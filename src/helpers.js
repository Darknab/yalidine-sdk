import { ensureServer, setRequest, getIds } from "./utils.js";
import { FileCacheAdapter } from "../cache/fileCacheAdapter.js";

const defaultCache = new FileCacheAdapter();
const CACHE_TTL = 1000* 60 * 60 *24;

export async function getWilayas(
    deliverableOnly = true, 
    params = {},
    cache = defaultCache
) {
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

export async function getCommunes(
    deliverableOnly = true,
    params = {}
) {
    ensureServer();

    const response = await setRequest({
        endpoint: 'communes',
        params,
    });

    const communes = response.data

    if (deliverableOnly) {
        return communes.filter(c => c.is_deliverable === 1);
    }

    return communes;
}
