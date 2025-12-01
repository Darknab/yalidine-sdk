import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import fs from "fs";
import path from "path";

import { CacheAdapter } from "../../src/cache/cacheAdapter.js";
import { MemoryCacheAdapter } from "../../src/cache/memoryCacheAdapter.js";
import { FileCacheAdapter } from "../../src/cache/fileCacheAdapter.js";
import { getCacheConfig } from "../../src/cache/cacheConfig.js";

describe("CacheAdapter (abstract)", () => {
    it("Throws Not implemented for get/set/delete", async () => {
        const adapter = new CacheAdapter();
        await expect(adapter.get("key")).rejects.toThrow("Not implemented");
        await expect(adapter.set("key", "val")).rejects.toThrow("Not implemented");
        await expect(adapter.delete("key")).rejects.toThrow("Not implemented");
    });
});

describe("MemoryCacheAdapter", () => {
    let memCache;

    beforeEach(() => {
        memCache = new MemoryCacheAdapter();
    });

    it("Can send and get values", async () => {
        await memCache.set("foo", 123);
        expect(await memCache.get("foo")).toBe(123);
    });

    it("Returns null for missing key", async () => {
        expect(await memCache.get("missing")).toBeNull();
    });

    it("Deletes keys", async () => {
        await memCache.set("foo", 123);
        await memCache.delete("foo");
        expect(await memCache.get("foo")).toBeNull();
    });

    it("Respect TTL", async () => {
        await memCache.set("foo", 123, 1); //1 ms
        await new Promise(r => setTimeout(r, 5));
        expect(await memCache.get("foo")).toBeNull();
    });
});

describe("FileCacheAdapter", () => {
    const tmpFile = path.join(__dirname, "test-cache.json");
    let fileCache;

    beforeEach(() => {
        if (fs.existsSync(tmpFile)) fs.unlinkSync(tmpFile);
        fileCache = new FileCacheAdapter(tmpFile);
    });

    afterEach(() => {
        if (fs.existsSync(tmpFile)) fs.unlinkSync(tmpFile);
    });

    it("can set and get values", async () => {
        await fileCache.set("foo", "bar");
        expect(await fileCache.get("foo")).toBe("bar");
    });

    it("Persists values to file", async () => {
        await fileCache.set("foo", "bar");
        const json = JSON.parse(fs.readFileSync(tmpFile, "utf-8"));
        expect(json.foo.value).toBe("bar");
    });

    it("Delete keys", async () => {
        await fileCache.set("foo", "bar");
        await fileCache.delete("foo");
        expect(await fileCache.get("foo")).toBeNull();
    });

    it("Falls back to memory cache if file is unreadable", async () => {
        // simulate broken file
        fileCache.store = null;
        const memSpy = vi.spyOn(fileCache.memoryFallback, "set");
        await fileCache.set("foo", "bar");
        expect(memSpy).toHaveBeenCalledWith("foo", "bar", undefined);
    });
});

describe("getCacheConfig", () => {
    const OLD_CONFIG = global.__YALIDINE_CONFIG__;

    afterEach(() => {
        global.__YALIDINE_CONFIG__ = OLD_CONFIG;
    });

    it("Returns FileCacheAdapter When configured", () => {
        global.__YALIDINE_CONFIG__ = { defaultCache: "file", cacheLifeTime: 2 };
        const { cache, CACHE_TTL } = getCacheConfig();
        expect(cache).toBeInstanceOf(FileCacheAdapter);
        expect(CACHE_TTL).toBe(2 * 1000 * 60 * 60 * 24);
    });

    it("Falls back to MemoryCacheAdapter for unknown type", () => {
        global.__YALIDINE_CONFIG__ = { defaultCache: "unknown", cacheLifeTime: 1 };
        const { cache } = getCacheConfig();
        expect(cache).toBeInstanceOf(MemoryCacheAdapter);
    });
});