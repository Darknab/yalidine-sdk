import { getCacheConfig } from "../cache/cacheConfig.js";
import { ensureServer, getIds, setRequest } from "../utils.js";

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