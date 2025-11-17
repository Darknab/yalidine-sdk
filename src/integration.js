export default function yalidineIntegration(options = {}) {
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
                                defaultCache: options.cacheDefault ?? MemoryCacheAdapter,
                                cacheLifeTime: options.cacheLifeTime ?? 1,
                            }),
                        },
                    },
                });
            },
        },
    };
}