export const SIGN_OUT_CALLBACK_URL = "/";

function hasControlCharacter(path: string): boolean {
    for (let i = 0; i < path.length; i++) {
        if (path.charCodeAt(i) < 0x20) {
            return true;
        }
    }
    return false;
}

function isInternalPath(path?: string): boolean {
    return !!path
        && path.startsWith("/")
        && !path.startsWith("//")
        && !path.startsWith("/\\")
        && !hasControlCharacter(path);
}

/**
 * Login page URL that returns the visitor to `returnTo` after signing in.
 * Only internal paths are kept, so the query cannot be used as an open redirect.
 */
export function loginUrlFor(returnTo?: string): string {
    const callbackUrl = isInternalPath(returnTo) ? returnTo : "/";
    return `/account/login?phase=sign-in&callbackUrl=${encodeURIComponent(callbackUrl)}`;
}

/** Callback URL used for signing in; takes the raw (still-encoded) query value and keeps it only if it decodes to an internal path. */
export function safeCallbackUrl(rawCallbackUrl?: string): string {
    let callbackUrl: string;
    try {
        callbackUrl = decodeURIComponent(rawCallbackUrl ?? "/");
    } catch {
        return "/";
    }
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
