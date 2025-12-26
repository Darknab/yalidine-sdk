export default function yalidineIntegration(options = {}) {   
    return {
        name: "astro-yalidine",
        hooks: {
            "astro:config:setup": ({ updateConfig }) => {
                updateConfig({
                    vite: {
                        define: {
                            __YALIDINE_CONFIG__: JSON.stringify({
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