# RFC 008 PR 3 — ORCID email confirmation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** An ORCID sign-in only produces a usable session once the account behind it has a confirmed, real email; until then the session is *pending* (no `uid`), can reach only `/account/confirm-email` and the two email-verification BFF routes, and tokens issued before this change are signed out.

**Architecture:** The NextAuth `jwt` callback gains three behaviours: a version gate (`token.v === TOKEN_VERSION`, otherwise it throws, which NextAuth 4.24.9 turns into a deleted cookie and an empty session), an ORCID sign-in branch that either hydrates a verified account or sets `token.pending = {orcid, name, emailHint?}`, and an `update` branch that re-reads the ORCID iD already in the token. The BFF's `auth` step requires `uid` and the current version; a new `pendingOnlyChain` (next to PR 2's `publicChain`, wrapped as `pendingAccountRouter()` beside PR 2's `publicAccountRouter()`) admits only pending tokens to `pages/api/account/email-verifications/*`, which take the ORCID iD and name from the token and only the email or code from the browser, and answer errors through PR 2's `accountHandler`. `_app.tsx` and PR 2's login page route a pending session to `/account/confirm-email`, where `ConfirmEmailForm` (Formik + Yup, then PR 2's `VerificationCodeForm`) confirms the email, calls `update()` and returns to the `callbackUrl`. The profile gets "Connect ORCID", which reuses the same flow.

**Tech Stack:** Next.js 14 (pages router), NextAuth 4.24.9 (JWT strategy), next-connect 1.0.0-next.4, Axios, Formik 2.4 + Yup 1, Jest 29 + ts-jest, @testing-library/react 14 with `jest-environment-jsdom`.

## Global Constraints

- Worktree: `git worktree add -b feat/rfc-008-orcid-email-confirmation .claude/worktrees/rfc-008-orcid-email-confirmation main` (`main` after webapp PR 0, gatekeeper PR 1 and webapp PR 2 are merged); every command runs from `/Users/caio.maia/workspace/datamap/datamap-webapp/.claude/worktrees/rfc-008-orcid-email-confirmation`; `npm ci` there, never a symlinked `node_modules`.
- Jest from the worktree: `npx jest --coverage=false <paths>`.
- `TOKEN_VERSION = 2`, defined in `lib/sessionToken.ts` and re-exported from `pages/api/auth/[...nextauth].ts`; every token the `jwt` callback returns carries `token.v = 2`.
- A token without `v === 2` read outside a sign-in makes the `jwt` callback throw `new Error(STALE_SESSION_ERROR)`; NextAuth 4.24.9 then clears the session cookie and answers `{}`, which `next-auth/react` reads as `unauthenticated`.
- `token.pending?: { orcid: string; name: string; emailHint?: string }`; a pending token never has `uid` or `tenancies`.
- `session.user.pending: boolean` always set; `session.user.emailHint?: string` only when known; the ORCID iD is never put in the session.
- Placeholder emails are those ending in `@fake.mail.com` (case-insensitive).
- ORCID public email: `GET https://pub.orcid.org/v3.0/{orcid}/email`, `Accept: application/json`, `Authorization: Bearer <ORCID access token>`, timeout 3000 ms, any failure → `undefined`.
- An ORCID sign-in never calls `createUser`; accounts are created by the gatekeeper on email-verification confirm.
- `ROUTE_PAGE_CONFIRM_EMAIL = "/account/confirm-email"`.
- Gatekeeper: `POST /auth/email-verifications {orcid, email, name}` → `202 {challenge_id}`; `POST /auth/email-verifications/{challenge_id}/confirm {code}` → `200 {user_id}`, `400 code_invalid|code_expired|code_attempts_exceeded`, `404 challenge_not_found`, `409 email_belongs_to_another_account`.
- Gatekeeper validation `400`s carry `{"detail": "invalid_email" | "invalid_name" | "invalid_password" | "invalid_orcid"}`.
- BFF: `POST /api/account/email-verifications` (`pendingOnlyChain`, body `{email}`) → `202 {challengeId}`; `POST /api/account/email-verifications/[challengeId]/confirm` (`pendingOnlyChain`, body `{code}`) → `204`; errors through PR 2's `accountHandler` (gatekeeper status and `{detail}` unchanged; no response → `500 {detail: "unavailable"}`).
- Resend cooldown is PR 2's `RESEND_COOLDOWN_SECONDS = 90`, owned by `VerificationCodeForm`; this PR does not restate it.
- BFFAPI: `requestEmailVerification(email: string): Promise<{ challengeId: string }>`, `confirmEmailVerification(challengeId: string, code: string): Promise<void>`; both reject with the Axios error.
- 409 copy: `accountErrorMessage("email_belongs_to_another_account")` = `"This email belongs to another DataMap account. Contact the DataMap team."`.
- The browser never sends an ORCID iD or a user id.
- UI copy in English; forms with Formik + Yup; component tests start with the `/** @jest-environment jsdom */` docblock and import components from their own file under `components/`.
- Every commit message ends with `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.

### PR 2 code this plan builds on

Checked against `docs/superpowers/plans/2026-10-03-rfc-008-pr2-password-sign-in.md`. Every edit below is anchored on code as PR 2 leaves it.

- `pages/api/auth/[...nextauth].ts`: imports `import NextAuth, { AuthOptions, User } from "next-auth";`, `import { JWT } from "next-auth/jwt";` and `login` from `lib/account`; `async jwt({ token, account, trigger, user })` keeps `// Persist the OAuth access_token to the token right after signin`; the sign-in block is `if (trigger == "signIn") { if (account?.provider == "credentials") { token = await hydratePasswordSignIn(token, user.id); } else { ... getUserByProviderAuthentication ... } await claimPendingInvitations(token.uid as string); } else if (trigger == "update" && token.uid) {`; `getUserByProviderAuthentication` has only the `github` and `orcid` branches, then `} else { throw ... }`.
- `lib/users.ts`: PR 2 Task 2 already adds `has_password` and `email_verified_at` to `GetUserByProviderResponse` and `UserDetailsResponse`; this plan does not touch those types.
- `lib/account.ts`: `import axiosInstance from "./rpc";`; exports `signUp`, `confirmSignUp`, `resendChallenge`, `login`, `requestPasswordReset`, `confirmPasswordReset`, `changePassword`.
- `lib/middlewareChain.ts`: `export const publicChain = createRouter<NextApiRequest, NextApiResponse>().use(requestLogging);` right after `authOnlyChain`.
- `lib/accountRoute.ts`: `publicAccountRouter()` and `accountHandler(router: ReturnType<typeof publicAccountRouter>)`, which answers `err.response.status` with `{ detail: err.response.data.detail ?? "unavailable" }`, `500 {detail: "unavailable"}` without a response, `405` otherwise.
- `lib/__tests__/accountRoutes.test.ts` mocks `getToken` with `{ uid: "u1" }` for the password route (twice).
- `gateways/BFFAPI.ts`: `resendChallenge(challengeId: string): Promise<void>` exists; the last method of the class is `async changePassword(currentPassword: string, newPassword: string): Promise<void>`; account methods reject with the Axios error.
- `components/Account/VerificationCodeForm.tsx`: named export `VerificationCodeForm({ email, onSubmit, onResend })`; it shows `accountErrorMessage(error.response.data.detail)` for a rejected `onSubmit` and owns the 90 s resend countdown.
- `contants/AccountConstants.ts`: `ACCOUNT_ERROR_MESSAGES` already maps `email_belongs_to_another_account` to the exact 409 copy; `accountErrorMessage` falls back to `GENERIC_ERROR_MESSAGE` ("Something went wrong. Please try again."). It also maps the validation codes: `invalid_email` → "This email address is not valid.", `invalid_name` → "Enter your name.", `invalid_password` → "The password must have 10 to 128 characters.", `invalid_orcid` → "Your ORCID sign-in could not be read. Sign in again."; `resend_too_soon` → "Wait a moment before asking for another code." This plan adds no messages.
- `lib/accountValidation.ts`: `emailField` (Yup, "Enter a valid email address." / "Enter your email address.").
- `contants/EditFormConstants.ts`: `EDIT_FORM_LABEL_CLASS`, `EDIT_FORM_INPUT_CLASS`, `EDIT_FORM_ERROR_CLASS`; inline alerts use `text-error-600`.
- `lib/authRoutes.ts`: ends with `loginTabFor` / `loginPhaseFor`.
- `pages/account/login/index.tsx`: imports `import { signIn } from "next-auth/react";`, `import Router from "next/router";`, `import { loginPhaseFor, loginTabFor } from "../../../lib/authRoutes";`; `LoginPage` starts with `const callbackUrl = decodeURIComponent(props.callbackUrl || "/");`; not `auth`-gated.
- `pages/app/profile/index.tsx`: the "Sign-in methods" `<ul>` ends with `<PasswordSignInMethod user={user} />`, an `<li className="grid grid-cols-[140px_minmax(0,1fr)_auto] items-center gap-4 px-4 py-3 text-sm">`; `import { getUserByUID } from "../../../lib/users";` is unchanged.
- Gatekeeper: `GET /users/{id}` and `PUT /users/{id}/password` skip Casbin when `{id} == X-User-Id`, so a role-less new account can read itself; nothing in this plan works around it.

---

## File Structure

| File | Status | Responsibility |
|---|---|---|
| `lib/sessionToken.ts` | create | `TOKEN_VERSION`, `STALE_SESSION_ERROR`, `PendingSignIn` type |
| `lib/orcidEmail.ts` | create | `isPlaceholderEmail`, `pickOrcidEmail`, `fetchOrcidPublicEmail` (isolated, 3 s timeout, never throws) |
| `types/next-auth.d.ts` | modify | `Session.user.pending/emailHint`; `JWT.uid/tenancies/accessToken/v/pending` |
| `lib/users.ts` | modify | `hasSignInProvider` |
| `pages/api/auth/[...nextauth].ts` | modify | version gate, ORCID pending branch, `update` on pending, session exposes `pending`/`emailHint`, ORCID removed from `getUserByProviderAuthentication` |
| `lib/middlewareChain.ts` | modify | `auth` requires `uid` + current version; `pendingOnlyChain` |
| `lib/account.ts` | modify | `requestEmailVerification`, `confirmEmailVerification` |
| `lib/accountRoute.ts` | modify | `pendingAccountRouter()` next to PR 2's `publicAccountRouter()` |
| `pages/api/account/email-verifications/index.ts` | create | BFF: request a code for the pending ORCID sign-in |
| `pages/api/account/email-verifications/[challengeId]/confirm.ts` | create | BFF: confirm the code |
| `gateways/BFFAPI.ts` | modify | `requestEmailVerification`, `confirmEmailVerification` |
| `contants/InternalRoutesConstants.ts` | modify | `ROUTE_PAGE_CONFIRM_EMAIL` |
| `lib/authRoutes.ts` | modify | `safeReturnPath`, `confirmEmailUrlFor`, `pendingSessionRedirect` |
| `pages/_app.tsx` | modify | `Auth` sends pending sessions to confirm-email and non-pending ones away from it |
| `pages/account/login/index.tsx` | modify | a pending session that reaches the login page goes to confirm-email with the login's `callbackUrl` |
| `components/Account/ConfirmEmailForm.tsx` | create | email step (Formik) → `VerificationCodeForm` → `update()` → `callbackUrl`; 409; sign out |
| `pages/account/confirm-email.tsx` | create | the page, `BareLayout`, 560 px column, `auth` gated |
| `components/Account/ConnectOrcid.tsx` | create | profile row with "Connect ORCID" |
| `pages/app/profile/index.tsx` | modify | shows `ConnectOrcid` when the account has no `orcid` provider |
| `lib/__tests__/orcidEmail.test.ts` | create | tests for `lib/orcidEmail.ts` |
| `lib/__tests__/sessionTokenVersion.test.ts` | create | version gate + NextAuth session-route behaviour |
| `lib/__tests__/orcidPendingSignIn.test.ts` | create | ORCID sign-in, `update` on pending, session callback |
| `lib/__tests__/middlewareChain.test.ts` | modify | `uid`/version required; `pendingOnlyChain` |
| `lib/__tests__/embargoRoutes.test.ts`, `lib/__tests__/membersAccessRoute.test.ts`, `lib/__tests__/shareRoutes.test.ts`, `lib/__tests__/accountRoutes.test.ts` | modify | mocked signed-in tokens carry `v: 2` |
| `lib/__tests__/accountEmailVerification.test.ts` | create | tests for the two `lib/account.ts` functions |
| `lib/__tests__/emailVerificationRoutes.test.ts` | create | tests for the two BFF routes |
| `gateways/__tests__/BFFAPI.emailVerification.test.ts` | create | tests for the two BFFAPI methods |
| `lib/__tests__/authRoutes.test.ts` | modify | tests for the new route helpers, including the login-page case |
| `components/Account/__tests__/ConfirmEmailForm.test.tsx` | create | component tests |
| `components/Account/__tests__/ConnectOrcid.test.tsx` | create | component tests |
| `lib/__tests__/users.test.ts` | modify | test for `hasSignInProvider` |

New tests for the NextAuth module live under `lib/__tests__/`, not `pages/api/auth/__tests__/`, so that `next build` does not pick them up as API routes.

---

### Task 1: Read the public email from ORCID

**Files:**
- Create: `lib/orcidEmail.ts`
- Test: `lib/__tests__/orcidEmail.test.ts`

**Interfaces:**
- Consumes: `axios` default export.
- Produces:
  - `ORCID_PUBLIC_API_URL = "https://pub.orcid.org/v3.0"`
  - `ORCID_EMAIL_TIMEOUT_MS = 3000`
  - `isPlaceholderEmail(email?: string | null): boolean`
  - `pickOrcidEmail(emails: OrcidEmail[] | undefined): string | undefined`
  - `fetchOrcidPublicEmail(orcid: string, accessToken?: string): Promise<string | undefined>`

- [ ] **Step 0: Create the worktree**

```bash
cd /Users/caio.maia/workspace/datamap/datamap-webapp
git fetch origin
git log --oneline -5 origin/main   # PR 2 ("password sign-in through the gatekeeper" etc.) must be here
git worktree add -b feat/rfc-008-orcid-email-confirmation .claude/worktrees/rfc-008-orcid-email-confirmation origin/main
cd .claude/worktrees/rfc-008-orcid-email-confirmation
npm ci
```

Every later command in this plan runs from `/Users/caio.maia/workspace/datamap/datamap-webapp/.claude/worktrees/rfc-008-orcid-email-confirmation`.

- [ ] **Step 1: Write the failing test**

Create `lib/__tests__/orcidEmail.test.ts`:

```ts
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
```

- [ ] **Step 2: Run it and watch it fail**

Run: `npx jest --coverage=false lib/__tests__/orcidEmail.test.ts`
Expected: FAIL — `Cannot find module '../orcidEmail' from 'lib/__tests__/orcidEmail.test.ts'`.

- [ ] **Step 3: Implement**

Create `lib/orcidEmail.ts`:

```ts
import axios from "axios";

export const ORCID_PUBLIC_API_URL = "https://pub.orcid.org/v3.0";

export const ORCID_EMAIL_TIMEOUT_MS = 3000;

const PLACEHOLDER_EMAIL_DOMAIN = "@fake.mail.com";

const ORCID_ID = /^\d{4}-\d{4}-\d{4}-\d{3}[\dX]$/;

export interface OrcidEmail {
    email?: string
    primary?: boolean
    verified?: boolean
}

export function isPlaceholderEmail(email?: string | null): boolean {
    return !email || email.trim().toLowerCase().endsWith(PLACEHOLDER_EMAIL_DOMAIN);
}

export function pickOrcidEmail(emails: OrcidEmail[] | undefined): string | undefined {
    const usable = (emails ?? []).filter((entry) => typeof entry?.email === "string" && entry.email.includes("@"));
    const best = usable.find((entry) => entry.primary && entry.verified)
        ?? usable.find((entry) => entry.verified)
        ?? usable[0];
    return best?.email;
}

/** Only used to pre-fill the confirmation field: a slow or failing ORCID must never block a sign-in. */
export async function fetchOrcidPublicEmail(orcid: string, accessToken?: string): Promise<string | undefined> {
    if (!ORCID_ID.test(orcid)) {
        return undefined;
    }
    try {
        const response = await axios.get(`${ORCID_PUBLIC_API_URL}/${orcid}/email`, {
            timeout: ORCID_EMAIL_TIMEOUT_MS,
            headers: {
                Accept: "application/json",
                ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
            },
        });
        return pickOrcidEmail(response.data?.email);
    } catch {
        return undefined;
    }
}
```

- [ ] **Step 4: Run it and watch it pass**

Run: `npx jest --coverage=false lib/__tests__/orcidEmail.test.ts`
Expected: PASS (all tests green).

- [ ] **Step 5: Commit**

```bash
git add lib/orcidEmail.ts lib/__tests__/orcidEmail.test.ts
git commit -m "$(cat <<'EOF'
feat: read the public ORCID email to pre-fill the confirmation

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 2: Sign out tokens issued before this change

**Files:**
- Create: `lib/sessionToken.ts`
- Modify: `types/next-auth.d.ts`
- Modify: `pages/api/auth/[...nextauth].ts`
- Test: `lib/__tests__/sessionTokenVersion.test.ts`

**Interfaces:**
- Consumes: `authOptions.callbacks.jwt` / `.session` (existing); `next-auth/core/routes/session` default export (NextAuth 4.24.9 internal, used only in the test to prove the cookie is deleted).
- Produces:
  - `lib/sessionToken.ts`: `TOKEN_VERSION = 2`, `STALE_SESSION_ERROR: string`, `interface PendingSignIn { orcid: string; name: string; emailHint?: string }`
  - `pages/api/auth/[...nextauth].ts`: `export { TOKEN_VERSION }`
  - `JWT` augmentation: `uid?: string; tenancies?: string[]; accessToken?: string; v?: number; pending?: PendingSignIn`
  - `Session.user` augmentation: `uid: string; tenancies: string[]; pending: boolean; emailHint?: string`

Why throwing: in NextAuth 4.24.9 `core/routes/session.js` wraps the `jwt` callback in a `try`; on any throw it logs `JWT_SESSION_ERROR`, pushes `sessionStore.clean()` (the session cookie with `maxAge: 0`) and leaves the body `{}`. On the client, `next-auth/react`'s `fetchData` returns `Object.keys(data).length > 0 ? data : null`, so the session becomes `null`, `status` becomes `"unauthenticated"`, and `_app.tsx`'s `useSession({ required: true, onUnauthenticated })` replaces the page with `loginUrlFor(router.asPath)`. Returning `{}` instead would re-encode an empty token and keep the user "authenticated"; returning `null` is not handled by 4.24.9 (the `session` callback would receive `null`). The same path runs for `update()` (`isUpdate`), so an old token cannot be revived. The cost is one `JWT_SESSION_ERROR` log line per stale session, once.

- [ ] **Step 1: Write the failing test**

Create `lib/__tests__/sessionTokenVersion.test.ts`:

```ts
jest.mock("../share", () => ({ claimInvitations: jest.fn() }));
jest.mock("../users", () => ({
    ...jest.requireActual("../users"),
    getUserByProviderID: jest.fn(),
    getUserByUID: jest.fn(),
    createUser: jest.fn(),
}));

import sessionRoute from "next-auth/core/routes/session";
import { authOptions, TOKEN_VERSION } from "../../pages/api/auth/[...nextauth]";
import { claimInvitations } from "../share";
import { STALE_SESSION_ERROR } from "../sessionToken";
import { getUserByUID } from "../users";

const jwt = (params: Record<string, unknown>) => authOptions.callbacks.jwt(params as any);

beforeEach(() => {
    jest.mocked(claimInvitations).mockResolvedValue({ accepted: [] } as any);
});

describe("the token version", () => {
    test("is 2", () => {
        expect(TOKEN_VERSION).toBe(2);
    });

    test("a token issued before versions existed is refused", async () => {
        await expect(jwt({ token: { uid: "u1", tenancies: ["datamap/production/data-amazon"] } }))
            .rejects.toThrow(STALE_SESSION_ERROR);
    });

    test("an older version is refused", async () => {
        await expect(jwt({ token: { uid: "u1", v: 1 } })).rejects.toThrow(STALE_SESSION_ERROR);
    });

    test("update() cannot revive an old token", async () => {
        await expect(jwt({ token: { uid: "u1" }, trigger: "update" })).rejects.toThrow(STALE_SESSION_ERROR);
    });

    test("a current token is read unchanged", async () => {
        expect(await jwt({ token: { uid: "u1", v: TOKEN_VERSION } })).toEqual({ uid: "u1", v: TOKEN_VERSION });
    });

    test("a password sign-in stamps the version on the new token", async () => {
        jest.mocked(getUserByUID).mockResolvedValue({ id: "u1", name: "Ana", email: "ana@usp.br", tenancies: [] } as any);

        const token = await jwt({
            token: { email: "ana@usp.br" },
            user: { id: "u1", email: "ana@usp.br" },
            account: { provider: "credentials", type: "credentials", providerAccountId: "u1" },
            trigger: "signIn",
        });

        expect(token.uid).toBe("u1");
        expect(token.v).toBe(TOKEN_VERSION);
    });
});

describe("NextAuth's session endpoint", () => {
    const CLEARED = [{ name: "next-auth.session-token", value: "", options: { maxAge: 0 } }];

    function sessionStore() {
        return {
            value: "cookie-from-the-browser",
            chunk: jest.fn(() => [{ name: "next-auth.session-token", value: "re-encoded", options: {} }]),
            clean: jest.fn(() => CLEARED),
        };
    }

    function options(decoded: Record<string, unknown>) {
        return {
            jwt: { decode: jest.fn(async () => decoded), encode: jest.fn(async () => "re-encoded") },
            callbacks: authOptions.callbacks,
            events: {},
            logger: { error: jest.fn(), warn: jest.fn(), debug: jest.fn() },
            session: { strategy: "jwt", maxAge: 3600 },
        };
    }

    test("a stale token gets an empty session and its cookie deleted, which the client reads as signed out", async () => {
        const store = sessionStore();
        const opts = options({ uid: "u1", tenancies: ["datamap/production/data-amazon"] });

        const response = await sessionRoute({ options: opts as any, sessionStore: store as any });

        expect(response.body).toEqual({});
        expect(response.cookies).toEqual(CLEARED);
        expect(opts.jwt.encode).not.toHaveBeenCalled();
        expect(opts.logger.error).toHaveBeenCalledWith("JWT_SESSION_ERROR", expect.any(Error));
    });

    test("a current token keeps its session", async () => {
        const store = sessionStore();
        const opts = options({ uid: "u1", tenancies: ["datamap/production/data-amazon"], v: TOKEN_VERSION });

        const response: any = await sessionRoute({ options: opts as any, sessionStore: store as any });

        expect(response.body.user.uid).toBe("u1");
        expect(store.clean).not.toHaveBeenCalled();
        expect(opts.jwt.encode).toHaveBeenCalledWith(expect.objectContaining({ token: expect.objectContaining({ v: TOKEN_VERSION }) }));
    });
});
```

- [ ] **Step 2: Run it and watch it fail**

Run: `npx jest --coverage=false lib/__tests__/sessionTokenVersion.test.ts`
Expected: FAIL — `Cannot find module '../sessionToken' from 'lib/__tests__/sessionTokenVersion.test.ts'`.

- [ ] **Step 3: Implement**

Create `lib/sessionToken.ts`:

```ts
/** Bump to sign out every open session, e.g. when the claims a token must carry change. */
export const TOKEN_VERSION = 2;

export const STALE_SESSION_ERROR = "session token issued before the current token version";

export interface PendingSignIn {
    orcid: string
    name: string
    emailHint?: string
}
```

Replace the whole of `types/next-auth.d.ts` (PR 2 does not change it):

```ts
import { DefaultSession } from "next-auth"
import type { PendingSignIn } from "../lib/sessionToken"

declare module "next-auth" {
    /**
     * Returned by `useSession`, `getSession` and received as a prop on the `SessionProvider` React Context
     */
    interface Session {
        user: {
            /** The user's unique ID. Absent while the sign-in is pending. */
            uid: string

            /** All available tenancies for a user */
            tenancies: string[]

            /** An ORCID sign-in waiting for a confirmed email. */
            pending: boolean

            /** Pre-fills the confirmation field of a pending sign-in. */
            emailHint?: string
        } & DefaultSession["user"]
    }
}

declare module "next-auth/jwt" {
    interface JWT {
        uid?: string
        tenancies?: string[]
        accessToken?: string
        v?: number
        pending?: PendingSignIn
    }
}
```

In `pages/api/auth/[...nextauth].ts`:

1. Immediately after the existing line `import { claimInvitations } from "../../../lib/share";` insert:

```ts
import { STALE_SESSION_ERROR, TOKEN_VERSION } from "../../../lib/sessionToken";

export { TOKEN_VERSION } from "../../../lib/sessionToken";
```

2. Immediately before the existing line `      // Persist the OAuth access_token to the token right after signin` (first statement of `async jwt(...)`), insert:

```ts
      if (!account && token.v !== TOKEN_VERSION) {
        throw new Error(STALE_SESSION_ERROR);
      }

```

3. Replace the end of the `jwt` callback:

```ts
      return token
    },

    // eslint-disable-next-line no-unused-vars
    async session({ session, token, user }) {
```

with:

```ts
      token.v = TOKEN_VERSION;
      return token
    },

    // eslint-disable-next-line no-unused-vars
    async session({ session, token, user }) {
```

- [ ] **Step 4: Run it and watch it pass**

Run: `npx jest --coverage=false lib/__tests__/sessionTokenVersion.test.ts lib/__tests__/passwordSignIn.test.ts "pages/api/auth/__tests__"`
Expected: PASS (the new file, PR 2's `passwordSignIn.test.ts` — its sign-in calls carry an `account`, so the version gate does not apply — and the existing `[...nextauth].test.ts`).

- [ ] **Step 5: Commit**

```bash
git add lib/sessionToken.ts types/next-auth.d.ts "pages/api/auth/[...nextauth].ts" lib/__tests__/sessionTokenVersion.test.ts
git commit -m "$(cat <<'EOF'
feat: sign out sessions issued before the token version

A token without v === 2 makes the jwt callback throw, which NextAuth
4.24 answers with an empty session and a deleted cookie, so open
sessions cannot skip the email confirmation.

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 3: ORCID sign-in without a confirmed email becomes pending

**Files:**
- Modify: `pages/api/auth/[...nextauth].ts`
- Test: `lib/__tests__/orcidPendingSignIn.test.ts`

**Interfaces:**
- Consumes: `getUserByProviderID(request: GetUserByProviderRequest): Promise<GetUserByProviderResponse>` (throws the Axios error, 404 when unknown; `email_verified_at: string | null` added by PR 2 Task 2); `fetchOrcidPublicEmail`, `isPlaceholderEmail` (Task 1); `hydrateWithUserInfo`, `claimPendingInvitations` (existing).
- Produces:
  - `export async function signInWithOrcid(token: JWT, account: Account): Promise<JWT>`
  - session callback sets `session.user.pending` and `session.user.emailHint`.

- [ ] **Step 1: Write the failing test**

Create `lib/__tests__/orcidPendingSignIn.test.ts`:

```ts
jest.mock("../share", () => ({ claimInvitations: jest.fn() }));
jest.mock("../users", () => ({
    ...jest.requireActual("../users"),
    getUserByProviderID: jest.fn(),
    getUserByUID: jest.fn(),
    createUser: jest.fn(),
}));
jest.mock("../orcidEmail", () => ({
    ...jest.requireActual("../orcidEmail"),
    fetchOrcidPublicEmail: jest.fn(),
}));

import { AxiosError, AxiosHeaders } from "axios";
import { authOptions, TOKEN_VERSION } from "../../pages/api/auth/[...nextauth]";
import { fetchOrcidPublicEmail } from "../orcidEmail";
import { claimInvitations } from "../share";
import { createUser, getUserByProviderID } from "../users";

const ORCID = "0000-0001-2345-6789";
const TENANCY = "datamap/production/data-amazon";

const jwt = (params: Record<string, unknown>): Promise<any> => authOptions.callbacks.jwt(params as any);

const orcidAccount = {
    provider: "orcid",
    type: "oauth",
    providerAccountId: ORCID,
    orcid: ORCID,
    access_token: "orcid-access-token",
};

function signInWithOrcid() {
    return jwt({ token: { name: "Ada Lovelace", sub: ORCID }, account: orcidAccount, trigger: "signIn" });
}

function gatekeeperError(status: number) {
    return new AxiosError("gatekeeper", "ERR", undefined, {}, {
        status, data: { detail: "x" }, statusText: "", headers: {}, config: { headers: new AxiosHeaders() },
    } as any);
}

function account(overrides: Record<string, unknown> = {}) {
    return {
        id: "u1",
        name: "Ada Lovelace",
        email: "ada@usp.br",
        email_verified_at: "2026-10-01T12:00:00Z",
        tenancies: [TENANCY],
        providers: [{ name: "orcid", reference: ORCID }],
        ...overrides,
    } as any;
}

beforeEach(() => {
    jest.mocked(claimInvitations).mockResolvedValue({ accepted: [] } as any);
    jest.mocked(fetchOrcidPublicEmail).mockResolvedValue(undefined);
});

describe("signing in with ORCID", () => {
    test("an account with a confirmed email signs in as before", async () => {
        jest.mocked(getUserByProviderID).mockResolvedValue(account());

        const token = await signInWithOrcid();

        expect(token).toEqual({
            name: "Ada Lovelace",
            sub: ORCID,
            accessToken: "orcid-access-token",
            uid: "u1",
            tenancies: [TENANCY],
            v: TOKEN_VERSION,
        });
        expect(getUserByProviderID).toHaveBeenCalledWith({ providerName: "orcid", providerID: ORCID });
        expect(claimInvitations).toHaveBeenCalledWith("u1");
    });

    test("an account with a placeholder email is pending, pre-filled from ORCID's public email", async () => {
        jest.mocked(getUserByProviderID).mockResolvedValue(account({ email: `${ORCID}@fake.mail.com`, email_verified_at: null }));
        jest.mocked(fetchOrcidPublicEmail).mockResolvedValue("ada.public@example.org");

        const token = await signInWithOrcid();

        expect(token.uid).toBeUndefined();
        expect(token.tenancies).toBeUndefined();
        expect(token.pending).toEqual({ orcid: ORCID, name: "Ada Lovelace", emailHint: "ada.public@example.org" });
        expect(token.v).toBe(TOKEN_VERSION);
        expect(fetchOrcidPublicEmail).toHaveBeenCalledWith(ORCID, "orcid-access-token");
        expect(claimInvitations).not.toHaveBeenCalled();
    });

    test("an account with a real but unconfirmed email is pending, pre-filled with that email", async () => {
        jest.mocked(getUserByProviderID).mockResolvedValue(account({ email: "ada@usp.br", email_verified_at: null }));

        const token = await signInWithOrcid();

        expect(token.uid).toBeUndefined();
        expect(token.pending).toEqual({ orcid: ORCID, name: "Ada Lovelace", emailHint: "ada@usp.br" });
        expect(fetchOrcidPublicEmail).not.toHaveBeenCalled();
    });

    test("an ORCID iD with no account is pending and no account is created", async () => {
        jest.mocked(getUserByProviderID).mockRejectedValue(gatekeeperError(404));
        jest.mocked(fetchOrcidPublicEmail).mockResolvedValue("ada.public@example.org");

        const token = await signInWithOrcid();

        expect(token.pending).toEqual({ orcid: ORCID, name: "Ada Lovelace", emailHint: "ada.public@example.org" });
        expect(createUser).not.toHaveBeenCalled();
    });

    test("without any email to suggest, the hint is left out", async () => {
        jest.mocked(getUserByProviderID).mockRejectedValue(gatekeeperError(404));

        const token = await signInWithOrcid();

        expect(token.pending).toEqual({ orcid: ORCID, name: "Ada Lovelace" });
        expect("emailHint" in token.pending).toBe(false);
    });

    test("a gatekeeper failure fails the sign-in instead of guessing", async () => {
        jest.mocked(getUserByProviderID).mockRejectedValue(gatekeeperError(503));

        await expect(signInWithOrcid()).rejects.toBeTruthy();
    });
});

describe("the session a browser sees", () => {
    const session = (token: Record<string, unknown>): Promise<any> => authOptions.callbacks.session({
        session: { user: { name: "Ada Lovelace" }, expires: "2026-11-01T00:00:00.000Z" },
        token,
    } as any);

    test("a pending session says so and carries the hint, with no user id and no ORCID iD", async () => {
        const result = await session({ pending: { orcid: ORCID, name: "Ada Lovelace", emailHint: "ada@usp.br" }, v: TOKEN_VERSION });

        expect(result.user).toEqual({ name: "Ada Lovelace", pending: true, emailHint: "ada@usp.br" });
        expect(JSON.stringify(result)).not.toContain(ORCID);
    });

    test("a signed-in session is not pending", async () => {
        const result = await session({ uid: "u1", tenancies: [TENANCY], v: TOKEN_VERSION });

        expect(result.user).toEqual({ name: "Ada Lovelace", uid: "u1", tenancies: [TENANCY], pending: false });
    });
});
```

- [ ] **Step 2: Run it and watch it fail**

Run: `npx jest --coverage=false lib/__tests__/orcidPendingSignIn.test.ts`
Expected: FAIL — the confirmed-account test fails on `getUserByProviderID` being called with the old `CreateUserRequest`-shaped object; the pending tests fail with `createUser` called / `token.pending` undefined; the session tests fail on missing `pending`.

- [ ] **Step 3: Implement**

In `pages/api/auth/[...nextauth].ts` (PR 2 already imports `JWT` from `next-auth/jwt`; do not import it again):

1. Replace PR 2's line

```ts
import NextAuth, { AuthOptions, User } from "next-auth";
```

with

```ts
import NextAuth, { Account, AuthOptions, User } from "next-auth";
```

and, immediately after the import of `lib/sessionToken` added in Task 2, insert:

```ts
import { fetchOrcidPublicEmail, isPlaceholderEmail } from "../../../lib/orcidEmail";
```

2. Replace the first line of PR 2's sign-in block:

```ts
      if (trigger == "signIn") {
        if (account?.provider == "credentials") {
```

with:

```ts
      if (trigger == "signIn" && account?.provider == "orcid") {
        token = await signInWithOrcid(token, account as Account);
      } else if (trigger == "signIn") {
        if (account?.provider == "credentials") {
```

The ORCID branch claims invitations itself, and only for a verified account; PR 2's `await claimPendingInvitations(token.uid as string);` stays inside the `else if` and keeps serving password and GitHub sign-ins.

3. Replace the existing line:

```ts
        session.user.tenancies = token.tenancies
```

with:

```ts
        session.user.tenancies = token.tenancies
        session.user.pending = Boolean(token.pending)
        if (token.pending?.emailHint) {
          session.user.emailHint = token.pending.emailHint
        }
```

4. In `getUserByProviderAuthentication`, delete the ORCID branch (ORCID never reaches this function any more, so it can never call `createUser`):

```ts
  } else if (account.provider == "orcid") {
    params = {
      providerName: account.provider,
      providerID: account.orcid,
      personName: token.name,
      userName: account.orcid,
      email: token.email
    };
```

so that, after PR 2 removed the `credentials` branch, the `github` branch is followed directly by `  } else {` / `throw new Error("Invalid provider authentication: " + account.provider);`.

5. Immediately after the closing `}` of `export async function claimPendingInvitations(...)`, insert:

```ts

async function findUserByOrcid(orcid: string): Promise<GetUserByProviderResponse | null> {
  try {
    return await getUserByProviderID({ providerName: "orcid", providerID: orcid });
  } catch (error) {
    if (axios.isAxiosError(error) && error.response?.status === 404) {
      return null;
    }
    throw error;
  }
}

async function emailHintFor(user: GetUserByProviderResponse | null, orcid: string, accessToken?: string): Promise<string | undefined> {
  if (user && !isPlaceholderEmail(user.email)) {
    return user.email;
  }
  return fetchOrcidPublicEmail(orcid, accessToken);
}

export async function signInWithOrcid(token: JWT, account: Account): Promise<JWT> {
  const orcid = account.orcid as string;
  const user = await findUserByOrcid(orcid);

  if (user?.email_verified_at) {
    token = hydrateWithUserInfo(token, user);
    delete token.pending;
    await claimPendingInvitations(user.id);
    return token;
  }

  delete token.uid;
  delete token.tenancies;
  const emailHint = await emailHintFor(user, orcid, account.access_token);
  token.pending = {
    orcid,
    name: (token.name as string) || user?.name || orcid,
    ...(emailHint ? { emailHint } : {}),
  };
  return token;
}
```

- [ ] **Step 4: Run it and watch it pass**

Run: `npx jest --coverage=false lib/__tests__/orcidPendingSignIn.test.ts lib/__tests__/sessionTokenVersion.test.ts lib/__tests__/passwordSignIn.test.ts "pages/api/auth/__tests__"`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add "pages/api/auth/[...nextauth].ts" lib/__tests__/orcidPendingSignIn.test.ts
git commit -m "$(cat <<'EOF'
feat: an ORCID sign-in without a confirmed email is pending

The token carries pending {orcid, name, emailHint} and no uid until the
email is confirmed; ORCID no longer creates accounts with placeholder
emails.

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 4: `update()` finishes a pending sign-in

**Files:**
- Modify: `pages/api/auth/[...nextauth].ts`
- Test: `lib/__tests__/orcidPendingSignIn.test.ts` (append)

**Interfaces:**
- Consumes: `findUserByOrcid`, `hydrateWithUserInfo`, `claimPendingInvitations`, `logError(message, error)`.
- Produces: `export async function refreshPendingSignIn(token: JWT): Promise<JWT>`; the `jwt` callback runs it on `trigger === "update"` when `token.pending` is set, ignoring anything the browser sent.

- [ ] **Step 1: Write the failing test**

Append to `lib/__tests__/orcidPendingSignIn.test.ts`:

```ts
describe("refreshing a pending session after the code was confirmed", () => {
    const pendingToken = () => ({
        name: "Ada Lovelace",
        pending: { orcid: ORCID, name: "Ada Lovelace", emailHint: "ada@usp.br" },
        v: TOKEN_VERSION,
    });

    test("signs in once the account has a confirmed email, looking up the ORCID iD from the token, never the browser", async () => {
        jest.mocked(getUserByProviderID).mockResolvedValue(account());

        const token = await jwt({
            token: pendingToken(),
            trigger: "update",
            session: { pending: { orcid: "9999-9999-9999-9999" }, uid: "someone-else" },
        });

        expect(getUserByProviderID).toHaveBeenCalledWith({ providerName: "orcid", providerID: ORCID });
        expect(token).toEqual({ name: "Ada Lovelace", uid: "u1", tenancies: [TENANCY], v: TOKEN_VERSION });
        expect(claimInvitations).toHaveBeenCalledWith("u1");
    });

    test("stays pending while the email is still unconfirmed", async () => {
        jest.mocked(getUserByProviderID).mockResolvedValue(account({ email_verified_at: null }));

        expect(await jwt({ token: pendingToken(), trigger: "update" })).toEqual(pendingToken());
        expect(claimInvitations).not.toHaveBeenCalled();
    });

    test("stays pending while there is still no account", async () => {
        jest.mocked(getUserByProviderID).mockRejectedValue(gatekeeperError(404));

        expect(await jwt({ token: pendingToken(), trigger: "update" })).toEqual(pendingToken());
    });

    test("a gatekeeper failure keeps the pending session instead of signing out", async () => {
        jest.mocked(getUserByProviderID).mockRejectedValue(gatekeeperError(503));
        const original = process.stdout.write;
        // @ts-ignore
        process.stdout.write = () => true;
        try {
            expect(await jwt({ token: pendingToken(), trigger: "update" })).toEqual(pendingToken());
        } finally {
            process.stdout.write = original;
        }
    });
});
```

- [ ] **Step 2: Run it and watch it fail**

Run: `npx jest --coverage=false lib/__tests__/orcidPendingSignIn.test.ts -t "refreshing a pending session"`
Expected: FAIL — "signs in once the account has a confirmed email" fails: `getUserByProviderID` was not called and `token.uid` is undefined (the `update` branch only runs for `token.uid`).

- [ ] **Step 3: Implement**

In `pages/api/auth/[...nextauth].ts`:

1. Replace the existing line:

```ts
      } else if (trigger == "update" && token.uid) {
```

with:

```ts
      } else if (trigger == "update" && token.pending) {
        token = await refreshPendingSignIn(token);
      } else if (trigger == "update" && token.uid) {
```

2. Immediately after the closing `}` of `signInWithOrcid` (Task 3), insert:

```ts

export async function refreshPendingSignIn(token: JWT): Promise<JWT> {
  let user: GetUserByProviderResponse | null;
  try {
    user = await findUserByOrcid(token.pending.orcid);
  } catch (error) {
    logError("failed to refresh a pending sign-in", error);
    return token;
  }

  if (!user?.email_verified_at) {
    return token;
  }

  token = hydrateWithUserInfo(token, user);
  delete token.pending;
  await claimPendingInvitations(user.id);
  return token;
}
```

- [ ] **Step 4: Run it and watch it pass**

Run: `npx jest --coverage=false lib/__tests__/orcidPendingSignIn.test.ts lib/__tests__/sessionTokenVersion.test.ts lib/__tests__/passwordSignIn.test.ts "pages/api/auth/__tests__"`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add "pages/api/auth/[...nextauth].ts" lib/__tests__/orcidPendingSignIn.test.ts
git commit -m "$(cat <<'EOF'
feat: update() completes a pending ORCID sign-in

The jwt callback re-reads the ORCID iD already in the token, never one
sent by the browser, and hydrates once the email is confirmed.

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 5: The BFF requires a user id; pending tokens get their own chain

**Files:**
- Modify: `lib/middlewareChain.ts`
- Modify: `lib/__tests__/middlewareChain.test.ts`
- Modify: `lib/__tests__/embargoRoutes.test.ts`, `lib/__tests__/membersAccessRoute.test.ts`, `lib/__tests__/shareRoutes.test.ts`, `lib/__tests__/accountRoutes.test.ts` (PR 2)

**Interfaces:**
- Consumes: `getToken({ req })`, `TOKEN_VERSION`.
- Produces: `auth` step requires `token.uid` and `token.v === TOKEN_VERSION` (PR 2's `publicChain` is untouched); `export const pendingOnlyChain`, declared next to `publicChain`, = `requestLogging` + a step requiring `token.pending`, no `token.uid`, and `token.v === TOKEN_VERSION`; 401 `"401 Unauthorized"` otherwise.

The version check here is defence in depth: `getToken` decodes the cookie without running the `jwt` callback, so between deploy and the browser's next `/api/auth/session` call an old cookie would still pass the BFF.

- [ ] **Step 1: Write the failing test**

In `lib/__tests__/middlewareChain.test.ts`:

1. Replace PR 2's line `import middlewareChain, { authOnlyChain, publicChain } from "../middlewareChain";` with:

```ts
import middlewareChain, { authOnlyChain, pendingOnlyChain, publicChain } from "../middlewareChain";
import { TOKEN_VERSION } from "../sessionToken";
```

2. Replace every `mockGetToken.mockResolvedValue({ uid: "u1" } as any);` with `mockGetToken.mockResolvedValue({ uid: "u1", v: TOKEN_VERSION } as any);` (three occurrences; PR 2's public-chain test mocks `null` and stays as it is).

3. Append at the end of the file:

```ts
describe("a token without a user id", () => {
    const pending = { pending: { orcid: "0000-0001-2345-6789", name: "Ada Lovelace" }, v: TOKEN_VERSION };

    test("a pending sign-in reaches neither chain that talks to the gatekeeper as a user", async () => {
        mockGetToken.mockResolvedValue(pending as any);

        expect((await call(authOnlyChain)).statusCode).toBe(401);
        expect((await call(middlewareChain, { [TENANCY_STORAGE_NAME]: "{}" })).statusCode).toBe(401);
    });

    test("a token from before the version is refused even with a user id", async () => {
        mockGetToken.mockResolvedValue({ uid: "u1" } as any);

        expect((await call(authOnlyChain)).statusCode).toBe(401);
    });
});

describe("the pending chain", () => {
    test("lets a pending sign-in through", async () => {
        mockGetToken.mockResolvedValue({ pending: { orcid: "0000-0001-2345-6789", name: "Ada Lovelace" }, v: TOKEN_VERSION } as any);

        expect((await call(pendingOnlyChain)).statusCode).toBe(200);
    });

    test("refuses a signed-in user", async () => {
        mockGetToken.mockResolvedValue({ uid: "u1", v: TOKEN_VERSION } as any);

        expect((await call(pendingOnlyChain)).statusCode).toBe(401);
    });

    test("refuses a token that somehow has both", async () => {
        mockGetToken.mockResolvedValue({ uid: "u1", pending: { orcid: "0000-0001-2345-6789", name: "Ada" }, v: TOKEN_VERSION } as any);

        expect((await call(pendingOnlyChain)).statusCode).toBe(401);
    });

    test("refuses an anonymous request and a stale pending token", async () => {
        mockGetToken.mockResolvedValue(null);
        expect((await call(pendingOnlyChain)).statusCode).toBe(401);

        mockGetToken.mockResolvedValue({ pending: { orcid: "0000-0001-2345-6789", name: "Ada" } } as any);
        expect((await call(pendingOnlyChain)).statusCode).toBe(401);
    });

    test("the public chain still lets a pending sign-in through, as it does anyone", async () => {
        mockGetToken.mockResolvedValue({ pending: { orcid: "0000-0001-2345-6789", name: "Ada" }, v: TOKEN_VERSION } as any);

        expect((await call(publicChain)).statusCode).toBe(200);
    });
});
```

- [ ] **Step 2: Run it and watch it fail**

Run: `npx jest --coverage=false lib/__tests__/middlewareChain.test.ts`
Expected: FAIL — the file does not compile: `Module '"../middlewareChain"' has no exported member 'pendingOnlyChain'`.

- [ ] **Step 3: Implement**

In `lib/middlewareChain.ts`:

1. After `import { requestLogging } from "./requestLogging";` insert:

```ts
import { TOKEN_VERSION } from "./sessionToken";
```

2. Immediately after PR 2's line `export const publicChain = createRouter<NextApiRequest, NextApiResponse>().use(requestLogging);` insert:

```ts

// Email-verification routes: an ORCID sign-in that has no account, or no confirmed email, yet.
export const pendingOnlyChain = createRouter<NextApiRequest, NextApiResponse>().use(requestLogging, pendingOnly);
```

3. Replace the `auth` function:

```ts
async function auth(req: NextApiRequest, res: NextApiResponse, next: any) {
    const token = await getToken({ req })
    if (!token) {
        res.status(401).end("401 Unauthorized");
    } else {
        await next(); // call next in chain
    }
}
```

with:

```ts
async function auth(req: NextApiRequest, res: NextApiResponse, next: any) {
    const token = await getToken({ req })
    if (!token?.uid || token.v !== TOKEN_VERSION) {
        res.status(401).end("401 Unauthorized");
    } else {
        await next();
    }
}

async function pendingOnly(req: NextApiRequest, res: NextApiResponse, next: any) {
    const token = await getToken({ req })
    if (!token?.pending || token.uid || token.v !== TOKEN_VERSION) {
        res.status(401).end("401 Unauthorized");
    } else {
        await next();
    }
}
```

- [ ] **Step 4: Bring the route tests' tokens up to the version**

Every test whose route goes through `middlewareChain`, `authOnlyChain` or `bffRouter` with a signed-in token now needs `v: 2`. `telemetryRoute.test.ts` reads `getToken` directly and is left alone.

```bash
sed -i '' 's/getToken: jest.fn(async () => ({ uid: "u1" }))/getToken: jest.fn(async () => ({ uid: "u1", v: 2 }))/' \
  lib/__tests__/embargoRoutes.test.ts \
  lib/__tests__/membersAccessRoute.test.ts \
  lib/__tests__/shareRoutes.test.ts
sed -i '' 's/jest.mocked(getToken).mockResolvedValue({ uid: "u1" } as any);/jest.mocked(getToken).mockResolvedValue({ uid: "u1", v: 2 } as any);/' \
  lib/__tests__/accountRoutes.test.ts
grep -rn 'uid: "u1" }' lib/__tests__/embargoRoutes.test.ts lib/__tests__/membersAccessRoute.test.ts lib/__tests__/shareRoutes.test.ts lib/__tests__/accountRoutes.test.ts
```

Expected: the final `grep` prints nothing (both `PUT /api/account/password` tests in `accountRoutes.test.ts` now carry `v: 2`).

- [ ] **Step 5: Run it and watch it pass**

Run: `npx jest --coverage=false lib/__tests__/middlewareChain.test.ts lib/__tests__/embargoRoutes.test.ts lib/__tests__/membersAccessRoute.test.ts lib/__tests__/shareRoutes.test.ts lib/__tests__/accountRoutes.test.ts`
Expected: PASS.

Then run the whole suite to catch any other chained route test: `npx jest --coverage=false`
Expected: PASS. A failure with status 401 in a route test means its mocked token needs `v: 2`.

- [ ] **Step 6: Commit**

```bash
git add lib/middlewareChain.ts lib/__tests__/middlewareChain.test.ts lib/__tests__/embargoRoutes.test.ts lib/__tests__/membersAccessRoute.test.ts lib/__tests__/shareRoutes.test.ts lib/__tests__/accountRoutes.test.ts
git commit -m "$(cat <<'EOF'
feat: the BFF requires a user id and the current token version

A pending ORCID sign-in has no uid and would otherwise reach the
gatekeeper with an empty X-User-Id. pendingOnlyChain admits only
pending tokens, for the email-verification routes.

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 6: Gatekeeper calls for email verification

**Files:**
- Modify: `lib/account.ts`
- Test: `lib/__tests__/accountEmailVerification.test.ts`

**Interfaces:**
- Consumes: `axiosInstance` (default export of `lib/rpc.ts`, already imported by PR 2's `lib/account.ts`).
- Produces (contract):
  - `requestEmailVerification(input: { orcid: string; email: string; name: string }): Promise<{ challengeId: string }>`
  - `confirmEmailVerification(challengeId: string, code: string): Promise<{ userId: string }>`
  Both reject with the Axios error on non-2xx.

- [ ] **Step 1: Write the failing test**

Create `lib/__tests__/accountEmailVerification.test.ts`:

```ts
jest.mock("../rpc");

import { AxiosError, AxiosHeaders } from "axios";
import { confirmEmailVerification, requestEmailVerification } from "../account";
import axiosInstance from "../rpc";

const ORCID = "0000-0001-2345-6789";
const mockPost = jest.mocked(axiosInstance.post);

describe("email verification calls", () => {
    test("asks the gatekeeper for a code, in snake_case", async () => {
        mockPost.mockResolvedValue({ status: 202, data: { challenge_id: "c1" } });

        expect(await requestEmailVerification({ orcid: ORCID, email: "ada@usp.br", name: "Ada Lovelace" }))
            .toEqual({ challengeId: "c1" });
        expect(mockPost).toHaveBeenCalledWith("/auth/email-verifications", { orcid: ORCID, email: "ada@usp.br", name: "Ada Lovelace" });
    });

    test("confirms the code against the challenge", async () => {
        mockPost.mockResolvedValue({ status: 200, data: { user_id: "u1" } });

        expect(await confirmEmailVerification("c1", "123456")).toEqual({ userId: "u1" });
        expect(mockPost).toHaveBeenCalledWith("/auth/email-verifications/c1/confirm", { code: "123456" });
    });

    test("a refusal reaches the caller as the Axios error", async () => {
        const conflict = new AxiosError("conflict", "ERR", undefined, {}, {
            status: 409, data: { detail: "email_belongs_to_another_account" }, statusText: "", headers: {}, config: { headers: new AxiosHeaders() },
        } as any);
        mockPost.mockRejectedValue(conflict);

        await expect(confirmEmailVerification("c1", "123456")).rejects.toBe(conflict);
    });
});
```

- [ ] **Step 2: Run it and watch it fail**

Run: `npx jest --coverage=false lib/__tests__/accountEmailVerification.test.ts`
Expected: FAIL — `Module '"../account"' has no exported member 'requestEmailVerification'` (and `confirmEmailVerification`).

- [ ] **Step 3: Implement**

Append to the end of `lib/account.ts`:

```ts

export async function requestEmailVerification(input: { orcid: string; email: string; name: string }): Promise<{ challengeId: string }> {
    const response = await axiosInstance.post("/auth/email-verifications", {
        orcid: input.orcid,
        email: input.email,
        name: input.name,
    });
    return { challengeId: response.data.challenge_id };
}

export async function confirmEmailVerification(challengeId: string, code: string): Promise<{ userId: string }> {
    const response = await axiosInstance.post(`/auth/email-verifications/${encodeURIComponent(challengeId)}/confirm`, { code });
    return { userId: response.data.user_id };
}
```

- [ ] **Step 4: Run it and watch it pass**

Run: `npx jest --coverage=false lib/__tests__/accountEmailVerification.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add lib/account.ts lib/__tests__/accountEmailVerification.test.ts
git commit -m "$(cat <<'EOF'
feat: gatekeeper calls to request and confirm an email verification

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 7: BFF routes for the pending sign-in

**Files:**
- Modify: `lib/accountRoute.ts`
- Create: `pages/api/account/email-verifications/index.ts`
- Create: `pages/api/account/email-verifications/[challengeId]/confirm.ts`
- Test: `lib/__tests__/emailVerificationRoutes.test.ts`

**Interfaces:**
- Consumes: `pendingOnlyChain` (Task 5); PR 2's `accountHandler(router)` from `lib/accountRoute.ts` (gatekeeper status and `{detail}` unchanged, `500 {detail: "unavailable"}` without a response, `405` on another verb); `requestEmailVerification`, `confirmEmailVerification` (Task 6); `getToken`.
- Produces:
  - `pendingAccountRouter(): NodeRouter<NextApiRequest, NextApiResponse>` in `lib/accountRoute.ts`, next to `publicAccountRouter()`.
  - `POST /api/account/email-verifications` body `{email}` → `202 {challengeId}`
  - `POST /api/account/email-verifications/[challengeId]/confirm` body `{code}` → `204`

- [ ] **Step 1: Write the failing test**

Create `lib/__tests__/emailVerificationRoutes.test.ts`:

```ts
jest.mock("next-auth/jwt", () => ({ getToken: jest.fn() }));
jest.mock("../account");

import { AxiosError, AxiosHeaders } from "axios";
import { getToken } from "next-auth/jwt";
import confirmHandler from "../../pages/api/account/email-verifications/[challengeId]/confirm";
import requestHandler from "../../pages/api/account/email-verifications/index";
import { confirmEmailVerification, requestEmailVerification } from "../account";

const ORCID = "0000-0001-2345-6789";
const pendingToken = { pending: { orcid: ORCID, name: "Ada Lovelace" }, v: 2 };

function gatekeeperError(status: number, detail: string) {
    return new AxiosError("gatekeeper", "ERR", undefined, {}, {
        status, data: { detail }, statusText: "", headers: {}, config: { headers: new AxiosHeaders() },
    } as any);
}

function fakeRes() {
    const res: any = { statusCode: 200, headers: {} };
    res.setHeader = jest.fn((key: string, value: string) => (res.headers[key] = value));
    res.getHeader = jest.fn((key: string) => res.headers[key]);
    res.status = jest.fn((code: number) => {
        res.statusCode = code;
        return res;
    });
    res.end = jest.fn(() => res);
    res.json = jest.fn(() => res);
    return res;
}

async function send(handler: any, method: string, query: Record<string, string>, body: unknown = undefined) {
    const res = fakeRes();
    const original = process.stdout.write;
    // @ts-ignore
    process.stdout.write = () => true;
    try {
        await handler({ method, url: "/api/account/email-verifications", headers: {}, cookies: {}, query, body } as any, res);
    } finally {
        process.stdout.write = original;
    }
    return res;
}

beforeEach(() => {
    jest.mocked(getToken).mockResolvedValue(pendingToken as any);
});

describe("POST /api/account/email-verifications", () => {
    test("takes the ORCID iD and name from the session and only the email from the browser", async () => {
        jest.mocked(requestEmailVerification).mockResolvedValue({ challengeId: "c1" });

        const res = await send(requestHandler, "POST", {}, { email: " ada@usp.br ", orcid: "9999-9999-9999-9999", name: "Mallory" });

        expect(res.statusCode).toBe(202);
        expect(res.json).toHaveBeenCalledWith({ challengeId: "c1" });
        expect(requestEmailVerification).toHaveBeenCalledWith({ orcid: ORCID, name: "Ada Lovelace", email: "ada@usp.br" });
    });

    test.each`
        detail
        ${"invalid_email"}
        ${"invalid_name"}
        ${"invalid_orcid"}
    `("a gatekeeper validation error ($detail) keeps its 400 and code", async ({ detail }) => {
        jest.mocked(requestEmailVerification).mockRejectedValue(gatekeeperError(400, detail));

        const res = await send(requestHandler, "POST", {}, { email: "ada@usp.br" });

        expect(res.statusCode).toBe(400);
        expect(res.json).toHaveBeenCalledWith({ detail });
    });

    test("a signed-in user cannot use it", async () => {
        jest.mocked(getToken).mockResolvedValue({ uid: "u1", v: 2 } as any);

        const res = await send(requestHandler, "POST", {}, { email: "ada@usp.br" });

        expect(res.statusCode).toBe(401);
        expect(requestEmailVerification).not.toHaveBeenCalled();
    });

    test("nor can an anonymous visitor", async () => {
        jest.mocked(getToken).mockResolvedValue(null);

        expect((await send(requestHandler, "POST", {}, { email: "ada@usp.br" })).statusCode).toBe(401);
    });

    test("only POST", async () => {
        expect((await send(requestHandler, "GET", {})).statusCode).toBe(405);
    });
});

describe("POST /api/account/email-verifications/[challengeId]/confirm", () => {
    test("confirms the code and answers 204", async () => {
        jest.mocked(confirmEmailVerification).mockResolvedValue({ userId: "u1" });

        const res = await send(confirmHandler, "POST", { challengeId: "c1" }, { code: "123456" });

        expect(res.statusCode).toBe(204);
        expect(res.end).toHaveBeenCalled();
        expect(res.json).not.toHaveBeenCalled();
        expect(confirmEmailVerification).toHaveBeenCalledWith("c1", "123456");
    });

    test.each`
        status | detail
        ${409} | ${"email_belongs_to_another_account"}
        ${400} | ${"code_invalid"}
        ${400} | ${"code_expired"}
        ${400} | ${"code_attempts_exceeded"}
        ${404} | ${"challenge_not_found"}
    `("forwards $status $detail unchanged", async ({ status, detail }) => {
        jest.mocked(confirmEmailVerification).mockRejectedValue(gatekeeperError(status, detail));

        const res = await send(confirmHandler, "POST", { challengeId: "c1" }, { code: "123456" });

        expect(res.statusCode).toBe(status);
        expect(res.json).toHaveBeenCalledWith({ detail });
    });

    test("a gatekeeper that does not answer is a 500 with a code", async () => {
        jest.mocked(confirmEmailVerification).mockRejectedValue(new Error("ECONNREFUSED"));

        const res = await send(confirmHandler, "POST", { challengeId: "c1" }, { code: "123456" });

        expect(res.statusCode).toBe(500);
        expect(res.json).toHaveBeenCalledWith({ detail: "unavailable" });
    });

    test("a signed-in user cannot use it", async () => {
        jest.mocked(getToken).mockResolvedValue({ uid: "u1", v: 2 } as any);

        const res = await send(confirmHandler, "POST", { challengeId: "c1" }, { code: "123456" });

        expect(res.statusCode).toBe(401);
        expect(confirmEmailVerification).not.toHaveBeenCalled();
    });
});
```

- [ ] **Step 2: Run it and watch it fail**

Run: `npx jest --coverage=false lib/__tests__/emailVerificationRoutes.test.ts`
Expected: FAIL — `Cannot find module '../../pages/api/account/email-verifications/[challengeId]/confirm'`.

- [ ] **Step 3: Implement**

In `lib/accountRoute.ts`:

1. Replace PR 2's line `import { publicChain } from "./middlewareChain";` with:

```ts
import { pendingOnlyChain, publicChain } from "./middlewareChain";
```

2. Immediately after the closing `}` of `export function publicAccountRouter() { ... }`, insert:

```ts

/** Email verification of an ORCID sign-in that has no account, or no confirmed email, yet. */
export function pendingAccountRouter() {
    return createRouter<NextApiRequest, NextApiResponse>().use(pendingOnlyChain);
}
```

Create `pages/api/account/email-verifications/index.ts`:

```ts
import { getToken } from "next-auth/jwt";
import { requestEmailVerification } from "../../../../lib/account";
import { accountHandler, pendingAccountRouter } from "../../../../lib/accountRoute";

const router = pendingAccountRouter()
    .post(async (req, res) => {
        const { pending } = await getToken({ req });
        const email = typeof req.body?.email === "string" ? req.body.email.trim() : "";
        res.status(202).json(await requestEmailVerification({ orcid: pending.orcid, name: pending.name, email }));
    });

export default accountHandler(router);
```

Create `pages/api/account/email-verifications/[challengeId]/confirm.ts`:

```ts
import { confirmEmailVerification } from "../../../../../lib/account";
import { accountHandler, pendingAccountRouter } from "../../../../../lib/accountRoute";

const router = pendingAccountRouter()
    .post(async (req, res) => {
        await confirmEmailVerification(req.query.challengeId as string, req.body?.code);
        res.status(204).end();
    });

export default accountHandler(router);
```

- [ ] **Step 4: Run it and watch it pass**

Run: `npx jest --coverage=false lib/__tests__/emailVerificationRoutes.test.ts lib/__tests__/accountRoutes.test.ts lib/__tests__/serverLogging.invariant.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add lib/accountRoute.ts pages/api/account/email-verifications lib/__tests__/emailVerificationRoutes.test.ts
git commit -m "$(cat <<'EOF'
feat: BFF routes to confirm the email of a pending ORCID sign-in

The ORCID iD and name come from the token; the browser sends only the
email or the code. Errors go through accountHandler, so the gatekeeper's
status and detail reach the screen unchanged.

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 8: BFFAPI methods

**Files:**
- Modify: `gateways/BFFAPI.ts`
- Test: `gateways/__tests__/BFFAPI.emailVerification.test.ts`

**Interfaces:**
- Consumes: the two BFF routes (Task 7).
- Produces (contract): `requestEmailVerification(email: string): Promise<{ challengeId: string }>`, `confirmEmailVerification(challengeId: string, code: string): Promise<void>`; both reject with the Axios error.

- [ ] **Step 1: Write the failing test**

Create `gateways/__tests__/BFFAPI.emailVerification.test.ts`:

```ts
jest.mock("../../lib/telemetryClient", () => ({ trackUiEvent: jest.fn() }));
jest.mock("axios", () => {
    const actual = jest.requireActual("axios");
    return {
        __esModule: true,
        ...actual,
        default: {
            ...actual.default,
            get: jest.fn(),
            post: jest.fn(),
            put: jest.fn(),
            delete: jest.fn(),
            isAxiosError: actual.default.isAxiosError,
        },
    };
});

import axios, { AxiosError, AxiosHeaders } from "axios";
import { BFFAPI } from "../BFFAPI";

const bff = new BFFAPI();

describe("BFFAPI email verification", () => {
    test("asks for a code for the typed email only", async () => {
        jest.mocked(axios.post).mockResolvedValue({ status: 202, data: { challengeId: "c1" } });

        expect(await bff.requestEmailVerification("ada@usp.br")).toEqual({ challengeId: "c1" });
        expect(axios.post).toHaveBeenCalledWith("/api/account/email-verifications", { email: "ada@usp.br" });
    });

    test("confirms the code against the challenge", async () => {
        jest.mocked(axios.post).mockResolvedValue({ status: 204, data: "" });

        await expect(bff.confirmEmailVerification("c1", "123456")).resolves.toBeUndefined();
        expect(axios.post).toHaveBeenCalledWith("/api/account/email-verifications/c1/confirm", { code: "123456" });
    });

    test("a refusal rejects with the Axios error so the screen can read its detail", async () => {
        const conflict = new AxiosError("conflict", "ERR", undefined, {}, {
            status: 409, data: { detail: "email_belongs_to_another_account" }, statusText: "", headers: {}, config: { headers: new AxiosHeaders() },
        } as any);
        jest.mocked(axios.post).mockRejectedValue(conflict);

        await expect(bff.confirmEmailVerification("c1", "123456")).rejects.toBe(conflict);
    });
});
```

- [ ] **Step 2: Run it and watch it fail**

Run: `npx jest --coverage=false gateways/__tests__/BFFAPI.emailVerification.test.ts`
Expected: FAIL — `Property 'requestEmailVerification' does not exist on type 'BFFAPI'`.

- [ ] **Step 3: Implement**

In `gateways/BFFAPI.ts`, immediately after the closing `}` of PR 2's last method:

```ts
    async changePassword(currentPassword: string, newPassword: string): Promise<void> {
        await axios.put("/api/account/password", { currentPassword, newPassword });
    }
```

(and before the class's final `}`) insert:

```ts

    async requestEmailVerification(email: string): Promise<{ challengeId: string }> {
        const response = await axios.post("/api/account/email-verifications", { email });
        return response.data as { challengeId: string };
    }

    async confirmEmailVerification(challengeId: string, code: string): Promise<void> {
        await axios.post(`/api/account/email-verifications/${encodeURIComponent(challengeId)}/confirm`, { code });
    }
```

- [ ] **Step 4: Run it and watch it pass**

Run: `npx jest --coverage=false gateways/__tests__/BFFAPI.emailVerification.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add gateways/BFFAPI.ts gateways/__tests__/BFFAPI.emailVerification.test.ts
git commit -m "$(cat <<'EOF'
feat: BFFAPI methods for the ORCID email confirmation

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 9: Route a pending session to the confirmation page

**Files:**
- Modify: `contants/InternalRoutesConstants.ts`
- Modify: `lib/authRoutes.ts`
- Modify: `pages/_app.tsx`
- Test: `lib/__tests__/authRoutes.test.ts` (append)

**Interfaces:**
- Produces:
  - `ROUTE_PAGE_CONFIRM_EMAIL = "/account/confirm-email"`
  - `safeReturnPath(value: unknown): string` — the value when it is an internal path, else `"/"`
  - `confirmEmailUrlFor(returnTo?: string): string` — `"/account/confirm-email?callbackUrl=<encoded internal path>"`
  - `pendingSessionRedirect(pending: boolean, pathname: string, asPath: string): string | null`
- `_app.tsx` `Auth`: once `status === "authenticated"`, a pending session on any `auth` page other than confirm-email goes to `confirmEmailUrlFor(router.asPath)`; a non-pending session on confirm-email goes to `ROUTE_PAGE_HOME`; while a redirect is due, the page's `loading` element is shown.

- [ ] **Step 1: Write the failing test**

Append to `lib/__tests__/authRoutes.test.ts`:

```ts
import { confirmEmailUrlFor, pendingSessionRedirect, safeReturnPath } from "../authRoutes";
import { ROUTE_PAGE_CONFIRM_EMAIL } from "../../contants/InternalRoutesConstants";

test("the confirmation page lives at /account/confirm-email", () => {
  expect(ROUTE_PAGE_CONFIRM_EMAIL).toBe("/account/confirm-email");
});

test("the confirmation page remembers where the person was going", () => {
  expect(confirmEmailUrlFor("/app/datasets/80f230be?tab=settings"))
    .toBe("/account/confirm-email?callbackUrl=%2Fapp%2Fdatasets%2F80f230be%3Ftab%3Dsettings");
});

test.each`
  value
  ${"https://evil.example/app"}
  ${"//evil.example/app"}
  ${""}
  ${undefined}
  ${["/app/home", "/app/datasets"]}
`("a return path that is not internal becomes the home page ($value)", ({ value }) => {
  expect(safeReturnPath(value)).toBe("/");
  expect(confirmEmailUrlFor(value)).toBe("/account/confirm-email?callbackUrl=%2F");
});

test("an internal return path is kept", () => {
  expect(safeReturnPath("/invitations/tok")).toBe("/invitations/tok");
});

test("a pending session on an app page is sent to confirm its email", () => {
  expect(pendingSessionRedirect(true, "/app/datasets/[datasetId]", "/app/datasets/d1"))
    .toBe("/account/confirm-email?callbackUrl=%2Fapp%2Fdatasets%2Fd1");
});

test("a pending session on the confirmation page stays there", () => {
  expect(pendingSessionRedirect(true, "/account/confirm-email", "/account/confirm-email?callbackUrl=%2F")).toBeNull();
});

test("a signed-in session has nothing to confirm", () => {
  expect(pendingSessionRedirect(false, "/account/confirm-email", "/account/confirm-email")).toBe("/app/home");
  expect(pendingSessionRedirect(false, "/app/home", "/app/home")).toBeNull();
});

test("on the login page, a pending session goes to confirm with the login's own callbackUrl", () => {
  expect(pendingSessionRedirect(true, "/account/login", "/invitations/tok"))
    .toBe("/account/confirm-email?callbackUrl=%2Finvitations%2Ftok");
  expect(pendingSessionRedirect(false, "/account/login", "/invitations/tok")).toBeNull();
});
```

- [ ] **Step 2: Run it and watch it fail**

Run: `npx jest --coverage=false lib/__tests__/authRoutes.test.ts`
Expected: FAIL — `Module '"../authRoutes"' has no exported member 'confirmEmailUrlFor'` (and the other two names).

- [ ] **Step 3: Implement**

In `contants/InternalRoutesConstants.ts`, immediately after PR 2's line `export const ROUTE_PAGE_RESET_PASSWORD = (token: string) => "/account/reset-password/" + token;` insert:

```ts

/**
 * Route to the email confirmation of a pending ORCID sign-in.
 * @constant
 */
export const ROUTE_PAGE_CONFIRM_EMAIL = '/account/confirm-email';
```

In `lib/authRoutes.ts`:

1. Add as the first line of the file:

```ts
import { ROUTE_PAGE_CONFIRM_EMAIL, ROUTE_PAGE_HOME } from "../contants/InternalRoutesConstants";

```

2. Append to the end of the file (after PR 2's `loginPhaseFor`):

```ts

/** The value when it is an internal path, so a query parameter cannot be used as an open redirect. */
export function safeReturnPath(value: unknown): string {
    return typeof value === "string" && isInternalPath(value) ? value : "/";
}

export function confirmEmailUrlFor(returnTo?: string): string {
    return `${ROUTE_PAGE_CONFIRM_EMAIL}?callbackUrl=${encodeURIComponent(safeReturnPath(returnTo))}`;
}

export function pendingSessionRedirect(pending: boolean, pathname: string, asPath: string): string | null {
    const onConfirmPage = pathname === ROUTE_PAGE_CONFIRM_EMAIL;
    if (pending && !onConfirmPage) {
        return confirmEmailUrlFor(asPath);
    }
    if (!pending && onConfirmPage) {
        return ROUTE_PAGE_HOME;
    }
    return null;
}
```

In `pages/_app.tsx`:

1. Replace the line `import { loginUrlFor } from "../lib/authRoutes";` with:

```ts
import { loginUrlFor, pendingSessionRedirect } from "../lib/authRoutes";
```

2. Replace the whole `Auth` function (from `function Auth({ authContext, children }) {` to the end of the file) with:

```tsx
function Auth({ authContext, children }) {
  const { data: session } = useSession();
  const setTenancySelected = useTenancyStore((state) => state.setTenancySelected)
  const isTenancySelected = useTenancyStore((state) => state.isTenancySelected)

  const router = useRouter();

  // if `{ required: true }` is supplied, `status` can only be "loading" or "authenticated"
  const { status } = useSession({
    required: true,
    onUnauthenticated() {
      Router.replace(loginUrlFor(router.asPath));
    },
  })

  const redirectTo = status === "authenticated"
    ? pendingSessionRedirect(session?.user?.pending === true, router.pathname, router.asPath)
    : null;

  useEffect(() => {
    if (redirectTo) {
      Router.replace(redirectTo);
    }
  }, [redirectTo]);

  if (status === "loading" || redirectTo) {
    return authContext.loading
  }

  // Set the default tenancy if the user have only one, after the login.
  if (!isTenancySelected() && session?.user?.tenancies?.length == 1) {
    setTenancySelected(session.user.tenancies[0]);
  }

  return children
}
```

- [ ] **Step 4: Run it and watch it pass**

Run: `npx jest --coverage=false lib/__tests__/authRoutes.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add contants/InternalRoutesConstants.ts lib/authRoutes.ts pages/_app.tsx lib/__tests__/authRoutes.test.ts
git commit -m "$(cat <<'EOF'
feat: a pending session is sent to confirm its email

Every auth-gated page sends a pending ORCID session to
/account/confirm-email, keeping where it was going; the confirmation
page sends anyone else home.

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 10: A pending session that reaches the login page goes to confirm its email

**Files:**
- Modify: `pages/account/login/index.tsx`

**Interfaces:**
- Consumes: `pendingSessionRedirect(pending, pathname, asPath)` (Task 9, including its login-page test), `useSession`, PR 2's login page (`const callbackUrl = decodeURIComponent(props.callbackUrl || "/");`).
- Produces: on `/account/login`, a pending session is replaced with `/account/confirm-email?callbackUrl=<the login's callbackUrl>`; any other visitor sees the page as before.

Why: the login page is not `auth`-gated, so `_app.tsx` does not route it. Several pages send a session without `uid` to login: the invitation page (server-rendered; `invitationAccount` needs `uid`), the DOI landing's "Sign in", a bookmarked login URL. A person invited by email who signs in with ORCID for the first time is pending, so ORCID returns them to `/invitations/<token>`, which sends them to `/account/login?callbackUrl=%2Finvitations%2F<token>`; without this redirect they would pick ORCID again and go round in a circle. With it they confirm their email and come back to the invitation, which the confirmed account then claims in the `jwt` callback. The decision is the pure function tested in Task 9; the page only wires it, so it is covered by `npm run build` and manual checks 8 and 9 in Task 14.

- [ ] **Step 1: Implement**

In `pages/account/login/index.tsx`:

1. Replace PR 2's import lines

```tsx
import { signIn } from "next-auth/react";
```

```tsx
import Router from "next/router";
```

```tsx
import { loginPhaseFor, loginTabFor } from "../../../lib/authRoutes";
```

with, respectively,

```tsx
import { signIn, useSession } from "next-auth/react";
```

```tsx
import Router, { useRouter } from "next/router";
import { useEffect } from "react";
```

```tsx
import { loginPhaseFor, loginTabFor, pendingSessionRedirect } from "../../../lib/authRoutes";
```

2. Replace PR 2's first line of `LoginPage`

```tsx
  const callbackUrl = decodeURIComponent(props.callbackUrl || "/");
```

with

```tsx
  const callbackUrl = decodeURIComponent(props.callbackUrl || "/");
  const router = useRouter();
  const { data: session } = useSession();
  const pendingRedirect = pendingSessionRedirect(session?.user?.pending === true, router.pathname, callbackUrl);

  useEffect(() => {
    if (pendingRedirect) {
      Router.replace(pendingRedirect);
    }
  }, [pendingRedirect]);
```

- [ ] **Step 2: Build**

Run: `npm run build`
Expected: exit code 0; `/account/login` still listed.

- [ ] **Step 3: Commit**

```bash
git add pages/account/login/index.tsx
git commit -m "$(cat <<'EOF'
fix: a pending ORCID sign-in on the login page confirms its email first

The invitation page sends a session without uid to login, and ORCID
sent it straight back: the person went round in a circle.

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 11: `ConfirmEmailForm`

**Files:**
- Create: `components/Account/ConfirmEmailForm.tsx`
- Test: `components/Account/__tests__/ConfirmEmailForm.test.tsx`

**Interfaces:**
- Consumes: `useSession().update`, `signOut`, `Router.replace`, `BFFAPI.requestEmailVerification` / `confirmEmailVerification` / `resendChallenge`, `VerificationCodeForm({ email, onSubmit, onResend })` (PR 2, named export; shows `accountErrorMessage(detail)` for a rejected `onSubmit` and owns the 90 s resend countdown), `ACCOUNT_ERROR_MESSAGES` / `accountErrorMessage(detail?: string): string` (PR 2, already maps `email_belongs_to_another_account` to the exact 409 copy), `emailField` from `lib/accountValidation.ts` (PR 2), `EDIT_FORM_LABEL_CLASS` / `EDIT_FORM_INPUT_CLASS` / `EDIT_FORM_ERROR_CLASS`, `SIGN_OUT_CALLBACK_URL`.
- Produces: `ConfirmEmailForm({ emailHint, callbackUrl }: { emailHint?: string; callbackUrl: string })`.

Behaviour:
- Email step: Formik field "Email" pre-filled with `emailHint`; validated with PR 2's `emailField`; "Send code" → `requestEmailVerification(email)` → code step. A request error shows `accountErrorMessage(detail)` in `role="alert"`.
- Code step: `VerificationCodeForm`; "Use a different email" returns to the email step with the last email typed.
- Confirmed: `await update()` then `Router.replace(callbackUrl)`.
- `409`: back to the email step with `accountErrorMessage("email_belongs_to_another_account")` in `role="alert"`; any other confirm error is re-thrown so `VerificationCodeForm` shows it.
- "Sign out" always available.

- [ ] **Step 1: (no constants to add)**

PR 2 Task 1 already maps `email_belongs_to_another_account`, `invalid_email` ("This email address is not valid."), `invalid_name`, `invalid_password` and `invalid_orcid` in `ACCOUNT_ERROR_MESSAGES`; this task uses them as they are.

- [ ] **Step 2: Write the failing test**

Create `components/Account/__tests__/ConfirmEmailForm.test.tsx`:

```tsx
/**
 * @jest-environment jsdom
 */
import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";

const mockUpdate = jest.fn();
const mockSignOut = jest.fn();
const mockReplace = jest.fn();
const mockBff = {
    requestEmailVerification: jest.fn(),
    confirmEmailVerification: jest.fn(),
    resendChallenge: jest.fn(),
};
let mockCodeFormProps: any = null;

jest.mock("next-auth/react", () => ({
    useSession: () => ({ data: null, status: "authenticated", update: mockUpdate }),
    signOut: (...args: unknown[]) => mockSignOut(...args),
}));

jest.mock("next/router", () => ({
    __esModule: true,
    default: { replace: (...args: unknown[]) => mockReplace(...args) },
}));

jest.mock("../../../gateways/BFFAPI", () => ({
    BFFAPI: function BFFAPI() {
        return mockBff;
    },
}));

jest.mock("../VerificationCodeForm", () => ({
    VerificationCodeForm: (props: any) => {
        mockCodeFormProps = props;
        return require("react").createElement("div", { "data-testid": "code-step" }, props.email);
    },
}));

import { accountErrorMessage } from "../../../contants/AccountConstants";
import { ConfirmEmailForm } from "../ConfirmEmailForm";

const CONFLICT_MESSAGE = "This email belongs to another DataMap account. Contact the DataMap team.";

async function sendCode(email: string) {
    fireEvent.change(screen.getByLabelText("Email"), { target: { value: email } });
    fireEvent.click(screen.getByRole("button", { name: "Send code" }));
    await screen.findByTestId("code-step");
}

beforeEach(() => {
    mockCodeFormProps = null;
    mockUpdate.mockResolvedValue({ user: { uid: "u1", pending: false } });
    mockReplace.mockResolvedValue(true);
    mockBff.requestEmailVerification.mockResolvedValue({ challengeId: "c1" });
});

describe("ConfirmEmailForm", () => {
    test("pre-fills the email with the hint", () => {
        render(<ConfirmEmailForm emailHint="ada@usp.br" callbackUrl="/app/home" />);

        expect((screen.getByLabelText("Email") as HTMLInputElement).value).toBe("ada@usp.br");
    });

    test("starts empty without a hint", () => {
        render(<ConfirmEmailForm callbackUrl="/app/home" />);

        expect((screen.getByLabelText("Email") as HTMLInputElement).value).toBe("");
    });

    test("does not send a code to something that is not an email", async () => {
        render(<ConfirmEmailForm callbackUrl="/app/home" />);

        fireEvent.change(screen.getByLabelText("Email"), { target: { value: "not-an-email" } });
        fireEvent.click(screen.getByRole("button", { name: "Send code" }));

        expect(await screen.findByText("Enter a valid email address.")).toBeTruthy();
        expect(mockBff.requestEmailVerification).not.toHaveBeenCalled();
    });

    test("sends a code to the typed email and asks for it", async () => {
        render(<ConfirmEmailForm emailHint="ada@usp.br" callbackUrl="/app/home" />);

        await sendCode("ada.lovelace@usp.br");

        expect(mockBff.requestEmailVerification).toHaveBeenCalledWith("ada.lovelace@usp.br");
        expect(mockCodeFormProps.email).toBe("ada.lovelace@usp.br");
    });

    test("a confirmed code refreshes the session, then goes where the person was going", async () => {
        mockBff.confirmEmailVerification.mockResolvedValue(undefined);
        render(<ConfirmEmailForm emailHint="ada@usp.br" callbackUrl="/app/datasets/d1" />);
        await sendCode("ada@usp.br");

        await act(async () => {
            await mockCodeFormProps.onSubmit("123456");
        });

        expect(mockBff.confirmEmailVerification).toHaveBeenCalledWith("c1", "123456");
        expect(mockUpdate).toHaveBeenCalledTimes(1);
        expect(mockReplace).toHaveBeenCalledWith("/app/datasets/d1");
        expect(mockUpdate.mock.invocationCallOrder[0]).toBeLessThan(mockReplace.mock.invocationCallOrder[0]);
    });

    test("an email of another account is explained and the person can try another one", async () => {
        mockBff.confirmEmailVerification.mockRejectedValue({ response: { status: 409, data: { detail: "email_belongs_to_another_account" } } });
        render(<ConfirmEmailForm emailHint="ada@usp.br" callbackUrl="/app/home" />);
        await sendCode("ada@usp.br");

        await act(async () => {
            await mockCodeFormProps.onSubmit("123456");
        });

        expect(screen.getByRole("alert").textContent).toBe(CONFLICT_MESSAGE);
        expect((screen.getByLabelText("Email") as HTMLInputElement).value).toBe("ada@usp.br");
        expect(mockUpdate).not.toHaveBeenCalled();
        expect(mockReplace).not.toHaveBeenCalled();
    });

    test("any other code error is left to the code form to show", async () => {
        const invalid = { response: { status: 400, data: { detail: "code_invalid" } } };
        mockBff.confirmEmailVerification.mockRejectedValue(invalid);
        render(<ConfirmEmailForm callbackUrl="/app/home" />);
        await sendCode("ada@usp.br");

        await expect(mockCodeFormProps.onSubmit("000000")).rejects.toBe(invalid);
        expect(mockUpdate).not.toHaveBeenCalled();
    });

    test("resending uses the same challenge", async () => {
        mockBff.resendChallenge.mockResolvedValue(undefined);
        render(<ConfirmEmailForm callbackUrl="/app/home" />);
        await sendCode("ada@usp.br");

        await act(async () => {
            await mockCodeFormProps.onResend();
        });

        expect(mockBff.resendChallenge).toHaveBeenCalledWith("c1");
    });

    test("a different email can be used from the code step", async () => {
        render(<ConfirmEmailForm callbackUrl="/app/home" />);
        await sendCode("ada@usp.br");

        fireEvent.click(screen.getByRole("button", { name: "Use a different email" }));

        expect((screen.getByLabelText("Email") as HTMLInputElement).value).toBe("ada@usp.br");
    });

    test("an email the gatekeeper refuses is explained", async () => {
        mockBff.requestEmailVerification.mockRejectedValue({ response: { status: 400, data: { detail: "invalid_email" } } });
        render(<ConfirmEmailForm callbackUrl="/app/home" />);

        fireEvent.change(screen.getByLabelText("Email"), { target: { value: "ada@usp.br" } });
        fireEvent.click(screen.getByRole("button", { name: "Send code" }));

        await waitFor(() => expect(screen.getByRole("alert").textContent).toBe("This email address is not valid."));
        expect(screen.queryByTestId("code-step")).toBeNull();
    });

    test("a failure to send the code is shown", async () => {
        mockBff.requestEmailVerification.mockRejectedValue({ response: { status: 503, data: {} } });
        render(<ConfirmEmailForm callbackUrl="/app/home" />);

        fireEvent.change(screen.getByLabelText("Email"), { target: { value: "ada@usp.br" } });
        fireEvent.click(screen.getByRole("button", { name: "Send code" }));

        await waitFor(() => expect(screen.getByRole("alert").textContent).toBe(accountErrorMessage(undefined)));
    });

    test("the person can sign out instead", () => {
        render(<ConfirmEmailForm callbackUrl="/app/home" />);

        fireEvent.click(screen.getByRole("button", { name: "Sign out" }));

        expect(mockSignOut).toHaveBeenCalledWith({ callbackUrl: "/" });
    });
});
```

- [ ] **Step 3: Run it and watch it fail**

Run: `npx jest --coverage=false components/Account/__tests__/ConfirmEmailForm.test.tsx`
Expected: FAIL — `Cannot find module '../ConfirmEmailForm' from 'components/Account/__tests__/ConfirmEmailForm.test.tsx'`.

- [ ] **Step 4: Implement**

Create `components/Account/ConfirmEmailForm.tsx`:

```tsx
import { ErrorMessage, Field, Form, Formik } from "formik";
import { signOut, useSession } from "next-auth/react";
import Router from "next/router";
import { useState } from "react";
import * as Yup from "yup";
import { accountErrorMessage } from "../../contants/AccountConstants";
import { EDIT_FORM_ERROR_CLASS, EDIT_FORM_INPUT_CLASS, EDIT_FORM_LABEL_CLASS } from "../../contants/EditFormConstants";
import { BFFAPI } from "../../gateways/BFFAPI";
import { emailField } from "../../lib/accountValidation";
import { SIGN_OUT_CALLBACK_URL } from "../../lib/authRoutes";
import { VerificationCodeForm } from "./VerificationCodeForm";

interface Props {
    emailHint?: string
    callbackUrl: string
}

interface Challenge {
    id: string
    email: string
}

const EMAIL_BELONGS_TO_ANOTHER_ACCOUNT = "email_belongs_to_another_account";

const EMAIL_SCHEMA = Yup.object({
    email: emailField,
});

export function ConfirmEmailForm(props: Props) {
    const { update } = useSession();
    const [email, setEmail] = useState(props.emailHint ?? "");
    const [challenge, setChallenge] = useState<Challenge | null>(null);
    const [error, setError] = useState<string | null>(null);

    async function requestCode(values: { email: string }) {
        const typed = values.email.trim();
        setError(null);
        setEmail(typed);
        try {
            const { challengeId } = await new BFFAPI().requestEmailVerification(typed);
            setChallenge({ id: challengeId, email: typed });
        } catch (e) {
            setError(accountErrorMessage(e?.response?.data?.detail));
        }
    }

    async function confirmCode(code: string) {
        try {
            await new BFFAPI().confirmEmailVerification(challenge.id, code);
        } catch (e) {
            if (e?.response?.status === 409) {
                setChallenge(null);
                setError(accountErrorMessage(EMAIL_BELONGS_TO_ANOTHER_ACCOUNT));
                return;
            }
            throw e;
        }
        await update();
        await Router.replace(props.callbackUrl);
    }

    async function resendCode() {
        await new BFFAPI().resendChallenge(challenge.id);
    }

    return (
        <div className="flex flex-col gap-5">
            <div className="flex flex-col gap-2">
                <h1 className="m-0 text-[26px] leading-[1.2] font-semibold tracking-[-0.02em] text-primary-900">Confirm your email</h1>
                <p className="m-0 text-[15px] leading-6 text-primary-600">
                    Every DataMap account has a confirmed email. We&apos;ll send a 6-digit code to the address below;
                    type it here to finish signing in with ORCID.
                </p>
            </div>

            {error && <p role="alert" className="m-0 text-sm text-error-600">{error}</p>}

            {challenge ? (
                <div className="flex flex-col gap-3">
                    <VerificationCodeForm email={challenge.email} onSubmit={confirmCode} onResend={resendCode} />
                    <button
                        type="button"
                        className="self-start text-sm font-medium text-primary-900 underline underline-offset-2"
                        onClick={() => setChallenge(null)}
                    >
                        Use a different email
                    </button>
                </div>
            ) : (
                <Formik initialValues={{ email }} validationSchema={EMAIL_SCHEMA} onSubmit={requestCode}>
                    {({ isSubmitting }) => (
                        <Form noValidate className="flex flex-col gap-2">
                            <label htmlFor="confirm-email" className={EDIT_FORM_LABEL_CLASS}>Email</label>
                            <Field id="confirm-email" name="email" type="email" autoComplete="email" className={EDIT_FORM_INPUT_CLASS} />
                            <ErrorMessage name="email" component="p" className={EDIT_FORM_ERROR_CLASS} />
                            <button type="submit" disabled={isSubmitting} className="btn-primary m-0 mt-2 self-start disabled:opacity-60">
                                Send code
                            </button>
                        </Form>
                    )}
                </Formik>
            )}

            <p className="m-0 text-[13px] leading-5 text-primary-500">
                Not now?{" "}
                <button
                    type="button"
                    className="font-medium text-primary-900 underline underline-offset-2"
                    onClick={() => signOut({ callbackUrl: SIGN_OUT_CALLBACK_URL })}
                >
                    Sign out
                </button>
            </p>
        </div>
    );
}
```

(The field error is not `role="alert"`, as in PR 2's forms; the request and 409 errors are. The 409 hides the code step, so `VerificationCodeForm`'s own alert and this one never show together.)

- [ ] **Step 5: Run it and watch it pass**

Run: `npx jest --coverage=false components/Account/__tests__/ConfirmEmailForm.test.tsx`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add components/Account/ConfirmEmailForm.tsx components/Account/__tests__/ConfirmEmailForm.test.tsx
git commit -m "$(cat <<'EOF'
feat: ConfirmEmailForm for a pending ORCID sign-in

Email pre-filled from the hint, then the 6-digit code; on success the
session is refreshed with update() before returning to where the person
was going. An email of another account is refused with a way out.

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 12: The `/account/confirm-email` page

**Files:**
- Create: `pages/account/confirm-email.tsx`

**Interfaces:**
- Consumes: `ConfirmEmailForm` (Task 11), `BareLayout`, `safeReturnPath` (Task 9), `useSession().data.user.emailHint`.
- Produces: page at `ROUTE_PAGE_CONFIRM_EMAIL`, `auth`-gated so that `_app.tsx` sends a signed-out visitor to login and a non-pending one home.

The page has no logic of its own beyond reading the session and the query; it is covered by `npm run build` and the manual checks in Task 14.

- [ ] **Step 1: Implement**

Create `pages/account/confirm-email.tsx`:

```tsx
import { useSession } from "next-auth/react";
import { useRouter } from "next/router";
import { ConfirmEmailForm } from "../../components/Account/ConfirmEmailForm";
import { BareLayout } from "../../components/Public/BareLayout";
import { safeReturnPath } from "../../lib/authRoutes";

const COLUMN = "mx-auto w-full max-w-[560px] px-4 md:px-8 pt-20 pb-24";

export default function ConfirmEmailPage() {
    const { data: session } = useSession();
    const router = useRouter();

    return (
        <BareLayout>
            <div className={COLUMN}>
                <ConfirmEmailForm
                    emailHint={session?.user?.emailHint}
                    callbackUrl={safeReturnPath(router.query.callbackUrl)}
                />
            </div>
        </BareLayout>
    );
}

ConfirmEmailPage.auth = {
    role: "pending",
    loading: <BareLayout><div className={COLUMN} /></BareLayout>,
};
```

- [ ] **Step 2: Build (type-checks the page against the session types)**

Run: `npm run build`
Expected: build succeeds and the route list contains `○ /account/confirm-email` and `λ /api/account/email-verifications` and `λ /api/account/email-verifications/[challengeId]/confirm`.

- [ ] **Step 3: Commit**

```bash
git add pages/account/confirm-email.tsx
git commit -m "$(cat <<'EOF'
feat: /account/confirm-email page

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 13: "Connect ORCID" on the profile

**Files:**
- Modify: `lib/users.ts`
- Create: `components/Account/ConnectOrcid.tsx`
- Modify: `pages/app/profile/index.tsx`
- Test: `lib/__tests__/users.test.ts` (append), `components/Account/__tests__/ConnectOrcid.test.tsx`

**Interfaces:**
- Produces:
  - `hasSignInProvider(user: { providers?: { name: string }[] } | undefined | null, provider: string): boolean`
  - `ConnectOrcid({ accountEmail }: { accountEmail: string })` — an `<li>` with the same grid as PR 2's `PasswordSignInMethod` row ("ORCID" | "Not connected…" | button); the button calls `signIn("orcid", { callbackUrl: ROUTE_PAGE_PROFILE })`.

Why this links rather than creating a second account: NextAuth replaces the session with a fresh ORCID one, so the `jwt` callback looks the ORCID iD up. It has no account, so the session is pending and `_app` sends it to `/account/confirm-email?callbackUrl=%2Fapp%2Fprofile`. The person types the email of the account they were signed into; the gatekeeper's email-verification confirm hits the row "ORCID iD has no account, email has an account → attach the ORCID provider to that account, confirm it". `update()` then finds the ORCID iD on that same account, with a confirmed email, and hydrates the same `uid`; the profile now lists ORCID. The row tells the person which email to use, because the session they were in is gone by the time they reach the confirmation page and the hint may differ.

- [ ] **Step 1: Write the failing tests**

Append to `lib/__tests__/users.test.ts`:

```ts
import { hasSignInProvider } from "../users";

describe("hasSignInProvider", () => {
    test("finds a provider by name", () => {
        expect(hasSignInProvider({ providers: [{ name: "orcid" }] }, "orcid")).toBe(true);
    });

    test("an account without it, or without providers, does not have it", () => {
        expect(hasSignInProvider({ providers: [{ name: "github" }] }, "orcid")).toBe(false);
        expect(hasSignInProvider({ providers: [] }, "orcid")).toBe(false);
        expect(hasSignInProvider({}, "orcid")).toBe(false);
        expect(hasSignInProvider(undefined, "orcid")).toBe(false);
    });
});
```

Create `components/Account/__tests__/ConnectOrcid.test.tsx`:

```tsx
/**
 * @jest-environment jsdom
 */
import { fireEvent, render, screen } from "@testing-library/react";

const mockSignIn = jest.fn();

jest.mock("next-auth/react", () => ({
    signIn: (...args: unknown[]) => mockSignIn(...args),
}));

import { ConnectOrcid } from "../ConnectOrcid";

describe("ConnectOrcid", () => {
    test("starts an ORCID sign-in that comes back to the profile", () => {
        render(<ul><ConnectOrcid accountEmail="ada@usp.br" /></ul>);

        fireEvent.click(screen.getByRole("button", { name: "Connect ORCID" }));

        expect(mockSignIn).toHaveBeenCalledWith("orcid", { callbackUrl: "/app/profile" });
    });

    test("says which email to confirm so the iD lands on this account", () => {
        render(<ul><ConnectOrcid accountEmail="ada@usp.br" /></ul>);

        expect(screen.getByTestId("connect-orcid").textContent).toContain("ada@usp.br");
    });
});
```

- [ ] **Step 2: Run them and watch them fail**

Run: `npx jest --coverage=false lib/__tests__/users.test.ts components/Account/__tests__/ConnectOrcid.test.tsx`
Expected: FAIL — `Module '"../users"' has no exported member 'hasSignInProvider'` and `Cannot find module '../ConnectOrcid'`.

- [ ] **Step 3: Implement**

Append to the end of `lib/users.ts`:

```ts

export function hasSignInProvider(user: { providers?: { name: string }[] } | undefined | null, provider: string): boolean {
    return (user?.providers ?? []).some((entry) => entry.name === provider);
}
```

Create `components/Account/ConnectOrcid.tsx`:

```tsx
import { signIn } from "next-auth/react";
import { ROUTE_PAGE_PROFILE } from "../../contants/InternalRoutesConstants";

export function ConnectOrcid(props: { accountEmail: string }) {
    return (
        <li data-testid="connect-orcid" className="grid grid-cols-[140px_minmax(0,1fr)_auto] items-center gap-4 px-4 py-3 text-sm">
            <span className="text-primary-500">ORCID</span>
            <span className="min-w-0 text-primary-900">
                Not connected. When asked, confirm <span className="font-semibold">{props.accountEmail}</span> so the iD links to this account.
            </span>
            <button
                type="button"
                className="btn-primary-outline btn-small m-0"
                onClick={() => signIn("orcid", { callbackUrl: ROUTE_PAGE_PROFILE })}
            >
                Connect ORCID
            </button>
        </li>
    );
}
```

In `pages/app/profile/index.tsx`:

1. Replace the line `import { getUserByUID } from "../../../lib/users";` with:

```ts
import { getUserByUID, hasSignInProvider } from "../../../lib/users";
```

and replace PR 2's line `import { PasswordSignInMethod } from "../../../components/Account/PasswordSignInMethod";` with:

```ts
import { ConnectOrcid } from "../../../components/Account/ConnectOrcid";
import { PasswordSignInMethod } from "../../../components/Account/PasswordSignInMethod";
```

2. In the "Sign-in methods" list, replace PR 2's line

```tsx
                    <PasswordSignInMethod user={user} />
```

with

```tsx
                    <PasswordSignInMethod user={user} />
                    {!hasSignInProvider(user, "orcid") && <ConnectOrcid accountEmail={user.email} />}
```

(`user` is non-null there: PR 2 renders the `<ul>` only under `user ? (`.)

- [ ] **Step 4: Run them and watch them pass**

Run: `npx jest --coverage=false lib/__tests__/users.test.ts components/Account/__tests__/ConnectOrcid.test.tsx`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add lib/users.ts lib/__tests__/users.test.ts components/Account/ConnectOrcid.tsx components/Account/__tests__/ConnectOrcid.test.tsx pages/app/profile/index.tsx
git commit -m "$(cat <<'EOF'
feat: Connect ORCID from the profile

It starts an ORCID sign-in that lands on the email confirmation; the
account's own email attaches the iD to it.

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 14: Verify

**Files:** none changed (fixes, if any, go in their own commit).

- [ ] **Step 1: Unit tests**

From the worktree: `npx jest --coverage=false`
Expected: every suite passes, PR 2's included; no route test reports a 401 (a 401 means a mocked signed-in token is missing `v: 2`).

- [ ] **Step 2: Build**

Run: `npm run build`
Expected: exit code 0, `/account/confirm-email` and both `/api/account/email-verifications` routes listed next to PR 2's six `/api/account/...` routes, no type errors.

- [ ] **Step 3: Start the stack**

```bash
cd /Users/caio.maia/workspace/datamap/gatekeeper
make ENV_FILE_PATH=integration-test.env integration-test-up
curl -s -o /dev/null -w "%{http_code}\n" http://localhost:9094/api/v1/health-check/
```

Expected: `200`. Mailpit UI at `http://localhost:8025`.

Copy `/Users/caio.maia/workspace/datamap/datamap-webapp/.env.local` into the worktree and set `DATAMAP_BASE_URL=http://localhost:9094/api/v1`, the integration API key/secret, and ORCID credentials whose redirect URI accepts `http://localhost:3000/api/auth/callback/orcid` (if none are registered for localhost, run this checklist on staging with real email). Then `npm run dev` from the worktree.

- [ ] **Step 4: Manual end-to-end checklist**

Run each against a fresh browser profile (or after signing out). Database edits use psql on the integration database (port 5433).

1. **New ORCID user.** ORCID iD with no DataMap account. Sign in with ORCID → lands on `/account/confirm-email?callbackUrl=...`, email pre-filled only if the ORCID record has a public email. Enter a new email → code arrives in Mailpit → type it → lands on the callback page signed in; `users` has one row with that email, `email_verified_at` set, provider `orcid`; admins got `new_account_pending`.
2. **Existing ORCID user with a placeholder email.** `UPDATE users SET email = '<orcid>@fake.mail.com', email_verified_at = NULL WHERE id = '<id>';` Sign in with ORCID → confirm-email, field empty (or ORCID public email). Confirm a new real email → signed in as the same `id`; the row's email replaced and confirmed.
3. **Existing real-email ORCID user (prefill).** `UPDATE users SET email = 'ada@example.org', email_verified_at = NULL WHERE id = '<id>';` Sign in → field pre-filled with `ada@example.org`; confirm → same `id`, `email_verified_at` set. Sign out and in again → no confirmation step.
4. **409 collision.** Create a password account for `taken@example.org` (sign-up tab). Put the ORCID account back to a placeholder (step 2's SQL). Sign in with ORCID, type `taken@example.org`, enter the code → "This email belongs to another DataMap account. Contact the DataMap team." with the email field back; "Sign out" returns to `/`.
5. **Connect ORCID from a password account.** Sign in with a password account that has no ORCID; on `/app/profile` click "Connect ORCID" → ORCID → confirm-email; type the account's email (shown in the profile row) → code → back on `/app/profile`, same user id, ORCID listed under Sign-in methods.
6. **Old token forced re-login.** Stop the worktree's dev server, run `npm run dev` from the main checkout (`main`, without this PR) and sign in with a password; keep the tab open; stop it and run `npm run dev` from the worktree again; reload any `/app/...` page → lands on `/account/login?phase=sign-in&callbackUrl=...`; DevTools shows `next-auth.session-token` deleted; the dev server logs one `JWT_SESSION_ERROR`.
7. **Pending session cannot reach the API.** While on confirm-email in case 1, copy the `next-auth.session-token` cookie and run `curl -s -o /dev/null -w "%{http_code}\n" -b "next-auth.session-token=<value>" http://localhost:3000/api/datasets/shared` → `401`. Visit `/app/home` directly → back on confirm-email.
8. **Invitation while pending.** Share a dataset with a new email; open the invitation link signed out; sign in with an ORCID with no account → after a moment on the login page, confirm-email with `callbackUrl=%2Finvitations%2F<token>`; confirm the invited email → the invitation page, then the dataset under "Shared with me".
9. **Login page while pending.** In a pending session, open `/account/login?phase=sign-in&callbackUrl=%2Fapp%2Fdatasets` → replaced with `/account/confirm-email?callbackUrl=%2Fapp%2Fdatasets`. Signed out, `/account/login` shows both tabs as in PR 2.
10. **Validation code from the gatekeeper.** On confirm-email, send a code to an address the gatekeeper rejects but Yup accepts (e.g. one over 256 characters) → "This email address is not valid." and the email step stays.
11. **New account with no role.** After case 1, `/app/profile` loads the account (the gatekeeper lets an account read itself without a Casbin role) and `/app/home` shows the "Your access is not set up yet" card until a tenancy is granted.

- [ ] **Step 5: Stop the stack**

```bash
cd /Users/caio.maia/workspace/datamap/gatekeeper
make ENV_FILE_PATH=integration-test.env integration-test-down
```

---

## Self-review

| RFC 008 / contract requirement | Task |
|---|---|
| Tokens carry a version; a token without it is signed out | 2 (callback + proof against NextAuth 4.24.9's session route), 5 (BFF also refuses it), 14.6 |
| `TOKEN_VERSION = 2` exported from `[...nextauth].ts`, `token.v` on every token | 2 |
| ORCID sign-in: verified account → hydrate + claim invitations | 3 |
| ORCID sign-in: no account or `email_verified_at === null` → `pending {orcid, name, emailHint?}`, no `uid` | 3 |
| `emailHint`: account email unless placeholder, else ORCID public email, else none | 1, 3 |
| ORCID never creates users / no `@fake.mail.com` from ORCID | 3 |
| `update()` re-reads the ORCID iD from the token, never from the browser | 4 |
| `session.user.pending: boolean` (+ `emailHint`), no ORCID iD in the session | 3, types in 2 |
| `_app` sends a pending session to `/account/confirm-email`; that page requires pending | 9, 12 |
| `middlewareChain` `auth` requires `uid` | 5 |
| `pendingOnlyChain` requires `pending` and no `uid` | 5 |
| `requestEmailVerification` / `confirmEmailVerification` in `lib/account.ts` | 6 |
| BFF `POST /api/account/email-verifications` and `.../[challengeId]/confirm`, `pendingOnlyChain` (via `pendingAccountRouter`), iD and name from the token, status and `detail` forwarded by PR 2's `accountHandler` | 7 |
| Gatekeeper validation codes shown with PR 2's copy on the confirmation screen | 7 (forwarded), 11 (`invalid_email` test) |
| A pending session reaching `/account/login` goes to confirm its email (covers invitation links) | 9, 10, 14.8, 14.9 |
| BFFAPI `requestEmailVerification(email)`, `confirmEmailVerification(challengeId, code)` rejecting with the Axios error | 8 |
| `ROUTE_PAGE_CONFIRM_EMAIL = "/account/confirm-email"` | 9 |
| Confirm-email screen: `BareLayout`, 560 px column, Formik + PR 2's `emailField`, email pre-filled, then PR 2's `VerificationCodeForm` (90 s resend), `role="alert"` errors, English copy | 11, 12 |
| 409 copy "This email belongs to another DataMap account. Contact the DataMap team." | 11 |
| Sign-out escape on the confirmation screen | 11 |
| Profile "Connect ORCID" → ORCID sign-in → email verification attaches the iD | 13, 14.5 |
| Webapp Jest: pending state in `jwt`, token version, `middlewareChain` refusing a token without `uid`, confirm-email form | 2, 3, 4, 5, 11 |
| Manual checks against gatekeeper + Mailpit | 14 |

Not in the contract, added because the flow breaks without it: the login page's pending redirect (Task 10; without it an invitation link loops through login and ORCID), the version check in the BFF `auth` step (Task 5; `getToken` never runs the `jwt` callback), and `session.user.emailHint` (Task 3; pre-fill).
