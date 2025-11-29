import fs from "fs";
import path from "path";
import { MemoryCacheAdapter } from "./memoryCacheAdapter.js";
import { CacheAdapter } from "./cacheAdapter.js";

export class FileCacheAdapter extends CacheAdapter {
    constructor(filePath = "./.cache/yalidine.json") {
        super();
        this.filePath = filePath;
        this.memoryFallback = new MemoryCacheAdapter();
        this.load();
    }

    load() {
        try {
            if (fs.existsSync(this.filePath)) {
                const json = JSON.parse(fs.readFileSync(this.filePath, "utf-8"));
                this.store = new Map(Object.entries(json));
            } else {
                this.store = new Map()
            }
        } catch {
            this.store = null;
        }
    }

    async get(key) {
        if (!this.store) return this.memoryFallback.get(key);

        const entry = this.store.get(key);
        if(!entry) return null;
        if (entry.expiry && Date.now() > entry.expiry) {
            this.store.delete(key);
            this.save();
            return null;
        }
        return entry.value;
    }

    async set(key, value, ttl) {
        if (!this.store) return this.memoryFallback.set(key, value, ttl);

        const expiry = ttl ? Date.now() + ttl : null;
        this.store.set(key, { value, expiry });
        this.save();
    }

    save() {
        try {
            fs.mkdirSync(path.dirname(this.filePath), { recursive: true});
            fs.writeFileSync(
                this.filePath,
                JSON.stringify(Object.fromEntries(this.store), null, 2)
            );
        } catch {
            // Fallback silently
            this.store = null;
        }
    }

    async delete(key) {
        if (!this.store) return this.memoryFallback.delete(key);
        this.store.delete(key);
        this.save();
    }
}