export class CacheAdapter {
    async get(key) {
        throw new Error("Not implemented");
    }

    async set (key, value, ttl) {
        throw new Error("Not implemented");
    }

    async delete(key) {
        throw new Error("Not implemented");
    }
}