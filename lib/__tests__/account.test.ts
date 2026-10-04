import { changePassword, confirmPasswordReset, confirmSignUp, login, requestPasswordReset, resendChallenge, signUp } from "../account";
import axiosInstance from "../rpc";

jest.mock("../rpc");
const mockPost = jest.mocked(axiosInstance.post);
const mockPut = jest.mocked(axiosInstance.put);

describe("account calls to the gatekeeper", () => {
    test("sign-up sends snake_case and answers the challenge in camelCase", async () => {
        mockPost.mockResolvedValue({ status: 202, data: { challenge_id: "c1" } });

        expect(await signUp({ name: "Ana", email: "ana@usp.br", password: "a long password" })).toEqual({ challengeId: "c1" });
        expect(mockPost).toHaveBeenCalledWith("/auth/sign-up", { name: "Ana", email: "ana@usp.br", password: "a long password" });
    });

    test("confirming a sign-up answers the new user id", async () => {
        mockPost.mockResolvedValue({ status: 200, data: { user_id: "u1" } });

        expect(await confirmSignUp("c1", "123456")).toEqual({ userId: "u1" });
        expect(mockPost).toHaveBeenCalledWith("/auth/sign-up/c1/confirm", { code: "123456" });
    });

    test("resending posts to the challenge without a body", async () => {
        mockPost.mockResolvedValue({ status: 202, data: null });

        await expect(resendChallenge("c1")).resolves.toBeUndefined();
        expect(mockPost).toHaveBeenCalledWith("/auth/challenges/c1/resend");
    });

    test("a challenge id cannot reach another gatekeeper path", async () => {
        mockPost.mockResolvedValue({ status: 202, data: null });

        await resendChallenge("../users");

        expect(mockPost).toHaveBeenCalledWith("/auth/challenges/..%2Fusers/resend");
    });

    test("login answers the user id", async () => {
        mockPost.mockResolvedValue({ status: 200, data: { user_id: "u1" } });

        expect(await login("ana@usp.br", "a long password")).toEqual({ userId: "u1" });
        expect(mockPost).toHaveBeenCalledWith("/auth/login", { email: "ana@usp.br", password: "a long password" });
    });

    test("a refused login rejects with the gatekeeper error", async () => {
        const refused = { response: { status: 401, data: { detail: "invalid_credentials" } } };
        mockPost.mockRejectedValue(refused);

        await expect(login("ana@usp.br", "wrong password")).rejects.toBe(refused);
    });

    test("requesting a reset sends only the email", async () => {
        mockPost.mockResolvedValue({ status: 202, data: null });

        await expect(requestPasswordReset("ana@usp.br")).resolves.toBeUndefined();
        expect(mockPost).toHaveBeenCalledWith("/auth/password-reset", { email: "ana@usp.br" });
    });

    test("confirming a reset sends the token and the new password", async () => {
        mockPost.mockResolvedValue({ status: 204, data: null });

        await expect(confirmPasswordReset("tok", "a new long password")).resolves.toBeUndefined();
        expect(mockPost).toHaveBeenCalledWith("/auth/password-reset/confirm", { token: "tok", password: "a new long password" });
    });

    test("changing the password acts as the user and sends snake_case", async () => {
        mockPut.mockResolvedValue({ status: 204, data: null });

        await expect(changePassword("u1", "the old password", "the new password")).resolves.toBeUndefined();
        expect(mockPut).toHaveBeenCalledWith(
            "/users/u1/password",
            { current_password: "the old password", new_password: "the new password" },
            { headers: { "X-User-Id": "u1" } },
        );
    });
});
