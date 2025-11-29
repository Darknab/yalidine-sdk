import { ensureServer, setRequest, validateParcels } from "../utils.js";

export async function createParcels(...parcels) {
    ensureServer();
    validateParcels(parcels);

    const data = await setRequest({
        endpoint: 'parcel',
        method: 'POST',
        params: { body: parcels },
    });

    const succeededParcels = [];
    const failedParcels = [];

    for (const [orderId, result] of Object.entries(data)) {
        if (result.success) succeededParcels.push(orderId);
        else failedParcels.push(orderId);
    }

    return {
        data,
        meta: { succeededParcels, failedParcels },
    };
}