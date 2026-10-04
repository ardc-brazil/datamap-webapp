export const SIGN_OUT_CALLBACK_URL = "/";

function isInternalPath(path?: string): boolean {
    return !!path && path.startsWith("/") && !path.startsWith("//");
}

/**
 * Login page URL that returns the visitor to `returnTo` after signing in.
 * Only internal paths are kept, so the query cannot be used as an open redirect.
 */
export function loginUrlFor(returnTo?: string): string {
    const callbackUrl = isInternalPath(returnTo) ? returnTo : "/";
    return `/account/login?phase=sign-in&callbackUrl=${encodeURIComponent(callbackUrl)}`;
}

/**
 * Callback URL used for signing in, kept to an internal path so a crafted login link cannot redirect off-site.
 */
export function safeCallbackUrl(callbackUrl?: string): string {
    return isInternalPath(callbackUrl) ? callbackUrl : "/";
}

const LOGIN_PHASES = ["sign-in", "sign-up"];

/** Tab of the login page for its `phase` query parameter: "sign-up" opens Create account. */
export function loginTabFor(phase?: string | string[]): number {
    return phase === "sign-up" ? 1 : 0;
}

export function loginPhaseFor(tabIndex: number): string {
    return LOGIN_PHASES[tabIndex] ?? LOGIN_PHASES[0];
}
