jest.mock("next-auth/jwt", () => ({ getToken: jest.fn(async () => ({ uid: "u1", v: 2 })) }));
jest.mock("../tenancies");

import { AxiosError, AxiosHeaders } from "axios";
import { getToken } from "next-auth/jwt";
import tenanciesHandler from "../../pages/api/tenancies/index";
import requestsHandler from "../../pages/api/tenancy-requests/index";
import requestHandler from "../../pages/api/tenancy-requests/[requestId]";
import invitationsHandler from "../../pages/api/tenancy-invitations/index";
import acceptHandler from "../../pages/api/tenancy-invitations/[invitationId]/accept";
import declineHandler from "../../pages/api/tenancy-invitations/[invitationId]/decline";
import {
    acceptTenancyInvitation,
    createTenancyRequest,
    declineTenancyInvitation,
    listMyTenancies,
    listMyTenancyInvitations,
    listMyTenancyRequests,
    withdrawTenancyRequest,
} from "../tenancies";

const JSON_HEADERS = { "content-type": "application/json" };
const REQUEST_ID = "6f1c3d1e-2b7a-4f0e-9a51-1c2d3e4f5a6b";
const INVITATION_ID = "0b9e8d7c-6a5b-4c3d-8e2f-1a2b3c4d5e6f";

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

async function send(handler: any, method: string, query: Record<string, string> = {}, body: unknown = undefined, headers: Record<string, string> = {}) {
    const res = fakeRes();
    const original = process.stdout.write;
    // @ts-ignore
    process.stdout.write = () => true;
    try {
        await handler({ method, url: "/api/x", headers, cookies: {}, query, body } as any, res);
    } finally {
        process.stdout.write = original;
    }
    return res;
}

describe("the user's tenancy BFF routes", () => {
    test("GET /api/tenancies reads the tenancies of the user in the token", async () => {
        jest.mocked(listMyTenancies).mockResolvedValue([{ path: "datamap/production/public" }] as any);

        const res = await send(tenanciesHandler, "GET");

        expect(res.statusCode).toBe(200);
        expect(listMyTenancies).toHaveBeenCalledWith("u1");
        expect(res.json).toHaveBeenCalledWith([{ path: "datamap/production/public" }]);
    });

    test("GET /api/tenancy-requests lists the user's requests", async () => {
        jest.mocked(listMyTenancyRequests).mockResolvedValue([{ id: "r1" }] as any);

        const res = await send(requestsHandler, "GET");

        expect(res.statusCode).toBe(200);
        expect(listMyTenancyRequests).toHaveBeenCalledWith("u1");
    });

    test("POST /api/tenancy-requests creates one and answers 201", async () => {
        jest.mocked(createTenancyRequest).mockResolvedValue({ id: "r1", status: "pending" } as any);

        const res = await send(requestsHandler, "POST", {}, { tenancyName: "Data Amazon", reason: "SMPS data" }, JSON_HEADERS);

        expect(res.statusCode).toBe(201);
        expect(createTenancyRequest).toHaveBeenCalledWith("u1", { tenancyName: "Data Amazon", reason: "SMPS data" });
        expect(res.json).toHaveBeenCalledWith({ id: "r1", status: "pending" });
    });

    test("a POST that is not JSON is refused before the gatekeeper", async () => {
        jest.mocked(createTenancyRequest).mockClear();

        const res = await send(requestsHandler, "POST", {}, "tenancyName=x", { "content-type": "application/x-www-form-urlencoded" });

        expect(res.statusCode).toBe(415);
        expect(res.json).toHaveBeenCalledWith({ detail: "invalid_request" });
        expect(createTenancyRequest).not.toHaveBeenCalled();
    });

    test("a body without the two strings is invalid_request", async () => {
        jest.mocked(createTenancyRequest).mockClear();

        const res = await send(requestsHandler, "POST", {}, { tenancyName: 42 }, JSON_HEADERS);

        expect(res.statusCode).toBe(400);
        expect(res.json).toHaveBeenCalledWith({ detail: "invalid_request" });
        expect(createTenancyRequest).not.toHaveBeenCalled();
    });

    test("the gatekeeper's 409 reaches the browser with its code", async () => {
        jest.mocked(createTenancyRequest).mockRejectedValue(gatekeeperError(409, { detail: "request_pending" }));

        const res = await send(requestsHandler, "POST", {}, { tenancyName: "Data Amazon", reason: "SMPS data" }, JSON_HEADERS);

        expect(res.statusCode).toBe(409);
        expect(res.json).toHaveBeenCalledWith({ detail: "request_pending" });
    });

    test("DELETE /api/tenancy-requests/[requestId] withdraws and answers 204", async () => {
        jest.mocked(withdrawTenancyRequest).mockResolvedValue(undefined);

        const res = await send(requestHandler, "DELETE", { requestId: REQUEST_ID });

        expect(res.statusCode).toBe(204);
        expect(withdrawTenancyRequest).toHaveBeenCalledWith("u1", REQUEST_ID);
    });

    test("a request id that is not a UUID never reaches the gatekeeper", async () => {
        jest.mocked(withdrawTenancyRequest).mockClear();

        const res = await send(requestHandler, "DELETE", { requestId: "../../admin" });

        expect(res.statusCode).toBe(404);
        expect(res.json).toHaveBeenCalledWith({ detail: "request_not_found" });
        expect(withdrawTenancyRequest).not.toHaveBeenCalled();
    });

    test("GET /api/tenancy-invitations lists the pending ones", async () => {
        jest.mocked(listMyTenancyInvitations).mockResolvedValue([{ id: INVITATION_ID }] as any);

        const res = await send(invitationsHandler, "GET");

        expect(res.statusCode).toBe(200);
        expect(listMyTenancyInvitations).toHaveBeenCalledWith("u1");
    });

    test("accepting answers the tenancy joined", async () => {
        jest.mocked(acceptTenancyInvitation).mockResolvedValue({ tenancy: { path: "datamap/production/data-amazon" } } as any);

        const res = await send(acceptHandler, "POST", { invitationId: INVITATION_ID }, {}, JSON_HEADERS);

        expect(res.statusCode).toBe(200);
        expect(acceptTenancyInvitation).toHaveBeenCalledWith("u1", INVITATION_ID);
        expect(res.json).toHaveBeenCalledWith({ tenancy: { path: "datamap/production/data-amazon" } });
    });

    test("declining answers 204", async () => {
        jest.mocked(declineTenancyInvitation).mockResolvedValue(undefined);

        const res = await send(declineHandler, "POST", { invitationId: INVITATION_ID }, {}, JSON_HEADERS);

        expect(res.statusCode).toBe(204);
        expect(declineTenancyInvitation).toHaveBeenCalledWith("u1", INVITATION_ID);
    });

    test("an invitation that is no longer open is a 404 with its code", async () => {
        jest.mocked(acceptTenancyInvitation).mockRejectedValue(gatekeeperError(404, { detail: "invitation_not_found" }));

        const res = await send(acceptHandler, "POST", { invitationId: INVITATION_ID }, {}, JSON_HEADERS);

        expect(res.statusCode).toBe(404);
        expect(res.json).toHaveBeenCalledWith({ detail: "invitation_not_found" });
    });

    test("a signed-out caller gets 401 and the gatekeeper is not called", async () => {
        jest.mocked(listMyTenancies).mockClear();
        jest.mocked(getToken).mockResolvedValueOnce(null);

        const res = await send(tenanciesHandler, "GET");

        expect(res.statusCode).toBe(401);
        expect(listMyTenancies).not.toHaveBeenCalled();
    });

    test("GET on accept is 405", async () => {
        const res = await send(acceptHandler, "GET", { invitationId: INVITATION_ID });

        expect(res.statusCode).toBe(405);
    });

    test("GET on decline is 405", async () => {
        const res = await send(declineHandler, "GET", { invitationId: INVITATION_ID });

        expect(res.statusCode).toBe(405);
    });

    test("accepting or declining with a non-UUID id never reaches the gatekeeper", async () => {
        jest.mocked(acceptTenancyInvitation).mockClear();
        jest.mocked(declineTenancyInvitation).mockClear();

        const accepted = await send(acceptHandler, "POST", { invitationId: "../../admin" }, {}, JSON_HEADERS);
        const declined = await send(declineHandler, "POST", { invitationId: "../../admin" }, {}, JSON_HEADERS);

        expect(accepted.statusCode).toBe(404);
        expect(accepted.json).toHaveBeenCalledWith({ detail: "invitation_not_found" });
        expect(declined.statusCode).toBe(404);
        expect(declined.json).toHaveBeenCalledWith({ detail: "invitation_not_found" });
        expect(acceptTenancyInvitation).not.toHaveBeenCalled();
        expect(declineTenancyInvitation).not.toHaveBeenCalled();
    });

    test("accepting or declining without JSON is refused before the gatekeeper", async () => {
        jest.mocked(acceptTenancyInvitation).mockClear();
        jest.mocked(declineTenancyInvitation).mockClear();

        const accepted = await send(acceptHandler, "POST", { invitationId: INVITATION_ID }, "x=1", { "content-type": "application/x-www-form-urlencoded" });
        const declined = await send(declineHandler, "POST", { invitationId: INVITATION_ID }, "x=1", { "content-type": "application/x-www-form-urlencoded" });

        expect(accepted.statusCode).toBe(415);
        expect(declined.statusCode).toBe(415);
        expect(acceptTenancyInvitation).not.toHaveBeenCalled();
        expect(declineTenancyInvitation).not.toHaveBeenCalled();
    });

    test("a pending ORCID sign-in is refused on these routes", async () => {
        jest.mocked(getToken).mockResolvedValueOnce({ pending: { orcid: "0000-0001-2345-6789" }, v: 2 } as any);
        jest.mocked(acceptTenancyInvitation).mockClear();

        const res = await send(acceptHandler, "POST", { invitationId: INVITATION_ID }, {}, JSON_HEADERS);

        expect(res.statusCode).toBe(401);
        expect(acceptTenancyInvitation).not.toHaveBeenCalled();
    });

    test("a token from before the version is refused", async () => {
        jest.mocked(getToken).mockResolvedValueOnce({ uid: "u1", v: 1 } as any);
        jest.mocked(acceptTenancyInvitation).mockClear();

        const res = await send(acceptHandler, "POST", { invitationId: INVITATION_ID }, {}, JSON_HEADERS);

        expect(res.statusCode).toBe(401);
        expect(acceptTenancyInvitation).not.toHaveBeenCalled();
    });

    test("fields beyond tenancyName and reason are dropped before the gatekeeper sees them", async () => {
        jest.mocked(createTenancyRequest).mockClear();
        jest.mocked(createTenancyRequest).mockResolvedValue({ id: "r1", status: "pending" } as any);

        await send(requestsHandler, "POST", {}, { tenancyName: "Data Amazon", reason: "SMPS data", roles: ["admin"], userId: "u2" }, JSON_HEADERS);

        expect(createTenancyRequest).toHaveBeenCalledWith("u1", { tenancyName: "Data Amazon", reason: "SMPS data" });
    });

    test("a missing reason is invalid_request", async () => {
        jest.mocked(createTenancyRequest).mockClear();

        const res = await send(requestsHandler, "POST", {}, { tenancyName: "Data Amazon" }, JSON_HEADERS);

        expect(res.statusCode).toBe(400);
        expect(res.json).toHaveBeenCalledWith({ detail: "invalid_request" });
        expect(createTenancyRequest).not.toHaveBeenCalled();
    });

    test("a non-Axios error answers 500 unavailable, not the raw error", async () => {
        jest.mocked(createTenancyRequest).mockRejectedValue(new Error("boom"));

        const res = await send(requestsHandler, "POST", {}, { tenancyName: "Data Amazon", reason: "SMPS data" }, JSON_HEADERS);

        expect(res.statusCode).toBe(500);
        expect(res.json).toHaveBeenCalledWith({ detail: "unavailable" });
    });
});
