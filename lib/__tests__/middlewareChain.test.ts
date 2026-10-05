jest.mock("next-auth/jwt", () => ({ getToken: jest.fn() }));

import { getToken } from "next-auth/jwt";
import { createRouter } from "next-connect";
import middlewareChain, { authOnlyChain, pendingOnlyChain, publicChain } from "../middlewareChain";
import { TENANCY_STORAGE_NAME } from "../../types/TenancyStore";
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

async function call(chain: any, cookies: Record<string, string> = {}) {
    const res = fakeRes();
    const original = process.stdout.write;
    // @ts-ignore
    process.stdout.write = () => true;
    try {
        const handler = createRouter<any, any>()
            .use(chain)
            .get((req, r) => r.status(200).end("ok"))
            .handler();
        await handler({ method: "GET", url: "/api/x", headers: {}, cookies, query: {} } as any, res);
    } finally {
        process.stdout.write = original;
    }
    return res;
}

describe("the BFF chains", () => {
    test("the dataset chain lets a signed-in account with no tenancy through", async () => {
        mockGetToken.mockResolvedValue({ uid: "u1", v: TOKEN_VERSION } as any);

        expect((await call(authOnlyChain)).statusCode).toBe(200);
    });

    test("the default chain still requires a tenancy", async () => {
        mockGetToken.mockResolvedValue({ uid: "u1", v: TOKEN_VERSION } as any);

        expect((await call(middlewareChain)).statusCode).toBe(400);
    });

    test("the default chain passes with a tenancy cookie", async () => {
        mockGetToken.mockResolvedValue({ uid: "u1", v: TOKEN_VERSION } as any);

        expect((await call(middlewareChain, { [TENANCY_STORAGE_NAME]: "{}" })).statusCode).toBe(200);
    });

    test("neither lets an anonymous request through", async () => {
        mockGetToken.mockResolvedValue(null);

        expect((await call(authOnlyChain)).statusCode).toBe(401);
        expect((await call(middlewareChain)).statusCode).toBe(401);
    });

    test("the public chain lets an anonymous request through, and still logs it", async () => {
        mockGetToken.mockResolvedValue(null);

        const res = await call(publicChain);

        expect(res.statusCode).toBe(200);
        expect(res.headers["X-Request-Id"]).toBeTruthy();
    });
});

describe("a token without a user id", () => {
    const pending = { pending: { orcid: "0000-0001-2345-6789", name: "Ada Lovelace" }, v: TOKEN_VERSION };

    test("a pending sign-in reaches neither chain that talks to the gatekeeper as a user", async () => {
        mockGetToken.mockResolvedValue(pending as any);

        expect((await call(authOnlyChain)).statusCode).toBe(401);
        expect((await call(middlewareChain, { [TENANCY_STORAGE_NAME]: "{}" })).statusCode).toBe(401);
    });

    test("a token from before the version is refused even with a user id", async () => {
        mockGetToken.mockResolvedValue({ uid: "u1" } as any);

        expect((await call(authOnlyChain)).statusCode).toBe(401);
    });
});

describe("the pending chain", () => {
    test("lets a pending sign-in through", async () => {
        mockGetToken.mockResolvedValue({ pending: { orcid: "0000-0001-2345-6789", name: "Ada Lovelace" }, v: TOKEN_VERSION } as any);

        expect((await call(pendingOnlyChain)).statusCode).toBe(200);
    });

    test("refuses a signed-in user", async () => {
        mockGetToken.mockResolvedValue({ uid: "u1", v: TOKEN_VERSION } as any);

        expect((await call(pendingOnlyChain)).statusCode).toBe(401);
    });

    test("refuses a token that somehow has both", async () => {
        mockGetToken.mockResolvedValue({ uid: "u1", pending: { orcid: "0000-0001-2345-6789", name: "Ada" }, v: TOKEN_VERSION } as any);

        expect((await call(pendingOnlyChain)).statusCode).toBe(401);
    });

    test("refuses an anonymous request and a stale pending token", async () => {
        mockGetToken.mockResolvedValue(null);
        expect((await call(pendingOnlyChain)).statusCode).toBe(401);

        mockGetToken.mockResolvedValue({ pending: { orcid: "0000-0001-2345-6789", name: "Ada" } } as any);
        expect((await call(pendingOnlyChain)).statusCode).toBe(401);
    });

    test("the public chain still lets a pending sign-in through, as it does anyone", async () => {
        mockGetToken.mockResolvedValue({ pending: { orcid: "0000-0001-2345-6789", name: "Ada" }, v: TOKEN_VERSION } as any);

        expect((await call(publicChain)).statusCode).toBe(200);
    });
});
