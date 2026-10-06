jest.mock("next-auth/jwt", () => ({ getToken: jest.fn(async () => ({ uid: "u1", v: 2 })) }));
jest.mock("../dataset");

import { AxiosError, AxiosHeaders } from "axios";
import datasetsHandler from "../../pages/api/datasets/index";
import { getAllDataset } from "../dataset";

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

test("a tenancy the user was removed from reaches the browser with its code", async () => {
    jest.mocked(getAllDataset).mockRejectedValue(new AxiosError("gatekeeper", "ERR", undefined, {}, {
        status: 401, data: { detail: "unauthorized_tenancy: user is not a member" }, statusText: "", headers: {}, config: { headers: new AxiosHeaders() },
    } as any));
    const res = fakeRes();
    const original = process.stdout.write;
    // @ts-ignore
    process.stdout.write = () => true;
    try {
        await datasetsHandler({
            method: "GET", url: "/api/datasets?minimal=true", query: {}, cookies: {},
            headers: { "x-datamap-tenancy": "datamap/production/data-amazon" },
        } as any, res);
    } finally {
        process.stdout.write = original;
    }

    expect(res.statusCode).toBe(401);
    expect(res.json).toHaveBeenCalledWith({ detail: "unauthorized_tenancy: user is not a member" });
});
