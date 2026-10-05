/** Bump to sign out every open session, e.g. when the claims a token must carry change. */
export const TOKEN_VERSION = 2;

export const STALE_SESSION_ERROR = "session token issued before the current token version";

export interface PendingSignIn {
    orcid: string
    name: string
    emailHint?: string
}
