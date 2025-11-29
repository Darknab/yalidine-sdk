import { getCacheConfig } from '../cache/cacheConfig.js'
import { ensureServer, setRequest } from "../utils.js";

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