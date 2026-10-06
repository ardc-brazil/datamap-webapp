jest.mock("next-auth/jwt", () => ({ getToken: jest.fn() }));
jest.mock("../admin");

import { AxiosError, AxiosHeaders } from "axios";
import { getToken } from "next-auth/jwt";
import approveHandler from "../../pages/api/admin/tenancy-requests/[requestId]/approve";
import declineHandler from "../../pages/api/admin/tenancy-requests/[requestId]/decline";
import detailHandler from "../../pages/api/admin/tenancy-requests/[requestId]/index";
import countsHandler from "../../pages/api/admin/tenancy-requests/counts";
import listHandler from "../../pages/api/admin/tenancy-requests/index";
import { approveTenancyRequest, declineTenancyRequest, getTenancyRequest, getTenancyRequestCounts, listTenancyRequests } from "../admin";
import { TOKEN_VERSION } from "../sessionToken";

const REQUEST_ID = "7a9b5d5e-fa6d-4c18-9a51-2b1e2c3d4e5f";
const JSON_BODY = { "content-type": "application/json" };
const NEW_TENANCY = { newTenancy: { displayName: "Cerrado Flux", namespace: "cerrado-flux" } };

function gatekeeperError(status: number, detail: string) {
    return new AxiosError("gatekeeper", "ERR", undefined, {}, {
        status, data: { detail }, statusText: "", headers: {}, config: { headers: new AxiosHeaders() },
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
        await handler({ method, url: "/api/admin/x", headers, cookies: {}, query, body } as any, res);
    } finally {
        process.stdout.write = original;
    }
    return res;
}

beforeEach(() => {
    jest.mocked(getToken).mockResolvedValue({ uid: "admin-1", v: TOKEN_VERSION, admin: true } as any);
});

describe("the admin request routes", () => {
    test("counts come from the gatekeeper as they are, for the signed-in admin", async () => {
        jest.mocked(getTenancyRequestCounts).mockResolvedValue({ open: 4, join: 2, new: 2, closed: 31 });

        const res = await send(countsHandler, "GET");

        expect(res.statusCode).toBe(200);
        expect(res.json).toHaveBeenCalledWith({ open: 4, join: 2, new: 2, closed: 31 });
        expect(getTenancyRequestCounts).toHaveBeenCalledWith("admin-1");
    });

    test("an account that is not an admin gets 404 and the gatekeeper is not called", async () => {
        jest.mocked(getToken).mockResolvedValue({ uid: "u1", v: TOKEN_VERSION } as any);

        const res = await send(countsHandler, "GET");

        expect(res.statusCode).toBe(404);
        expect(getTenancyRequestCounts).not.toHaveBeenCalled();
    });

    test("the queue reads its filters from the query", async () => {
        jest.mocked(listTenancyRequests).mockResolvedValue({ items: [], total_count: 0, limit: 50, offset: 50 });

        await send(listHandler, "GET", { status: "open", kind: "new", q: " tanaka ", offset: "50" });

        expect(listTenancyRequests).toHaveBeenCalledWith("admin-1", { status: "open", kind: "new", q: "tanaka", limit: 50, offset: 50 });
    });

    test("the closed list drops the kind, and no query is the open queue's first page", async () => {
        jest.mocked(listTenancyRequests).mockResolvedValue({ items: [], total_count: 0, limit: 5, offset: 0 });

        await send(listHandler, "GET", { status: "closed", kind: "join", limit: "5" });
        await send(listHandler, "GET", {});

        expect(listTenancyRequests).toHaveBeenNthCalledWith(1, "admin-1", { status: "closed", limit: 5, offset: 0 });
        expect(listTenancyRequests).toHaveBeenNthCalledWith(2, "admin-1", { status: "open", limit: 50, offset: 0 });
    });

    test("a query the queue does not know is refused before the gatekeeper", async () => {
        for (const query of [{ status: "withdrawn" }, { kind: "both" }, { offset: "-1" }, { limit: "ten" }, { limit: "101" }]) {
            const res = await send(listHandler, "GET", query);
            expect(res.statusCode).toBe(400);
            expect(res.json).toHaveBeenCalledWith({ detail: "invalid_request" });
        }
        expect(listTenancyRequests).not.toHaveBeenCalled();
    });

    test("one request; a gatekeeper 404 keeps its code", async () => {
        jest.mocked(getTenancyRequest).mockRejectedValue(gatekeeperError(404, "request_not_found"));

        const res = await send(detailHandler, "GET", { requestId: REQUEST_ID });

        expect(res.statusCode).toBe(404);
        expect(res.json).toHaveBeenCalledWith({ detail: "request_not_found" });
        expect(getTenancyRequest).toHaveBeenCalledWith("admin-1", REQUEST_ID);
    });

    test("an id that is not a UUID never reaches the gatekeeper", async () => {
        const res = await send(detailHandler, "GET", { requestId: "../counts" });

        expect(res.statusCode).toBe(404);
        expect(res.json).toHaveBeenCalledWith({ detail: "request_not_found" });
        expect(getTenancyRequest).not.toHaveBeenCalled();
    });

    test("approving into an existing tenancy", async () => {
        jest.mocked(approveTenancyRequest).mockResolvedValue({ id: REQUEST_ID } as any);

        const res = await send(approveHandler, "POST", { requestId: REQUEST_ID }, { tenancy: "datamap/production/atto" }, JSON_BODY);

        expect(res.statusCode).toBe(200);
        expect(res.json).toHaveBeenCalledWith({ id: REQUEST_ID });
        expect(approveTenancyRequest).toHaveBeenCalledWith("admin-1", REQUEST_ID, { tenancy: "datamap/production/atto" });
    });

    test("approving with a new tenancy", async () => {
        jest.mocked(approveTenancyRequest).mockResolvedValue({ id: REQUEST_ID } as any);

        await send(approveHandler, "POST", { requestId: REQUEST_ID }, NEW_TENANCY, JSON_BODY);

        expect(approveTenancyRequest).toHaveBeenCalledWith("admin-1", REQUEST_ID, NEW_TENANCY);
    });

    test("an approval names exactly one of the two, and a path that is a path", async () => {
        const bodies = [
            {},
            { tenancy: "datamap/production/atto", ...NEW_TENANCY },
            { tenancy: "../../users" },
            { newTenancy: { displayName: "Cerrado Flux" } },
        ];
        for (const body of bodies) {
            const res = await send(approveHandler, "POST", { requestId: REQUEST_ID }, body, JSON_BODY);
            expect(res.statusCode).toBe(400);
            expect(res.json).toHaveBeenCalledWith({ detail: "invalid_request" });
        }
        expect(approveTenancyRequest).not.toHaveBeenCalled();
    });

    test("a gatekeeper 409 reaches the browser with its code", async () => {
        jest.mocked(approveTenancyRequest).mockRejectedValue(gatekeeperError(409, "requester_email_unverified"));

        const res = await send(approveHandler, "POST", { requestId: REQUEST_ID }, NEW_TENANCY, JSON_BODY);

        expect(res.statusCode).toBe(409);
        expect(res.json).toHaveBeenCalledWith({ detail: "requester_email_unverified" });
    });

    test("an approval without a JSON content type is refused", async () => {
        const res = await send(approveHandler, "POST", { requestId: REQUEST_ID }, { tenancy: "datamap/production/atto" });

        expect(res.statusCode).toBe(415);
        expect(approveTenancyRequest).not.toHaveBeenCalled();
    });

    test("declining passes the message, and nothing when there is none", async () => {
        jest.mocked(declineTenancyRequest).mockResolvedValue({ id: REQUEST_ID } as any);

        await send(declineHandler, "POST", { requestId: REQUEST_ID }, { message: "Ask Luciana" }, JSON_BODY);
        await send(declineHandler, "POST", { requestId: REQUEST_ID }, { message: null }, JSON_BODY);

        expect(declineTenancyRequest).toHaveBeenNthCalledWith(1, "admin-1", REQUEST_ID, "Ask Luciana");
        expect(declineTenancyRequest).toHaveBeenNthCalledWith(2, "admin-1", REQUEST_ID, undefined);
    });

    test("a message that is not text is refused", async () => {
        const res = await send(declineHandler, "POST", { requestId: REQUEST_ID }, { message: 42 }, JSON_BODY);

        expect(res.statusCode).toBe(400);
        expect(declineTenancyRequest).not.toHaveBeenCalled();
    });
});
