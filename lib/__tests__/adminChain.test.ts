jest.mock("next-auth/jwt", () => ({ getToken: jest.fn() }));

import { getToken } from "next-auth/jwt";
import { createRouter } from "next-connect";
import { adminBffRouter } from "../bffRoute";
import { adminChain } from "../middlewareChain";
import { TOKEN_VERSION } from "../sessionToken";

const mockGetToken = jest.mocked(getToken);

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

async function call(handler: (req: any, res: any) => Promise<unknown>, method = "GET", headers: Record<string, string> = {}) {
    const res = fakeRes();
    const original = process.stdout.write;
    // @ts-ignore
    process.stdout.write = () => true;
    try {
        await handler({ method, url: "/api/admin/x", headers, cookies: {}, query: {} } as any, res);
    } finally {
        process.stdout.write = original;
    }
    return res;
}

function chainOnly() {
    return createRouter<any, any>()
        .use(adminChain)
        .get((req, r) => r.status(200).end("ok"))
        .handler();
}

function adminRoute() {
    return adminBffRouter()
        .get((req, res) => { res.status(200).end("ok"); })
        .post((req, res) => { res.status(201).end("created"); })
        .put((req, res) => { res.status(200).end("put"); })
        .patch((req, res) => { res.status(200).end("patched"); })
        .delete((req, res) => { res.status(204).end(); })
        .handler();
}

const JSON_BODY = { "content-type": "application/json" };

describe("the admin chain", () => {
    test("lets an admin through", async () => {
        mockGetToken.mockResolvedValue({ uid: "u1", v: TOKEN_VERSION, admin: true } as any);

        expect((await call(chainOnly())).statusCode).toBe(200);
    });

    test("answers 404 to a signed-in account that is not an admin, so the area does not reveal itself", async () => {
        mockGetToken.mockResolvedValue({ uid: "u1", v: TOKEN_VERSION } as any);

        const res = await call(chainOnly());

        expect(res.statusCode).toBe(404);
        expect(res.json).toHaveBeenCalledWith({ detail: "not_found" });
    });

    test("answers 401 to a visitor who is not signed in", async () => {
        mockGetToken.mockResolvedValue(null);

        expect((await call(chainOnly())).statusCode).toBe(401);
    });

    test("answers 401 to a pending ORCID sign-in, even one carrying an admin claim", async () => {
        mockGetToken.mockResolvedValue({ pending: { orcid: "0000-0001-2345-6789", name: "Ada Lovelace" }, v: TOKEN_VERSION, admin: true } as any);

        expect((await call(chainOnly())).statusCode).toBe(401);
    });

    test("refuses an admin claim on a token from before the version", async () => {
        mockGetToken.mockResolvedValue({ uid: "u1", admin: true } as any);

        expect((await call(chainOnly())).statusCode).toBe(401);
    });
});

describe("the admin BFF router", () => {
    beforeEach(() => {
        mockGetToken.mockResolvedValue({ uid: "u1", v: TOKEN_VERSION, admin: true } as any);
    });

    test("a read needs no content type", async () => {
        expect((await call(adminRoute(), "GET")).statusCode).toBe(200);
    });

    test("a change without a JSON content type is refused, so a cross-site form cannot make one", async () => {
        const post = await call(adminRoute(), "POST");
        const del = await call(adminRoute(), "DELETE", { "content-type": "text/plain" });

        expect(post.statusCode).toBe(415);
        expect(post.json).toHaveBeenCalledWith({ detail: "invalid_request" });
        expect(del.statusCode).toBe(415);
    });

    test("a change with a JSON content type goes through", async () => {
        expect((await call(adminRoute(), "POST", JSON_BODY)).statusCode).toBe(201);
        expect((await call(adminRoute(), "DELETE", JSON_BODY)).statusCode).toBe(204);
    });

    test("a DELETE with no content type at all is refused", async () => {
        expect((await call(adminRoute(), "DELETE")).statusCode).toBe(415);
    });

    test("PUT and PATCH go through the same gate", async () => {
        expect((await call(adminRoute(), "PUT")).statusCode).toBe(415);
        expect((await call(adminRoute(), "PATCH", { "content-type": "text/plain" })).statusCode).toBe(415);
        expect((await call(adminRoute(), "PUT", JSON_BODY)).statusCode).toBe(200);
        expect((await call(adminRoute(), "PATCH", JSON_BODY)).statusCode).toBe(200);
    });

    test("a non-admin gets the 404 before the content type is looked at", async () => {
        mockGetToken.mockResolvedValue({ uid: "u1", v: TOKEN_VERSION } as any);

        expect((await call(adminRoute(), "POST")).statusCode).toBe(404);
    });
});
