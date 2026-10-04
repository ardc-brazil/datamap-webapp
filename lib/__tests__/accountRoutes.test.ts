jest.mock("next-auth/jwt", () => ({ getToken: jest.fn() }));
jest.mock("../account");

import { AxiosError, AxiosHeaders } from "axios";
import { getToken } from "next-auth/jwt";
import passwordHandler from "../../pages/api/account/password";
import resetHandler from "../../pages/api/account/password-reset/index";
import resetConfirmHandler from "../../pages/api/account/password-reset/confirm";
import resendHandler from "../../pages/api/account/challenges/[challengeId]/resend";
import signUpHandler from "../../pages/api/account/sign-up/index";
import confirmHandler from "../../pages/api/account/sign-up/[challengeId]/confirm";
import { changePassword, confirmPasswordReset, confirmSignUp, requestPasswordReset, resendChallenge, signUp } from "../account";

function gatekeeperError(status: number, data: unknown) {
    return new AxiosError("gatekeeper", "ERR", undefined, {}, {
        status, data, statusText: "", headers: {}, config: { headers: new AxiosHeaders() },
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

async function send(handler: any, method: string, query: Record<string, string>, body: unknown = undefined) {
    const res = fakeRes();
    const original = process.stdout.write;
    // @ts-ignore
    process.stdout.write = () => true;
    try {
        await handler({ method, url: "/api/account/x", headers: {}, cookies: {}, query, body } as any, res);
    } finally {
        process.stdout.write = original;
    }
    return res;
}

beforeEach(() => {
    jest.mocked(getToken).mockResolvedValue(null);
});

describe("the public account routes", () => {
    test("sign-up needs no session and answers the challenge", async () => {
        jest.mocked(signUp).mockResolvedValue({ challengeId: "c1" });

        const res = await send(signUpHandler, "POST", {}, { name: "Ana", email: "ana@usp.br", password: "a long password", role: "admin" });

        expect(res.statusCode).toBe(202);
        expect(res.json).toHaveBeenCalledWith({ challengeId: "c1" });
        expect(signUp).toHaveBeenCalledWith({ name: "Ana", email: "ana@usp.br", password: "a long password" });
    });

    test("confirming a sign-up answers 204", async () => {
        jest.mocked(confirmSignUp).mockResolvedValue({ userId: "u1" });

        const res = await send(confirmHandler, "POST", { challengeId: "c1" }, { code: "123456" });

        expect(res.statusCode).toBe(204);
        expect(confirmSignUp).toHaveBeenCalledWith("c1", "123456");
    });

    test("a wrong code keeps its status and code", async () => {
        jest.mocked(confirmSignUp).mockRejectedValue(gatekeeperError(400, { detail: "code_invalid" }));

        const res = await send(confirmHandler, "POST", { challengeId: "c1" }, { code: "000000" });

        expect(res.statusCode).toBe(400);
        expect(res.json).toHaveBeenCalledWith({ detail: "code_invalid" });
    });

    test("an unknown challenge keeps its 404 and code", async () => {
        jest.mocked(confirmSignUp).mockRejectedValue(gatekeeperError(404, { detail: "challenge_not_found" }));

        const res = await send(confirmHandler, "POST", { challengeId: "gone" }, { code: "123456" });

        expect(res.statusCode).toBe(404);
        expect(res.json).toHaveBeenCalledWith({ detail: "challenge_not_found" });
    });

    test("resending too soon keeps its 429", async () => {
        jest.mocked(resendChallenge).mockRejectedValue(gatekeeperError(429, { detail: "resend_too_soon" }));

        const res = await send(resendHandler, "POST", { challengeId: "c1" });

        expect(res.statusCode).toBe(429);
        expect(res.json).toHaveBeenCalledWith({ detail: "resend_too_soon" });
    });

    test("resending answers 202", async () => {
        jest.mocked(resendChallenge).mockResolvedValue(undefined);

        const res = await send(resendHandler, "POST", { challengeId: "c1" });

        expect(res.statusCode).toBe(202);
        expect(resendChallenge).toHaveBeenCalledWith("c1");
    });

    test("asking for a reset answers 202", async () => {
        jest.mocked(requestPasswordReset).mockResolvedValue(undefined);

        const res = await send(resetHandler, "POST", {}, { email: "ana@usp.br" });

        expect(res.statusCode).toBe(202);
        expect(requestPasswordReset).toHaveBeenCalledWith("ana@usp.br");
    });

    test("a reset with a dead token keeps its code", async () => {
        jest.mocked(confirmPasswordReset).mockRejectedValue(gatekeeperError(400, { detail: "token_invalid" }));

        const res = await send(resetConfirmHandler, "POST", {}, { token: "tok", password: "a new long password" });

        expect(res.statusCode).toBe(400);
        expect(res.json).toHaveBeenCalledWith({ detail: "token_invalid" });
        expect(confirmPasswordReset).toHaveBeenCalledWith("tok", "a new long password");
    });

    test("a gatekeeper that does not answer is a 500 with a code", async () => {
        jest.mocked(requestPasswordReset).mockRejectedValue(new Error("ECONNREFUSED"));

        const res = await send(resetHandler, "POST", {}, { email: "ana@usp.br" });

        expect(res.statusCode).toBe(500);
        expect(res.json).toHaveBeenCalledWith({ detail: "unavailable" });
    });

    test("an unsupported method answers 405", async () => {
        const res = await send(signUpHandler, "GET", {});

        expect(res.statusCode).toBe(405);
    });
});

describe("changing the password", () => {
    test("acts as the signed-in user, never one from the body", async () => {
        jest.mocked(getToken).mockResolvedValue({ uid: "u1" } as any);
        jest.mocked(changePassword).mockResolvedValue(undefined);

        const res = await send(passwordHandler, "PUT", {}, { currentPassword: "the old password", newPassword: "the new password", userId: "u2" });

        expect(res.statusCode).toBe(204);
        expect(changePassword).toHaveBeenCalledWith("u1", "the old password", "the new password");
    });

    test("a wrong current password keeps its 401 and code", async () => {
        jest.mocked(getToken).mockResolvedValue({ uid: "u1" } as any);
        jest.mocked(changePassword).mockRejectedValue(gatekeeperError(401, { detail: "invalid_credentials" }));

        const res = await send(passwordHandler, "PUT", {}, { currentPassword: "wrong", newPassword: "the new password" });

        expect(res.statusCode).toBe(401);
        expect(res.json).toHaveBeenCalledWith({ detail: "invalid_credentials" });
    });

    test("needs a session", async () => {
        const res = await send(passwordHandler, "PUT", {}, { currentPassword: "a", newPassword: "b" });

        expect(res.statusCode).toBe(401);
        expect(changePassword).not.toHaveBeenCalled();
    });
});
