import { ensureServer, setRequest, getIds, getConfig, calculateOverWeight } from "./utils.js";
import { getCacheConfig } from "../cache/cacheConfig.js";

export async function getWilayas({
    deliverableOnly = true, 
    params = {},
}) {
    ensureServer();

    const { cache, CACHE_TTL } = getCacheConfig()

    const isPartial = Boolean(params.id)
    const cacheKey = "wilayas";
    const cached = await cache.get(cacheKey);

    let wilayas

    if (cached) {
        if (isPartial) {
            const ids = getIds(params);
            wilayas = cached.filter(w => ids.includes(w.id));
        } else {
            wilayas = cached;
        }
    } else {
        const response = await setRequest({
            endpoint: 'wilayas',
            params
        });

        wilayas = response.data;

        if (!isPartial) {
            await cache.set(cacheKey, wilayas, CACHE_TTL);
        }
    }

    const cleaned = deliverableOnly
        ? wilayas.filter(w => w.is_deliverable === 1)
        : wilayas;
    
    return cleaned.map(w => ({
        id: w.id,
        name: w.name,
        zone: w.zone,
        ...(deliverableOnly ? {} : { is_deliverable : w.is_deliverable })
    }))
}

export async function getCommunesByWilaya({
    wilayaId,
    deliverableOnly = true,
    hasStopDesk = false,
    params = {}
}) {
    ensureServer();

    const { cache, CACHE_TTL } = getCacheConfig()

    const isPartial = Boolean(params.id);
    const cacheKey = `communes-${wilayaId}`;
    const cached = await cache.get(cacheKey)

    let communes;

    if (cached) {
        if (isPartial) {
            const ids = getIds(params);
            communes = cached.filter(c => ids.includes(c.id));
        } else {
            communes = cached;
        }
    } else {
        const response = await setRequest({
            endpoint: 'communes',
            params: {
                wilaya_id: wilayaId,
                ...params
            }
        });

        communes = response.data;

        if (!isPartial) {
            await cache.set(cacheKey, communes, CACHE_TTL);
        }
    }

    const cleanedDeliverability = deliverableOnly
        ? communes.filter(c => c.is_deliverable === 1)
        : communes;
    
    
    const cleaned = hasStopDesk
        ? cleanedDeliverability.filter(c => c.has_stop_desk === 1)
        : cleanedDeliverability;

    return cleaned.map( c => ({
        id: c.id,
        name: c.name,
        delivery_time_parcel: c.delivery_time_parcel,
        ...(deliverableOnly ? {} : { is_deliverable : c.is_deliverable }),
        ...(hasStopDesk ? {} : { has_stop_desk: c.has_stop_desk })
    }))   
}

export async function getCentersByWilaya({
    wilayaId,
    params = {}
}) {
    ensureServer();

    if (!wilayaId) {
        throw new Error('A wilaya Id must be entered to retrieve centers.');
    }

    const { cache, CACHE_TTL } = getCacheConfig()

    const cacheKey = `centers-${wilayaId}`;
    const cached = await cache.get(cacheKey);

    let centers

    if (cached) {
        centers = cached;
    } else {
        const response = await setRequest({
            endpoint: 'centers',
            params: {
                wilaya_id: wilayaId,
                ...params
            }
        });

        centers = response.data;

        await cache.set(cacheKey, centers, CACHE_TTL);
    }

    return centers.map( c => ({
        id: c.center_id,
        name: c.name,
        address: c.address,
        gps: c.gps,
        commune_id: c.commune_id,
        commune_name: c.commune_name,
        wilaya_id: c.wilaya_id
    }));
}

export async function getCentersByCommune({
    communeId,
    params = {}
}) {
    ensureServer();

    if (!communeId) {
        throw new Error('A commune Id must be entered to retrieve centers.');
    }

    const response = await setRequest({
        endpoint: 'centers',
        params: {
            commune_id: communeId,
            ...params
        }
    });

    const centers = response.data;

    return centers.map( c => ({
        id: c.center_id,
        name: c.name,
        address: c.address,
        gps: c.gps,
        commune_id: c.commune_id,
        commune_name: c.commune_name,
        wilaya_id: c.wilaya_id
    }));
}

export async function getFees({
    fromWilayaId,
    toWilayaId,
    toCommuneId,
    billableWeight = 5
}) {
    ensureServer();
    
    if (!toWilayaId || !toCommuneId) {
        throw new Error('Destination wilaya and commune are required to calculate fees.');
    }

    const safeWeight = 
        typeof billableWeight === 'number' && billableWeight > 0
            ? billableWeight
            : 5;
    
    const startingWilaya = fromWilayaId ?? getConfig().startingWilaya;

    const data = await setRequest({
        endpoint: 'fees',
        params: {
            from_wilaya_id: startingWilaya,
            to_wilaya_id: toWilayaId
        }
    });

    if (!data.per_commune[toCommuneId]) {
        throw new Error('Commune not found');
    };

    const communeFee = data.per_commune[toCommuneId];
    const oversizeFee = data.oversize_fee;

    return {
        fees: {
            expressHome: calculateOverWeight(communeFee.express_home, oversizeFee, safeWeight),
            expressDesk: calculateOverWeight(communeFee.express_desk, oversizeFee, safeWeight),
            economicHome: communeFee.economic_home ? calculateOverWeight(communeFee.economic_home, oversizeFee, safeWeight) : null,
            economicDesk: communeFee.economic_desk ? calculateOverWeight(communeFee.economic_desk, oversizeFee, safeWeight) : null,
        },
        meta: {
            retourFee: data.retour_fee,
            codPercentage: data.cod_percentage,
            insurancePercentage: data.insurance_percentage,
            oversizeApplied: safeWeight > 5
        }
    }
}

export function calculateBillableWeight(height, width, length, weight) {
    const volumetricWeight = height * width * length * 0.0002;

    return weight > volumetricWeight ? weight : volumetricWeight;
}
