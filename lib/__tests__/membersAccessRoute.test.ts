jest.mock("next-auth/jwt", () => ({ getToken: jest.fn(async () => ({ uid: "u1", v: 2 })) }));
jest.mock("../share");

import { AxiosError, AxiosHeaders } from "axios";
import membersAccessHandler from "../../pages/api/datasets/[datasetId]/members-access";
import { setMembersAccess } from "../share";

function gatekeeperError(status: number, data: unknown) {
    return new AxiosError("gatekeeper", "ERR", undefined, {}, {
        status, data, statusText: "", headers: {}, config: { headers: new AxiosHeaders() },
    } as any);
}

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

describe("the members' access BFF route", () => {
    test("PUT passes the body through, without a tenancy", async () => {
        const answer = { members_can_edit: false, access: { level: "owner" } };
        jest.mocked(setMembersAccess).mockResolvedValue(answer as any);

        const res = await send(membersAccessHandler, "PUT", { datasetId: "d1" }, { members_can_edit: false });

        expect(res.statusCode).toBe(200);
        expect(setMembersAccess).toHaveBeenCalledWith(expect.anything(), "d1", { members_can_edit: false });
        expect(res.json).toHaveBeenCalledWith(answer);
    });

    test("a refusal keeps the gatekeeper's status", async () => {
        jest.mocked(setMembersAccess).mockRejectedValue(gatekeeperError(403, { detail: "forbidden" }));

        const res = await send(membersAccessHandler, "PUT", { datasetId: "d1" }, { members_can_edit: false });

        expect(res.statusCode).toBe(403);
    });

    test("only PUT is answered", async () => {
        const res = await send(membersAccessHandler, "GET", { datasetId: "d1" });

        expect(res.statusCode).toBe(405);
    });
});
