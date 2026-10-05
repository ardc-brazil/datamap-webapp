import { GENERIC_ERROR_MESSAGE } from "./EmbargoConstants";

export const PASSWORD_MIN_LENGTH = 10;

export const PASSWORD_MAX_LENGTH = 128;

export const CODE_LENGTH = 6;

export const RESEND_COOLDOWN_SECONDS = 90;

export const INVALID_SIGN_IN_MESSAGE = "Invalid email or password.";

export const CURRENT_PASSWORD_INCORRECT_MESSAGE = "The current password is incorrect, or the account is temporarily locked after too many attempts.";

export const SESSION_EXPIRED_MESSAGE = "Your session has expired. Sign in again.";

export const PASSWORD_LENGTH_MESSAGE = `Use ${PASSWORD_MIN_LENGTH} to ${PASSWORD_MAX_LENGTH} characters.`;

export const ACCOUNT_ERROR_MESSAGES: Record<string, string> = {
    code_invalid: "Invalid code.",
    code_expired: "Code expired, request a new one.",
    code_attempts_exceeded: "Too many attempts. Request a new code.",
    challenge_not_found: "This code is no longer valid. Start again.",
    resend_too_soon: "Wait a moment before asking for another code.",
    invalid_credentials: INVALID_SIGN_IN_MESSAGE,
    token_invalid: "This link is invalid or has expired.",
    email_belongs_to_another_account: "This email belongs to another DataMap account. Contact the DataMap team.",
    invalid_email: "This email address is not valid.",
    invalid_name: "Enter your name.",
    invalid_password: `The password must have ${PASSWORD_MIN_LENGTH} to ${PASSWORD_MAX_LENGTH} characters.`,
    invalid_orcid: "Your ORCID sign-in could not be read. Sign in again.",
    invalid_request: "Something in the form could not be read. Check it and try again.",
};

export function accountErrorMessage(detail?: string): string {
    if (typeof detail === "string" && Object.prototype.hasOwnProperty.call(ACCOUNT_ERROR_MESSAGES, detail)) {
        return ACCOUNT_ERROR_MESSAGES[detail];
    }
    return GENERIC_ERROR_MESSAGE;
}

export const ORCID_ID_PATTERN = /^\d{4}-\d{4}-\d{4}-\d{3}[\dX]$/;

export const DEV_ORCID_MOCK_PROVIDER_ID = "orcid-dev";

export const DEV_ORCID_MOCK_PROVIDER_NAME = "ORCID (development mock)";

export const ORCID_LINK_INTENT_COOKIE_NAME = "datamap.orcid-link-intent";

export const ORCID_LINK_INTENT_MAX_AGE_SECONDS = 10 * 60;

export const ORCID_LINK_OUTCOME_PARAM = "orcid";

export type OrcidLinkOutcomeKind = "already_linked" | "connected" | "unavailable";

export const ORCID_CONNECT_FAILED_MESSAGE = "ORCID could not be connected. Try again.";

export const ORCID_LINK_OUTCOMES: Record<OrcidLinkOutcomeKind, { message: string, role: "status" | "alert" }> = {
    already_linked: { message: "This ORCID iD is already linked to another DataMap account.", role: "alert" },
    connected: { message: "Your ORCID iD is connected.", role: "status" },
    unavailable: { message: ORCID_CONNECT_FAILED_MESSAGE, role: "alert" },
};
