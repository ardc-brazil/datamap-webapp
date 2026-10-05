jest.mock("next-auth/jwt", () => ({ getToken: jest.fn() }));
jest.mock("../account");

import { AxiosError, AxiosHeaders } from "axios";
import { getToken } from "next-auth/jwt";
import confirmHandler from "../../pages/api/account/email-verifications/[challengeId]/confirm";
import requestHandler from "../../pages/api/account/email-verifications/index";
import { confirmEmailVerification, requestEmailVerification } from "../account";

const ORCID = "0000-0001-2345-6789";
const CHALLENGE_ID = "550e8400-e29b-41d4-a716-446655440000";
const pendingToken = { pending: { orcid: ORCID, name: "Ada Lovelace" }, v: 2 };
const JSON_BODY = { "content-type": "application/json" };

function gatekeeperError(status: number, detail: string) {
    return new AxiosError("gatekeeper", "ERR", undefined, {}, {
        status, data: { detail }, statusText: "", headers: {}, config: { headers: new AxiosHeaders() },
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

async function send(handler: any, method: string, query: Record<string, string>, body: unknown = undefined, headers: Record<string, string> = JSON_BODY) {
    const res = fakeRes();
    const original = process.stdout.write;
    // @ts-ignore
    process.stdout.write = () => true;
    try {
        await handler({ method, url: "/api/account/email-verifications", headers, cookies: {}, query, body } as any, res);
    } finally {
        process.stdout.write = original;
    }
    return res;
}

beforeEach(() => {
    jest.mocked(getToken).mockResolvedValue(pendingToken as any);
});

describe("POST /api/account/email-verifications", () => {
    test("takes the ORCID iD and name from the session and only the email from the browser", async () => {
        jest.mocked(requestEmailVerification).mockResolvedValue({ challengeId: CHALLENGE_ID });

        const res = await send(requestHandler, "POST", {}, { email: " ada@usp.br ", orcid: "9999-9999-9999-9999", name: "Mallory" });

        expect(res.statusCode).toBe(202);
        expect(res.json).toHaveBeenCalledWith({ challengeId: CHALLENGE_ID });
        expect(requestEmailVerification).toHaveBeenCalledWith({ orcid: ORCID, name: "Ada Lovelace", email: "ada@usp.br" });
    });

    test.each`
        detail
        ${"invalid_email"}
        ${"invalid_name"}
        ${"invalid_orcid"}
    `("a gatekeeper validation error ($detail) keeps its 400 and code", async ({ detail }) => {
        jest.mocked(requestEmailVerification).mockRejectedValue(gatekeeperError(400, detail));

        const res = await send(requestHandler, "POST", {}, { email: "ada@usp.br" });

        expect(res.statusCode).toBe(400);
        expect(res.json).toHaveBeenCalledWith({ detail });
    });

    test("a cross-site form post is refused before the gatekeeper is asked", async () => {
        const res = await send(requestHandler, "POST", {}, "email=ada@usp.br", { "content-type": "application/x-www-form-urlencoded" });

        expect(res.statusCode).toBe(415);
        expect(res.json).toHaveBeenCalledWith({ detail: "invalid_request" });
        expect(requestEmailVerification).not.toHaveBeenCalled();
    });

    test("a signed-in user cannot use it", async () => {
        jest.mocked(getToken).mockResolvedValue({ uid: "u1", v: 2 } as any);

        const res = await send(requestHandler, "POST", {}, { email: "ada@usp.br" });

        expect(res.statusCode).toBe(401);
        expect(requestEmailVerification).not.toHaveBeenCalled();
    });

    test("nor can an anonymous visitor", async () => {
        jest.mocked(getToken).mockResolvedValue(null);

        expect((await send(requestHandler, "POST", {}, { email: "ada@usp.br" })).statusCode).toBe(401);
    });

    test("only POST", async () => {
        expect((await send(requestHandler, "GET", {})).statusCode).toBe(405);
    });
});

describe("POST /api/account/email-verifications/[challengeId]/confirm", () => {
    test("confirms the code and answers 204", async () => {
        jest.mocked(confirmEmailVerification).mockResolvedValue({ userId: "u1" });

        const res = await send(confirmHandler, "POST", { challengeId: CHALLENGE_ID }, { code: "123456" });

        expect(res.statusCode).toBe(204);
        expect(res.end).toHaveBeenCalled();
        expect(res.json).not.toHaveBeenCalled();
        expect(confirmEmailVerification).toHaveBeenCalledWith(CHALLENGE_ID, "123456");
    });

    test.each`
        status | detail
        ${409} | ${"email_belongs_to_another_account"}
        ${400} | ${"code_invalid"}
        ${400} | ${"code_expired"}
        ${400} | ${"code_attempts_exceeded"}
        ${404} | ${"challenge_not_found"}
    `("forwards $status $detail unchanged", async ({ status, detail }) => {
        jest.mocked(confirmEmailVerification).mockRejectedValue(gatekeeperError(status, detail));

        const res = await send(confirmHandler, "POST", { challengeId: CHALLENGE_ID }, { code: "123456" });

        expect(res.statusCode).toBe(status);
        expect(res.json).toHaveBeenCalledWith({ detail });
    });

    test("a challenge id that is not a UUID never reaches the gatekeeper", async () => {
        const res = await send(confirmHandler, "POST", { challengeId: "../../users" }, { code: "123456" });

        expect(res.statusCode).toBe(404);
        expect(res.json).toHaveBeenCalledWith({ detail: "challenge_not_found" });
        expect(confirmEmailVerification).not.toHaveBeenCalled();
    });

    test("a gatekeeper that does not answer is a 500 with a code", async () => {
        jest.mocked(confirmEmailVerification).mockRejectedValue(new Error("ECONNREFUSED"));

        const res = await send(confirmHandler, "POST", { challengeId: CHALLENGE_ID }, { code: "123456" });

        expect(res.statusCode).toBe(500);
        expect(res.json).toHaveBeenCalledWith({ detail: "unavailable" });
    });

    test("a signed-in user cannot use it", async () => {
        jest.mocked(getToken).mockResolvedValue({ uid: "u1", v: 2 } as any);

        const res = await send(confirmHandler, "POST", { challengeId: CHALLENGE_ID }, { code: "123456" });

        expect(res.statusCode).toBe(401);
        expect(confirmEmailVerification).not.toHaveBeenCalled();
    });
});
