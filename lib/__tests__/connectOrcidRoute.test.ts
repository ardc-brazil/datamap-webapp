jest.mock("next-auth/jwt", () => ({ getToken: jest.fn() }));

import { getToken } from "next-auth/jwt";
import connectOrcidHandler from "../../pages/api/account/connect-orcid";
import { TOKEN_VERSION } from "../sessionToken";
import { orcidLinkIntentCookie, verifyOrcidLinkIntent } from "../orcidLinkIntent";

const SECRET = "test-nextauth-secret";
const UID = "b0000000-0000-0000-0000-00000000000b";

function fakeRes() {
    const res: any = { statusCode: 200, headers: {} };
    res.setHeader = jest.fn((key: string, value: unknown) => (res.headers[key.toLowerCase()] = value));
    res.getHeader = jest.fn((key: string) => res.headers[key.toLowerCase()]);
    res.status = jest.fn((code: number) => {
        res.statusCode = code;
        return res;
    });
    res.end = jest.fn(() => res);
    res.json = jest.fn(() => res);
    return res;
}

async function send(method: string, headers: Record<string, string> = { "content-type": "application/json" }) {
    const res = fakeRes();
    const original = process.stdout.write;
    // @ts-ignore
    process.stdout.write = () => true;
    try {
        await connectOrcidHandler({ method, url: "/api/account/connect-orcid", headers, cookies: {}, query: {}, body: {} } as any, res);
    } finally {
        process.stdout.write = original;
    }
    return res;
}

function intentCookie(res: any): string | undefined {
    const value = res.headers["set-cookie"];
    const cookies: string[] = Array.isArray(value) ? value : value ? [value] : [];
    return cookies.find((cookie) => cookie.startsWith(`${orcidLinkIntentCookie()}=`));
}

const previousSecret = process.env.NEXTAUTH_SECRET;

beforeAll(() => {
    process.env.NEXTAUTH_SECRET = SECRET;
});

afterAll(() => {
    process.env.NEXTAUTH_SECRET = previousSecret;
});

describe("starting to connect ORCID", () => {
    test("a signed-out visitor gets 401 and no cookie", async () => {
        jest.mocked(getToken).mockResolvedValue(null);

        const res = await send("POST");

        expect(res.statusCode).toBe(401);
        expect(intentCookie(res)).toBeUndefined();
    });

    test("a pending ORCID sign-in, which has no account yet, gets 401", async () => {
        jest.mocked(getToken).mockResolvedValue({ pending: { orcid: "0000-0001-2345-6789", name: "Ada" }, v: TOKEN_VERSION } as any);

        const res = await send("POST");

        expect(res.statusCode).toBe(401);
        expect(intentCookie(res)).toBeUndefined();
    });

    test("a signed-in user gets an intent cookie bound to their id, and no id in the body", async () => {
        jest.mocked(getToken).mockResolvedValue({ uid: UID, v: TOKEN_VERSION } as any);

        const res = await send("POST");

        expect(res.statusCode).toBe(204);
        const cookie = intentCookie(res);
        expect(cookie).toContain("HttpOnly");
        const value = cookie.split(";")[0].slice(orcidLinkIntentCookie().length + 1);
        expect(verifyOrcidLinkIntent(value, SECRET)).toBe(UID);
        expect(res.json).not.toHaveBeenCalled();
    });

    test.each([
        ["a form post", { "content-type": "application/x-www-form-urlencoded" }],
        ["a text post", { "content-type": "text/plain" }],
        ["a post without a content type", {}],
    ])("%s is refused with 415", async (_label, headers) => {
        jest.mocked(getToken).mockResolvedValue({ uid: UID, v: TOKEN_VERSION } as any);

        const res = await send("POST", headers);

        expect(res.statusCode).toBe(415);
        expect(intentCookie(res)).toBeUndefined();
    });

    test("only POST is accepted", async () => {
        jest.mocked(getToken).mockResolvedValue({ uid: UID, v: TOKEN_VERSION } as any);

        const res = await send("GET");

        expect(res.statusCode).toBe(405);
        expect(intentCookie(res)).toBeUndefined();
    });
});
