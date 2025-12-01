import { it, expect, vi, beforeEach } from "vitest";
import { getCentersByCommune } from "../../src/helpers/getCentersByCommune.js";

// Mocks
import * as utils from "../../src/utils.js";

beforeEach(() => {
    vi.restoreAllMocks();
});

it("throws when communeId is missing", async () => {
    vi.spyOn(utils, "ensureServer").mockImplementation(() => {});
    await expect(getCentersByCommune({})).rejects.toThrow(
        "A commune Id must be entered to retrieve centers."
    );
});

it("calls setRequest with correct params", async () => {
    vi.spyOn(utils, "ensureServer").mockImplementation(() => {});
    const mockSetRequest = vi
        .spyOn(utils, "setRequest")
        .mockResolvedValue({ data: [] });

    await getCentersByCommune({
        communeId: 123,
        params: { foo: "bar" }
    });

    expect(mockSetRequest).toHaveBeenCalledWith({
        endpoint: "centers",
        params: {
            commune_id: 123,
            foo: "bar"
        }
    });
});

it("maps the returned centers correctly", async () => {
    vi.spyOn(utils, "ensureServer").mockImplementation(() => {});

    vi.spyOn(utils, "setRequest").mockResolvedValue({
        data: [
            {
                center_id: 1,
                name: "Center One",
                address: "Main St",
                gps: "35.1, 3.2",
                commune_id: 10,
                commune_name: "CommuneX",
                wilaya_id: 5
            },
            {
                center_id: 2,
                name: "Center Two",
                address: "Second St",
                gps: "36.0, 3.1",
                commune_id: 20,
                commune_name: "CommuneY",
                wilaya_id: 7
            }
        ]
    });

    const result = await getCentersByCommune({ communeId: 10 });

    expect(result).toEqual([
        {
            id: 1,
            name: "Center One",
            address: "Main St",
            gps: "35.1, 3.2",
            commune_id: 10,
            commune_name: "CommuneX",
            wilaya_id: 5
        },
        {
            id: 2,
            name: "Center Two",
            address: "Second St",
            gps: "36.0, 3.1",
            commune_id: 20,
            commune_name: "CommuneY",
            wilaya_id: 7
        }
    ]);
});
