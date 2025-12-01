import { describe, it, expect, vi, beforeEach } from "vitest";
import { getCentersByWilaya } from "../../src/helpers/getCentersByWilaya.js";

// --- Mock utils and cache ---
vi.mock("../../src/utils.js", () => ({
    ensureServer: vi.fn(),
    setRequest: vi.fn(),
}));

vi.mock("../../src/cache/cacheConfig.js", () => ({
    getCacheConfig: vi.fn(),
}));

import { ensureServer, setRequest } from "../../src/utils.js";
import { getCacheConfig } from "../../src/cache/cacheConfig.js";

let mockCache;

beforeEach(() => {
    vi.clearAllMocks();

    mockCache = {
        get: vi.fn(),
        set: vi.fn(),
    };

    getCacheConfig.mockReturnValue({
        cache: mockCache,
        CACHE_TTL: 3600,
    });
});

describe("getCentersByWilaya", () => {

    it("calls ensureServer()", async () => {
        mockCache.get.mockResolvedValue(null);
        setRequest.mockResolvedValue({ data: [] });

        await getCentersByWilaya({ wilayaId: 1 });

        expect(ensureServer).toHaveBeenCalled();
    });

    it("throws if wilayaId is missing", async () => {
        await expect(getCentersByWilaya({}))
            .rejects.toThrow("A wilaya Id must be entered to retrieve centers.");
    });

    it("returns cached data when available", async () => {
        const cachedData = [
            { center_id: 1, name: "A", address: "X", gps: "0,0", commune_id: 10, commune_name: "Foo", wilaya_id: 1 }
        ];

        mockCache.get.mockResolvedValue(cachedData);

        const result = await getCentersByWilaya({ wilayaId: 1 });

        expect(mockCache.get).toHaveBeenCalledWith("centers-1");
        expect(setRequest).not.toHaveBeenCalled();  // No network call
        expect(mockCache.set).not.toHaveBeenCalled();
        expect(result).toEqual([
            {
                id: 1,
                name: "A",
                address: "X",
                gps: "0,0",
                commune_id: 10,
                commune_name: "Foo",
                wilaya_id: 1
            }
        ]);
    });

    it("fetches data when cache is empty", async () => {
        mockCache.get.mockResolvedValue(null);

        const apiResponse = {
            data: [
                { center_id: 2, name: "B", address: "Y", gps: "1,1", commune_id: 20, commune_name: "Bar", wilaya_id: 5 }
            ]
        };

        setRequest.mockResolvedValue(apiResponse);

        const result = await getCentersByWilaya({ wilayaId: 5 });

        expect(setRequest).toHaveBeenCalledWith({
            endpoint: "centers",
            params: { wilaya_id: 5 }
        });

        expect(mockCache.set).toHaveBeenCalledWith(
            "centers-5",
            apiResponse.data,
            3600
        );

        expect(result).toEqual([
            {
                id: 2,
                name: "B",
                address: "Y",
                gps: "1,1",
                commune_id: 20,
                commune_name: "Bar",
                wilaya_id: 5
            }
        ]);
    });

    it("passes extra params to the request", async () => {
        mockCache.get.mockResolvedValue(null);
        setRequest.mockResolvedValue({ data: [] });

        await getCentersByWilaya({
            wilayaId: 10,
            params: { active: true, limit: 20 }
        });

        expect(setRequest).toHaveBeenCalledWith({
            endpoint: "centers",
            params: { 
                wilaya_id: 10,
                active: true,
                limit: 20,
            }
        });
    });
});
