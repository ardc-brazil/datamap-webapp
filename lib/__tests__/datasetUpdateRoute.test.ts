jest.mock("next-auth/jwt", () => ({ getToken: jest.fn(async () => ({ uid: "u1", v: 2 })) }));
jest.mock("../dataset");

import { AxiosError, AxiosHeaders } from "axios";
import datasetHandler from "../../pages/api/datasets/[datasetId]";
import { updateDataset } from "../dataset";

const AMAZON = "datamap/production/data-amazon";
const body = { id: "d1", name: "Ozone", data: {}, tenancy: AMAZON, is_enabled: true };

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

async function put() {
    const res = fakeRes();
    const original = process.stdout.write;
    // @ts-ignore
    process.stdout.write = () => true;
    try {
        await datasetHandler({
            method: "PUT", url: "/api/datasets/d1", query: { datasetId: "d1" }, cookies: {}, body,
            headers: { "x-datamap-tenancy": AMAZON },
        } as any, res);
    } finally {
        process.stdout.write = original;
    }
    return res;
}

describe("PUT /api/datasets/[datasetId]", () => {
    test("an edit is passed on with the tenancy the form sent", async () => {
        jest.mocked(updateDataset).mockResolvedValue({});

        const res = await put();

        expect(res.statusCode).toBe(200);
        expect(jest.mocked(updateDataset).mock.calls[0][1]).toEqual(body);
    });

    test("a dataset sent with another tenancy reaches the browser with its code", async () => {
        jest.mocked(updateDataset).mockRejectedValue(new AxiosError("gatekeeper", "ERR", undefined, {}, {
            status: 400, data: { detail: "tenancy_cannot_change" }, statusText: "", headers: {}, config: { headers: new AxiosHeaders() },
        } as any));

        const res = await put();

        expect(res.statusCode).toBe(400);
        expect(res.json).toHaveBeenCalledWith({ detail: "tenancy_cannot_change" });
    });
});
