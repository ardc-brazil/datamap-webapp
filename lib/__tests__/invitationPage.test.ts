import { describe, expect, test } from '@jest/globals';
import { invitationAccount, invitationPageProps } from "../invitationPage";
import { TOKEN_VERSION } from "../sessionToken";

const pending: any = { state: "pending", dataset_name: "GoAmazon", inviter_name: "Luciana Rizzo", owner_name: "Luciana Rizzo", level: "read", invited_as: "fernanda@inpe.br", embargo_until: null, accepted_at: null };

describe("invitationPageProps", () => {
    test("a signed-in account sees the invitation", () => {
        expect(invitationPageProps(pending, "tok", "fernanda.lima@gmail.com"))
            .toEqual({ props: { token: "tok", preview: pending, account: "fernanda.lima@gmail.com" } });
    });

    test("anyone else signs in first and comes back to the same invitation", () => {
        const result: any = invitationPageProps(pending, "tok", null);

        expect(result.redirect.permanent).toBe(false);
        expect(result.redirect.destination).toBe("/account/login?phase=sign-in&callbackUrl=%2Finvitations%2Ftok");
    });

    test("a used invitation is explained without signing in", () => {
        const used = { ...pending, state: "accepted", accepted_at: "2026-09-29T10:00:00Z" };

        expect(invitationPageProps(used, "tok", null)).toEqual({ props: { token: "tok", preview: used, account: null } });
    });

    test("a revoked or unknown invitation is not found", () => {
        expect(invitationPageProps(null, "tok", "x@y.z")).toEqual({ notFound: true });
    });
});

describe("invitationAccount", () => {
    test("names the signed-in account by email, then by name", () => {
        expect(invitationAccount({ uid: "u1", v: TOKEN_VERSION, email: "fernanda.lima@gmail.com", name: "Fernanda" })).toBe("fernanda.lima@gmail.com");
        expect(invitationAccount({ uid: "u1", v: TOKEN_VERSION, name: "Fernanda Lima" })).toBe("Fernanda Lima");
    });

    test("a signed-in session with neither email nor name still counts as signed in, so the login never loops", () => {
        const account = invitationAccount({ uid: "u1", v: TOKEN_VERSION });

        expect(account).toBe("this account");
        expect(invitationPageProps(pending, "tok", account)).toEqual({ props: { token: "tok", preview: pending, account: "this account" } });
    });

    test("no session, or one without a uid, is not signed in", () => {
        expect(invitationAccount(null)).toBeNull();
        expect(invitationAccount({ v: TOKEN_VERSION, email: "x@y.z" })).toBeNull();
    });

    test("a token from before the current version is not signed in, even with a uid", () => {
        expect(invitationAccount({ uid: "u1", email: "fernanda.lima@gmail.com" })).toBeNull();
    });
});
