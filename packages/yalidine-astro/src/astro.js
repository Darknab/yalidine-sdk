export default function yalidineIntegration(options = {}) {
    if (!options.apiId || !options.apiToken) {
        console.warn(`[yalidine-astro] Warning: Missing apiId or apiToken.`);
    }
    
    return {
        name: "astro-yalidine",
        hooks: {
            "astro:config:setup": ({ updateConfig }) => {
                updateConfig({
                    vite: {
                        define: {
                            __YALIDINE_CONFIG__: JSON.stringify({
                                apiId: options.apiId ?? null,
                                apiToken: options.apiToken ?? null,
                                apiUrl: options.apiUrl ?? "https://api.yalidine.com/v1",
                                startingCenter: options.startingCenter ?? null,
                                startingWilaya: options.startingWilaya ?? null,
                                defaultCache: options.cacheDefault ?? 'memory',
                                cacheLifeTime: options.cacheLifeTime ?? 1,
                            }),
                        },
                    },
                });
            },
        },
    };
}