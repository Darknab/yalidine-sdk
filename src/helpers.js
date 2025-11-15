import { ensureServer, setRequest, getIds } from "./utils.js";
import { FileCacheAdapter } from "../cache/fileCacheAdapter.js";

const defaultCache = new FileCacheAdapter();
const CACHE_TTL = 1000* 60 * 60 *24;

export async function getWilayas({
    deliverableOnly = true, 
    params = {},
    cache = defaultCache
}) {
    ensureServer();

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

export async function getCommunes({
    wilayaId,
    deliverableOnly = true,
    hasStopDesk = false,
    params = {},
    cache = defaultCache
}) {
    ensureServer();

    const isPartial = Boolean(params.id);
    const cacheKey = `communes-${wilayaId}`;
    const cached = await cache.get(cacheKey)

    let communes;

    if (cached) {
        if (isPartial) {
            const ids = getIds(params);
            communes = cached.filter(c => ids.includes(w.id));
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

export async function getCenters({
    wilayaId,
    params = {},
    cache = defaultCache
}) {
    ensureServer();

    const isPartial = Boolean(params.commune_id)
    const cacheKey = `centers-${wilayaId}`;
    const cached = await cache.get(cacheKey);

    let centers

    if (cached) {
        if (isPartial) {
            const commune = options.commune_id
            centers = cached.filter(c => commune === c.commune_id)
        } else {
            centers = cached;
        }
    } else {
        const response = await setRequest({
            endpoint: 'centers',
            params: {
                wilaya_id: wilayaId,
                ...params
            }
        });

        centers = response.data;

        if (!isPartial) {
            await cache.set(cacheKey, centers, CACHE_TTL)
        }
    }

    return centers.map( c => ({
        id: c.center_id,
        name: c.name,
        address: c.address,
        gps: c.gps,
        commune_id: c.commune_id,
        commune_name: c.commune_name,
        wilaya_id: c.wilaya_id
    }))
}
