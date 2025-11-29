import { describe, it, expect, vi, beforeEach } from "vitest";
import { createParcels } from "../src/helpers/createParcels.js";

vi.mock("../src/utils.js", () => ({
    ensureServer: vi.fn(),
    validateParcels: vi.fn(),
    setRequest: vi.fn(), 
}));
import { ensureServer, validateParcels, setRequest } from "../src/utils.js";

beforeEach(() => {
    vi.resetAllMocks();
});

it("calls ensureServer()", async () => {
    setRequest.mockResolvedValue({});

    await createParcels({ dummy: true });

    expect(ensureServer).toHaveBeenCalled();
});

it("throws if ensureServer throws", async () => {
    ensureServer.mockImplementationOnce(() => {
        throw new Error("Server error");
    });

    await expect(createParcels({})).rejects.toThrow("Server error");
});

it("validates parcels", async () => {
    setRequest.mockResolvedValue({});

    const parcel1 = { id: 1 };
    const parcel2 = { id: 2 };

    await createParcels(parcel1, parcel2);

    expect(validateParcels).toHaveBeenCalledWith([parcel1, parcel2]);
});

it("throws if validateParcels throws", async () => {
    validateParcels.mockImplementation(() => {
        throw new Error("validation failed");
    });

    await expect(createParcels({})).rejects.toThrow("validation failed");
});

it("calls setRequest with correct arguments", async () => {
    const parcel = { a: 1 };
    setRequest.mockResolvedValue({});

    await createParcels(parcel);

    expect(setRequest).toHaveBeenCalledWith({
        endpoint: "parcel",
        method: "POST",
        params: { body: [parcel] },
    });
});

it("splits succeded and failed parcels correctly", async () => {
    setRequest.mockResolvedValue({
        "1001": { success: true },
        "2002": { success: false },
    });

    const result = await createParcels({});

    expect(result.meta.succeededParcels).toEqual(["1001"]);
    expect(result.meta.failedParcels).toEqual(["2002"]);
});

it("returns data and meta", async () => {
    const mockResponse = {
        "123": { success: true },
        "456": { success: false }, 
    };

    setRequest.mockResolvedValue(mockResponse);

    const result = await createParcels({});

    expect(result.data).toEqual(mockResponse);
})