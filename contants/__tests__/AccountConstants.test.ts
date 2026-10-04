import { describe, expect, test } from '@jest/globals';
import {
    CODE_LENGTH,
    PASSWORD_MAX_LENGTH,
    PASSWORD_MIN_LENGTH,
    RESEND_COOLDOWN_SECONDS,
    accountErrorMessage,
} from "../AccountConstants";
import { GENERIC_ERROR_MESSAGE } from "../EmbargoConstants";
import { ROUTE_PAGE_FORGOT_PASSWORD, ROUTE_PAGE_RESET_PASSWORD } from "../InternalRoutesConstants";

describe("the account rules", () => {
    test("match the gatekeeper's", () => {
        expect(PASSWORD_MIN_LENGTH).toBe(10);
        expect(PASSWORD_MAX_LENGTH).toBe(128);
        expect(CODE_LENGTH).toBe(6);
        expect(RESEND_COOLDOWN_SECONDS).toBe(90);
    });
});

describe("accountErrorMessage", () => {
    test.each`
        detail                                | message
        ${"code_invalid"}                     | ${"Invalid code."}
        ${"code_expired"}                     | ${"Code expired, request a new one."}
        ${"code_attempts_exceeded"}           | ${"Too many attempts. Request a new code."}
        ${"challenge_not_found"}              | ${"This code is no longer valid. Start again."}
        ${"resend_too_soon"}                  | ${"Wait a moment before asking for another code."}
        ${"invalid_credentials"}              | ${"Invalid email or password."}
        ${"token_invalid"}                    | ${"This link is invalid or has expired."}
        ${"email_belongs_to_another_account"} | ${"This email belongs to another DataMap account. Contact the DataMap team."}
        ${"invalid_email"}                    | ${"This email address is not valid."}
        ${"invalid_name"}                     | ${"Enter your name."}
        ${"invalid_password"}                 | ${"The password must have 10 to 128 characters."}
        ${"invalid_orcid"}                    | ${"Your ORCID sign-in could not be read. Sign in again."}
        ${"invalid_request"}                  | ${"Something in the form could not be read. Check it and try again."}
    `("explains $detail", ({ detail, message }) => {
        expect(accountErrorMessage(detail)).toBe(message);
    });

    test("anything else is the generic message", () => {
        expect(accountErrorMessage("made_up")).toBe(GENERIC_ERROR_MESSAGE);
        expect(accountErrorMessage(undefined)).toBe(GENERIC_ERROR_MESSAGE);
    });

    test("a name inherited from Object is not a message", () => {
        expect(accountErrorMessage("constructor")).toBe(GENERIC_ERROR_MESSAGE);
        expect(accountErrorMessage("toString")).toBe(GENERIC_ERROR_MESSAGE);
    });

    test("a validation list instead of a code is the generic message", () => {
        expect(accountErrorMessage([{ msg: "field required" }] as unknown as string)).toBe(GENERIC_ERROR_MESSAGE);
    });
});

describe("the account routes", () => {
    test("forgot password", () => {
        expect(ROUTE_PAGE_FORGOT_PASSWORD).toBe("/account/forgot-password");
    });

    test("reset password carries the token", () => {
        expect(ROUTE_PAGE_RESET_PASSWORD("tok")).toBe("/account/reset-password/tok");
    });
});
