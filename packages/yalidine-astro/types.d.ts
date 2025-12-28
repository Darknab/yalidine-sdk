declare module "yalidine-astro" {
  interface YalidineOptions {
    apiUrl?: string;
    startingCenter?: string | number;
    startingWilaya?: string | number;
    cacheDefault?: "memory" | "file";
    cacheLifeTime?: number;
  }

  export default function yalidineIntegration(
    options?: YalidineOptions
  ): any;
}