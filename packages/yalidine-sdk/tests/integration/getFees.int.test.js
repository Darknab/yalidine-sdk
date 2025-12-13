import { describe, it, expect, beforeEach } from "vitest";
import "../mocks/utils.mock.js";

import { mockSetRequest, mockGetConfig } from "../mocks/utils.mock.js";
import { getFees } from "../../src/helpers/getFees.js";

const apiFeesResponse = {
  per_commune: {
    101: {
      express_home: 600,
      express_desk: 500,
      economic_home: 400,
      economic_desk: null
    }
  },
  oversize_fee: 50,
  retour_fee: 300,
  cod_percentage: 2,
  insurance_percentage: 1
};

describe("getFees (integration)", () => {

  beforeEach(() => {
    mockSetRequest.mockReset();
    mockGetConfig.mockClear();
  });

  it("throws when destination wilaya or commune is missing", async () => {
    await expect(
      getFees({ toWilayaId: 1 })
    ).rejects.toThrow(
      "Destination wilaya and commune are required"
    );
  });

  it("uses fromWilayaId when provided", async () => {
    mockSetRequest.mockResolvedValue(apiFeesResponse);

    await getFees({
      fromWilayaId: 99,
      toWilayaId: 1,
      toCommuneId: 101
    });

    expect(mockSetRequest).toHaveBeenCalledWith({
      endpoint: "fees",
      params: {
        from_wilaya_id: 99,
        to_wilaya_id: 1
      }
    });
  });

  it("falls back to startingWilaya from config", async () => {
    mockSetRequest.mockResolvedValue(apiFeesResponse);

    await getFees({
      toWilayaId: 1,
      toCommuneId: 101
    });

    expect(mockGetConfig).toHaveBeenCalled();
    expect(mockSetRequest).toHaveBeenCalledWith({
      endpoint: "fees",
      params: {
        from_wilaya_id: 16,
        to_wilaya_id: 1
      }
    });
  });

  it("throws when commune is not found in API response", async () => {
    mockSetRequest.mockResolvedValue({
      ...apiFeesResponse,
      per_commune: {}
    });

    await expect(
      getFees({
        toWilayaId: 1,
        toCommuneId: 999
      })
    ).rejects.toThrow("Commune not found");
  });

  it("calculates fees with default weight (5kg)", async () => {
    mockSetRequest.mockResolvedValue(apiFeesResponse);

    const res = await getFees({
      toWilayaId: 1,
      toCommuneId: 101
    });

    expect(res.meta.oversizeApplied).toBe(false);
    expect(res.fees.expressHome).toBeDefined();
    expect(res.fees.economicDesk).toBeNull();
  });

  it("applies oversize fee when billableWeight > 5", async () => {
    mockSetRequest.mockResolvedValue(apiFeesResponse);

    const res = await getFees({
      toWilayaId: 1,
      toCommuneId: 101,
      billableWeight: 10
    });

    expect(res.meta.oversizeApplied).toBe(true);
    expect(res.fees.expressHome).toBeGreaterThan(600);
  });

  it("normalizes invalid billableWeight to 5", async () => {
    mockSetRequest.mockResolvedValue(apiFeesResponse);

    const res = await getFees({
      toWilayaId: 1,
      toCommuneId: 101,
      billableWeight: -3
    });

    expect(res.meta.oversizeApplied).toBe(false);
  });
});
