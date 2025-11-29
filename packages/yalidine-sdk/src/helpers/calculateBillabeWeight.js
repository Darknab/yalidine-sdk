export function calculateBillableWeight(height, width, length, weight) {
    const volumetricWeight = height * width * length * 0.0002;

    return weight > volumetricWeight ? weight : volumetricWeight;
}
