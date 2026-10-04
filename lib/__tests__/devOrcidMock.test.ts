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

import { AxiosError, AxiosHeaders } from "axios";
import { authOptions, TOKEN_VERSION } from "../../pages/api/auth/[...nextauth]";
import { DEV_ORCID_MOCK_PROVIDER_ID } from "../../contants/AccountConstants";
import { authorizeDevOrcidMock } from "../devOrcidMock";
import { fetchOrcidPublicEmail } from "../orcidEmail";
import { claimInvitations } from "../share";
import { createUser, getUserByProviderID } from "../users";

const ORCID = "0000-0001-2345-6789";
const TENANCY = "datamap/production/data-amazon";

const jwt = async (params: Record<string, unknown>): Promise<any> => authOptions.callbacks.jwt(params as any);

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

/** What NextAuth 4.24.9's credentials callback does after authorize: default token from the user, then jwt. */
async function signInWithMock(fields: Record<string, string>) {
    const user = await authorizeDevOrcidMock(fields);
    return jwt({
        token: { name: user.name, sub: user.id },
        user,
        account: { provider: DEV_ORCID_MOCK_PROVIDER_ID, type: "credentials", providerAccountId: user.id },
        trigger: "signIn",
    });
}

beforeEach(() => {
    jest.mocked(claimInvitations).mockResolvedValue({ accepted: [] } as any);
    jest.mocked(fetchOrcidPublicEmail).mockResolvedValue("never-used@orcid.org");
});

describe("the mock's authorize", () => {
    test("signs in as the typed iD, with the name and public email", async () => {
        expect(await authorizeDevOrcidMock({ orcid: ` ${ORCID} `, name: " Ada Lovelace ", email: " ada.public@example.org " }))
            .toEqual({ id: ORCID, name: "Ada Lovelace", publicEmail: "ada.public@example.org" });
    });

    test("without a name it makes one up from the iD, and without an email it has none", async () => {
        const user = await authorizeDevOrcidMock({ orcid: ORCID, name: "", email: "" });

        expect(user).toEqual({ id: ORCID, name: `Dev User ${ORCID}` });
        expect("publicEmail" in user).toBe(false);
    });

    test("accepts an iD whose check digit is X", async () => {
        expect((await authorizeDevOrcidMock({ orcid: "0000-0002-1694-233X" })).id).toBe("0000-0002-1694-233X");
    });

    test.each`
        orcid
        ${""}
        ${"0000-0001-2345-678"}
        ${"0000-0001-2345-678x"}
        ${"0000000123456789"}
        ${"0000-0001-2345-6789-0000"}
        ${"../../admin"}
    `("refuses a malformed iD ($orcid)", async ({ orcid }) => {
        expect(await authorizeDevOrcidMock({ orcid, name: "Mallory" })).toBeNull();
    });

    test("refuses a request without fields", async () => {
        expect(await authorizeDevOrcidMock(undefined)).toBeNull();
    });
});

describe("a mock sign-in takes the ORCID path", () => {
    test("an iD with no account is pending, pre-filled with the email typed in the form, and ORCID is never asked", async () => {
        jest.mocked(getUserByProviderID).mockRejectedValue(gatekeeperError(404));

        const token = await signInWithMock({ orcid: ORCID, name: "Ada Lovelace", email: "ada.public@example.org" });

        expect(token.uid).toBeUndefined();
        expect(token.tenancies).toBeUndefined();
        expect(token.pending).toEqual({ orcid: ORCID, name: "Ada Lovelace", emailHint: "ada.public@example.org" });
        expect(token.v).toBe(TOKEN_VERSION);
        expect(getUserByProviderID).toHaveBeenCalledWith({ providerName: "orcid", providerID: ORCID });
        expect(fetchOrcidPublicEmail).not.toHaveBeenCalled();
        expect(createUser).not.toHaveBeenCalled();
        expect(claimInvitations).not.toHaveBeenCalled();
    });

    test("without a public email in the form, the hint is left out", async () => {
        jest.mocked(getUserByProviderID).mockRejectedValue(gatekeeperError(404));

        const token = await signInWithMock({ orcid: ORCID, name: "", email: "" });

        expect(token.pending).toEqual({ orcid: ORCID, name: `Dev User ${ORCID}` });
        expect(fetchOrcidPublicEmail).not.toHaveBeenCalled();
    });

    test("an account with a placeholder email is pending, pre-filled from the form", async () => {
        jest.mocked(getUserByProviderID).mockResolvedValue(account({ email: `${ORCID}@fake.mail.com`, email_verified_at: null }));

        const token = await signInWithMock({ orcid: ORCID, name: "Ada Lovelace", email: "ada.public@example.org" });

        expect(token.pending).toEqual({ orcid: ORCID, name: "Ada Lovelace", emailHint: "ada.public@example.org" });
    });

    test("an account with a real but unconfirmed email is pre-filled with that email, not the form's", async () => {
        jest.mocked(getUserByProviderID).mockResolvedValue(account({ email: "ada@usp.br", email_verified_at: null }));

        const token = await signInWithMock({ orcid: ORCID, name: "Ada Lovelace", email: "ada.public@example.org" });

        expect(token.pending).toEqual({ orcid: ORCID, name: "Ada Lovelace", emailHint: "ada@usp.br" });
    });

    test("an account with a confirmed email signs in as that account and claims its invitations", async () => {
        jest.mocked(getUserByProviderID).mockResolvedValue(account());

        const token = await signInWithMock({ orcid: ORCID, name: "Ada Lovelace", email: "" });

        expect(token.uid).toBe("u1");
        expect(token.tenancies).toEqual([TENANCY]);
        expect(token.pending).toBeUndefined();
        expect(token.v).toBe(TOKEN_VERSION);
        expect(getUserByProviderID).toHaveBeenCalledWith({ providerName: "orcid", providerID: ORCID });
        expect(claimInvitations).toHaveBeenCalledWith("u1");
    });

    test("update() finishes a pending mock sign-in once the email is confirmed", async () => {
        jest.mocked(getUserByProviderID).mockRejectedValueOnce(gatekeeperError(404));
        const pending = await signInWithMock({ orcid: ORCID, name: "Ada Lovelace", email: "ada.public@example.org" });
        jest.mocked(getUserByProviderID).mockResolvedValue(account());

        const token = await jwt({ token: pending, trigger: "update" });

        expect(token.uid).toBe("u1");
        expect(token.pending).toBeUndefined();
        expect(getUserByProviderID).toHaveBeenLastCalledWith({ providerName: "orcid", providerID: ORCID });
    });
});
