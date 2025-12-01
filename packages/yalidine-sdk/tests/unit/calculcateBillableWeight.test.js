import { it, expect } from "vitest";
import { calculateBillableWeight } from "../../src/helpers/calculateBillabeWeight.js";

it("Returns the highest value real and volumetric weight", () => {
    expect(calculateBillableWeight(10, 40, 20, 8)).toEqual(8);
    expect(calculateBillableWeight(80, 90, 80, 10)).toEqual(115.2);
});

it("Handles equal volumetric and real weight", () => {
    expect(calculateBillableWeight(50, 50, 20, 10)).toEqual(10);
});