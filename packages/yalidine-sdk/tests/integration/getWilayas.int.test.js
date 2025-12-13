import { describe, it, expect, beforeEach } from "vitest";
import "../mocks/utils.mock.js";
import "../mocks/cache.mock.js";

import { 
  mockSetRequest 
} from "../mocks/utils.mock.js";

import { 
  mockCacheGet, 
  mockCacheSet 
} from "../mocks/cache.mock.js";

import { getWilayas } from "../../src/helpers/getWilayas.js";

const apiWilayas = [
  { id: 1, name: "Alger", zone: "C", is_deliverable: 1 },
  { id: 2, name: "Oran", zone: "W", is_deliverable: 0 },
  { id: 3, name: "Constantine", zone: "E", is_deliverable: 1 },
];

describe("getWilayas (integration)", () => {

  beforeEach(() => {
    mockSetRequest.mockReset();
    mockCacheGet.mockReset();
    mockCacheSet.mockReset();
  });

  it("returns cached wilayas when cache hit", async () => {
    mockCacheGet.mockResolvedValue(apiWilayas);

    const res = await getWilayas({});

    expect(mockCacheGet).toHaveBeenCalledWith("wilayas");
    expect(mockSetRequest).not.toHaveBeenCalled();
    expect(res.length).toBe(2); // deliverableOnly = true
  });

  it("filters only requested IDs on cache hit (partial)", async () => {
    mockCacheGet.mockResolvedValue(apiWilayas);

    const res = await getWilayas({
      params: { id: "1,3" }
    });

    expect(res.map(w => w.id)).toEqual([1, 3]);
  });

  it("fetches from API when cache miss, then stores cache", async () => {
    mockCacheGet.mockResolvedValue(undefined);
    mockSetRequest.mockResolvedValue({ data: apiWilayas });

    const res = await getWilayas({});

    expect(mockSetRequest).toHaveBeenCalledWith({
      endpoint: "wilayas",
      params: {}
    });

    expect(mockCacheSet).toHaveBeenCalledWith(
      "wilayas",
      apiWilayas,
      expect.any(Number)
    );

    expect(res.length).toBe(2);
  });

  it("does NOT write to cache when request is partial", async () => {
    mockCacheGet.mockResolvedValue(undefined);

    const requestedId = "2";
    const mockPartialResponse = apiWilayas.filter(c => c.id === parseInt(requestedId));
    mockSetRequest.mockResolvedValue({ data: mockPartialResponse });

    const res = await getWilayas({
      params: { id: requestedId }
    });
    
    expect(mockCacheSet).not.toHaveBeenCalled();
    expect(res.length).toBe(0); // id=2 is not deliverable
  });

  it("returns all wilayas when deliverableOnly=false", async () => {
    mockCacheGet.mockResolvedValue(apiWilayas);

    const res = await getWilayas({
      deliverableOnly: false
    });

    expect(res.length).toBe(3);
    expect(res.some(w => w.is_deliverable === 0)).toBe(true);
  });

  it("returns correct mapped shape", async () => {
    mockCacheGet.mockResolvedValue(apiWilayas);

    const res = await getWilayas({});

    expect(res[0]).toEqual({
      id: 1,
      name: "Alger",
      zone: "C",
    });
  });

});
