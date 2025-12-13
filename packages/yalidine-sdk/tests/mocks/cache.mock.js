import { vi } from "vitest";

export const mockCacheGet = vi.fn();
export const mockCacheSet = vi.fn();

export const mockGetCacheConfig = vi.fn(() => ({
  cache: {
    get: mockCacheGet,
    set: mockCacheSet
  },
  CACHE_TTL: 60
}));

export function registerCacheMock() {
  vi.mock("../../src/cache/cacheConfig.js", () => ({
    getCacheConfig: mockGetCacheConfig
  }));
}