import { describe, it, expect, beforeEach } from "vitest";
import "../mocks/utils.mock.js";

import { mockSetRequest, mockApiSuccess } from "../mocks/utils.mock.js";
import { getCentersByCommune } from "../../src/helpers/getCentersByCommune.js";

describe("getCentersByCommune (integration)", () => {
  beforeEach(() => {
    mockSetRequest.mockReset();
  });

  it("throws an error when communeId is missing", async () => {
    await expect(getCentersByCommune({}))
      .rejects
      .toThrow("A commune Id must be entered to retrieve centers.");
  });

  it("calls setRequest with correct parameters", async () => {
    mockApiSuccess({
      data: []
    });

    await getCentersByCommune({ communeId: 16 });

    expect(mockSetRequest).toHaveBeenCalledWith({
      endpoint: "centers",
      params: {
        commune_id: 16
      }
    });
  });

  it("returns mapped centers", async () => {
    const apiResponse = {
      data: [
        {
          center_id: "C01",
          name: "Center One",
          address: "123 Main St",
          gps: "36.123, 3.456",
          commune_id: 16,
          commune_name: "Commune Name",
          wilaya_id: 1
        },
        {
          center_id: "C02",
          name: "Center Two",
          address: "56 Market St",
          gps: "36.789, 3.222",
          commune_id: 16,
          commune_name: "Commune Name",
          wilaya_id: 1
        }
      ]
    };

    mockApiSuccess(apiResponse);

    const result = await getCentersByCommune({ communeId: 16 });

    expect(result).toEqual([
      {
        id: "C01",
        name: "Center One",
        address: "123 Main St",
        gps: "36.123, 3.456",
        commune_id: 16,
        commune_name: "Commune Name",
        wilaya_id: 1
      },
      {
        id: "C02",
        name: "Center Two",
        address: "56 Market St",
        gps: "36.789, 3.222",
        commune_id: 16,
        commune_name: "Commune Name",
        wilaya_id: 1
      }
    ]);
  });
});
