import { ORCID_LINK_INTENT_MAX_AGE_SECONDS } from "../../contants/AccountConstants";
import {
    orcidLinkIntentCookie,
    setOrcidLinkIntent,
    signOrcidLinkIntent,
    takeOrcidLinkIntent,
    verifyOrcidLinkIntent,
} from "../orcidLinkIntent";

const SECRET = "a-secret-long-enough-for-hmac";
const UID = "8a6e0804-2bd0-4672-b79d-d97027f9071a";
const NOW = Date.parse("2026-10-04T12:00:00Z");

function fakeRes() {
    const res: any = { headers: {} };
    res.setHeader = jest.fn((key: string, value: unknown) => (res.headers[key.toLowerCase()] = value));
    res.getHeader = jest.fn((key: string) => res.headers[key.toLowerCase()]);
    return res;
}

function setCookies(res: any): string[] {
    const value = res.headers["set-cookie"];
    return Array.isArray(value) ? value : value ? [value] : [];
}

describe("the ORCID link intent", () => {
    test("a freshly signed intent verifies to the user id", () => {
        expect(verifyOrcidLinkIntent(signOrcidLinkIntent(UID, SECRET, NOW), SECRET, NOW + 1000)).toBe(UID);
    });

    test("an intent signed with another secret is rejected", () => {
        expect(verifyOrcidLinkIntent(signOrcidLinkIntent(UID, "another-secret", NOW), SECRET, NOW)).toBeNull();
    });

    test("an intent whose payload was swapped for another user is rejected", () => {
        const [, mac] = signOrcidLinkIntent(UID, SECRET, NOW).split(".");
        const forged = Buffer.from(JSON.stringify({ uid: "someone-else", exp: NOW / 1000 + 600 })).toString("base64url");

        expect(verifyOrcidLinkIntent(`${forged}.${mac}`, SECRET, NOW)).toBeNull();
    });

    test("an intent with a tampered signature is rejected", () => {
        const intent = signOrcidLinkIntent(UID, SECRET, NOW);
        const tampered = intent.slice(0, -2) + (intent.endsWith("AA") ? "BB" : "AA");

        expect(verifyOrcidLinkIntent(tampered, SECRET, NOW)).toBeNull();
    });

    test("an intent expires after ten minutes", () => {
        const intent = signOrcidLinkIntent(UID, SECRET, NOW);

        expect(ORCID_LINK_INTENT_MAX_AGE_SECONDS).toBe(600);
        expect(verifyOrcidLinkIntent(intent, SECRET, NOW + 599_000)).toBe(UID);
        expect(verifyOrcidLinkIntent(intent, SECRET, NOW + 600_000)).toBeNull();
    });

    test.each([undefined, "", "garbage", "a.b.c", ".", "e30.", `${Buffer.from("not json").toString("base64url")}.x`])(
        "a malformed value %p is rejected",
        (value) => {
            expect(verifyOrcidLinkIntent(value, SECRET, NOW)).toBeNull();
        },
    );

    test("nothing verifies without a secret", () => {
        expect(verifyOrcidLinkIntent(signOrcidLinkIntent(UID, "", NOW), "", NOW)).toBeNull();
    });
});

describe("the ORCID link intent cookie", () => {
    test("is short-lived, HttpOnly, SameSite=Lax and scoped to the sign-in callbacks", () => {
        const res = fakeRes();

        setOrcidLinkIntent(res, UID, SECRET, NOW);

        const [cookie] = setCookies(res);
        expect(cookie).toMatch(new RegExp(`^${orcidLinkIntentCookie()}=[A-Za-z0-9_-]+\\.[A-Za-z0-9_-]+;`));
        expect(cookie).toContain("Max-Age=600");
        expect(cookie).toContain("HttpOnly");
        expect(cookie).toContain("SameSite=Lax");
        expect(cookie).toContain("Path=/api/auth/callback");
        expect(cookie).not.toContain(UID);
    });

    describe.each([
        ["https://datamap.pcs.usp.br", true],
        ["http://localhost:3000", false],
        [undefined, false],
    ])("when NEXTAUTH_URL is %p", (url, secure) => {
        const saved = process.env.NEXTAUTH_URL;

        beforeEach(() => {
            if (url === undefined) {
                delete process.env.NEXTAUTH_URL;
            } else {
                process.env.NEXTAUTH_URL = url;
            }
        });

        afterEach(() => {
            process.env.NEXTAUTH_URL = saved;
        });

        test(`the cookie is ${secure ? "" : "not "}Secure and ${secure ? "" : "not "}__Secure- prefixed, as NextAuth decides for its own`, () => {
            const res = fakeRes();

            setOrcidLinkIntent(res, UID, SECRET, NOW);

            const [cookie] = setCookies(res);
            expect(orcidLinkIntentCookie()).toBe(secure ? "__Secure-datamap.orcid-link-intent" : "datamap.orcid-link-intent");
            expect(cookie.startsWith(`${orcidLinkIntentCookie()}=`)).toBe(true);
            expect(/;\s*Secure(;|$)/.test(cookie)).toBe(secure);
        });

        test("the intent is read back under the same name", () => {
            const res = fakeRes();

            expect(takeOrcidLinkIntent({ cookies: { [orcidLinkIntentCookie()]: signOrcidLinkIntent(UID, SECRET, NOW) } } as any, res, SECRET, NOW)).toBe(UID);
        });
    });

    test("taking the intent returns the user id and expires the cookie, keeping cookies set before it", () => {
        const intent = signOrcidLinkIntent(UID, SECRET, NOW);
        const res = fakeRes();
        res.setHeader("Set-Cookie", ["other=1; Path=/"]);

        const uid = takeOrcidLinkIntent({ cookies: { [orcidLinkIntentCookie()]: intent } } as any, res, SECRET, NOW);

        expect(uid).toBe(UID);
        expect(setCookies(res)).toEqual([
            "other=1; Path=/",
            expect.stringMatching(new RegExp(`^${orcidLinkIntentCookie()}=; .*Max-Age=0`)),
        ]);
        expect(setCookies(res)[1]).toContain("Path=/api/auth/callback");
    });

    test("an invalid intent is expired too and yields nothing", () => {
        const res = fakeRes();

        expect(takeOrcidLinkIntent({ cookies: { [orcidLinkIntentCookie()]: "forged.value" } } as any, res, SECRET, NOW)).toBeNull();
        expect(setCookies(res)).toHaveLength(1);
    });

    test("without the cookie nothing is read and nothing is set", () => {
        const res = fakeRes();

        expect(takeOrcidLinkIntent({ cookies: {} } as any, res, SECRET, NOW)).toBeNull();
        expect(res.setHeader).not.toHaveBeenCalled();
    });
});
