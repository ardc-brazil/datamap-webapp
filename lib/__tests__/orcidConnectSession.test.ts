const mockGetUserByProviderID = jest.fn();
const mockGetUserByUID = jest.fn();

jest.mock("../share", () => ({ claimInvitations: jest.fn().mockResolvedValue({ accepted: [] }) }));
jest.mock("../metrics", () => ({ getMetrics: () => ({ recordLogin: jest.fn() }) }));
jest.mock("../users", () => ({
    ...jest.requireActual("../users"),
    getUserByProviderID: (...args: unknown[]) => mockGetUserByProviderID(...args),
    getUserByUID: (...args: unknown[]) => mockGetUserByUID(...args),
    createUser: jest.fn(),
}));

import { createHash } from "crypto";
import { encode } from "next-auth/jwt";
import { TOKEN_VERSION } from "../sessionToken";
import { orcidLinkIntentCookie, signOrcidLinkIntent } from "../orcidLinkIntent";

const SECRET = "test-nextauth-secret";
const ORCID = "0000-0001-2345-6789";
const ACCOUNT_A = "a0000000-0000-0000-0000-00000000000a";
const ACCOUNT_B = "b0000000-0000-0000-0000-00000000000b";
const SESSION_COOKIE = "next-auth.session-token";
const CSRF = "csrf-token-value";

// The whole NextAuth handler, through the development ORCID mock: the only way to see which cookies a callback really sets.
type Handler = (req: unknown, res: unknown) => Promise<unknown>;

function handlerInDevelopment(): Handler {
    const env = process.env as Record<string, string | undefined>;
    const original = { NODE_ENV: env.NODE_ENV, ENABLE_DEV_ORCID_MOCK: env.ENABLE_DEV_ORCID_MOCK };
    env.NODE_ENV = "development";
    env.ENABLE_DEV_ORCID_MOCK = "true";
    try {
        let handler: Handler;
        jest.isolateModules(() => {
            handler = require("../../pages/api/auth/[...nextauth]").default;
        });
        return handler;
    } finally {
        env.NODE_ENV = original.NODE_ENV;
        if (original.ENABLE_DEV_ORCID_MOCK === undefined) {
            delete env.ENABLE_DEV_ORCID_MOCK;
        } else {
            env.ENABLE_DEV_ORCID_MOCK = original.ENABLE_DEV_ORCID_MOCK;
        }
    }
}

function fakeRes() {
    const res: any = { statusCode: 200, headers: {} };
    res.setHeader = jest.fn((key: string, value: unknown) => {
        res.headers[key.toLowerCase()] = value;
        return res;
    });
    res.getHeader = jest.fn((key: string) => res.headers[key.toLowerCase()]);
    res.status = jest.fn((code: number) => {
        res.statusCode = code;
        return res;
    });
    res.json = jest.fn(() => res);
    res.send = jest.fn(() => res);
    res.end = jest.fn(() => res);
    return res;
}

function setCookieNames(res: any): string[] {
    const value = res.headers["set-cookie"];
    const cookies: string[] = Array.isArray(value) ? value : value ? [value] : [];
    return cookies.map((cookie) => cookie.split("=")[0]);
}

async function signInWithTheMockAs(cookies: Record<string, string>) {
    const csrfHash = createHash("sha256").update(`${CSRF}${SECRET}`).digest("hex");
    const res = fakeRes();
    const original = process.stdout.write;
    // @ts-ignore
    process.stdout.write = () => true;
    try {
        await handlerInDevelopment()({
            method: "POST",
            url: "/api/auth/callback/orcid-dev",
            query: { nextauth: ["callback", "orcid-dev"] },
            headers: { host: "localhost:3000", "content-type": "application/x-www-form-urlencoded" },
            cookies: { "next-auth.csrf-token": `${CSRF}|${csrfHash}`, ...cookies },
            body: { orcid: ORCID, name: "Ada Lovelace", csrfToken: CSRF, json: "true", callbackUrl: "http://localhost:3000/app/profile" },
        }, res);
    } finally {
        process.stdout.write = original;
    }
    return res;
}

const saved = { secret: process.env.NEXTAUTH_SECRET, url: process.env.NEXTAUTH_URL };

beforeAll(() => {
    process.env.NEXTAUTH_SECRET = SECRET;
    process.env.NEXTAUTH_URL = "http://localhost:3000";
});

afterAll(() => {
    process.env.NEXTAUTH_SECRET = saved.secret;
    process.env.NEXTAUTH_URL = saved.url;
});

beforeEach(() => {
    mockGetUserByProviderID.mockResolvedValue({
        id: ACCOUNT_A, name: "Ada", email: "a@usp.br", email_verified_at: "2026-10-01T12:00:00Z", tenancies: [],
    });
    mockGetUserByUID.mockResolvedValue({ id: ACCOUNT_B, email: "b@usp.br" });
});

describe("connecting an ORCID iD that belongs to another account, through the NextAuth handler", () => {
    test("without an intent, the ORCID sign-in replaces the session with the other account", async () => {
        const sessionB = await encode({ token: { uid: ACCOUNT_B, v: TOKEN_VERSION }, secret: SECRET });

        const res = await signInWithTheMockAs({ [SESSION_COOKIE]: sessionB });

        expect(res.json).toHaveBeenCalledWith({ url: "http://localhost:3000/app/profile" });
        expect(setCookieNames(res)).toContain(SESSION_COOKIE);
    });

    test("with the intent, the sign-in comes back to the profile and sets no session cookie", async () => {
        const sessionB = await encode({ token: { uid: ACCOUNT_B, v: TOKEN_VERSION }, secret: SECRET });

        const res = await signInWithTheMockAs({ [SESSION_COOKIE]: sessionB, [orcidLinkIntentCookie()]: signOrcidLinkIntent(ACCOUNT_B, SECRET) });

        expect(res.json).toHaveBeenCalledWith({ url: "/app/profile?orcid=already_linked" });
        expect(setCookieNames(res)).not.toContain(SESSION_COOKIE);
        expect(setCookieNames(res)).toContain(orcidLinkIntentCookie());
    });
});
