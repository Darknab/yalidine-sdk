import { vi } from 'vitest';

export const mockSetRequest = vi.fn();

export function mockApiSuccess(data) {
    mockSetRequest.mockResolvedValue(data);
}

export function mockApiFailure(data) {
    mockSetRequest.mockResolvedValue(data); // API responds but marks failure
}

export function mockApiError(error) {
    mockSetRequest.mockRejectedValue(error);
}

export const mockGetConfig = vi.fn(() => ({
    apiUrl: 'https://api.test-server.net',
    startingCenter: 110,
    startingWilaya: 16,
    defaultCache: 'file',
    cacheLifeTime: 1
}));

