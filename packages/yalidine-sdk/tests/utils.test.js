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

// TODO: add test to all edge cases
describe("validateParcels", () => {
  it("throws when parcels array is empty or undefined", () => {
    expect(() => validateParcels()).toThrow();
    expect(() => validateParcels([])).toThrow();
  });

  it("throws when too many parcels (>50)", () => {
    const parcels = Array.from({ length: 51 }, (_, i) => ({ order_id: `id${i}`, from_wilaya_name: "A", firstname:"B", familyname:"C", contact_phone:"0123456789", address:"Addr", to_commune_name:"Commune", to_wilaya_name:"Wilaya", product_list:"Prod", price:1, declared_value:1, length:1, width:1, height:1, weight:1 }));
    expect(() => validateParcels(parcels)).toThrow("Too many parcels");
  });

  it("returns true for a valid parcel", () => {
    const validParcel = {
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
      weight: 5
    };
    expect(validateParcels([validParcel])).toBe(true);
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

