jest.mock("next-auth/jwt", () => ({ getToken: jest.fn(async () => ({ uid: "u1" })) }));
jest.mock("../share");

import { AxiosError, AxiosHeaders } from "axios";
import shareHandler from "../../pages/api/datasets/[datasetId]/share/index";
import permissionHandler from "../../pages/api/datasets/[datasetId]/share/permissions/[userId]";
import acceptHandler from "../../pages/api/invitations/accept";
import { acceptInvitation, getShareState, grantAccess, revokePermission } from "../share";

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

describe("the share BFF routes", () => {
    test("GET answers the share state, without a tenancy", async () => {
        jest.mocked(getShareState).mockResolvedValue({ owner: { id: "o" }, permissions: [], invitations: [], anonymous_links: [] } as any);

        const res = await send(shareHandler, "GET", { datasetId: "d1" });

        expect(res.statusCode).toBe(200);
        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ owner: { id: "o" } }));
        expect(getShareState).toHaveBeenCalledWith(expect.objectContaining({ uid: "u1" }), "d1");
    });

    test("POST grants and answers 201", async () => {
        jest.mocked(grantAccess).mockResolvedValue({ kind: "permission", permission: {} } as any);

        const res = await send(shareHandler, "POST", { datasetId: "d1" }, { user_id: "u2", level: "read" });

        expect(res.statusCode).toBe(201);
        expect(grantAccess).toHaveBeenCalledWith(expect.anything(), "d1", { user_id: "u2", level: "read" });
    });

    test("a gatekeeper 400 keeps its error code", async () => {
        jest.mocked(grantAccess).mockRejectedValue(new AxiosError("bad", "ERR", undefined, {}, {
            status: 400, data: { details: "Invalid client input", errors: [{ code: "invalid_orcid" }] },
            statusText: "", headers: {}, config: { headers: new AxiosHeaders() },
        } as any));

        const res = await send(shareHandler, "POST", { datasetId: "d1" }, { orcid: "0000", level: "read" });

        expect(res.statusCode).toBe(400);
        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ errors: [{ code: "invalid_orcid" }] }));
    });

    test("DELETE on a permission answers 204", async () => {
        jest.mocked(revokePermission).mockResolvedValue(undefined);

        const res = await send(permissionHandler, "DELETE", { datasetId: "d1", userId: "u2" });

        expect(res.statusCode).toBe(204);
        expect(revokePermission).toHaveBeenCalledWith(expect.anything(), "d1", "u2");
    });

    test("accepting an invitation already accepted is a 409", async () => {
        jest.mocked(acceptInvitation).mockRejectedValue(new AxiosError("conflict", "ERR", undefined, {}, {
            status: 409, data: { detail: "invitation_already_accepted" },
            statusText: "", headers: {}, config: { headers: new AxiosHeaders() },
        } as any));

        const res = await send(acceptHandler, "POST", {}, { token: "t" });

        expect(res.statusCode).toBe(409);
    });
});
