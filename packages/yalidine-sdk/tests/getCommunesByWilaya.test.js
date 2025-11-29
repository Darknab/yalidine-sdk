import { describe, it, expect, vi, beforeEach } from "vitest";
import { getCommunesByWilaya } from "../src/helpers/getCommunesByWilaya";

vi.mock("../src/utils.js", () => ({
    ensureServer: vi.fn(),
    setRequest: vi.fn(),
    getIds: vi.fn(),
}));

vi.mock("../src/cache/cacheConfig.js", () => ({
    getCacheConfig: vi.fn(),
}));

import { ensureServer, setRequest, getIds } from "../src/utils.js";
import { getCacheConfig } from "../src/cache/cacheConfig.js";

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

describe("getCommunesByWilaya", () => {

    it("calls ensureServer()", async () => {
        mockCache.get.mockResolvedValue([]);
        await getCommunesByWilaya({ wilayaId: 1 });
        expect(ensureServer).toHaveBeenCalled();
    });

    // --- CACHE HIT: FULL LIST ---
    it("returns cached communes when available (full request)", async () => {
        const cachedCommunes = [
            { id: 1, name: "A", is_deliverable: 1, has_stop_desk: 0, delivery_time_parcel: 2 },
            { id: 2, name: "B", is_deliverable: 0, has_stop_desk: 1, delivery_time_parcel: 4 },
        ];

        mockCache.get.mockResolvedValue(cachedCommunes);

        const result = await getCommunesByWilaya({ wilayaId: 16 });

        expect(mockCache.get).toHaveBeenCalledWith("communes-16");
        expect(result).toEqual([
            {
                id: 1,
                name: "A",
                has_stop_desk: 0,
                delivery_time_parcel: 2,
            },
        ]); // deliverableOnly = true filters ID 2 out
    });

    // --- CACHE HIT: PARTIAL REQUEST ---
    it("returns filtered cached communes for partial request", async () => {
        const cachedCommunes = [
            { id: 1, name: "A", is_deliverable: 1, has_stop_desk: 1, delivery_time_parcel: 2 },
            { id: 2, name: "B", is_deliverable: 1, has_stop_desk: 1, delivery_time_parcel: 3 },
        ];

        mockCache.get.mockResolvedValue(cachedCommunes);

        getIds.mockReturnValue([2]);

        const result = await getCommunesByWilaya({
            wilayaId: 16,
            params: { id: [2] },
        });

        expect(getIds).toHaveBeenCalledWith({ id: [2] });
        expect(result).toEqual([
            {
                id: 2,
                name: "B",
                has_stop_desk: 1,
                delivery_time_parcel: 3,
            },
        ]);
    });

    // --- CACHE MISS ---
    it("fetches communes and stores them in cache when not partial", async () => {
        mockCache.get.mockResolvedValue(null);

        const apiData = [
            { id: 1, name: "A", is_deliverable: 1, has_stop_desk: 0, delivery_time_parcel: 5 },
        ];

        setRequest.mockResolvedValue({ data: apiData });

        const result = await getCommunesByWilaya({ wilayaId: 31 });

        expect(setRequest).toHaveBeenCalledWith({
            endpoint: "communes",
            params: { wilaya_id: 31 },
        });

        expect(mockCache.set).toHaveBeenCalledWith(
            "communes-31",
            apiData,
            3600
        );

        expect(result).toEqual([
            {
                id: 1,
                name: "A",
                has_stop_desk: 0,
                delivery_time_parcel: 5,
            },
        ]);
    });

    it("does NOT cache partial requests", async () => {
        mockCache.get.mockResolvedValue(null);
        setRequest.mockResolvedValue({ data: [] });

        await getCommunesByWilaya({
            wilayaId: 31,
            params: { id: 5 }, // partial request
        });

        expect(mockCache.set).not.toHaveBeenCalled();
    });

    // --- DELIVERABILITY AND STOP-DESK FILTERS ---
    it("returns only deliverable communes when deliverableOnly=true", async () => {
        mockCache.get.mockResolvedValue([
            { id: 1, name: "A", is_deliverable: 1, has_stop_desk: 1, delivery_time_parcel: 2 },
            { id: 2, name: "B", is_deliverable: 0, has_stop_desk: 1, delivery_time_parcel: 3 },
        ]);

        const result = await getCommunesByWilaya({ wilayaId: 16 });

        expect(result.length).toBe(1);
        expect(result[0].id).toBe(1);
    });

    it("filters by stop desk when hasStopDesk=true", async () => {
        mockCache.get.mockResolvedValue([
            { id: 1, name: "A", is_deliverable: 1, has_stop_desk: 0, delivery_time_parcel: 2 },
            { id: 2, name: "B", is_deliverable: 1, has_stop_desk: 1, delivery_time_parcel: 3 },
        ]);

        const result = await getCommunesByWilaya({
            wilayaId: 16,
            hasStopDesk: true,
        });

        expect(result.length).toBe(1);
        expect(result[0].id).toBe(2);
    });

    // --- FIELD MAPPING ---
    it("includes is_deliverable when deliverableOnly=false", async () => {
        mockCache.get.mockResolvedValue([
            { id: 7, name: "X", is_deliverable: 0, has_stop_desk: 1, delivery_time_parcel: 9 },
        ]);

        const result = await getCommunesByWilaya({
            wilayaId: 16,
            deliverableOnly: false,
        });

        expect(result[0]).toMatchObject({
            id: 7,
            name: "X",
            is_deliverable: 0,
            has_stop_desk: 1,
        });
    });

    it("excludes has_stop_desk when hasStopDesk=true", async () => {
        mockCache.get.mockResolvedValue([
            { id: 8, name: "Y", is_deliverable: 1, has_stop_desk: 1, delivery_time_parcel: 4 },
        ]);

        const result = await getCommunesByWilaya({
            wilayaId: 10,
            hasStopDesk: true,
        });

        expect(result[0]).not.toHaveProperty("has_stop_desk");
    });
});
