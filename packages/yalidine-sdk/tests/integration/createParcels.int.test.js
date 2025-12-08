import { describe, it, expect, beforeEach, vi } from "vitest";

// Import the API mock helpers
import { registerUtilsMock } from "../mocks/utils.mock.js";

beforeAll(async () => {
  await registerUtilsMock()
})

import { createParcels } from "../../src/helpers/createParcels.js";
import { mockSetRequest, mockApiSuccess, mockApiError, mockGetConfig } from "../mocks/utils.mock.js";

// --- Sample parcels for tests ---

const validParcel = {
  order_id: "order-1",
  from_wilaya_name: "Algiers",
  firstname: "John",
  familyname: "Doe",
  contact_phone: "0123456789",
  address: "123 Main Street",
  to_commune_name: "Bab Ezzouar",
  to_wilaya_name: "Algiers",
  product_list: "Books",
  price: 1000,
  declared_value: 1000,
  length: 10,
  width: 10,
  height: 10,
  weight: 1,
  do_insurance: true,
  freeshipping: false,
  is_stopdesk: false,
  has_exchange: false,
  economic: false,
};

const validParcels = [
  {...validParcel, order_id: "order-1"},
  {...validParcel, order_id: "order-2"},
];

const mixedParcels = [
  {...validParcel, order_id: "order-1"},
  {...validParcel, order_id: "order-2"},
];

// Reset the mock before each test
beforeEach(() => {
  vi.resetAllMocks();
});

describe("createParcels integration tests", () => {

  it("successfully creates all parcels when API responds with success", async () => {
    mockApiSuccess({
      "order-1": { success: true },
      "order-2": { success: true },
    });

    mockGetConfig.mockReturnValueOnce({
      apiId: "",
      apiToken: "",
      apiUrl: "https://api.test-server.net",
    });

    const result = await createParcels(...validParcels);

    // Check the API call
    expect(mockSetRequest).toHaveBeenCalledTimes(1);
    expect(mockSetRequest).toHaveBeenCalledWith({
      endpoint: "parcel",
      method: "POST",
      params: { body: validParcels },
    });

    // Check returned meta
    expect(result.meta.succeededParcels).toEqual(["order-1", "order-2"]);
    expect(result.meta.failedParcels).toEqual([]);
  });

  it("handles partial failures correctly", async () => {
    mockApiSuccess({
      "order-1": { success: true },
      "order-2": { success: false, error: "Invalid weight" },
    });

    mockGetConfig.mockReturnValueOnce({
      apiId: "",
      apiToken: "",
      apiUrl: "https://api.test-server.net",
    });

    const result = await createParcels(...mixedParcels);

    expect(result.meta.succeededParcels).toEqual(["order-1"]);
    expect(result.meta.failedParcels).toEqual(["order-2"]);
  });

  it("throws if no parcels are provided", async () => {
    await expect(createParcels()).rejects.toThrow(
      "At least one parcel should be entered!"
    );

    // API should never be called
    expect(mockSetRequest).not.toHaveBeenCalled();
  });

  it("throws if too many parcels are provided (>50)", async () => {
    const tooMany = Array.from({ length: 51 }, (_, i) => ({ order_id: `o${i}` }));
    await expect(createParcels(...tooMany)).rejects.toThrow(
      "Too many parcels in one request. Please split into smaller batches."
    );

    expect(mockSetRequest).not.toHaveBeenCalled();
  });

  it("propagates API errors correctly", async () => {
    mockApiError(new Error("Network failure"));

    mockGetConfig.mockReturnValueOnce({
      apiId: "",
      apiToken: "",
      apiUrl: "https://api.test-server.net",
    });

    await expect(createParcels(...validParcels)).rejects.toThrow("Network failure");

    expect(mockSetRequest).toHaveBeenCalledTimes(1);
  });

});
