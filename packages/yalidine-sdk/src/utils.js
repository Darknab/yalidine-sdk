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

export function calculateOverWeight(baseFee, overSizeFee, weight) {
    if (weight <= 5) {
        return baseFee;
    } else {
        return baseFee + (overSizeFee * (weight - 5))
    }
}

export function validateParcels(parcels) {
    if (!parcels || parcels.length === 0) {
        throw new Error('At least one parcel should be entered!');
    }

    if (parcels.length > 50) {
        throw new Error("Too many parcels in one request. Please split into smaller batches.");
    }

    let errorsCount = 0;
    let errorMessage = '';

    const displayErrorCount = (count) => (count === 1 ? 'One error' : `${count} errors`);

    parcels.forEach((parcel, index) => {
        // --- Required string fields ---
        const requiredStrings = [
            'order_id', 'from_wilaya_name', 'firstname', 'familyname',
            'contact_phone', 'address', 'to_commune_name', 'to_wilaya_name', 'product_list'
        ];
        requiredStrings.forEach(field => {
            if (!parcel[field] || typeof parcel[field] !== 'string' || parcel[field].trim().length === 0) {
                errorsCount++;
                errorMessage += `Parcel ${index}: ${field} must be a non-empty string\n`;
            }
        });

        // --- Numeric fields ---
        const numericFields = ['price', 'declared_value', 'length', 'width', 'height', 'weight'];
        numericFields.forEach(field => {
            if (parcel[field] == null || typeof parcel[field] !== 'number' || parcel[field] < 0) {
                errorsCount++;
                errorMessage += `Parcel ${index}: ${field} must be a number >= 0\n`;
            }
        });

        // Check price and declared_value range
        if (parcel.price < 0 || parcel.price > 150000) {
            errorsCount++;
            errorMessage += `Parcel ${index}: price must be between 0 and 150000\n`;
        }
        if (parcel.declared_value < 0 || parcel.declared_value > 150000) {
            errorsCount++;
            errorMessage += `Parcel ${index}: declared_value must be between 0 and 150000\n`;
        }

        // --- Boolean fields ---
        const booleanFields = ['do_insurance', 'freeshipping', 'is_stopdesk', 'has_exchange', 'economic'];
        booleanFields.forEach(field => {
            if (parcel[field] != null && typeof parcel[field] !== 'boolean') {
                errorsCount++;
                errorMessage += `Parcel ${index}: ${field} must be a boolean if provided\n`;
            }
        });

        // --- Conditional fields ---
        if (parcel.is_stopdesk && (!parcel.stopdesk_id || typeof parcel.stopdesk_id !== 'string')) {
            errorsCount++;
            errorMessage += `Parcel ${index}: stopdesk_id is required when is_stopdesk is true\n`;
        }

        if (parcel.has_exchange && (!parcel.product_to_collect || typeof parcel.product_to_collect !== 'string')) {
            errorsCount++;
            errorMessage += `Parcel ${index}: product_to_collect is required when has_exchange is true\n`;
        }

        // --- Phone format ---
        if (parcel.contact_phone) {
            const phones = parcel.contact_phone.split(',').map(p => p.trim());
            phones.forEach(p => {
                if (!/^0\d{8,9}$/.test(p)) {
                    errorsCount++;
                    errorMessage += `Parcel ${index}: contact_phone "${p}" is invalid, must start with 0 and be 9 or 10 digits\n`;
                }
            });
        }
    });

    if (errorsCount > 0) {
        throw new Error(`${displayErrorCount(errorsCount)} prevent the helper from sending the request:\n${errorMessage}`);
    }

    return true;
}
