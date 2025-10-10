export default function yalidineIntegration(options = {}) {
    return {
        name: "astro-yalidine",
        hooks: {
            "astro:config:setup": ({ updateConfig }) => {
                updateConfig({
                    vite: {
                        define: {
                            __YALIDINE_CONFIG__: JSON.stringify({
                                apiId: options.apiId || 'Nothing',
                                apiToken: options.apiToken || 'Nothing',
                                apiUrl: options.apiUrl || "https://api.yalidine.com/v1",
                            }),
                        },
                    },
                });
            },
        },
    };
}