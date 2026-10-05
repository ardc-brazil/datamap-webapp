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
jest.mock("../metrics", () => ({ getMetrics: () => ({ recordLogin: mockRecordLogin }) }));
const mockRecordLogin = jest.fn();

import { AxiosError, AxiosHeaders } from "axios";
import { authOptions, refreshPendingSignIn, TOKEN_VERSION } from "../../pages/api/auth/[...nextauth]";
import { fetchOrcidPublicEmail } from "../orcidEmail";
import { claimInvitations } from "../share";
import { createUser, getUserByProviderID } from "../users";

const ORCID = "0000-0001-2345-6789";
const TENANCY = "datamap/production/data-amazon";

const jwt = async (params: Record<string, unknown>): Promise<any> => authOptions.callbacks.jwt(params as any);

const orcidAccount = {
    provider: "orcid",
    type: "oauth",
    providerAccountId: ORCID,
    orcid: ORCID,
    access_token: "orcid-access-token",
};

function signInWithOrcid() {
    return jwt({ token: { name: "Ada Lovelace", sub: ORCID }, account: orcidAccount, trigger: "signIn" });
}

function gatekeeperError(status: number) {
    return new AxiosError("gatekeeper", "ERR", undefined, {}, {
        status, data: { detail: "x" }, statusText: "", headers: {}, config: { headers: new AxiosHeaders() },
    } as any);
}

function account(overrides: Record<string, unknown> = {}) {
    return {
        id: "u1",
        name: "Ada Lovelace",
        email: "ada@usp.br",
        email_verified_at: "2026-10-01T12:00:00Z",
        tenancies: [TENANCY],
        providers: [{ name: "orcid", reference: ORCID }],
        ...overrides,
    } as any;
}

beforeEach(() => {
    jest.mocked(claimInvitations).mockResolvedValue({ accepted: [] } as any);
    jest.mocked(fetchOrcidPublicEmail).mockResolvedValue(undefined);
    mockRecordLogin.mockClear();
});

describe("signing in with ORCID", () => {
    test("an account with a confirmed email signs in as before", async () => {
        jest.mocked(getUserByProviderID).mockResolvedValue(account());

        const token = await signInWithOrcid();

        expect(token).toEqual({
            name: "Ada Lovelace",
            email: "ada@usp.br",
            sub: ORCID,
            uid: "u1",
            tenancies: [TENANCY],
            v: TOKEN_VERSION,
        });
        expect(getUserByProviderID).toHaveBeenCalledWith({ providerName: "orcid", providerID: ORCID });
        expect(claimInvitations).toHaveBeenCalledWith("u1");
        expect(mockRecordLogin).toHaveBeenCalledWith("orcid", "success");
    });

    test("a stale uid, tenancies and pending on the token are replaced once the sign-in confirms", async () => {
        jest.mocked(getUserByProviderID).mockResolvedValue(account());

        const token = await jwt({
            token: {
                name: "Ada Lovelace",
                sub: ORCID,
                uid: "stale-uid",
                tenancies: ["stale/tenancy"],
                pending: { orcid: "9999-9999-9999-9999", name: "Someone Else" },
            },
            account: orcidAccount,
            trigger: "signIn",
        });

        expect(token.uid).toBe("u1");
        expect(token.tenancies).toEqual([TENANCY]);
        expect("pending" in token).toBe(false);
    });

    test("an account with a placeholder email is pending, pre-filled from ORCID's public email", async () => {
        jest.mocked(getUserByProviderID).mockResolvedValue(account({ email: `${ORCID}@fake.mail.com`, email_verified_at: null }));
        jest.mocked(fetchOrcidPublicEmail).mockResolvedValue("ada.public@example.org");

        const token = await signInWithOrcid();

        expect(token.uid).toBeUndefined();
        expect(token.tenancies).toBeUndefined();
        expect(token.pending).toEqual({ orcid: ORCID, name: "Ada Lovelace", emailHint: "ada.public@example.org" });
        expect(token.v).toBe(TOKEN_VERSION);
        expect(fetchOrcidPublicEmail).toHaveBeenCalledWith(ORCID, "orcid-access-token");
        expect(claimInvitations).not.toHaveBeenCalled();
        expect(mockRecordLogin).toHaveBeenCalledWith("orcid", "pending");
    });

    test("a stale uid, tenancies and pending on the token are removed or replaced while the sign-in is still pending", async () => {
        jest.mocked(getUserByProviderID).mockResolvedValue(account({ email_verified_at: null }));

        const token = await jwt({
            token: {
                name: "Ada Lovelace",
                sub: ORCID,
                uid: "stale-uid",
                tenancies: ["stale/tenancy"],
                pending: { orcid: "9999-9999-9999-9999", name: "Someone Else" },
            },
            account: orcidAccount,
            trigger: "signIn",
        });

        expect("uid" in token).toBe(false);
        expect("tenancies" in token).toBe(false);
        expect(token.pending).toEqual({ orcid: ORCID, name: "Ada Lovelace", emailHint: "ada@usp.br" });
    });

    test("an account with a real but unconfirmed email is pending, pre-filled with that email", async () => {
        jest.mocked(getUserByProviderID).mockResolvedValue(account({ email: "ada@usp.br", email_verified_at: null }));

        const token = await signInWithOrcid();

        expect(token.uid).toBeUndefined();
        expect(token.pending).toEqual({ orcid: ORCID, name: "Ada Lovelace", emailHint: "ada@usp.br" });
        expect(fetchOrcidPublicEmail).not.toHaveBeenCalled();
    });

    test("an ORCID iD with no account is pending and no account is created", async () => {
        jest.mocked(getUserByProviderID).mockRejectedValue(gatekeeperError(404));
        jest.mocked(fetchOrcidPublicEmail).mockResolvedValue("ada.public@example.org");

        const token = await signInWithOrcid();

        expect(token.pending).toEqual({ orcid: ORCID, name: "Ada Lovelace", emailHint: "ada.public@example.org" });
        expect(createUser).not.toHaveBeenCalled();
    });

    test("without any email to suggest, the hint is left out", async () => {
        jest.mocked(getUserByProviderID).mockRejectedValue(gatekeeperError(404));

        const token = await signInWithOrcid();

        expect(token.pending).toEqual({ orcid: ORCID, name: "Ada Lovelace" });
        expect("emailHint" in token.pending).toBe(false);
    });

    test("a gatekeeper failure fails the sign-in instead of guessing", async () => {
        jest.mocked(getUserByProviderID).mockRejectedValue(gatekeeperError(503));

        await expect(signInWithOrcid()).rejects.toMatchObject({ response: { status: 503 } });
        expect(fetchOrcidPublicEmail).not.toHaveBeenCalled();
    });
});

describe("the session a browser sees", () => {
    const session = async (token: Record<string, unknown>): Promise<any> => authOptions.callbacks.session({
        session: { user: { name: "Ada Lovelace" }, expires: "2026-11-01T00:00:00.000Z" },
        token,
    } as any);

    test("a pending session says so and carries the hint, with no user id and no ORCID iD", async () => {
        const result = await session({ pending: { orcid: ORCID, name: "Ada Lovelace", emailHint: "ada@usp.br" }, v: TOKEN_VERSION });

        expect(result.user).toEqual({ name: "Ada Lovelace", pending: true, emailHint: "ada@usp.br", admin: false });
        expect(JSON.stringify(result)).not.toContain(ORCID);
    });

    test("a signed-in session is not pending", async () => {
        const result = await session({ uid: "u1", tenancies: [TENANCY], v: TOKEN_VERSION });

        expect(result.user).toEqual({ name: "Ada Lovelace", uid: "u1", tenancies: [TENANCY], pending: false, admin: false });
    });
});

describe("refreshing a pending session after the code was confirmed", () => {
    const pendingToken = () => ({
        name: "Ada Lovelace",
        pending: { orcid: ORCID, name: "Ada Lovelace", emailHint: "ada@usp.br" },
        v: TOKEN_VERSION,
    });

    test("signs in once the account has a confirmed email, looking up the ORCID iD from the token, never the browser", async () => {
        jest.mocked(getUserByProviderID).mockResolvedValue(account());

        const token = await jwt({
            token: pendingToken(),
            trigger: "update",
            session: { pending: { orcid: "9999-9999-9999-9999" }, uid: "someone-else" },
        });

        expect(getUserByProviderID).toHaveBeenCalledWith({ providerName: "orcid", providerID: ORCID });
        expect(token).toEqual({ name: "Ada Lovelace", email: "ada@usp.br", uid: "u1", tenancies: [TENANCY], v: TOKEN_VERSION });
        expect(claimInvitations).toHaveBeenCalledWith("u1");
    });

    test("the completed sign-in carries the account's confirmed email and name", async () => {
        jest.mocked(getUserByProviderID).mockResolvedValue(account({ name: "Ada King", email: "ada.king@usp.br" }));

        const token = await jwt({ token: { ...pendingToken(), email: null }, trigger: "update" });

        expect(token.email).toBe("ada.king@usp.br");
        expect(token.name).toBe("Ada King");
    });

    test("completing a pending sign-in counts as one successful ORCID login", async () => {
        jest.mocked(getUserByProviderID).mockResolvedValue(account());

        await jwt({ token: pendingToken(), trigger: "update" });

        expect(mockRecordLogin).toHaveBeenCalledTimes(1);
        expect(mockRecordLogin).toHaveBeenCalledWith("orcid", "success");
    });

    test("a refresh that leaves the sign-in pending records no login", async () => {
        jest.mocked(getUserByProviderID).mockResolvedValue(account({ email_verified_at: null }));

        await jwt({ token: pendingToken(), trigger: "update" });

        expect(mockRecordLogin).not.toHaveBeenCalled();
    });

    test("stays pending while the email is still unconfirmed", async () => {
        jest.mocked(getUserByProviderID).mockResolvedValue(account({ email_verified_at: null }));

        expect(await jwt({ token: pendingToken(), trigger: "update" })).toEqual(pendingToken());
        expect(claimInvitations).not.toHaveBeenCalled();
    });

    test("stays pending while there is still no account", async () => {
        jest.mocked(getUserByProviderID).mockRejectedValue(gatekeeperError(404));

        expect(await jwt({ token: pendingToken(), trigger: "update" })).toEqual(pendingToken());
    });

    test("a gatekeeper failure keeps the pending session instead of signing out", async () => {
        jest.mocked(getUserByProviderID).mockRejectedValue(gatekeeperError(503));
        const original = process.stdout.write;
        // @ts-ignore
        process.stdout.write = () => true;
        try {
            expect(await jwt({ token: pendingToken(), trigger: "update" })).toEqual(pendingToken());
        } finally {
            process.stdout.write = original;
        }
    });

    test("returns the token unchanged when there is nothing pending", async () => {
        const token = { name: "Ada Lovelace", uid: "u1", tenancies: [TENANCY], v: TOKEN_VERSION };

        expect(await refreshPendingSignIn(token as any)).toEqual(token);
        expect(getUserByProviderID).not.toHaveBeenCalled();
    });
});
