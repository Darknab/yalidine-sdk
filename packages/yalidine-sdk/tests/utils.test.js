import { describe, it, expect, vi } from "vitest";
import { ensureServer, getConfig, getIds, calculateOverWeight, validateParcels, setRequest } from "../src/utils.js";

describe("ensureServer", () => {
  afterEach(() => {
    // cleanup: remove global.window if it was set
    delete global.window;
  });

  it("does NOT throw when running in Node environment", () => {
    // ensure no window object exists
    delete global.window;

    expect(() => ensureServer()).not.toThrow();
  });

  it("throws an error when running in browser environment", () => {
    // simulate browser
    global.window = {};

    expect(() => ensureServer()).toThrow(
      "astro-yalidine: server-only helper imported in client code. Use these helpers only in server contexts ( API routes, server-side page formatter, etc.)."
    );
  });
});

describe("getConfig", () => {
  const OLD_CONFIG = global.__YALIDINE_CONFIG__;

  afterEach(() => {
    // restore original global variable after each test
    if (OLD_CONFIG === undefined) {
      delete global.__YALIDINE_CONFIG__;
    } else {
      global.__YALIDINE_CONFIG__ = OLD_CONFIG;
    }
  });

  it("throws if config is missing", () => {
    delete global.__YALIDINE_CONFIG__;
    expect(() => getConfig()).toThrow(
      "astro-yalidine: Configuration missing. Did you add yalidine to astro.config.mjs ?"
    );
  });

  it("returns the config if defined", () => {
    global.__YALIDINE_CONFIG__ = { apiId: "123", apiToken: "abc" };
    expect(getConfig()).toEqual({ apiId: "123", apiToken: "abc" });
  });
});

describe("getIds", () => {
  it("splits comma-separated IDs into numbers", () => {
    expect(getIds({ id: "1,2,3" })).toEqual([1, 2, 3]);
    expect(getIds({ id: "10,20" })).toEqual([10, 20]);
  });
});

describe("calculateOverWeight", () => {
  it("returns baseFee for weight <= 5", () => {
    expect(calculateOverWeight(100, 10, 5)).toBe(100);
    expect(calculateOverWeight(50, 5, 4)).toBe(50);
  });

  it("adds overSizeFee for weight > 5", () => {
    expect(calculateOverWeight(100, 10, 6)).toBe(110);
    expect(calculateOverWeight(50, 5, 8)).toBe(65);
  });
});

// Helper to generate a valid parcel
function baseParcel(overrides = {}) {
  return {
    order_id: "ORD01",
    from_wilaya_name: "A",
    firstname: "B",
    familyname: "C",
    contact_phone: "0123456789",
    address: "Addr",
    to_commune_name: "Commune",
    to_wilaya_name: "Wilaya",
    product_list: "Prod",
    price: 100,
    declared_value: 100,
    length: 10,
    width: 10,
    height: 10,
    weight: 5,
    ...overrides
  };
}

describe("validateParcels", () => {
  // -----------------------------
  // Base cases
  // -----------------------------
  it("throws when parcels array is empty or undefined", () => {
    expect(() => validateParcels()).toThrow();
    expect(() => validateParcels([])).toThrow();
  });

  it("throws when too many parcels (>50)", () => {
    const parcels = Array.from({ length: 51 }, (_, i) =>
      baseParcel({ order_id: `ID${i}` })
    );
    expect(() => validateParcels(parcels)).toThrow(
      "Too many parcels in one request"
    );
  });

  it("returns true for a valid parcel", () => {
    expect(validateParcels([baseParcel()])).toBe(true);
  });

  // -----------------------------
  // Required string fields
  // -----------------------------
  const requiredStrings = [
    "order_id",
    "from_wilaya_name",
    "firstname",
    "familyname",
    "contact_phone",
    "address",
    "to_commune_name",
    "to_wilaya_name",
    "product_list"
  ];

  requiredStrings.forEach(field => {
    it(`throws if required string field "${field}" is missing`, () => {
      const p = baseParcel({ [field]: "" });
      expect(() => validateParcels([p])).toThrow(`${field} must be a non-empty string`);
    });
  });

  // -----------------------------
  // Numeric fields
  // -----------------------------
  const numericFields = [
    "price",
    "declared_value",
    "length",
    "width",
    "height",
    "weight"
  ];

  numericFields.forEach(field => {
    it(`throws if numeric field "${field}" is missing`, () => {
      const p = baseParcel({ [field]: null });
      expect(() => validateParcels([p])).toThrow(`${field} must be a number >= 0`);
    });

    it(`throws if numeric field "${field}" is negative`, () => {
      const p = baseParcel({ [field]: -1 });
      expect(() => validateParcels([p])).toThrow(`${field} must be a number >= 0`);
    });
  });

  // -----------------------------
  // Price / declared_value ranges
  // -----------------------------
  it("throws if price is out of range", () => {
    const p = baseParcel({ price: 200000 });
    expect(() => validateParcels([p])).toThrow("price must be between 0 and 150000");
  });

  it("throws if declared_value is out of range", () => {
    const p = baseParcel({ declared_value: 200000 });
    expect(() => validateParcels([p])).toThrow("declared_value must be between 0 and 150000");
  });

  // -----------------------------
  // Boolean fields
  // -----------------------------
  const booleanFields = [
    "do_insurance",
    "freeshipping",
    "is_stopdesk",
    "has_exchange",
    "economic"
  ];

  booleanFields.forEach(field => {
    it(`throws if boolean field "${field}" is not boolean`, () => {
      const p = baseParcel({ [field]: "yes" });
      expect(() => validateParcels([p])).toThrow(`${field} must be a boolean`);
    });
  });

  // -----------------------------
  // Conditional fields
  // -----------------------------
  it("requires stopdesk_id when is_stopdesk is true", () => {
    const p = baseParcel({
      is_stopdesk: true,
      stopdesk_id: undefined
    });

    expect(() => validateParcels([p])).toThrow("stopdesk_id is required when is_stopdesk is true");
  });

  it("allows stopdesk_id when provided correctly", () => {
    const p = baseParcel({
      is_stopdesk: true,
      stopdesk_id: "SD123"
    });

    expect(validateParcels([p])).toBe(true);
  });

  it("requires product_to_collect when has_exchange is true", () => {
    const p = baseParcel({
      has_exchange: true,
      product_to_collect: undefined
    });

    expect(() => validateParcels([p])).toThrow(
      "product_to_collect is required when has_exchange is true"
    );
  });

  it("allows product_to_collect when provided", () => {
    const p = baseParcel({
      has_exchange: true,
      product_to_collect: "ItemXYZ"
    });

    expect(validateParcels([p])).toBe(true);
  });

  // -----------------------------
  // Phone validation
  // -----------------------------
  it("throws for invalid phone format", () => {
    const p = baseParcel({ contact_phone: "123456" });
    expect(() => validateParcels([p])).toThrow("contact_phone");
  });

  it("throws if one phone in comma list is invalid", () => {
    const p = baseParcel({ contact_phone: "0123456789, 987654" });
    expect(() => validateParcels([p])).toThrow("contact_phone");
  });

  it("allows multiple valid phone numbers", () => {
    const p = baseParcel({ contact_phone: "0123456789, 0555123456" });
    expect(validateParcels([p])).toBe(true);
  });

  // -----------------------------
  // Multiple errors
  // -----------------------------
  it("aggregates multiple errors in the thrown message", () => {
    const p = baseParcel({
      order_id: "",
      price: -10
    });

    try {
      validateParcels([p]);
    } catch (e) {
      expect(e.message).toMatch(/One error|errors prevent the helper/);
      expect(e.message).toMatch(/order_id/);
      expect(e.message).toMatch(/price/);
    }
  });
});

describe("setRequest", () => {
  const OLD_CONFIG = global.__YALIDINE_CONFIG__;

  beforeEach(() => {
    global.__YALIDINE_CONFIG__ = { apiId: "123", apiToken: "abc", apiUrl: "https://api.test" };
  });

  afterEach(() => {
    global.__YALIDINE_CONFIG__ = OLD_CONFIG;
    vi.restoreAllMocks();
  });

  it("calls fetch and returns JSON", async () => {
    const fakeResponse = { success: true };
    global.fetch = vi.fn(() =>
      Promise.resolve({ ok: true, json: () => Promise.resolve(fakeResponse) })
    );

    const result = await setRequest({ endpoint: "parcel" });
    expect(result).toEqual(fakeResponse);
    expect(fetch).toHaveBeenCalledWith(
      "https://api.test/parcel",
      expect.objectContaining({ method: "GET" })
    );
  });

  it("throws if fetch fails", async () => {
    global.fetch = vi.fn(() =>
      Promise.resolve({ ok: false, status: 400, statusText: "Bad Request" })
    );

    await expect(setRequest({ endpoint: "parcel" })).rejects.toThrow(
      "'Request failed: 400 Bad Request"
    );
  });
});

