jest.mock("next-auth/jwt", () => ({ ...jest.requireActual("next-auth/jwt"), getToken: jest.fn() }));
jest.mock("../share", () => ({ claimInvitations: jest.fn() }));
jest.mock("../users", () => ({
    ...jest.requireActual("../users"),
    getUserByProviderID: jest.fn(),
    getUserByUID: jest.fn(),
    createUser: jest.fn(),
}));
jest.mock("../orcidEmail", () => ({
    ...jest.requireActual("../orcidEmail"),
    fetchOrcidPublicEmail: jest.fn(),
}));
jest.mock("../metrics", () => ({ getMetrics: () => ({ recordLogin: jest.fn() }) }));

import { AxiosError, AxiosHeaders } from "axios";
import { getToken } from "next-auth/jwt";
import { DEV_ORCID_MOCK_PROVIDER_ID } from "../../contants/AccountConstants";
import { authOptions, authOptionsFor, TOKEN_VERSION } from "../../pages/api/auth/[...nextauth]";
import { fetchOrcidPublicEmail } from "../orcidEmail";
import { ORCID_LINK_INTENT_COOKIE, signOrcidLinkIntent } from "../orcidLinkIntent";
import { getUserByProviderID, getUserByUID } from "../users";

const ORCID = "0000-0001-2345-6789";
const SECRET = "test-nextauth-secret";
const ACCOUNT_B = "b0000000-0000-0000-0000-00000000000b";
const ACCOUNT_A = "a0000000-0000-0000-0000-00000000000a";

const orcidAccount = { provider: "orcid", type: "oauth", providerAccountId: ORCID, orcid: ORCID, access_token: "orcid-access-token" };
const devMockAccount = { provider: DEV_ORCID_MOCK_PROVIDER_ID, type: "credentials", providerAccountId: ORCID };
const orcidUser = { id: ORCID, name: "Ada Lovelace" };

function gatekeeperError(status: number) {
    return new AxiosError("gatekeeper", "ERR", undefined, {}, {
        status, data: { detail: "x" }, statusText: "", headers: {}, config: { headers: new AxiosHeaders() },
    } as any);
}

function fakeRes() {
    const res: any = { headers: {} };
    res.setHeader = jest.fn((key: string, value: unknown) => (res.headers[key.toLowerCase()] = value));
    res.getHeader = jest.fn((key: string) => res.headers[key.toLowerCase()]);
    return res;
}

function callbackRequest(intentFor?: string) {
    const cookies = intentFor ? { [ORCID_LINK_INTENT_COOKIE]: signOrcidLinkIntent(intentFor, SECRET) } : {};
    return { req: { cookies, headers: {} } as any, res: fakeRes() };
}

function clearedIntent(res: any): boolean {
    const value = res.headers["set-cookie"];
    const cookies: string[] = Array.isArray(value) ? value : value ? [value] : [];
    return cookies.some((cookie) => cookie.startsWith(`${ORCID_LINK_INTENT_COOKIE}=;`) && cookie.includes("Max-Age=0"));
}

async function signInThenJwt(context: ReturnType<typeof callbackRequest>, account: Record<string, unknown> = orcidAccount, user: Record<string, unknown> = orcidUser) {
    const options = authOptionsFor(context);
    const allowed = await options.callbacks.signIn({ user, account } as any);
    if (allowed !== true) {
        return { allowed, token: undefined };
    }
    const token: any = await options.callbacks.jwt({ token: { name: "Ada Lovelace", sub: ORCID }, user, account, trigger: "signIn" } as any);
    return { allowed, token };
}

const previousSecret = process.env.NEXTAUTH_SECRET;

beforeAll(() => {
    process.env.NEXTAUTH_SECRET = SECRET;
});

afterAll(() => {
    process.env.NEXTAUTH_SECRET = previousSecret;
});

beforeEach(() => {
    jest.mocked(getToken).mockResolvedValue({ uid: ACCOUNT_B, v: TOKEN_VERSION } as any);
    jest.mocked(fetchOrcidPublicEmail).mockResolvedValue("ada.public@example.org");
    jest.mocked(getUserByUID).mockResolvedValue({ id: ACCOUNT_B, email: "b@usp.br", name: "Bea" } as any);
});

describe.each([
    ["ORCID", orcidAccount],
    ["the development ORCID mock", devMockAccount],
])("connecting %s from the profile", (_label, account) => {
    test("an iD that belongs to another account stops the sign-in and keeps the current session", async () => {
        jest.mocked(getUserByProviderID).mockResolvedValue({ id: ACCOUNT_A, email: "a@usp.br", email_verified_at: "2026-10-01T12:00:00Z" } as any);
        const context = callbackRequest(ACCOUNT_B);

        const { allowed } = await signInThenJwt(context, account);

        expect(allowed).toBe("/app/profile?orcid=already_linked");
        expect(getUserByProviderID).toHaveBeenCalledWith({ providerName: "orcid", providerID: ORCID });
        expect(clearedIntent(context.res)).toBe(true);
    });

    test("an iD that belongs to another account whose email is unconfirmed is still not taken over", async () => {
        jest.mocked(getUserByProviderID).mockResolvedValue({ id: ACCOUNT_A, email: `${ORCID}@fake.mail.com`, email_verified_at: null } as any);

        const { allowed } = await signInThenJwt(callbackRequest(ACCOUNT_B), account);

        expect(allowed).toBe("/app/profile?orcid=already_linked");
    });

    test("an iD already on this account comes back to the profile as connected, without a new session", async () => {
        jest.mocked(getUserByProviderID).mockResolvedValue({ id: ACCOUNT_B, email: "b@usp.br", email_verified_at: "2026-10-01T12:00:00Z" } as any);
        const context = callbackRequest(ACCOUNT_B);

        const { allowed } = await signInThenJwt(context, account);

        expect(allowed).toBe("/app/profile?orcid=connected");
        expect(clearedIntent(context.res)).toBe(true);
    });

    test("an iD with no account goes on to confirm this account's email, not ORCID's public one", async () => {
        jest.mocked(getUserByProviderID).mockRejectedValue(gatekeeperError(404));
        const context = callbackRequest(ACCOUNT_B);

        const { allowed, token } = await signInThenJwt(context, account, { ...orcidUser, publicEmail: "ada.public@example.org" });

        expect(allowed).toBe(true);
        expect(getUserByUID).toHaveBeenCalledWith({ uid: ACCOUNT_B, tenancy: undefined });
        expect(token.pending).toEqual({ orcid: ORCID, name: "Ada Lovelace", emailHint: "b@usp.br" });
        expect(fetchOrcidPublicEmail).not.toHaveBeenCalled();
        expect(clearedIntent(context.res)).toBe(true);
    });

    test("a gatekeeper failure comes back to the profile instead of signing in as someone", async () => {
        jest.mocked(getUserByProviderID).mockRejectedValue(gatekeeperError(503));
        const original = process.stdout.write;
        // @ts-ignore
        process.stdout.write = () => true;
        try {
            const { allowed } = await signInThenJwt(callbackRequest(ACCOUNT_B), account);

            expect(allowed).toBe("/app/profile?orcid=unavailable");
        } finally {
            process.stdout.write = original;
        }
    });
});

describe("an ORCID sign-in without a valid intent behaves as before", () => {
    test("no intent cookie: the sign-in is allowed and the confirmed owner signs in", async () => {
        jest.mocked(getUserByProviderID).mockResolvedValue({ id: ACCOUNT_A, email: "a@usp.br", email_verified_at: "2026-10-01T12:00:00Z", tenancies: [] } as any);
        const context = callbackRequest();

        const { allowed, token } = await signInThenJwt(context);

        expect(allowed).toBe(true);
        expect(token.uid).toBe(ACCOUNT_A);
        expect(context.res.setHeader).not.toHaveBeenCalled();
    });

    test("an intent signed with another secret is ignored and cleared", async () => {
        jest.mocked(getUserByProviderID).mockResolvedValue({ id: ACCOUNT_A, email: "a@usp.br", email_verified_at: "2026-10-01T12:00:00Z" } as any);
        const context = callbackRequest();
        context.req.cookies[ORCID_LINK_INTENT_COOKIE] = signOrcidLinkIntent(ACCOUNT_B, "another-secret");

        const { allowed } = await signInThenJwt(context);

        expect(allowed).toBe(true);
        expect(clearedIntent(context.res)).toBe(true);
    });

    test("an intent left behind by a user who has since signed out is ignored", async () => {
        jest.mocked(getToken).mockResolvedValue(null);
        jest.mocked(getUserByProviderID).mockRejectedValue(gatekeeperError(404));
        const context = callbackRequest(ACCOUNT_B);

        const { allowed, token } = await signInThenJwt(context);

        expect(allowed).toBe(true);
        expect(getUserByUID).not.toHaveBeenCalled();
        expect(token.pending.emailHint).toBe("ada.public@example.org");
        expect(clearedIntent(context.res)).toBe(true);
    });

    test("an intent from another account than the one signed in is ignored", async () => {
        jest.mocked(getToken).mockResolvedValue({ uid: ACCOUNT_A, v: TOKEN_VERSION } as any);
        jest.mocked(getUserByProviderID).mockResolvedValue({ id: ACCOUNT_A, email: "a@usp.br", email_verified_at: "2026-10-01T12:00:00Z" } as any);

        const { allowed } = await signInThenJwt(callbackRequest(ACCOUNT_B));

        expect(allowed).toBe(true);
    });

    test("a password sign-in never reads the intent", async () => {
        const context = callbackRequest(ACCOUNT_B);

        const allowed = await authOptionsFor(context).callbacks.signIn({ user: { id: ACCOUNT_B }, account: { provider: "credentials", type: "credentials", providerAccountId: ACCOUNT_B } } as any);

        expect(allowed).toBe(true);
        expect(context.res.setHeader).not.toHaveBeenCalled();
    });

    test("the options without a request allow every sign-in", async () => {
        expect(await authOptions.callbacks.signIn({ user: orcidUser, account: orcidAccount } as any)).toBe(true);
    });
});
