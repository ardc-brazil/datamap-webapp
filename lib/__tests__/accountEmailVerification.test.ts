jest.mock("../rpc");

import { AxiosError, AxiosHeaders } from "axios";
import { confirmEmailVerification, requestEmailVerification } from "../account";
import axiosInstance from "../rpc";

const ORCID = "0000-0001-2345-6789";
const mockPost = jest.mocked(axiosInstance.post);

describe("email verification calls", () => {
    test("asks the gatekeeper for a code, in snake_case", async () => {
        mockPost.mockResolvedValue({ status: 202, data: { challenge_id: "c1" } });

        expect(await requestEmailVerification({ orcid: ORCID, email: "ada@usp.br", name: "Ada Lovelace" }))
            .toEqual({ challengeId: "c1" });
        expect(mockPost).toHaveBeenCalledWith("/auth/email-verifications", { orcid: ORCID, email: "ada@usp.br", name: "Ada Lovelace" });
    });

    test("confirms the code against the challenge", async () => {
        mockPost.mockResolvedValue({ status: 200, data: { user_id: "u1" } });

        expect(await confirmEmailVerification("c1", "123456")).toEqual({ userId: "u1" });
        expect(mockPost).toHaveBeenCalledWith("/auth/email-verifications/c1/confirm", { code: "123456" });
    });

    test("a refusal reaches the caller as the Axios error", async () => {
        const conflict = new AxiosError("conflict", "ERR", undefined, {}, {
            status: 409, data: { detail: "email_belongs_to_another_account" }, statusText: "", headers: {}, config: { headers: new AxiosHeaders() },
        } as any);
        mockPost.mockRejectedValue(conflict);

        await expect(confirmEmailVerification("c1", "123456")).rejects.toBe(conflict);
    });
});
