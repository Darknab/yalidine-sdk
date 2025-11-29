import { CacheAdapter } from "./cacheAdapter.js";

export class MemoryCacheAdapter extends CacheAdapter {
    constructor() {
        super();
        this.cache = new Map();
    }

    async get(key) {
        const entry = this.cache.get(key);
        if (!entry) return null;
        if (entry.expiry && date.now() > entry.expiry) {
            this.cache.delete(key);
            return null
        }
        return entry.value
    }

    async set(key, value, ttl) {
        const expiry = ttl ? Date.now() + ttl : null;
        this.cache.set(key, { value, expiry })
    }

    async delete(key) {
        this.cache.delete(key);
    }
}