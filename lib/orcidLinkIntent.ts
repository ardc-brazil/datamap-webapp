import { createHmac, timingSafeEqual } from "crypto";
import type { NextApiRequest, NextApiResponse } from "next";
import { ORCID_LINK_INTENT_COOKIE_NAME, ORCID_LINK_INTENT_MAX_AGE_SECONDS } from "../contants/AccountConstants";

// The rule NextAuth and getToken use for their own cookies.
function secureCookies(): boolean {
    return process.env.NEXTAUTH_URL?.startsWith("https://") ?? false;
}

export function orcidLinkIntentCookie(): string {
    return secureCookies() ? `__Secure-${ORCID_LINK_INTENT_COOKIE_NAME}` : ORCID_LINK_INTENT_COOKIE_NAME;
}

// Only the sign-in callbacks read it, so no other route ever receives it.
const COOKIE_PATH = "/api/auth/callback";

const MAC_CONTEXT = "datamap.orcid-link-intent.v1.";

interface Payload {
    uid: string
    exp: number
}

function mac(payload: string, secret: string): Buffer {
    return createHmac("sha256", secret).update(MAC_CONTEXT + payload).digest();
}

/** `<base64url payload>.<base64url HMAC-SHA256>`: the payload is readable, so it carries nothing but the user id and its expiry. */
export function signOrcidLinkIntent(uid: string, secret: string, now: number = Date.now()): string {
    const exp = Math.floor(now / 1000) + ORCID_LINK_INTENT_MAX_AGE_SECONDS;
    const payload = Buffer.from(JSON.stringify({ uid, exp } satisfies Payload)).toString("base64url");
    return `${payload}.${mac(payload, secret).toString("base64url")}`;
}

export function verifyOrcidLinkIntent(value: string | undefined, secret: string, now: number = Date.now()): string | null {
    if (!secret || typeof value !== "string") {
        return null;
    }
    const parts = value.split(".");
    if (parts.length !== 2 || !parts[0] || !parts[1]) {
        return null;
    }
    const [payload, signature] = parts;
    const expected = mac(payload, secret);
    const given = Buffer.from(signature, "base64url");
    if (given.length !== expected.length || !timingSafeEqual(new Uint8Array(given), new Uint8Array(expected))) {
        return null;
    }
    let decoded: Partial<Payload>;
    try {
        decoded = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
    } catch {
        return null;
    }
    if (typeof decoded?.uid !== "string" || !decoded.uid || typeof decoded.exp !== "number" || decoded.exp * 1000 <= now) {
        return null;
    }
    return decoded.uid;
}

function cookie(value: string, maxAge: number): string {
    return [
        `${orcidLinkIntentCookie()}=${value}`,
        `Path=${COOKIE_PATH}`,
        `Max-Age=${maxAge}`,
        "HttpOnly",
        "SameSite=Lax",
        ...(secureCookies() ? ["Secure"] : []),
    ].join("; ");
}

// NextAuth appends its own Set-Cookie headers after the callbacks run, so replacing the header here would be lost or would drop theirs.
function appendSetCookie(res: NextApiResponse, value: string) {
    const current = res.getHeader("Set-Cookie");
    const cookies = Array.isArray(current) ? current : current === undefined ? [] : [String(current)];
    res.setHeader("Set-Cookie", [...cookies, value]);
}

export function setOrcidLinkIntent(res: NextApiResponse, uid: string, secret: string, now: number = Date.now()) {
    appendSetCookie(res, cookie(signOrcidLinkIntent(uid, secret, now), ORCID_LINK_INTENT_MAX_AGE_SECONDS));
}

/** Reads the intent once: the cookie is expired whether or not it verifies. */
export function takeOrcidLinkIntent(req: Pick<NextApiRequest, "cookies">, res: NextApiResponse, secret: string, now: number = Date.now()): string | null {
    const value = req.cookies?.[orcidLinkIntentCookie()];
    if (value === undefined) {
        return null;
    }
    appendSetCookie(res, cookie("", 0));
    return verifyOrcidLinkIntent(value, secret, now);
}
