jest.mock("../../components/TenancyStore", () => ({
    useTenancyStore: { getState: () => ({ tenancySelected: "datamap/production/data-amazon" }) },
}));

import { fetcher } from "../fetcher";

describe("the SWR fetcher", () => {
    test("an error carries the status and the gatekeeper's code", async () => {
        global.fetch = jest.fn(async () => ({
            ok: false, status: 401, statusText: "Unauthorized",
            json: async () => ({ detail: "unauthorized_tenancy: removed" }),
        })) as any;

        await expect(fetcher("/api/datasets")).rejects.toMatchObject({ status: 401, detail: "unauthorized_tenancy: removed" });
    });

    test("an error without a JSON body has no code", async () => {
        global.fetch = jest.fn(async () => ({
            ok: false, status: 502, statusText: "Bad Gateway",
            json: async () => { throw new SyntaxError("Unexpected end of JSON input"); },
        })) as any;

        await expect(fetcher("/api/datasets")).rejects.toMatchObject({ status: 502, detail: undefined });
    });
});
