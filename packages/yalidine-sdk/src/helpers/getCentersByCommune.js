import { ensureServer, setRequest } from "../utils.js";

export async function getCentersByCommune({
    communeId,
    params = {}
}) {
    ensureServer();

    if (!communeId) {
        throw new Error('A commune Id must be entered to retrieve centers.');
    }

    const response = await setRequest({
        endpoint: 'centers',
        params: {
            commune_id: communeId,
            ...params
        }
    });

    const centers = response.data;

    return centers.map( c => ({
        id: c.center_id,
        name: c.name,
        address: c.address,
        gps: c.gps,
        commune_id: c.commune_id,
        commune_name: c.commune_name,
        wilaya_id: c.wilaya_id
    }));
}