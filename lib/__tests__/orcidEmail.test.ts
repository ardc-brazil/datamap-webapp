jest.mock("axios");

import axios from "axios";
import {
    fetchOrcidPublicEmail,
    isPlaceholderEmail,
    ORCID_EMAIL_TIMEOUT_MS,
    ORCID_PUBLIC_API_URL,
    pickOrcidEmail,
} from "../orcidEmail";

const ORCID = "0000-0001-2345-6789";
const mockGet = jest.mocked(axios.get);

describe("isPlaceholderEmail", () => {
    test.each`
        email                                  | placeholder
        ${"0000-0001-2345-6789@fake.mail.com"} | ${true}
        ${"0000-0001-2345-6789@FAKE.MAIL.COM"} | ${true}
        ${""}                                  | ${true}
        ${null}                                | ${true}
        ${undefined}                           | ${true}
        ${"ada@usp.br"}                        | ${false}
        ${"fake.mail.com@usp.br"}              | ${false}
    `("$email is a placeholder: $placeholder", ({ email, placeholder }) => {
        expect(isPlaceholderEmail(email)).toBe(placeholder);
    });
});

describe("pickOrcidEmail", () => {
    test("prefers the primary verified address", () => {
        expect(pickOrcidEmail([
            { email: "old@usp.br", primary: false, verified: true },
            { email: "ada@usp.br", primary: true, verified: true },
        ])).toBe("ada@usp.br");
    });

    test("then any verified address", () => {
        expect(pickOrcidEmail([
            { email: "unverified@usp.br", primary: true, verified: false },
            { email: "verified@usp.br", primary: false, verified: true },
        ])).toBe("verified@usp.br");
    });

    test("then the first address", () => {
        expect(pickOrcidEmail([{ email: "only@usp.br" }])).toBe("only@usp.br");
    });

    test("nothing public, nothing to pick", () => {
        expect(pickOrcidEmail([])).toBeUndefined();
        expect(pickOrcidEmail(undefined)).toBeUndefined();
        expect(pickOrcidEmail([{ email: "not-an-email" }])).toBeUndefined();
    });
});

describe("fetchOrcidPublicEmail", () => {
    test("reads the record's public emails with the sign-in access token", async () => {
        mockGet.mockResolvedValue({ data: { email: [{ email: "ada@usp.br", primary: true, verified: true }] } });

        expect(await fetchOrcidPublicEmail(ORCID, "access-token")).toBe("ada@usp.br");
        expect(mockGet).toHaveBeenCalledWith(`${ORCID_PUBLIC_API_URL}/${ORCID}/email`, {
            timeout: ORCID_EMAIL_TIMEOUT_MS,
            headers: { Accept: "application/json", Authorization: "Bearer access-token" },
        });
    });

    test("works without an access token", async () => {
        mockGet.mockResolvedValue({ data: { email: [] } });

        expect(await fetchOrcidPublicEmail(ORCID)).toBeUndefined();
        expect(mockGet).toHaveBeenCalledWith(`${ORCID_PUBLIC_API_URL}/${ORCID}/email`, {
            timeout: ORCID_EMAIL_TIMEOUT_MS,
            headers: { Accept: "application/json" },
        });
    });

    test("a failure or a timeout is ignored", async () => {
        mockGet.mockRejectedValue(new Error("timeout of 3000ms exceeded"));

        await expect(fetchOrcidPublicEmail(ORCID, "access-token")).resolves.toBeUndefined();
    });

    test("anything that is not an ORCID iD is never put in the URL", async () => {
        expect(await fetchOrcidPublicEmail("../../admin", "access-token")).toBeUndefined();
        expect(mockGet).not.toHaveBeenCalled();
    });

    test("waits at most three seconds", () => {
        expect(ORCID_EMAIL_TIMEOUT_MS).toBe(3000);
    });
});
