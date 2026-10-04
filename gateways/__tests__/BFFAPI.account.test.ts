jest.mock("axios", () => {
    const actual = jest.requireActual("axios");
    return {
        __esModule: true,
        ...actual,
        default: {
            ...actual.default,
            post: jest.fn(),
            put: jest.fn(),
            isAxiosError: actual.default.isAxiosError,
        },
    };
});

import axios, { AxiosError, AxiosHeaders } from "axios";
import { BFFAPI } from "../BFFAPI";

const bff = new BFFAPI();

describe("BFFAPI account", () => {
    test("sign-up answers the challenge id", async () => {
        jest.mocked(axios.post).mockResolvedValue({ status: 202, data: { challengeId: "c1" } });
        const input = { name: "Ana", email: "ana@usp.br", password: "a long password" };

        expect(await bff.signUp(input)).toEqual({ challengeId: "c1" });
        expect(axios.post).toHaveBeenCalledWith("/api/account/sign-up", input);
    });

    test("confirming posts the code to the challenge", async () => {
        jest.mocked(axios.post).mockResolvedValue({ status: 204, data: "" });

        await expect(bff.confirmSignUp("c1", "123456")).resolves.toBeUndefined();
        expect(axios.post).toHaveBeenCalledWith("/api/account/sign-up/c1/confirm", { code: "123456" });
    });

    test("resending posts to the challenge", async () => {
        jest.mocked(axios.post).mockResolvedValue({ status: 202, data: "" });

        await bff.resendChallenge("c1");

        expect(axios.post).toHaveBeenCalledWith("/api/account/challenges/c1/resend");
    });

    test("asking for a reset sends the email", async () => {
        jest.mocked(axios.post).mockResolvedValue({ status: 202, data: "" });

        await bff.requestPasswordReset("ana@usp.br");

        expect(axios.post).toHaveBeenCalledWith("/api/account/password-reset", { email: "ana@usp.br" });
    });

    test("confirming a reset sends the token and the password", async () => {
        jest.mocked(axios.post).mockResolvedValue({ status: 204, data: "" });

        await bff.confirmPasswordReset("tok", "a new long password");

        expect(axios.post).toHaveBeenCalledWith("/api/account/password-reset/confirm", { token: "tok", password: "a new long password" });
    });

    test("changing the password sends no user id", async () => {
        jest.mocked(axios.put).mockResolvedValue({ status: 204, data: "" });

        await bff.changePassword("the old password", "the new password");

        expect(axios.put).toHaveBeenCalledWith("/api/account/password", { currentPassword: "the old password", newPassword: "the new password" });
    });

    test("a refusal rejects with the Axios error, so the screen can read its detail", async () => {
        const refused = new AxiosError("bad", "ERR", undefined, {}, {
            status: 400, data: { detail: "code_invalid" },
            statusText: "", headers: {}, config: { headers: new AxiosHeaders() },
        } as any);
        jest.mocked(axios.post).mockRejectedValue(refused);

        await expect(bff.confirmSignUp("c1", "000000")).rejects.toBe(refused);
    });
});
