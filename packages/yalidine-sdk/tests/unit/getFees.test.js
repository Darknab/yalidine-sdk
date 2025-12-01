import { describe, it, expect, vi, beforeEach } from "vitest";
import { getFees } from "../../src/helpers/getFees.js";

vi.mock("../../src/utils.js", () => ({
    calculateOverWeight: vi.fn((base, over, weight) => base + (weight > 5 ? (weight - 5) * over : 0)),
    ensureServer: vi.fn(),
    getConfig: vi.fn(() => ({ startingWilaya: 1 })),
    setRequest: vi.fn(),
}));

import { calculateOverWeight, ensureServer, setRequest } from "../../src/utils.js";

beforeEach(() => {
    vi.clearAllMocks();
});

describe("getFees", () => {
    const mockData = {
        per_commune: {
            "10": {
                express_home: 10,
                express_desk: 12,
                economic_home: 8,
                economic_desk: 6
            }
        },
        oversize_fee: 2,
        retour_fee: 5,
        cod_percentage: 0.1,
        insurance_percentage: 0.05
    };

    it("calls ensureServer", async () => {
        setRequest.mockResolvedValue(mockData);
        await getFees({ toWilayaId: 2, toCommuneId: 10 });
        expect(ensureServer).toHaveBeenCalled();
    });

    it("throws if destination wilaya or commune missing", async () => {
        await expect(getFees({})).rejects.toThrow(
            'Destination wilaya and commune are required to calculate fees.'
        );
    });

    it("uses default startingWilaya from config if fromWilayaId not provided", async () => {
        setRequest.mockResolvedValue(mockData);
        await getFees({ toWilayaId: 2, toCommuneId: 10 });
        expect(setRequest).toHaveBeenCalledWith(
            expect.objectContaining({
                params: expect.objectContaining({ from_wilaya_id: 1 })
            })
        );
    });

    it("throws if commune not found in data", async () => {
        setRequest.mockResolvedValue({ per_commune: {} });
        await expect(getFees({ toWilayaId: 2, toCommuneId: 10 })).rejects.toThrow('Commune not found');
    });

    it("calculates fees correctly using calculateOverWeight", async () => {
        setRequest.mockResolvedValue(mockData);

        const result = await getFees({ toWilayaId: 2, toCommuneId: 10, billableWeight: 7 });

        expect(calculateOverWeight).toHaveBeenCalledTimes(4);
        expect(result.fees.expressHome).toBe(14); // 10 + (7-5)*2
        expect(result.fees.expressDesk).toBe(16); // 12 + (7-5)*2
        expect(result.fees.economicHome).toBe(12); // 8 + (7-5)*2
        expect(result.fees.economicDesk).toBe(10); // 6 + (7-5)*2
        expect(result.meta.oversizeApplied).toBe(true);
        expect(result.meta.retourFee).toBe(5);
        expect(result.meta.codPercentage).toBe(0.1);
        expect(result.meta.insurancePercentage).toBe(0.05);
    });

    it("handles billableWeight <= 5 correctly", async () => {
        setRequest.mockResolvedValue(mockData);

        const result = await getFees({ toWilayaId: 2, toCommuneId: 10, billableWeight: 5 });

        expect(result.fees.expressHome).toBe(10); // no oversize applied
        expect(result.meta.oversizeApplied).toBe(false);
    });

    it("defaults billableWeight to 5 if invalid", async () => {
        setRequest.mockResolvedValue(mockData);

        const result = await getFees({ toWilayaId: 2, toCommuneId: 10, billableWeight: -3 });

        expect(result.fees.expressHome).toBe(10);
        expect(result.meta.oversizeApplied).toBe(false);
    });

    it("uses fromWilayaId if provided", async () => {
        setRequest.mockResolvedValue(mockData);

        await getFees({ fromWilayaId: 99, toWilayaId: 2, toCommuneId: 10 });
        expect(setRequest).toHaveBeenCalledWith(
            expect.objectContaining({
                params: expect.objectContaining({ from_wilaya_id: 99 })
            })
        );
    });
});
