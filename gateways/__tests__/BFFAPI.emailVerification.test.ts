jest.mock("../../lib/telemetryClient", () => ({ trackUiEvent: jest.fn() }));
jest.mock("axios", () => {
    const actual = jest.requireActual("axios");
    return {
        __esModule: true,
        ...actual,
        default: {
            ...actual.default,
            get: jest.fn(),
            post: jest.fn(),
            put: jest.fn(),
            delete: jest.fn(),
            isAxiosError: actual.default.isAxiosError,
        },
    };
});

import axios, { AxiosError, AxiosHeaders } from "axios";
import { BFFAPI } from "../BFFAPI";

const bff = new BFFAPI();

describe("BFFAPI email verification", () => {
    test("asks for a code for the typed email only", async () => {
        jest.mocked(axios.post).mockResolvedValue({ status: 202, data: { challengeId: "c1" } });

        expect(await bff.requestEmailVerification("ada@usp.br")).toEqual({ challengeId: "c1" });
        expect(axios.post).toHaveBeenCalledWith("/api/account/email-verifications", { email: "ada@usp.br" });
    });

    test("confirms the code against the challenge", async () => {
        jest.mocked(axios.post).mockResolvedValue({ status: 204, data: "" });

        await expect(bff.confirmEmailVerification("c1", "123456")).resolves.toBeUndefined();
        expect(axios.post).toHaveBeenCalledWith("/api/account/email-verifications/c1/confirm", { code: "123456" });
    });

    test("a refusal rejects with the Axios error so the screen can read its detail", async () => {
        const conflict = new AxiosError("conflict", "ERR", undefined, {}, {
            status: 409, data: { detail: "email_belongs_to_another_account" }, statusText: "", headers: {}, config: { headers: new AxiosHeaders() },
        } as any);
        jest.mocked(axios.post).mockRejectedValue(conflict);

        await expect(bff.confirmEmailVerification("c1", "123456")).rejects.toBe(conflict);
    });
});
