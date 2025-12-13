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

import { getCentersByWilaya } from "../../src/helpers/getCentersByWilaya.js";

describe("getCentersByWilaya (integration)", () => {
  beforeEach(() => {
    mockSetRequest.mockReset();
    mockCacheGet.mockReset();
    mockCacheSet.mockReset();
  });

  it("throws when wilayaId is missing", async () => {
    await expect(getCentersByWilaya({}))
      .rejects
      .toThrow("A wilaya Id must be entered to retrieve centers.");
  });

  it("returns cached value when cache hit", async () => {
    const cachedCenters = [
      {
        center_id: "C01",
        name: "Cached Center",
        address: "123 St",
        gps: "35.1, 2.2",
        commune_id: 10,
        commune_name: "Commune",
        wilaya_id: 1
      }
    ];

    mockCacheGet.mockResolvedValue(cachedCenters);

    const result = await getCentersByWilaya({ wilayaId: 1 });

    expect(mockCacheGet).toHaveBeenCalledWith("centers-1");
    expect(mockSetRequest).not.toHaveBeenCalled(); // no API request
    expect(result).toEqual([
      {
        id: "C01",
        name: "Cached Center",
        address: "123 St",
        gps: "35.1, 2.2",
        commune_id: 10,
        commune_name: "Commune",
        wilaya_id: 1
      }
    ]);
  });

  it("fetches from API when cache miss and stores in cache", async () => {
    mockCacheGet.mockResolvedValue(null); // cache miss

    const apiResponse = {
      data: [
        {
          center_id: "C99",
          name: "API Center",
          address: "Road 5",
          gps: "36.0, 3.0",
          commune_id: 11,
          commune_name: "Api Commune",
          wilaya_id: 1
        }
      ]
    };

    mockApiSuccess(apiResponse);

    const result = await getCentersByWilaya({ wilayaId: 1 });

    expect(mockCacheGet).toHaveBeenCalledWith("centers-1");

    expect(mockSetRequest).toHaveBeenCalledWith({
      endpoint: "centers",
      params: { wilaya_id: 1 }
    });

    expect(mockCacheSet).toHaveBeenCalledWith(
      "centers-1",
      apiResponse.data,
      expect.any(Number) // TTL
    );

    expect(result).toEqual([
      {
        id: "C99",
        name: "API Center",
        address: "Road 5",
        gps: "36.0, 3.0",
        commune_id: 11,
        commune_name: "Api Commune",
        wilaya_id: 1
      }
    ]);
  });

  it("applies extra params to API call", async () => {
    mockCacheGet.mockResolvedValue(null);

    mockApiSuccess({ data: [] });

    await getCentersByWilaya({
      wilayaId: 1,
      params: { page: 2, limit: 50 }
    });

    expect(mockSetRequest).toHaveBeenCalledWith({
      endpoint: "centers",
      params: {
        wilaya_id: 1,
        page: 2,
        limit: 50
      }
    });
  });
});
