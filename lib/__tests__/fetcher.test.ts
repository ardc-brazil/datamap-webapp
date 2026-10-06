jest.mock("../../components/TenancyStore", () => ({
    useTenancyStore: { getState: () => ({ tenancySelected: "datamap/production/data-amazon" }) },
}));

import { fetcher } from "../fetcher";

describe("the SWR fetcher", () => {
    const originalFetch = global.fetch;
    let lastMock: typeof global.fetch;

    afterEach(() => {
        global.fetch = originalFetch;
    });

    test("an error carries the status and the gatekeeper's code", async () => {
        lastMock = jest.fn(async () => ({
            ok: false, status: 401, statusText: "Unauthorized",
            json: async () => ({ detail: "unauthorized_tenancy: removed" }),
        })) as any;
        global.fetch = lastMock;

        await expect(fetcher("/api/datasets")).rejects.toMatchObject({ status: 401, detail: "unauthorized_tenancy: removed" });
    });

    test("an error without a JSON body has no code", async () => {
        expect(global.fetch).not.toBe(lastMock);

        lastMock = jest.fn(async () => ({
            ok: false, status: 502, statusText: "Bad Gateway",
            json: async () => { throw new SyntaxError("Unexpected end of JSON input"); },
        })) as any;
        global.fetch = lastMock;

        await expect(fetcher("/api/datasets")).rejects.toMatchObject({ status: 502, detail: undefined });
    });

    test("does not leave its mock behind for a test that runs after", () => {
        expect(global.fetch).not.toBe(lastMock);
        expect(global.fetch).toBe(originalFetch);
    });
});
