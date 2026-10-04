jest.mock("../share", () => ({ claimInvitations: jest.fn() }));
jest.mock("../account", () => ({ login: jest.fn() }));
jest.mock("../users", () => ({ ...(jest.requireActual("../users") as object), getUserByUID: jest.fn() }));
jest.mock("../logging", () => ({ ...(jest.requireActual("../logging") as object), logError: jest.fn() }));
jest.mock("../metrics", () => ({ getMetrics: () => ({ recordLogin: mockRecordLogin }) }));
const mockRecordLogin = jest.fn();

import { describe, expect, test } from '@jest/globals';
import { AxiosError, AxiosHeaders } from "axios";
import { authOptions, authorizeCredentials, hydratePasswordSignIn } from "../../pages/api/auth/[...nextauth]";
import { login } from "../account";
import { logError } from "../logging";
import { claimInvitations } from "../share";
import { getUserByUID } from "../users";

function gatekeeperError(status: number, detail: string) {
    return new AxiosError("gatekeeper", "ERR", undefined, {}, {
        status, data: { detail }, statusText: "", headers: {}, config: { headers: new AxiosHeaders() },
    } as any);
}

describe("signing in with a password", () => {
    test("the gatekeeper user id becomes the NextAuth user", async () => {
        jest.mocked(login).mockResolvedValue({ userId: "u1" });

        expect(await authorizeCredentials({ email: "ana@usp.br", password: "a long password" })).toEqual({ id: "u1", email: "ana@usp.br" });
        expect(login).toHaveBeenCalledWith("ana@usp.br", "a long password");
    });

    test("a refused password is no user, and counts as a failure", async () => {
        jest.mocked(login).mockRejectedValue(gatekeeperError(401, "invalid_credentials"));

        expect(await authorizeCredentials({ email: "ana@usp.br", password: "wrong password" })).toBeNull();
        expect(mockRecordLogin).toHaveBeenCalledWith("credentials", "failure");
    });

    test("a missing field never reaches the gatekeeper", async () => {
        expect(await authorizeCredentials({ email: "ana@usp.br" })).toBeNull();
        expect(await authorizeCredentials(undefined)).toBeNull();
        expect(login).not.toHaveBeenCalled();
    });

    test("a non-string field never reaches the gatekeeper, and logs no error", async () => {
        expect(await authorizeCredentials({ email: 123, password: "a long password" } as any)).toBeNull();
        expect(await authorizeCredentials({ email: "ana@usp.br", password: ["a", "b"] } as any)).toBeNull();
        expect(login).not.toHaveBeenCalled();
        expect(logError).not.toHaveBeenCalled();
        expect(mockRecordLogin).toHaveBeenCalledWith("credentials", "failure");
    });

    test("a network error with no response also throws sign_in_unavailable", async () => {
        jest.mocked(login).mockRejectedValue(new AxiosError("x", "ECONNREFUSED"));

        await expect(authorizeCredentials({ email: "ana@usp.br", password: "a long password" })).rejects.toThrow("sign_in_unavailable");
    });

    test("the old local stub is gone: a @local.datamap.com address is checked like any other", async () => {
        jest.mocked(login).mockRejectedValue(gatekeeperError(401, "invalid_credentials"));

        expect(await authorizeCredentials({ email: "john-doe@local.datamap.com", password: "12345678" })).toBeNull();
        expect(login).toHaveBeenCalledWith("john-doe@local.datamap.com", "12345678");
    });

    test("a gatekeeper that cannot answer is an error, not a wrong password", async () => {
        jest.mocked(login).mockRejectedValue(gatekeeperError(500, "boom"));

        await expect(authorizeCredentials({ email: "ana@usp.br", password: "a long password" })).rejects.toThrow("sign_in_unavailable");
    });

    test("the session takes the name, email and tenancies from the gatekeeper", async () => {
        jest.mocked(getUserByUID).mockResolvedValue({ id: "u1", name: "Ana", email: "ana@usp.br", tenancies: ["t1"] } as any);

        expect(await hydratePasswordSignIn({ email: "typed@usp.br" }, "u1")).toEqual({
            uid: "u1", name: "Ana", email: "ana@usp.br", tenancies: ["t1"],
        });
        expect(getUserByUID).toHaveBeenCalledWith({ uid: "u1", tenancy: undefined });
    });

    test("a new account with no role is read as itself, with no tenancy", async () => {
        jest.mocked(getUserByUID).mockResolvedValue({ id: "u1", name: "Ana", email: "ana@usp.br", roles: [], tenancies: [] } as any);

        expect(await hydratePasswordSignIn({ email: "ana@usp.br", tenancies: ["stale"] }, "u1")).toEqual({
            uid: "u1", name: "Ana", email: "ana@usp.br",
        });
        expect(logError).not.toHaveBeenCalled();
    });

    test("a gatekeeper that fails to read the user still signs in, with no tenancy, and says so in the log", async () => {
        jest.mocked(getUserByUID).mockRejectedValue({ status: 500 });

        expect(await hydratePasswordSignIn({ email: "ana@usp.br", tenancies: ["stale"] }, "u1")).toEqual({
            uid: "u1", email: "ana@usp.br",
        });
        expect(logError).toHaveBeenCalledWith("hydrating a password sign-in failed", { status: 500 });
    });

    test("the jwt callback hydrates a password sign-in by user id, not by provider", async () => {
        jest.mocked(getUserByUID).mockResolvedValue({ id: "u1", name: "Ana", email: "ana@usp.br", tenancies: [] } as any);
        jest.mocked(claimInvitations).mockResolvedValue({ accepted: [] });

        const token = await authOptions.callbacks.jwt({
            token: { email: "ana@usp.br" },
            user: { id: "u1", email: "ana@usp.br" },
            account: { provider: "credentials", type: "credentials", providerAccountId: "u1" },
            trigger: "signIn",
        } as any);

        expect(token.uid).toBe("u1");
        expect(getUserByUID).toHaveBeenCalledWith({ uid: "u1", tenancy: undefined });
        expect(claimInvitations).toHaveBeenCalledWith("u1");
    });
});
