import { calculateOverWeight, ensureServer, getConfig, setRequest } from "../utils.js";

export async function getFees({
    fromWilayaId,
    toWilayaId,
    toCommuneId,
    billableWeight = 5
}) {
    ensureServer();
    
    if (!toWilayaId || !toCommuneId) {
        throw new Error('Destination wilaya and commune are required to calculate fees.');
    }

    const safeWeight = 
        typeof billableWeight === 'number' && billableWeight > 0
            ? billableWeight
            : 5;
    
    const startingWilaya = fromWilayaId ?? getConfig().startingWilaya;

    const data = await setRequest({
        endpoint: 'fees',
        params: {
            from_wilaya_id: startingWilaya,
            to_wilaya_id: toWilayaId
        }
    });

    if (!data.per_commune[toCommuneId]) {
        throw new Error('Commune not found');
    };

    const communeFee = data.per_commune[toCommuneId];
    const oversizeFee = data.oversize_fee;

    return {
        fees: {
            expressHome: calculateOverWeight(communeFee.express_home, oversizeFee, safeWeight),
            expressDesk: calculateOverWeight(communeFee.express_desk, oversizeFee, safeWeight),
            economicHome: communeFee.economic_home ? calculateOverWeight(communeFee.economic_home, oversizeFee, safeWeight) : null,
            economicDesk: communeFee.economic_desk ? calculateOverWeight(communeFee.economic_desk, oversizeFee, safeWeight) : null,
        },
        meta: {
            retourFee: data.retour_fee,
            codPercentage: data.cod_percentage,
            insurancePercentage: data.insurance_percentage,
            oversizeApplied: safeWeight > 5
        }
    }
}