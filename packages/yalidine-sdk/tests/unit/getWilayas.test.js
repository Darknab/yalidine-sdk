import { describe, it, expect, vi, beforeEach } from "vitest";
import { getWilayas } from "../../src/helpers/getWilayas.js";

// Mock utils and cache
vi.mock("../../src/utils.js", () => ({
    ensureServer: vi.fn(),
    getIds: vi.fn(),
    setRequest: vi.fn(),
}));
vi.mock("../../src/cache/cacheConfig.js", () => ({
    getCacheConfig: vi.fn(),
}));

import { ensureServer, getIds, setRequest } from "../../src/utils.js";
import { getCacheConfig } from "../../src/cache/cacheConfig.js";

beforeEach(() => {
    vi.clearAllMocks();
});

describe("getWilayas", () => {
    const fakeCache = {
        get: vi.fn(),
        set: vi.fn(),
    };

    beforeEach(() => {
        getCacheConfig.mockReturnValue({ cache: fakeCache, CACHE_TTL: 1000 });
        fakeCache.get.mockResolvedValue(null);
        fakeCache.set.mockResolvedValue(undefined);
    });

    it("calls ensureServer()", async () => {
        setRequest.mockResolvedValue({ data: [] });
        await getWilayas({});
        expect(ensureServer).toHaveBeenCalled();
    });

    it("returns cached data if available", async () => {
        const cachedData = [
            { id: 1, name: "Algiers", zone: "N", is_deliverable: 1 },
        ];
        fakeCache.get.mockResolvedValue(cachedData);

        const result = await getWilayas({});
        expect(result).toEqual([
            { id: 1, name: "Algiers", zone: "N" },
        ]);
        expect(fakeCache.set).not.toHaveBeenCalled();
    });

    it("fetches from API if no cache", async () => {
        const apiData = [
            { id: 2, name: "Oran", zone: "W", is_deliverable: 1 },
        ];
        setRequest.mockResolvedValue({ data: apiData });

        const result = await getWilayas({});
        expect(result).toEqual([{ id: 2, name: "Oran", zone: "W" }]);
        expect(fakeCache.set).toHaveBeenCalledWith("wilayas", apiData, 1000);
    });

    it("applies deliverableOnly filter", async () => {
        const apiData = [
            { id: 1, name: "Algiers", zone: "N", is_deliverable: 1 },
            { id: 2, name: "Oran", zone: "W", is_deliverable: 0 },
        ];
        setRequest.mockResolvedValue({ data: apiData });

        const result = await getWilayas({ deliverableOnly: true });
        expect(result).toEqual([{ id: 1, name: "Algiers", zone: "N" }]);
    });

    it("includes is_deliverable when deliverableOnly=false", async () => {
        const apiData = [
            { id: 1, name: "Algiers", zone: "N", is_deliverable: 1 },
            { id: 2, name: "Oran", zone: "W", is_deliverable: 0 },
        ];
        setRequest.mockResolvedValue({ data: apiData });

        const result = await getWilayas({ deliverableOnly: false });
        expect(result).toEqual([
            { id: 1, name: "Algiers", zone: "N", is_deliverable: 1 },
            { id: 2, name: "Oran", zone: "W", is_deliverable: 0 },
        ]);
    });

    it("handles partial fetch using params.id", async () => {
        const apiData = [
            { id: 1, name: "Algiers", zone: "N", is_deliverable: 1 },
            { id: 2, name: "Oran", zone: "W", is_deliverable: 1 },
        ];
        fakeCache.get.mockResolvedValue(apiData);
        getIds.mockReturnValue([2]);

        const result = await getWilayas({ params: { id: "2" } });
        expect(result).toEqual([{ id: 2, name: "Oran", zone: "W" }]);
    });
});
