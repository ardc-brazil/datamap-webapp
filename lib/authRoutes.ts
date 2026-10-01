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
