jest.mock("next-auth/jwt", () => ({ getToken: jest.fn(async () => ({ uid: "u1" })) }));
jest.mock("../embargo");
jest.mock("../dataset");

import embargoHandler from "../../pages/api/datasets/[datasetId]/embargo/index";
import extendHandler from "../../pages/api/datasets/[datasetId]/embargo/extend";
import noteHandler from "../../pages/api/datasets/[datasetId]/embargo/note";
import eventsHandler from "../../pages/api/datasets/[datasetId]/access-events";
import sharedHandler from "../../pages/api/datasets/shared";
import { getSharedDatasets } from "../dataset";
import { extendEmbargo, getAccessEvents, setEmbargo, setEmbargoNote } from "../embargo";

function fakeRes() {
    const res: any = { statusCode: 200, headers: {} };
    res.setHeader = jest.fn((key: string, value: string) => (res.headers[key] = value));
    res.getHeader = jest.fn((key: string) => res.headers[key]);
    res.status = jest.fn((code: number) => {
        res.statusCode = code;
        return res;
    });
    res.end = jest.fn(() => res);
    res.json = jest.fn(() => res);
    return res;
}

async function send(handler: any, method: string, query: Record<string, string>, body: unknown = undefined) {
    const res = fakeRes();
    const original = process.stdout.write;
    // @ts-ignore
    process.stdout.write = () => true;
    try {
        await handler({ method, url: "/api/x", headers: {}, cookies: {}, query, body } as any, res);
    } finally {
        process.stdout.write = original;
    }
    return res;
}

describe("the embargo BFF routes", () => {
    test("PUT sets the embargo", async () => {
        jest.mocked(setEmbargo).mockResolvedValue({ active: true } as any);
        const body = { until: "2026-12-01T23:59:59+00:00", metadata_visible: false, note: null };

        const res = await send(embargoHandler, "PUT", { datasetId: "d1" }, body);

        expect(res.statusCode).toBe(200);
        expect(setEmbargo).toHaveBeenCalledWith(expect.anything(), "d1", body);
    });

    test("POST extend", async () => {
        jest.mocked(extendEmbargo).mockResolvedValue({ active: true } as any);

        await send(extendHandler, "POST", { datasetId: "d1" }, { until: "2026-12-20T23:59:59+00:00" });

        expect(extendEmbargo).toHaveBeenCalledWith(expect.anything(), "d1", { until: "2026-12-20T23:59:59+00:00" });
    });

    test("the shared list passes the paging through", async () => {
        jest.mocked(getSharedDatasets).mockResolvedValue({ content: [] } as any);

        const res = await send(sharedHandler, "GET", { page: "1", page_size: "20" });

        expect(res.statusCode).toBe(200);
        expect(getSharedDatasets).toHaveBeenCalledWith(expect.anything(), { page: "1", page_size: "20" });
    });
});

describe("the routes the design adds", () => {
    test("PUT note", async () => {
        jest.mocked(setEmbargoNote).mockResolvedValue({ note: "Accepted" } as any);

        const res = await send(noteHandler, "PUT", { datasetId: "d1" }, { note: "Accepted" });

        expect(res.statusCode).toBe(200);
        expect(setEmbargoNote).toHaveBeenCalledWith(expect.anything(), "d1", { note: "Accepted" });
    });

    test("GET access events", async () => {
        jest.mocked(getAccessEvents).mockResolvedValue({ items: [] });

        const res = await send(eventsHandler, "GET", { datasetId: "d1" });

        expect(res.statusCode).toBe(200);
        expect(res.json).toHaveBeenCalledWith({ items: [] });
    });
});
