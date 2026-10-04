import { ROUTE_PAGE_CONFIRM_EMAIL, ROUTE_PAGE_HOME } from "../contants/InternalRoutesConstants";

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

/** Confirmation page URL that returns the person to `returnTo`; the same internal-path rule as `loginUrlFor`. */
export function confirmEmailUrlFor(returnTo?: string): string {
    const callbackUrl = typeof returnTo === "string" && isInternalPath(returnTo) ? returnTo : "/";
    return `${ROUTE_PAGE_CONFIRM_EMAIL}?callbackUrl=${encodeURIComponent(callbackUrl)}`;
}

const LOGIN_PAGE = "/account/login";

function rawQueryValue(value?: string | string[]): string | undefined {
    return typeof value === "string" ? value : undefined;
}

/**
 * A pending session must confirm its email first, and only a pending session belongs on the confirmation page.
 * `rawCallbackUrl` is the page's `callbackUrl` query value, used on the login and confirmation pages.
 */
export function pendingSessionRedirect(
    pending: boolean,
    pathname: string,
    asPath: string,
    rawCallbackUrl?: string | string[],
): string | null {
    if (pathname.startsWith("/api/")) {
        return null;
    }
    const onConfirmPage = pathname === ROUTE_PAGE_CONFIRM_EMAIL;
    if (pending && !onConfirmPage) {
        const returnTo = pathname === LOGIN_PAGE ? safeCallbackUrl(rawQueryValue(rawCallbackUrl)) : asPath;
        return confirmEmailUrlFor(returnTo);
    }
    if (!pending && onConfirmPage) {
        const callbackUrl = safeCallbackUrl(rawQueryValue(rawCallbackUrl));
        return callbackUrl.split(/[?#]/)[0] === ROUTE_PAGE_CONFIRM_EMAIL ? ROUTE_PAGE_HOME : callbackUrl;
    }
    return null;
}
