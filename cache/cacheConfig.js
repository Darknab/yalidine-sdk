import { getConfig } from "../src/utils";
import { FileCacheAdapter } from "./fileCacheAdapter";
import { MemoryCacheAdapter } from "./memoryCacheAdapter";


export function getCacheConfig() {
    const { defaultCache, cacheLifeTime }= getConfig();

    const CACHE_TTL = cacheLifeTime * 1000 * 60 * 60 * 24;

    let cache;
    
    switch (defaultCache) {
        case 'file': 
            cache = new FileCacheAdapter();
        break;
        case 'memory':
        default:
            cache = new MemoryCacheAdapter();
        break;
    }

    return {
        cache,
        CACHE_TTL
    }
} 