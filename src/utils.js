export function ensureServer() {
    // Throw an error if used in the browser
    if (typeof window !== "undefined") {
        throw new Error(
            "astro-yalidine: server-only helper imported in client code. " +
            "Use these helpers only in server contexts ( API routes, server-side page formatter, etc.)."
        );
    }
}

export function getConfig() {
    if (typeof __YALIDINE_CONFIG__ === undefined || !__YALIDINE_CONFIG__) {
        throw new Error(
            "astro-yalidine: Configuration missing. Did you add yalidine to astro.config.mjs ?"
        )
    }
    return __YALIDINE_CONFIG__;
}

export async function setRequest({endpoint, method = 'GET', options = {}, params = {}}) {
    const { apiId, apiToken, apiUrl } = getConfig();
    const query = new URLSearchParams(params).toString();
    const url = `${apiUrl.replace(/\/$/, '')}/${endpoint.replace(/^\//, '')}${query ? `?${query}` : ""}`;

    const fetchOptions = {
        method,
        headers: { 
            'X-API-ID': apiId.trim(),
            'X-API-TOKEN': apiToken.trim(),
            'Accept': 'application/json',
            ...options.headers,
        },
    };

    if (method !== 'GET' && options.body) {
        fetchOptions.body = JSON.stringify(options.body);
    }

    const res = await fetch(url, fetchOptions);

    if(!res.ok) {
        throw new Error(`'Request failed: ${res.status} ${res.statusText}`);
    }
    
    return await res.json();
}

export function getIds(options) {
    return options.id.split(",").map(Number)
}