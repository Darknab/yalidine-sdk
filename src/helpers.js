export function sayHello() {
    return 'Hello!'
}

export function getConfig() {
    if (typeof __YALIDINE_CONFIG__ === undefined || !__YALIDINE_CONFIG__) {
        throw new Error(
            "astro-yalidine: Configuration missing. Did you add yalidine to astro.config.mjs ?"
        )
    }
    return __YALIDINE_CONFIG__;
}

export function checkConfig() {
    const { apiKey, apiUrl } = getConfig()

    if (!apiUrl) {
        console.log('something went wrong!')
    } else {
        console.log(apiUrl)
    }
}