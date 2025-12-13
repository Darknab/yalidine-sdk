import { describe, it, expect, beforeEach } from "vitest";
import "../mocks/utils.mock.js";
import "../mocks/cache.mock.js";

import { 
  mockSetRequest, 
  mockApiSuccess 
} from "../mocks/utils.mock.js";

import { 
  mockCacheGet, 
  mockCacheSet 
} from "../mocks/cache.mock.js";

import { getCommunesByWilaya } from "../../src/helpers/getCommunesByWilaya.js";

const wId = 16

const apiCommunes = [
    { id: 1, name: "Comm1", is_deliverable: 1, has_stop_desk: 1, delivery_time_parcel: 2 },
    { id: 2, name: "Comm2", is_deliverable: 0, has_stop_desk: 1, delivery_time_parcel: 3 },
    { id: 3, name: "Comm3", is_deliverable: 1, has_stop_desk: 0, delivery_time_parcel: 4 },
]

describe("getCommunesByWilaya (integration)", () => {
  beforeEach(() => {
    mockSetRequest.mockReset();
    mockCacheGet.mockReset();
    mockCacheSet.mockReset();
  });

  it("throws when wilayaId is missing", async () => {
    await expect(getCommunesByWilaya({}))
    .rejects
    .toThrow('A wilaya Id must be entered to retrieve communes.');
  });

  it('returns cached value when cache hit', async () => {
    mockCacheGet.mockResolvedValue(apiCommunes);

    const res = await getCommunesByWilaya({wilayaId: wId});

    expect(mockCacheGet).toHaveBeenCalledWith(`communes-${wId}`);
    expect(mockSetRequest).not.toHaveBeenCalled();

    // deliverableOnly = true by default
    expect(res.length).toBe(2)  // only deliverable = 1
  });

  it("filters only requested IDs on cache hit (partial)", async () => {
    mockCacheGet.mockResolvedValue(apiCommunes)

    const res = await getCommunesByWilaya({
        wilayaId: wId,
        params: { id: "1,3" }
    });

    expect(res.length).toBe(2)
    expect(res.map(c => c.id)).toEqual([1, 3])
  });

  it("fetches from API when cache miss, then stores cache", async () => {
    mockCacheGet.mockResolvedValue(undefined)

    mockSetRequest.mockResolvedValue({ data: apiCommunes })

    const res = await getCommunesByWilaya({ wilayaId: wId })

    expect(mockSetRequest).toHaveBeenCalledWith({
        endpoint: "communes",
        params: { wilaya_id: wId }
    })

    expect(mockCacheSet).toHaveBeenCalledWith(`communes-${wId}`, apiCommunes, expect.any(Number))
    expect(res.length).toBe(2) // because deliverableOnly = true
  })

  it("does NOT write to cache when request is partial", async () => {
    mockCacheGet.mockResolvedValue(undefined)

    const requestedId = "3";
    const mockPartialResponse = apiCommunes.filter(c => c.id === parseInt(requestedId));
    mockSetRequest.mockResolvedValue({ data: mockPartialResponse });

    const res = await getCommunesByWilaya({
        wilayaId: wId,
        params: { id: requestedId }
    })

    expect(mockCacheSet).not.toHaveBeenCalled()
    expect(res.length).toBe(1)
    expect(res[0].id).toBe(3)
  });

  it("returns all communes when deliverableOnly=false", async () => {
    mockCacheGet.mockResolvedValue(apiCommunes)

    const res = await getCommunesByWilaya({
        wilayaId: wId,
        deliverableOnly: false
    })

    expect(res.length).toBe(3)
    expect(res.some(c => c.is_deliverable === 0)).toBe(true)
  });

  it("filters only has_stop_desk communes when hasStopDesk=true", async () => {
    mockCacheGet.mockResolvedValue(apiCommunes)

    const res = await getCommunesByWilaya({
        wilayaId: wId,
        hasStopDesk: true
    })

    // deliverableOnly still true, so final filter = deliverable + stopDesk
    // From apiCommunes → only commune 1 matches both
    expect(res.length).toBe(1)
    expect(res[0].id).toBe(1)
  });

  it("supports deliverableOnly=false + hasStopDesk=true", async () => {
    mockCacheGet.mockResolvedValue(apiCommunes)

    const res = await getCommunesByWilaya({
      wilayaId: wId,
      deliverableOnly: false,
      hasStopDesk: true
    })

    expect(res.length).toBe(2) // both stop desks
    expect(res[0]).toHaveProperty("is_deliverable")
    expect(res[0]).not.toHaveProperty("has_stop_desk")
  });
});