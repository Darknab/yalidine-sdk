import { ensureServer, setRequest } from "./utils.js";

export async function getWilayas(deliverableOnly = true, params = {}) {
    ensureServer();

    const wilayas = await setRequest({
        endpoint: 'wilayas',
        params,
    });

    if (deliverableOnly) {
        return wilayas.data
            .filter(w => w.is_deliverable === 1)
            .map(w => ({
                id: w.id,
                name: w.name,
                zone: w.zone,
            }));
    }

    return wilayas.data.map(w => ({
        id: w.id,
        name: w.name,
        zone: w.zone,
        is_deliverable: w.is_deliverable,
    }));
}
