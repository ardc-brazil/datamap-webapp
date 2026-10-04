# RFC 008 PR 2 — Password sign-in, sign-up, reset and change Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Anyone can create a DataMap account with a name, an email and a password, confirm the email with a 6-digit code typed on the same screen, sign in with that password, reset a forgotten password through an emailed link, and change or set the password from the profile — all against the gatekeeper's `/v1/auth/*` endpoints from PR 1.

**Architecture:** `lib/account.ts` is the server-side client for the gatekeeper's auth endpoints (snake_case on the wire, camelCase in TypeScript). The NextAuth credentials provider, now registered in every environment, calls `login()` and returns the gatekeeper `user_id`; the `jwt` callback hydrates a password sign-in with `getUserByUID` instead of a provider lookup. Six BFF routes under `pages/api/account/` proxy one-to-one to the gatekeeper through a new `publicChain` (request logging only) or the existing `authOnlyChain`, and a dedicated `accountHandler` forwards the gatekeeper's status and `{detail}` unchanged. The screens are built from components under `components/Account/` (each testable without importing a page): `CodeInput` and `VerificationCodeForm` (shared with PR 3), `SignInForm`, `SignUpForm`, `ForgotPasswordForm`, `ResetPasswordForm`, `ChangePasswordDialog` and `PasswordSignInMethod`; the login page selects its tab from the `phase` query parameter.

**Tech Stack:** Next.js 14.2 (pages router), NextAuth 4.24.9 (JWT strategy), next-connect 1.0.0-next.4, Axios 1.6, Formik 2.4.5 + Yup 1.2, TailwindCSS 3, Jest 29 + ts-jest, @testing-library/react 14.2 with `jest-environment-jsdom` (jsdom 20). No new dependency.

## Global Constraints

- Branch: `feat/rfc-008-password-sign-in` in worktree `.claude/worktrees/rfc-008-password-sign-in`, cut from `main` after webapp PR 0 (`fix/dev-only-auth-providers`) is merged and gatekeeper PR 1 is deployed.
- Gatekeeper paths (relative to `DATAMAP_BASE_URL`, which already ends in `/api/v1`): `POST /auth/sign-up`, `POST /auth/sign-up/{challenge_id}/confirm`, `POST /auth/challenges/{challenge_id}/resend`, `POST /auth/login`, `POST /auth/password-reset`, `POST /auth/password-reset/confirm`, `PUT /users/{id}/password`.
- Gatekeeper error codes handled: `code_invalid`, `code_expired`, `code_attempts_exceeded`, `challenge_not_found`, `resend_too_soon`, `invalid_credentials`, `token_invalid`, `email_belongs_to_another_account`, and the 400 validation codes `invalid_email`, `invalid_name`, `invalid_password`, `invalid_orcid` (`email_belongs_to_another_account` and `invalid_orcid` are PR 3's, mapped here so the map is complete).
- BFF routes: `POST /api/account/sign-up` → `202 {challengeId}`; `POST /api/account/sign-up/[challengeId]/confirm` → `204`; `POST /api/account/challenges/[challengeId]/resend` → `202`; `POST /api/account/password-reset` → `202`; `POST /api/account/password-reset/confirm` → `204`; `PUT /api/account/password` (`authOnlyChain`) → `204`. Every gatekeeper response error is forwarded as `res.status(<gatekeeper status>).json({ detail: <gatekeeper detail> })`; no response at all is `500 {detail: "unavailable"}`.
- The browser never sends a user id: `PUT /api/account/password` takes the id from the NextAuth token.
- `PASSWORD_MIN_LENGTH = 10`, `PASSWORD_MAX_LENGTH = 128`, `CODE_LENGTH = 6`, `RESEND_COOLDOWN_SECONDS = 90`.
- `ROUTE_PAGE_FORGOT_PASSWORD = "/account/forgot-password"`, `ROUTE_PAGE_RESET_PASSWORD = (token: string) => "/account/reset-password/" + token`.
- Credentials provider: `id: "credentials"`, registered in all environments; GitHub stays development-only. Provider ids in production: `["orcid", "credentials"]`; in development: `["orcid", "credentials", "github"]`.
- Sign-in failure copy: `"Invalid email or password."` (for NextAuth's `CredentialsSignin`); any other sign-in error: `"Something went wrong. Please try again."` (`GENERIC_ERROR_MESSAGE` from `contants/EmbargoConstants.ts`).
- UI copy in English. Public pages: `BareLayout`, `mx-auto w-full max-w-[560px] px-4 md:px-8 pt-20 pb-24`, `btn-primary`, inline errors with `role="alert"`. Form field classes from `contants/EditFormConstants.ts`. No new icons are needed; where the app uses Material Symbols it passes `weight={400} grade={-25}` (not 200).
- Component tests start with `/** @jest-environment jsdom */`, import the component from its own file under `components/Account/`, use `toBeTruthy()`/`toBeNull()` (no jest-dom matchers are configured).
- Tests that import `pages/api/auth/[...nextauth].ts` live in `lib/__tests__/`, never under `pages/`: `next build` compiles every file under `pages/` as a route.
- All work happens in the worktree `/Users/caio.maia/workspace/datamap/datamap-webapp/.claude/worktrees/rfc-008-password-sign-in` (Task 1, Step 1); every command in this plan runs from its root. It gets its own `node_modules` with `npm ci` — never symlink `node_modules` from the main checkout (a symlinked `node_modules` is how the main checkout's was wiped: Next's TypeScript auto-install made npm replace it).
- Jest inside the worktree: plain `npx jest --coverage=false`. Do not add `--testPathIgnorePatterns /.claude/` there: the worktree's own path contains `/.claude/` and nothing would run.
- Every commit message ends with `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.

---

## File Structure

| File | Status | Responsibility |
|---|---|---|
| `contants/AccountConstants.ts` | create | Password/code rules, sign-in copy, `accountErrorMessage(detail)` |
| `contants/__tests__/AccountConstants.test.ts` | create | Rules, every error code, prototype-name safety, the two new routes |
| `contants/InternalRoutesConstants.ts` | modify | `ROUTE_PAGE_FORGOT_PASSWORD`, `ROUTE_PAGE_RESET_PASSWORD` |
| `contants/TelemetryConstants.ts` | modify | The two new page templates in `PAGES` |
| `lib/account.ts` | create | Gatekeeper client for the PR 2 auth endpoints (snake_case ↔ camelCase) |
| `lib/__tests__/account.test.ts` | create | Paths, bodies, mapping, error propagation |
| `lib/users.ts` | modify | `has_password` and `email_verified_at` on both user response types |
| `pages/api/auth/[...nextauth].ts` | modify | Credentials provider calls `login()`; registered everywhere; `hydratePasswordSignIn`; stub removed |
| `lib/__tests__/passwordSignIn.test.ts` | create | `authorizeCredentials`, `hydratePasswordSignIn`, the `jwt` callback for credentials |
| `lib/__tests__/authProviders.test.ts` | modify | Provider ids now include `credentials` everywhere (file created by PR 0) |
| `lib/middlewareChain.ts` | modify | `publicChain` (request logging, no auth) |
| `lib/__tests__/middlewareChain.test.ts` | modify | Public chain lets anonymous requests through and still logs |
| `lib/accountRoute.ts` | create | `publicAccountRouter()`, `accountHandler()` forwarding status and `detail` |
| `pages/api/account/sign-up/index.ts` | create | BFF sign-up |
| `pages/api/account/sign-up/[challengeId]/confirm.ts` | create | BFF sign-up confirmation |
| `pages/api/account/challenges/[challengeId]/resend.ts` | create | BFF resend |
| `pages/api/account/password-reset/index.ts` | create | BFF reset request |
| `pages/api/account/password-reset/confirm.ts` | create | BFF reset confirmation |
| `pages/api/account/password.ts` | create | BFF password change (`authOnlyChain`) |
| `lib/__tests__/accountRoutes.test.ts` | create | The six routes: success codes, forwarded errors, session rules |
| `gateways/BFFAPI.ts` | modify | Six account methods that reject with the Axios error |
| `gateways/__tests__/BFFAPI.account.test.ts` | create | Paths, bodies, rejection |
| `components/Account/CodeInput.tsx` | create | Six single-digit boxes |
| `components/Account/__tests__/CodeInput.test.tsx` | create | Typing, Backspace, arrows, paste, completion, attributes |
| `components/Account/VerificationCodeForm.tsx` | create | Code step: errors, auto-submit, 90 s resend countdown |
| `components/Account/__tests__/VerificationCodeForm.test.tsx` | create | Submission, each code error, countdown, resend |
| `lib/accountValidation.ts` | create | Shared Yup fields: `emailField`, `newPasswordField` |
| `components/Account/SignInForm.tsx` | create | Email + password sign-in, "Forgot password?" |
| `components/Account/__tests__/SignInForm.test.tsx` | create | Success, refusal, other failure, validation, link |
| `components/Account/SignUpForm.tsx` | create | Name/email/password, then the code step, then sign-in |
| `components/Account/__tests__/SignUpForm.test.tsx` | create | Validation, code step, sign-in after confirm, back to details |
| `lib/authRoutes.ts` | modify | `loginTabFor(phase)`, `loginPhaseFor(tabIndex)` |
| `lib/__tests__/authRoutes.test.ts` | modify | The two helpers |
| `pages/account/login/index.tsx` | modify | Tabs "Sign in" / "Create account" from `phase`; John Doe form removed |
| `components/Account/ForgotPasswordForm.tsx` | create | Email → "If an account exists…" |
| `components/Account/ResetPasswordForm.tsx` | create | New password + confirmation → sign-in link |
| `components/Account/__tests__/ForgotPasswordForm.test.tsx` | create | Same answer for every email, validation, failure |
| `components/Account/__tests__/ResetPasswordForm.test.tsx` | create | Token sent, mismatch, length, dead link |
| `pages/account/forgot-password/index.tsx` | create | Public page around `ForgotPasswordForm` |
| `pages/account/reset-password/[token].tsx` | create | Public page around `ResetPasswordForm`, `no-referrer` |
| `components/Account/ChangePasswordDialog.tsx` | create | Modal with current and new password |
| `components/Account/PasswordSignInMethod.tsx` | create | Profile row: "Change password" or "Set a password" |
| `components/Account/__tests__/ChangePasswordDialog.test.tsx` | create | Success, wrong current password, validation, cancel |
| `components/Account/__tests__/PasswordSignInMethod.test.tsx` | create | Both states, the link, unconfirmed email |
| `pages/app/profile/index.tsx` | modify | Password row in "Sign-in methods" |

---

### Task 1: Account rules, error copy and routes

**Files:**
- Create: `contants/AccountConstants.ts`, `contants/__tests__/AccountConstants.test.ts`
- Modify: `contants/InternalRoutesConstants.ts`

**Interfaces:**
- Consumes: `GENERIC_ERROR_MESSAGE` from `contants/EmbargoConstants.ts` (`"Something went wrong. Please try again."`).
- Produces: `PASSWORD_MIN_LENGTH = 10`, `PASSWORD_MAX_LENGTH = 128`, `CODE_LENGTH = 6`, `RESEND_COOLDOWN_SECONDS = 90`, `INVALID_SIGN_IN_MESSAGE: string`, `CURRENT_PASSWORD_INCORRECT_MESSAGE: string`, `PASSWORD_LENGTH_MESSAGE: string`, `ACCOUNT_ERROR_MESSAGES: Record<string, string>`, `accountErrorMessage(detail?: string): string`, `ROUTE_PAGE_FORGOT_PASSWORD: string`, `ROUTE_PAGE_RESET_PASSWORD(token: string): string`.

- [ ] **Step 1: Create the worktree**

```bash
cd /Users/caio.maia/workspace/datamap/datamap-webapp
git pull --ff-only                 # the main checkout is on main
git log --oneline -5 main          # PR 0 ("register GitHub and the credentials stub only in development") must be here
git worktree add -b feat/rfc-008-password-sign-in .claude/worktrees/rfc-008-password-sign-in main
cd .claude/worktrees/rfc-008-password-sign-in
npm ci                             # its own node_modules; never a symlink to the main checkout's
cp ../../../.env.local .env.local  # untracked; needed by npm run dev and npm run build
npx jest --coverage=false          # baseline: everything passes before the first change
```

Every later command in this plan runs from `/Users/caio.maia/workspace/datamap/datamap-webapp/.claude/worktrees/rfc-008-password-sign-in`.

- [ ] **Step 2: Write the failing test**

Create `contants/__tests__/AccountConstants.test.ts`:

```ts
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
```

- [ ] **Step 3: Run it and watch it fail**

Run: `npx jest --coverage=false contants/__tests__/AccountConstants.test.ts`

Expected: FAIL — "Test suite failed to run", `Cannot find module '../AccountConstants'`.

- [ ] **Step 4: Write the constants**

Create `contants/AccountConstants.ts`:

```ts
import { GENERIC_ERROR_MESSAGE } from "./EmbargoConstants";

export const PASSWORD_MIN_LENGTH = 10;

export const PASSWORD_MAX_LENGTH = 128;

export const CODE_LENGTH = 6;

export const RESEND_COOLDOWN_SECONDS = 90;

export const INVALID_SIGN_IN_MESSAGE = "Invalid email or password.";

export const CURRENT_PASSWORD_INCORRECT_MESSAGE = "The current password is not correct.";

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
};

export function accountErrorMessage(detail?: string): string {
    if (typeof detail === "string" && Object.prototype.hasOwnProperty.call(ACCOUNT_ERROR_MESSAGES, detail)) {
        return ACCOUNT_ERROR_MESSAGES[detail];
    }
    return GENERIC_ERROR_MESSAGE;
}
```

In `contants/InternalRoutesConstants.ts`, immediately after the line `export const ROUTE_PAGE_LOGIN = (params) => appendSearchParams('/account/login', params);`, insert:

```ts

/**
 * Route to the page that sends a password reset link.
 * @constant
 */
export const ROUTE_PAGE_FORGOT_PASSWORD = "/account/forgot-password";

/**
 * Route the password reset link opens.
 * @constant
 */
export const ROUTE_PAGE_RESET_PASSWORD = (token: string) => "/account/reset-password/" + token;
```

- [ ] **Step 5: Run it and watch it pass**

Run: `npx jest --coverage=false contants/__tests__/AccountConstants.test.ts`

Expected: PASS, 18 tests.

- [ ] **Step 6: Commit**

```bash
git add contants/AccountConstants.ts contants/__tests__/AccountConstants.test.ts contants/InternalRoutesConstants.ts
git commit -m "$(cat <<'EOF'
feat: account rules, error copy and routes for password sign-in

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 2: Gatekeeper client for the auth endpoints, and the new user fields

**Files:**
- Create: `lib/account.ts`, `lib/__tests__/account.test.ts`
- Modify: `lib/users.ts`

**Interfaces:**
- Consumes: `axiosInstance` (default export of `lib/rpc.ts`; it already carries `X-Api-Key`/`X-Api-Secret`).
- Produces (contract, exact):
  - `signUp(input: { name: string; email: string; password: string }): Promise<{ challengeId: string }>`
  - `confirmSignUp(challengeId: string, code: string): Promise<{ userId: string }>`
  - `resendChallenge(challengeId: string): Promise<void>`
  - `login(email: string, password: string): Promise<{ userId: string }>`
  - `requestPasswordReset(email: string): Promise<void>`
  - `confirmPasswordReset(token: string, password: string): Promise<void>`
  - `changePassword(userId: string, currentPassword: string, newPassword: string): Promise<void>`
  - Each rejects with the Axios error on a non-2xx.
  - `UserDetailsResponse` and `GetUserByProviderResponse` gain `has_password: boolean` and `email_verified_at: string | null`.

- [ ] **Step 1: Write the failing test**

Create `lib/__tests__/account.test.ts`:

```ts
import { changePassword, confirmPasswordReset, confirmSignUp, login, requestPasswordReset, resendChallenge, signUp } from "../account";
import axiosInstance from "../rpc";

jest.mock("../rpc");
const mockPost = jest.mocked(axiosInstance.post);
const mockPut = jest.mocked(axiosInstance.put);

describe("account calls to the gatekeeper", () => {
    test("sign-up sends snake_case and answers the challenge in camelCase", async () => {
        mockPost.mockResolvedValue({ status: 202, data: { challenge_id: "c1" } });

        expect(await signUp({ name: "Ana", email: "ana@usp.br", password: "a long password" })).toEqual({ challengeId: "c1" });
        expect(mockPost).toHaveBeenCalledWith("/auth/sign-up", { name: "Ana", email: "ana@usp.br", password: "a long password" });
    });

    test("confirming a sign-up answers the new user id", async () => {
        mockPost.mockResolvedValue({ status: 200, data: { user_id: "u1" } });

        expect(await confirmSignUp("c1", "123456")).toEqual({ userId: "u1" });
        expect(mockPost).toHaveBeenCalledWith("/auth/sign-up/c1/confirm", { code: "123456" });
    });

    test("resending posts to the challenge without a body", async () => {
        mockPost.mockResolvedValue({ status: 202, data: null });

        await expect(resendChallenge("c1")).resolves.toBeUndefined();
        expect(mockPost).toHaveBeenCalledWith("/auth/challenges/c1/resend");
    });

    test("a challenge id cannot reach another gatekeeper path", async () => {
        mockPost.mockResolvedValue({ status: 202, data: null });

        await resendChallenge("../users");

        expect(mockPost).toHaveBeenCalledWith("/auth/challenges/..%2Fusers/resend");
    });

    test("login answers the user id", async () => {
        mockPost.mockResolvedValue({ status: 200, data: { user_id: "u1" } });

        expect(await login("ana@usp.br", "a long password")).toEqual({ userId: "u1" });
        expect(mockPost).toHaveBeenCalledWith("/auth/login", { email: "ana@usp.br", password: "a long password" });
    });

    test("a refused login rejects with the gatekeeper error", async () => {
        const refused = { response: { status: 401, data: { detail: "invalid_credentials" } } };
        mockPost.mockRejectedValue(refused);

        await expect(login("ana@usp.br", "wrong password")).rejects.toBe(refused);
    });

    test("requesting a reset sends only the email", async () => {
        mockPost.mockResolvedValue({ status: 202, data: null });

        await expect(requestPasswordReset("ana@usp.br")).resolves.toBeUndefined();
        expect(mockPost).toHaveBeenCalledWith("/auth/password-reset", { email: "ana@usp.br" });
    });

    test("confirming a reset sends the token and the new password", async () => {
        mockPost.mockResolvedValue({ status: 204, data: null });

        await expect(confirmPasswordReset("tok", "a new long password")).resolves.toBeUndefined();
        expect(mockPost).toHaveBeenCalledWith("/auth/password-reset/confirm", { token: "tok", password: "a new long password" });
    });

    test("changing the password acts as the user and sends snake_case", async () => {
        mockPut.mockResolvedValue({ status: 204, data: null });

        await expect(changePassword("u1", "the old password", "the new password")).resolves.toBeUndefined();
        expect(mockPut).toHaveBeenCalledWith(
            "/users/u1/password",
            { current_password: "the old password", new_password: "the new password" },
            { headers: { "X-User-Id": "u1" } },
        );
    });
});
```

- [ ] **Step 2: Run it and watch it fail**

Run: `npx jest --coverage=false lib/__tests__/account.test.ts`

Expected: FAIL — `Cannot find module '../account'`.

- [ ] **Step 3: Write the client**

Create `lib/account.ts`:

```ts
import axiosInstance from "./rpc";

export async function signUp(input: { name: string; email: string; password: string }): Promise<{ challengeId: string }> {
    const response = await axiosInstance.post("/auth/sign-up", { name: input.name, email: input.email, password: input.password });
    return { challengeId: response.data.challenge_id };
}

export async function confirmSignUp(challengeId: string, code: string): Promise<{ userId: string }> {
    const response = await axiosInstance.post(`/auth/sign-up/${encodeURIComponent(challengeId)}/confirm`, { code });
    return { userId: response.data.user_id };
}

export async function resendChallenge(challengeId: string): Promise<void> {
    await axiosInstance.post(`/auth/challenges/${encodeURIComponent(challengeId)}/resend`);
}

export async function login(email: string, password: string): Promise<{ userId: string }> {
    const response = await axiosInstance.post("/auth/login", { email, password });
    return { userId: response.data.user_id };
}

export async function requestPasswordReset(email: string): Promise<void> {
    await axiosInstance.post("/auth/password-reset", { email });
}

export async function confirmPasswordReset(token: string, password: string): Promise<void> {
    await axiosInstance.post("/auth/password-reset/confirm", { token, password });
}

export async function changePassword(userId: string, currentPassword: string, newPassword: string): Promise<void> {
    await axiosInstance.put(
        `/users/${encodeURIComponent(userId)}/password`,
        { current_password: currentPassword, new_password: newPassword },
        { headers: { "X-User-Id": userId } },
    );
}
```

In `lib/users.ts`, in `export interface GetUserByProviderResponse`, after the line `    tenancies: string[]` add:

```ts
    has_password: boolean
    email_verified_at: string | null
```

and in `export interface UserDetailsResponse`, after the line `    tenancies: string[],` add:

```ts
    has_password: boolean,
    email_verified_at: string | null,
```

- [ ] **Step 4: Run it and watch it pass, then type-check**

Run: `npx jest --coverage=false lib/__tests__/account.test.ts`
Expected: PASS, 9 tests.

Run: `npx tsc --noEmit -p .`
Expected: no output.

- [ ] **Step 5: Commit**

```bash
git add lib/account.ts lib/__tests__/account.test.ts lib/users.ts
git commit -m "$(cat <<'EOF'
feat: gatekeeper client for sign-up, login, reset and password change

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 3: The credentials provider signs in through the gatekeeper

**Files:**
- Modify: `pages/api/auth/[...nextauth].ts`, `lib/__tests__/authProviders.test.ts`
- Create: `lib/__tests__/passwordSignIn.test.ts`

**Interfaces:**
- Consumes: `login(email, password)` (Task 2); `getUserByUID(context: AppLocalContext): Promise<UserDetailsResponse>` (rejects with `error.response`); `hydrateWithUserInfo(token, user)`, `claimPendingInvitations(uid)` (same file); `getMetrics().recordLogin(provider, outcome)`; `logError(message, error)`.
- Produces:
  - `authorizeCredentials(credentials?: Record<string, string>): Promise<User | null>` — `{ id: userId, email }` on success; `null` on a missing field or a gatekeeper `401`; throws `Error("sign_in_unavailable")` on anything else. Records `recordLogin("credentials", "failure")` on every failure.
  - `hydratePasswordSignIn(token: JWT, uid: string): Promise<JWT>` — sets `uid`, `name`, `email`, `tenancies` from `getUserByUID`. `getUserByUID({ uid, tenancy: undefined })` sends `X-User-Id: uid` (through `buildHeaders` in `lib/rpc.ts`), and gatekeeper PR 1 skips Casbin on `GET /users/{id}` when `{id}` equals `X-User-Id`, so a new account with no role is read normally. Only a genuine failure (gatekeeper down, 5xx) falls back to `uid` alone, drops `tenancies`, and is logged with `logError`.
  - Provider ids: production `["orcid", "credentials"]`, development `["orcid", "credentials", "github"]`.

- [ ] **Step 1: Write the failing tests**

In `lib/__tests__/authProviders.test.ts` (created by PR 0), replace the whole `describe("the sign-in providers", ...)` block with:

```ts
describe("the sign-in providers", () => {
    test("production offers ORCID and the password", () => {
        expect(providerIdsWhen("production")).toEqual(["orcid", "credentials"]);
    });

    test("development also offers GitHub", () => {
        expect(providerIdsWhen("development")).toEqual(["orcid", "credentials", "github"]);
    });

    test("anything that is not development counts as production", () => {
        expect(providerIdsWhen("test")).toEqual(["orcid", "credentials"]);
    });
});
```

Create `lib/__tests__/passwordSignIn.test.ts`:

```ts
jest.mock("../share", () => ({ claimInvitations: jest.fn() }));
jest.mock("../account", () => ({ login: jest.fn() }));
jest.mock("../users", () => ({ ...(jest.requireActual("../users") as object), getUserByUID: jest.fn() }));
jest.mock("../logging", () => ({ ...(jest.requireActual("../logging") as object), logError: jest.fn() }));
jest.mock("../metrics", () => ({ getMetrics: () => ({ recordLogin: mockRecordLogin }) }));
const mockRecordLogin = jest.fn();

import { describe, expect, test } from '@jest/globals';
import { AxiosError, AxiosHeaders } from "axios";
import { authOptions, authorizeCredentials, hydratePasswordSignIn } from "../../pages/api/auth/[...nextauth]";
import { login } from "../account";
import { logError } from "../logging";
import { claimInvitations } from "../share";
import { getUserByUID } from "../users";

function gatekeeperError(status: number, detail: string) {
    return new AxiosError("gatekeeper", "ERR", undefined, {}, {
        status, data: { detail }, statusText: "", headers: {}, config: { headers: new AxiosHeaders() },
    } as any);
}

describe("signing in with a password", () => {
    test("the gatekeeper user id becomes the NextAuth user", async () => {
        jest.mocked(login).mockResolvedValue({ userId: "u1" });

        expect(await authorizeCredentials({ email: "ana@usp.br", password: "a long password" })).toEqual({ id: "u1", email: "ana@usp.br" });
        expect(login).toHaveBeenCalledWith("ana@usp.br", "a long password");
    });

    test("a refused password is no user, and counts as a failure", async () => {
        jest.mocked(login).mockRejectedValue(gatekeeperError(401, "invalid_credentials"));

        expect(await authorizeCredentials({ email: "ana@usp.br", password: "wrong password" })).toBeNull();
        expect(mockRecordLogin).toHaveBeenCalledWith("credentials", "failure");
    });

    test("a missing field never reaches the gatekeeper", async () => {
        expect(await authorizeCredentials({ email: "ana@usp.br" })).toBeNull();
        expect(await authorizeCredentials(undefined)).toBeNull();
        expect(login).not.toHaveBeenCalled();
    });

    test("the old local stub is gone: a @local.datamap.com address is checked like any other", async () => {
        jest.mocked(login).mockRejectedValue(gatekeeperError(401, "invalid_credentials"));

        expect(await authorizeCredentials({ email: "john-doe@local.datamap.com", password: "12345678" })).toBeNull();
        expect(login).toHaveBeenCalledWith("john-doe@local.datamap.com", "12345678");
    });

    test("a gatekeeper that cannot answer is an error, not a wrong password", async () => {
        jest.mocked(login).mockRejectedValue(gatekeeperError(500, "boom"));

        await expect(authorizeCredentials({ email: "ana@usp.br", password: "a long password" })).rejects.toThrow("sign_in_unavailable");
    });

    test("the session takes the name, email and tenancies from the gatekeeper", async () => {
        jest.mocked(getUserByUID).mockResolvedValue({ id: "u1", name: "Ana", email: "ana@usp.br", tenancies: ["t1"] } as any);

        expect(await hydratePasswordSignIn({ email: "typed@usp.br" }, "u1")).toEqual({
            uid: "u1", name: "Ana", email: "ana@usp.br", tenancies: ["t1"],
        });
        expect(getUserByUID).toHaveBeenCalledWith({ uid: "u1", tenancy: undefined });
    });

    test("a new account with no role is read as itself, with no tenancy", async () => {
        jest.mocked(getUserByUID).mockResolvedValue({ id: "u1", name: "Ana", email: "ana@usp.br", roles: [], tenancies: [] } as any);

        expect(await hydratePasswordSignIn({ email: "ana@usp.br", tenancies: ["stale"] }, "u1")).toEqual({
            uid: "u1", name: "Ana", email: "ana@usp.br",
        });
        expect(logError).not.toHaveBeenCalled();
    });

    test("a gatekeeper that fails to read the user still signs in, with no tenancy, and says so in the log", async () => {
        jest.mocked(getUserByUID).mockRejectedValue({ status: 500 });

        expect(await hydratePasswordSignIn({ email: "ana@usp.br", tenancies: ["stale"] }, "u1")).toEqual({
            uid: "u1", email: "ana@usp.br",
        });
        expect(logError).toHaveBeenCalledWith("hydrating a password sign-in failed", { status: 500 });
    });

    test("the jwt callback hydrates a password sign-in by user id, not by provider", async () => {
        jest.mocked(getUserByUID).mockResolvedValue({ id: "u1", name: "Ana", email: "ana@usp.br", tenancies: [] } as any);
        jest.mocked(claimInvitations).mockResolvedValue({ accepted: [] });

        const token = await authOptions.callbacks.jwt({
            token: { email: "ana@usp.br" },
            user: { id: "u1", email: "ana@usp.br" },
            account: { provider: "credentials", type: "credentials", providerAccountId: "u1" },
            trigger: "signIn",
        } as any);

        expect(token.uid).toBe("u1");
        expect(getUserByUID).toHaveBeenCalledWith({ uid: "u1", tenancy: undefined });
        expect(claimInvitations).toHaveBeenCalledWith("u1");
    });
});
```

- [ ] **Step 2: Run them and watch them fail**

Run: `npx jest --coverage=false lib/__tests__/authProviders.test.ts lib/__tests__/passwordSignIn.test.ts`

Expected: FAIL. `authProviders.test.ts`: 3 failed (production receives `["orcid"]`, development `["orcid", "github", "credentials"]`). `passwordSignIn.test.ts`: "Test suite failed to run" — `Module '"../../pages/api/auth/[...nextauth]"' has no exported member 'authorizeCredentials'`.

- [ ] **Step 3: Rewrite the credentials provider and the sign-in hydration**

All edits are in `pages/api/auth/[...nextauth].ts`.

(a) Replace the line

```ts
import NextAuth, { AuthOptions } from "next-auth";
```

with

```ts
import NextAuth, { AuthOptions, User } from "next-auth";
import { JWT } from "next-auth/jwt";
```

and replace the line

```ts
import OrcidProvider from "../../../lib/OrcidOAuthProvider";
```

with

```ts
import { login } from "../../../lib/account";
import OrcidProvider from "../../../lib/OrcidOAuthProvider";
```

(b) Replace everything from the line `// The credentials stub signs in any @local.datamap.com address and GitHub is for local work: neither may exist in production.` (added by PR 0) down to and including the `  ],` that closes `providers` with:

```ts
// GitHub is for local work only; it must not exist in production.
const developmentOnlyProviders = process.env.NODE_ENV === "development"
  ? [
    GithubProvider({
      clientId: process.env.GITHUB_ID,
      clientSecret: process.env.GITHUB_SECRET,
    }),
  ]
  : [];

export async function authorizeCredentials(credentials?: Record<string, string>): Promise<User | null> {
  const email = credentials?.email ?? "";
  const password = credentials?.password ?? "";

  if (!email || !password) {
    getMetrics().recordLogin("credentials", "failure");
    return null;
  }

  try {
    const { userId } = await login(email, password);
    return { id: userId, email };
  } catch (error) {
    getMetrics().recordLogin("credentials", "failure");
    if (axios.isAxiosError(error) && error.response?.status === 401) {
      return null;
    }
    logError("password sign-in failed", error);
    throw new Error("sign_in_unavailable");
  }
}

export const authOptions: AuthOptions = {
  providers: [
    OrcidProvider({
      clientId: process.env.OAUTH_ORCID_CLIENT_ID,
      clientSecret: process.env.OAUTH_ORCID_CLIENT_SECRET,
    }),
    CredentialsProvider({
      id: "credentials",
      name: "Email and password",
      credentials: {},
      authorize: authorizeCredentials,
    }),
    ...developmentOnlyProviders,
  ],
```

(c) Replace

```ts
    async jwt({ token, account, trigger }) {
```

with

```ts
    async jwt({ token, account, trigger, user }) {
```

and replace

```ts
      if (trigger == "signIn") {
        const user = await getUserByProviderAuthentication(account, token);
        token = hydrateWithUserInfo(token, user);
        await claimPendingInvitations(user.id);
      } else if (trigger == "update" && token.uid) {
```

with

```ts
      if (trigger == "signIn") {
        if (account?.provider == "credentials") {
          token = await hydratePasswordSignIn(token, user.id);
        } else {
          const signedIn = await getUserByProviderAuthentication(account, token);
          token = hydrateWithUserInfo(token, signedIn);
        }
        await claimPendingInvitations(token.uid as string);
      } else if (trigger == "update" && token.uid) {
```

(d) Immediately before the line `export async function claimPendingInvitations(uid: string): Promise<void> {`, insert:

```ts
export async function hydratePasswordSignIn(token: JWT, uid: string): Promise<JWT> {
  try {
    const signedIn = await getUserByUID({ uid, tenancy: undefined });
    token.name = signedIn.name;
    token.email = signedIn.email;
    return hydrateWithUserInfo(token, signedIn);
  } catch (error) {
    // The gatekeeper already accepted the password: a failed read must not undo the sign-in.
    logError("hydrating a password sign-in failed", error);
    return hydrateWithUserInfo(token, { id: uid });
  }
}

```

(e) In `getUserByProviderAuthentication`, delete the branch

```ts
  } else if (account.provider == "credentials") {
    params = {
      providerName: account.provider,
      providerID: token.email,
      personName: token.name,
      userName: token.email.split('@')[0],
      email: token.email
    };
```

so that the `orcid` branch is followed directly by `  } else {` / `throw new Error("Invalid provider authentication: " + account.provider);`.

- [ ] **Step 4: Run them and watch them pass, then type-check**

Run: `npx jest --coverage=false lib/__tests__/authProviders.test.ts lib/__tests__/passwordSignIn.test.ts pages/api/auth`
Expected: PASS — 3 + 9 + 7 = 19 tests.

Run: `npx tsc --noEmit -p .`
Expected: no output.

- [ ] **Step 5: Commit**

```bash
git add "pages/api/auth/[...nextauth].ts" lib/__tests__/authProviders.test.ts lib/__tests__/passwordSignIn.test.ts
git commit -m "$(cat <<'EOF'
feat: password sign-in through the gatekeeper

The credentials provider now calls POST /auth/login and is registered in
every environment; the @local.datamap.com stub is gone. A password
sign-in is hydrated by user id; the gatekeeper lets a user read itself,
so this works for a new account with no role. If that read fails, the
sign-in still stands with only the uid, and the session refresh picks up
the rest.

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 4: BFF routes under `/api/account`

**Files:**
- Modify: `lib/middlewareChain.ts`, `lib/__tests__/middlewareChain.test.ts`
- Create: `lib/accountRoute.ts`, `pages/api/account/sign-up/index.ts`, `pages/api/account/sign-up/[challengeId]/confirm.ts`, `pages/api/account/challenges/[challengeId]/resend.ts`, `pages/api/account/password-reset/index.ts`, `pages/api/account/password-reset/confirm.ts`, `pages/api/account/password.ts`, `lib/__tests__/accountRoutes.test.ts`

**Interfaces:**
- Consumes: the seven functions of `lib/account.ts` (Task 2); `requestLogging`; `bffRouter()` from `lib/bffRoute.ts` (uses `authOnlyChain`); `NewContext(req)` from `lib/appLocalContext.ts`; `maskPathTokens`, `logError`.
- Produces:
  - `publicChain` exported from `lib/middlewareChain.ts` — `requestLogging` only.
  - `publicAccountRouter(): NodeRouter<NextApiRequest, NextApiResponse>` and `accountHandler(router)` in `lib/accountRoute.ts`. `accountHandler` answers a gatekeeper error with its status and `{ detail }`, logs only 5xx, answers `500 {detail: "unavailable"}` when there is no response, `405` on another verb. (`bffHandler` cannot be reused: `httpErrorHandler` replaces the `detail` of a 401 and a 404 with its own message, losing `invalid_credentials` and `challenge_not_found`.)
  - The six routes in Global Constraints.

- [ ] **Step 1: Write the failing tests**

In `lib/__tests__/middlewareChain.test.ts`, replace

```ts
import middlewareChain, { authOnlyChain } from "../middlewareChain";
```

with

```ts
import middlewareChain, { authOnlyChain, publicChain } from "../middlewareChain";
```

and add as the last test inside `describe("the BFF chains", ...)`:

```ts

    test("the public chain lets an anonymous request through, and still logs it", async () => {
        mockGetToken.mockResolvedValue(null);

        const res = await call(publicChain);

        expect(res.statusCode).toBe(200);
        expect(res.headers["X-Request-Id"]).toBeTruthy();
    });
```

Create `lib/__tests__/accountRoutes.test.ts`:

```ts
jest.mock("next-auth/jwt", () => ({ getToken: jest.fn() }));
jest.mock("../account");

import { AxiosError, AxiosHeaders } from "axios";
import { getToken } from "next-auth/jwt";
import passwordHandler from "../../pages/api/account/password";
import resetHandler from "../../pages/api/account/password-reset/index";
import resetConfirmHandler from "../../pages/api/account/password-reset/confirm";
import resendHandler from "../../pages/api/account/challenges/[challengeId]/resend";
import signUpHandler from "../../pages/api/account/sign-up/index";
import confirmHandler from "../../pages/api/account/sign-up/[challengeId]/confirm";
import { changePassword, confirmPasswordReset, confirmSignUp, requestPasswordReset, resendChallenge, signUp } from "../account";

function gatekeeperError(status: number, data: unknown) {
    return new AxiosError("gatekeeper", "ERR", undefined, {}, {
        status, data, statusText: "", headers: {}, config: { headers: new AxiosHeaders() },
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
        await handler({ method, url: "/api/account/x", headers: {}, cookies: {}, query, body } as any, res);
    } finally {
        process.stdout.write = original;
    }
    return res;
}

beforeEach(() => {
    jest.mocked(getToken).mockResolvedValue(null);
});

describe("the public account routes", () => {
    test("sign-up needs no session and answers the challenge", async () => {
        jest.mocked(signUp).mockResolvedValue({ challengeId: "c1" });

        const res = await send(signUpHandler, "POST", {}, { name: "Ana", email: "ana@usp.br", password: "a long password", role: "admin" });

        expect(res.statusCode).toBe(202);
        expect(res.json).toHaveBeenCalledWith({ challengeId: "c1" });
        expect(signUp).toHaveBeenCalledWith({ name: "Ana", email: "ana@usp.br", password: "a long password" });
    });

    test("confirming a sign-up answers 204", async () => {
        jest.mocked(confirmSignUp).mockResolvedValue({ userId: "u1" });

        const res = await send(confirmHandler, "POST", { challengeId: "c1" }, { code: "123456" });

        expect(res.statusCode).toBe(204);
        expect(confirmSignUp).toHaveBeenCalledWith("c1", "123456");
    });

    test("a wrong code keeps its status and code", async () => {
        jest.mocked(confirmSignUp).mockRejectedValue(gatekeeperError(400, { detail: "code_invalid" }));

        const res = await send(confirmHandler, "POST", { challengeId: "c1" }, { code: "000000" });

        expect(res.statusCode).toBe(400);
        expect(res.json).toHaveBeenCalledWith({ detail: "code_invalid" });
    });

    test("an unknown challenge keeps its 404 and code", async () => {
        jest.mocked(confirmSignUp).mockRejectedValue(gatekeeperError(404, { detail: "challenge_not_found" }));

        const res = await send(confirmHandler, "POST", { challengeId: "gone" }, { code: "123456" });

        expect(res.statusCode).toBe(404);
        expect(res.json).toHaveBeenCalledWith({ detail: "challenge_not_found" });
    });

    test("resending too soon keeps its 429", async () => {
        jest.mocked(resendChallenge).mockRejectedValue(gatekeeperError(429, { detail: "resend_too_soon" }));

        const res = await send(resendHandler, "POST", { challengeId: "c1" });

        expect(res.statusCode).toBe(429);
        expect(res.json).toHaveBeenCalledWith({ detail: "resend_too_soon" });
    });

    test("resending answers 202", async () => {
        jest.mocked(resendChallenge).mockResolvedValue(undefined);

        const res = await send(resendHandler, "POST", { challengeId: "c1" });

        expect(res.statusCode).toBe(202);
        expect(resendChallenge).toHaveBeenCalledWith("c1");
    });

    test("asking for a reset answers 202", async () => {
        jest.mocked(requestPasswordReset).mockResolvedValue(undefined);

        const res = await send(resetHandler, "POST", {}, { email: "ana@usp.br" });

        expect(res.statusCode).toBe(202);
        expect(requestPasswordReset).toHaveBeenCalledWith("ana@usp.br");
    });

    test("a reset with a dead token keeps its code", async () => {
        jest.mocked(confirmPasswordReset).mockRejectedValue(gatekeeperError(400, { detail: "token_invalid" }));

        const res = await send(resetConfirmHandler, "POST", {}, { token: "tok", password: "a new long password" });

        expect(res.statusCode).toBe(400);
        expect(res.json).toHaveBeenCalledWith({ detail: "token_invalid" });
        expect(confirmPasswordReset).toHaveBeenCalledWith("tok", "a new long password");
    });

    test("a gatekeeper that does not answer is a 500 with a code", async () => {
        jest.mocked(requestPasswordReset).mockRejectedValue(new Error("ECONNREFUSED"));

        const res = await send(resetHandler, "POST", {}, { email: "ana@usp.br" });

        expect(res.statusCode).toBe(500);
        expect(res.json).toHaveBeenCalledWith({ detail: "unavailable" });
    });

    test("an unsupported method answers 405", async () => {
        const res = await send(signUpHandler, "GET", {});

        expect(res.statusCode).toBe(405);
    });
});

describe("changing the password", () => {
    test("acts as the signed-in user, never one from the body", async () => {
        jest.mocked(getToken).mockResolvedValue({ uid: "u1" } as any);
        jest.mocked(changePassword).mockResolvedValue(undefined);

        const res = await send(passwordHandler, "PUT", {}, { currentPassword: "the old password", newPassword: "the new password", userId: "u2" });

        expect(res.statusCode).toBe(204);
        expect(changePassword).toHaveBeenCalledWith("u1", "the old password", "the new password");
    });

    test("a wrong current password keeps its 401 and code", async () => {
        jest.mocked(getToken).mockResolvedValue({ uid: "u1" } as any);
        jest.mocked(changePassword).mockRejectedValue(gatekeeperError(401, { detail: "invalid_credentials" }));

        const res = await send(passwordHandler, "PUT", {}, { currentPassword: "wrong", newPassword: "the new password" });

        expect(res.statusCode).toBe(401);
        expect(res.json).toHaveBeenCalledWith({ detail: "invalid_credentials" });
    });

    test("needs a session", async () => {
        const res = await send(passwordHandler, "PUT", {}, { currentPassword: "a", newPassword: "b" });

        expect(res.statusCode).toBe(401);
        expect(changePassword).not.toHaveBeenCalled();
    });
});
```

- [ ] **Step 2: Run them and watch them fail**

Run: `npx jest --coverage=false lib/__tests__/middlewareChain.test.ts lib/__tests__/accountRoutes.test.ts`

Expected: FAIL — `middlewareChain.test.ts`: `Module '"../middlewareChain"' has no exported member 'publicChain'`; `accountRoutes.test.ts`: `Cannot find module '../../pages/api/account/password'`.

- [ ] **Step 3: Add the public chain, the handler and the routes**

In `lib/middlewareChain.ts`, immediately after the line `export const authOnlyChain = createRouter<NextApiRequest, NextApiResponse>().use(requestLogging, auth);` insert:

```ts

// Account routes a signed-out visitor needs: sign-up, code confirmation, password reset.
export const publicChain = createRouter<NextApiRequest, NextApiResponse>().use(requestLogging);
```

Create `lib/accountRoute.ts`:

```ts
import axios from "axios";
import type { NextApiRequest, NextApiResponse } from "next";
import { createRouter } from "next-connect";
import { maskPathTokens } from "./externalCalls";
import { logError } from "./logging";
import { publicChain } from "./middlewareChain";

export function publicAccountRouter() {
    return createRouter<NextApiRequest, NextApiResponse>().use(publicChain);
}

/** The account screens map the gatekeeper's `detail` codes to their own copy, so both reach the browser as they were. */
export function accountHandler(router: ReturnType<typeof publicAccountRouter>) {
    return router.handler({
        onError: (err: unknown, req, res) => {
            const response = axios.isAxiosError(err) ? err.response : undefined;
            const status = response?.status ?? 500;
            if (status >= 500) {
                logError("account route failed", err, { method: req.method, path: maskPathTokens((req.url ?? "").split("?")[0]) });
            }
            res.status(status).json({ detail: response?.data?.detail ?? "unavailable" });
        },
        onNoMatch: (req, res) => {
            res.status(405).end(`Method ${req.method} not allowed`);
        },
    });
}
```

Create `pages/api/account/sign-up/index.ts`:

```ts
import { signUp } from "../../../../lib/account";
import { accountHandler, publicAccountRouter } from "../../../../lib/accountRoute";

const router = publicAccountRouter()
    .post(async (req, res) => {
        const { name, email, password } = req.body ?? {};
        res.status(202).json(await signUp({ name, email, password }));
    });

export default accountHandler(router);
```

Create `pages/api/account/sign-up/[challengeId]/confirm.ts`:

```ts
import { confirmSignUp } from "../../../../../lib/account";
import { accountHandler, publicAccountRouter } from "../../../../../lib/accountRoute";

const router = publicAccountRouter()
    .post(async (req, res) => {
        await confirmSignUp(req.query.challengeId as string, req.body?.code);
        res.status(204).end();
    });

export default accountHandler(router);
```

Create `pages/api/account/challenges/[challengeId]/resend.ts`:

```ts
import { resendChallenge } from "../../../../../lib/account";
import { accountHandler, publicAccountRouter } from "../../../../../lib/accountRoute";

const router = publicAccountRouter()
    .post(async (req, res) => {
        await resendChallenge(req.query.challengeId as string);
        res.status(202).end();
    });

export default accountHandler(router);
```

Create `pages/api/account/password-reset/index.ts`:

```ts
import { requestPasswordReset } from "../../../../lib/account";
import { accountHandler, publicAccountRouter } from "../../../../lib/accountRoute";

const router = publicAccountRouter()
    .post(async (req, res) => {
        await requestPasswordReset(req.body?.email);
        res.status(202).end();
    });

export default accountHandler(router);
```

Create `pages/api/account/password-reset/confirm.ts`:

```ts
import { confirmPasswordReset } from "../../../../lib/account";
import { accountHandler, publicAccountRouter } from "../../../../lib/accountRoute";

const router = publicAccountRouter()
    .post(async (req, res) => {
        await confirmPasswordReset(req.body?.token, req.body?.password);
        res.status(204).end();
    });

export default accountHandler(router);
```

Create `pages/api/account/password.ts`:

```ts
import { changePassword } from "../../../lib/account";
import { accountHandler } from "../../../lib/accountRoute";
import { NewContext } from "../../../lib/appLocalContext";
import { bffRouter } from "../../../lib/bffRoute";

const router = bffRouter()
    .put(async (req, res) => {
        const context = await NewContext(req);
        await changePassword(context.uid, req.body?.currentPassword, req.body?.newPassword);
        res.status(204).end();
    });

export default accountHandler(router);
```

- [ ] **Step 4: Run them and watch them pass, then type-check**

Run: `npx jest --coverage=false lib/__tests__/middlewareChain.test.ts lib/__tests__/accountRoutes.test.ts lib/__tests__/serverLogging.invariant.test.ts`
Expected: PASS — 5 + 13 + 2 tests.

Run: `npx tsc --noEmit -p .`
Expected: no output.

- [ ] **Step 5: Commit**

```bash
git add lib/middlewareChain.ts lib/__tests__/middlewareChain.test.ts lib/accountRoute.ts lib/__tests__/accountRoutes.test.ts pages/api/account
git commit -m "$(cat <<'EOF'
feat: BFF routes for sign-up, codes, password reset and change

The public routes go through a chain that only logs. Errors keep the
gatekeeper's status and detail: bffHandler rewrites the detail of a 401
and a 404, which would lose invalid_credentials and challenge_not_found.

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 5: BFFAPI account methods

**Files:**
- Modify: `gateways/BFFAPI.ts`
- Create: `gateways/__tests__/BFFAPI.account.test.ts`

**Interfaces:**
- Consumes: the six BFF routes (Task 4).
- Produces (contract, exact; each rejects with the Axios error, not with `httpErrorHandler`'s `APIError`, so callers read `error.response.data.detail`):
  - `signUp(input: { name: string; email: string; password: string }): Promise<{ challengeId: string }>`
  - `confirmSignUp(challengeId: string, code: string): Promise<void>`
  - `resendChallenge(challengeId: string): Promise<void>`
  - `requestPasswordReset(email: string): Promise<void>`
  - `confirmPasswordReset(token: string, password: string): Promise<void>`
  - `changePassword(currentPassword: string, newPassword: string): Promise<void>`

- [ ] **Step 1: Write the failing test**

Create `gateways/__tests__/BFFAPI.account.test.ts`:

```ts
jest.mock("axios", () => {
    const actual = jest.requireActual("axios");
    return {
        __esModule: true,
        ...actual,
        default: {
            ...actual.default,
            post: jest.fn(),
            put: jest.fn(),
            isAxiosError: actual.default.isAxiosError,
        },
    };
});

import axios, { AxiosError, AxiosHeaders } from "axios";
import { BFFAPI } from "../BFFAPI";

const bff = new BFFAPI();

describe("BFFAPI account", () => {
    test("sign-up answers the challenge id", async () => {
        jest.mocked(axios.post).mockResolvedValue({ status: 202, data: { challengeId: "c1" } });
        const input = { name: "Ana", email: "ana@usp.br", password: "a long password" };

        expect(await bff.signUp(input)).toEqual({ challengeId: "c1" });
        expect(axios.post).toHaveBeenCalledWith("/api/account/sign-up", input);
    });

    test("confirming posts the code to the challenge", async () => {
        jest.mocked(axios.post).mockResolvedValue({ status: 204, data: "" });

        await expect(bff.confirmSignUp("c1", "123456")).resolves.toBeUndefined();
        expect(axios.post).toHaveBeenCalledWith("/api/account/sign-up/c1/confirm", { code: "123456" });
    });

    test("resending posts to the challenge", async () => {
        jest.mocked(axios.post).mockResolvedValue({ status: 202, data: "" });

        await bff.resendChallenge("c1");

        expect(axios.post).toHaveBeenCalledWith("/api/account/challenges/c1/resend");
    });

    test("asking for a reset sends the email", async () => {
        jest.mocked(axios.post).mockResolvedValue({ status: 202, data: "" });

        await bff.requestPasswordReset("ana@usp.br");

        expect(axios.post).toHaveBeenCalledWith("/api/account/password-reset", { email: "ana@usp.br" });
    });

    test("confirming a reset sends the token and the password", async () => {
        jest.mocked(axios.post).mockResolvedValue({ status: 204, data: "" });

        await bff.confirmPasswordReset("tok", "a new long password");

        expect(axios.post).toHaveBeenCalledWith("/api/account/password-reset/confirm", { token: "tok", password: "a new long password" });
    });

    test("changing the password sends no user id", async () => {
        jest.mocked(axios.put).mockResolvedValue({ status: 204, data: "" });

        await bff.changePassword("the old password", "the new password");

        expect(axios.put).toHaveBeenCalledWith("/api/account/password", { currentPassword: "the old password", newPassword: "the new password" });
    });

    test("a refusal rejects with the Axios error, so the screen can read its detail", async () => {
        const refused = new AxiosError("bad", "ERR", undefined, {}, {
            status: 400, data: { detail: "code_invalid" },
            statusText: "", headers: {}, config: { headers: new AxiosHeaders() },
        } as any);
        jest.mocked(axios.post).mockRejectedValue(refused);

        await expect(bff.confirmSignUp("c1", "000000")).rejects.toBe(refused);
    });
});
```

- [ ] **Step 2: Run it and watch it fail**

Run: `npx jest --coverage=false gateways/__tests__/BFFAPI.account.test.ts`

Expected: FAIL — "Test suite failed to run", `Property 'signUp' does not exist on type 'BFFAPI'`.

- [ ] **Step 3: Add the methods**

In `gateways/BFFAPI.ts`, inside `export class BFFAPI`, after the closing `}` of `async acceptInvitation(token: string)` and before the class's final `}`, add:

```ts

    async signUp(input: { name: string; email: string; password: string }): Promise<{ challengeId: string }> {
        const response = await axios.post("/api/account/sign-up", input);
        return response.data as { challengeId: string };
    }

    async confirmSignUp(challengeId: string, code: string): Promise<void> {
        await axios.post(`/api/account/sign-up/${encodeURIComponent(challengeId)}/confirm`, { code });
    }

    async resendChallenge(challengeId: string): Promise<void> {
        await axios.post(`/api/account/challenges/${encodeURIComponent(challengeId)}/resend`);
    }

    async requestPasswordReset(email: string): Promise<void> {
        await axios.post("/api/account/password-reset", { email });
    }

    async confirmPasswordReset(token: string, password: string): Promise<void> {
        await axios.post("/api/account/password-reset/confirm", { token, password });
    }

    async changePassword(currentPassword: string, newPassword: string): Promise<void> {
        await axios.put("/api/account/password", { currentPassword, newPassword });
    }
```

- [ ] **Step 4: Run it and watch it pass**

Run: `npx jest --coverage=false gateways/__tests__/BFFAPI.account.test.ts gateways/__tests__/BFFAPI.embargo.test.ts`
Expected: PASS — 7 new tests, the embargo tests unchanged.

- [ ] **Step 5: Commit**

```bash
git add gateways/BFFAPI.ts gateways/__tests__/BFFAPI.account.test.ts
git commit -m "$(cat <<'EOF'
feat: BFFAPI methods for the account routes

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 6: `CodeInput`

**Files:**
- Create: `components/Account/CodeInput.tsx`, `components/Account/__tests__/CodeInput.test.tsx`

**Interfaces:**
- Consumes: `CODE_LENGTH` (Task 1).
- Produces (contract, exact): `CodeInput({ value, onChange, onComplete, disabled, invalid }: { value: string; onChange: (value: string) => void; onComplete: (code: string) => void; disabled?: boolean; invalid?: boolean })`, a named export. `value` holds the digits typed so far, contiguous from the first box. Behaviour: six boxes labelled "Digit n of 6"; digits only; a digit moves focus to the next box; typing over a filled box replaces its digit; Backspace on a filled box clears it, on an empty box moves back; ArrowLeft/ArrowRight move; focusing a box past the first empty one moves focus to the first empty one; a paste anywhere replaces the whole value with its first six digits (non-digits stripped); several digits arriving at once in a box (OS autofill) are spread from that box; `onComplete(code)` whenever an edit leaves six digits; `inputMode="numeric"` on every box, `autocomplete="one-time-code"` on the first and `"off"` on the others; `invalid` sets `aria-invalid="true"` and `border-error-500`.

- [ ] **Step 1: Write the failing test**

Create `components/Account/__tests__/CodeInput.test.tsx`:

```tsx
/** @jest-environment jsdom */
import { describe, expect, jest, test } from '@jest/globals';
import { fireEvent, render, screen } from '@testing-library/react';
import { useState } from "react";
import { CodeInput } from "../CodeInput";

function Harness(props: { initial?: string, onComplete?: (code: string) => void, disabled?: boolean, invalid?: boolean }) {
    const [value, setValue] = useState(props.initial ?? "");
    return (
        <>
            <CodeInput value={value} onChange={setValue} onComplete={props.onComplete ?? (() => undefined)} disabled={props.disabled} invalid={props.invalid} />
            <output data-testid="value">{value}</output>
        </>
    );
}

function box(n: number): HTMLInputElement {
    return screen.getByLabelText(`Digit ${n} of 6`) as HTMLInputElement;
}

function typed(): string {
    return screen.getByTestId("value").textContent ?? "";
}

describe("CodeInput", () => {
    test("shows six boxes, each labelled", () => {
        render(<Harness />);

        for (let n = 1; n <= 6; n++) {
            expect(box(n)).toBeTruthy();
        }
        expect(screen.getAllByRole("textbox")).toHaveLength(6);
    });

    test("asks for the numeric keyboard, and lets the first box take a code from the OS", () => {
        render(<Harness />);

        expect(box(1).getAttribute("inputmode")).toBe("numeric");
        expect(box(6).getAttribute("inputmode")).toBe("numeric");
        expect(box(1).getAttribute("autocomplete")).toBe("one-time-code");
        expect(box(2).getAttribute("autocomplete")).toBe("off");
    });

    test("typing a digit fills the box and moves to the next one", () => {
        render(<Harness />);
        box(1).focus();

        fireEvent.change(box(1), { target: { value: "4" } });

        expect(typed()).toBe("4");
        expect(box(1).value).toBe("4");
        expect(document.activeElement).toBe(box(2));
    });

    test("a letter is ignored", () => {
        render(<Harness />);
        box(1).focus();

        fireEvent.change(box(1), { target: { value: "a" } });

        expect(typed()).toBe("");
        expect(box(1).value).toBe("");
        expect(document.activeElement).toBe(box(1));
    });

    test("typing over a filled box replaces its digit", () => {
        render(<Harness initial="123" />);

        fireEvent.change(box(2), { target: { value: "27" } });

        expect(typed()).toBe("173");
        expect(document.activeElement).toBe(box(3));
    });

    test("the sixth digit completes the code", () => {
        const onComplete = jest.fn();
        render(<Harness initial="12345" onComplete={onComplete} />);

        fireEvent.change(box(6), { target: { value: "6" } });

        expect(onComplete).toHaveBeenCalledWith("123456");
        expect(onComplete).toHaveBeenCalledTimes(1);
    });

    test("fewer than six digits do not complete it", () => {
        const onComplete = jest.fn();
        render(<Harness initial="1234" onComplete={onComplete} />);

        fireEvent.change(box(5), { target: { value: "5" } });

        expect(onComplete).not.toHaveBeenCalled();
    });

    test("Backspace on a filled box clears it and stays", () => {
        render(<Harness initial="123" />);
        box(3).focus();

        fireEvent.keyDown(box(3), { key: "Backspace" });

        expect(typed()).toBe("12");
        expect(document.activeElement).toBe(box(3));
    });

    test("Backspace on an empty box moves back", () => {
        render(<Harness initial="12" />);
        box(3).focus();

        fireEvent.keyDown(box(3), { key: "Backspace" });

        expect(typed()).toBe("12");
        expect(document.activeElement).toBe(box(2));
    });

    test("Backspace on the first box stays there", () => {
        render(<Harness />);
        box(1).focus();

        fireEvent.keyDown(box(1), { key: "Backspace" });

        expect(document.activeElement).toBe(box(1));
    });

    test("the arrow keys move between boxes", () => {
        render(<Harness initial="1234" />);
        box(2).focus();

        fireEvent.keyDown(box(2), { key: "ArrowRight" });
        expect(document.activeElement).toBe(box(3));

        fireEvent.keyDown(box(3), { key: "ArrowLeft" });
        fireEvent.keyDown(box(2), { key: "ArrowLeft" });
        expect(document.activeElement).toBe(box(1));
    });

    test("an empty box past the first empty one sends the focus back to it", () => {
        render(<Harness initial="12" />);

        box(5).focus();

        expect(document.activeElement).toBe(box(3));
    });

    test("pasting a code fills all six, whatever box it lands in", () => {
        const onComplete = jest.fn();
        render(<Harness onComplete={onComplete} />);
        box(1).focus();

        fireEvent.paste(box(1), { clipboardData: { getData: () => "123 456" } });

        expect(typed()).toBe("123456");
        for (let n = 1; n <= 6; n++) {
            expect(box(n).value).toBe(String(n));
        }
        expect(onComplete).toHaveBeenCalledWith("123456");
    });

    test("a pasted code is cut to six digits, and its non-digits are dropped", () => {
        render(<Harness initial="9" />);

        fireEvent.paste(box(1), { clipboardData: { getData: () => "Your code: 98-76-54-32" } });

        expect(typed()).toBe("987654");
    });

    test("a paste with no digits changes nothing", () => {
        render(<Harness initial="12" />);

        fireEvent.paste(box(1), { clipboardData: { getData: () => "hello" } });

        expect(typed()).toBe("12");
    });

    test("several digits typed at once, as the OS fills a code, are spread over the boxes", () => {
        const onComplete = jest.fn();
        render(<Harness onComplete={onComplete} />);

        fireEvent.change(box(1), { target: { value: "654321" } });

        expect(typed()).toBe("654321");
        expect(onComplete).toHaveBeenCalledWith("654321");
    });

    test("disabled disables every box", () => {
        render(<Harness disabled />);

        for (let n = 1; n <= 6; n++) {
            expect(box(n).disabled).toBe(true);
        }
    });

    test("invalid marks every box for assistive technology and in colour", () => {
        render(<Harness invalid />);

        expect(box(1).getAttribute("aria-invalid")).toBe("true");
        expect(box(1).className).toContain("border-error-500");
    });

    test("valid boxes carry no invalid mark", () => {
        render(<Harness />);

        expect(box(1).getAttribute("aria-invalid")).toBeNull();
        expect(box(1).className).not.toContain("border-error-500");
    });
});
```

- [ ] **Step 2: Run it and watch it fail**

Run: `npx jest --coverage=false components/Account/__tests__/CodeInput.test.tsx`

Expected: FAIL — `Cannot find module '../CodeInput'`.

- [ ] **Step 3: Write the component**

Create `components/Account/CodeInput.tsx`:

```tsx
import { ClipboardEvent, KeyboardEvent, useRef } from "react";
import { CODE_LENGTH } from "../../contants/AccountConstants";

interface Props {
    value: string
    onChange: (value: string) => void
    onComplete: (code: string) => void
    disabled?: boolean
    invalid?: boolean
}

const BOX_CLASS = "w-10 h-12 p-0 text-center text-xl font-semibold font-mono text-primary-900 bg-primary-0 border rounded-md disabled:opacity-60";

export function CodeInput({ value, onChange, onComplete, disabled, invalid }: Props) {
    const boxes = useRef<(HTMLInputElement | null)[]>([]);
    // Focus moves before the parent re-renders with the new value, so the boxes read the length from here.
    const filled = useRef(value.length);
    filled.current = value.length;
    const digits = Array.from({ length: CODE_LENGTH }, (_, index) => value[index] ?? "");

    function focusBox(index: number) {
        boxes.current[Math.max(0, Math.min(CODE_LENGTH - 1, index))]?.focus();
    }

    function update(next: string, focusIndex: number) {
        filled.current = next.length;
        onChange(next);
        focusBox(focusIndex);
        if (next.length === CODE_LENGTH) {
            onComplete(next);
        }
    }

    function fillFrom(index: number, typed: string) {
        const next = (value.slice(0, index) + typed + value.slice(index + typed.length)).slice(0, CODE_LENGTH);
        update(next, index + typed.length);
    }

    function onBoxChange(index: number, raw: string) {
        const typed = raw.replace(/\D/g, "");
        if (!typed) {
            return;
        }
        const previous = digits[index];
        // A box that kept its digit receives it again next to the new one; only the new one counts.
        if (previous && typed.length === 2) {
            fillFrom(index, typed[0] === previous ? typed[1] : typed[0]);
        } else {
            fillFrom(index, typed);
        }
    }

    function onKeyDown(index: number, event: KeyboardEvent<HTMLInputElement>) {
        if (event.key === "Backspace") {
            event.preventDefault();
            if (digits[index]) {
                const next = value.slice(0, index) + value.slice(index + 1);
                filled.current = next.length;
                onChange(next);
            } else {
                focusBox(index - 1);
            }
        } else if (event.key === "ArrowLeft") {
            event.preventDefault();
            focusBox(index - 1);
        } else if (event.key === "ArrowRight") {
            event.preventDefault();
            focusBox(index + 1);
        }
    }

    function onPaste(event: ClipboardEvent<HTMLInputElement>) {
        event.preventDefault();
        const pasted = event.clipboardData.getData("text").replace(/\D/g, "").slice(0, CODE_LENGTH);
        if (pasted) {
            update(pasted, pasted.length);
        }
    }

    return (
        <div role="group" aria-label="Verification code" className="flex gap-2">
            {digits.map((digit, index) => (
                <input
                    key={index}
                    ref={(element) => { boxes.current[index] = element; }}
                    value={digit}
                    onChange={(event) => onBoxChange(index, event.target.value)}
                    onKeyDown={(event) => onKeyDown(index, event)}
                    onPaste={onPaste}
                    onFocus={(event) => {
                        if (index > filled.current) {
                            focusBox(filled.current);
                        } else {
                            event.target.select();
                        }
                    }}
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    autoComplete={index === 0 ? "one-time-code" : "off"}
                    aria-label={`Digit ${index + 1} of ${CODE_LENGTH}`}
                    aria-invalid={invalid ? true : undefined}
                    disabled={disabled}
                    className={`${BOX_CLASS} ${invalid ? "border-error-500" : "border-primary-300"}`}
                />
            ))}
        </div>
    );
}
```

- [ ] **Step 4: Run it and watch it pass**

Run: `npx jest --coverage=false components/Account/__tests__/CodeInput.test.tsx`
Expected: PASS, 19 tests.

- [ ] **Step 5: Commit**

```bash
git add components/Account/CodeInput.tsx components/Account/__tests__/CodeInput.test.tsx
git commit -m "$(cat <<'EOF'
feat: CodeInput, six boxes for a confirmation code

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 7: `VerificationCodeForm`

**Files:**
- Create: `components/Account/VerificationCodeForm.tsx`, `components/Account/__tests__/VerificationCodeForm.test.tsx`

**Interfaces:**
- Consumes: `CodeInput` (Task 6); `CODE_LENGTH`, `RESEND_COOLDOWN_SECONDS`, `accountErrorMessage` (Task 1).
- Produces (contract, exact): `VerificationCodeForm({ email, onSubmit, onResend }: { email: string; onSubmit: (code: string) => Promise<void>; onResend: () => Promise<void> })`, a named export. Submits on the sixth digit and on "Confirm"; on rejection shows `accountErrorMessage(error.response.data.detail)` in `role="alert"`, marks the boxes invalid and clears them; "Resend code in Ns" disabled for 90 s from mount and from each successful resend, then "Resend code"; a successful resend shows "We sent a new code to {email}." in `role="status"`. It uses component state, not Formik: Formik 2.4.5's `submitForm` submits the values of the last render (`executeSubmit` closes over them), so submitting right after `setFieldValue` from `onComplete` would send the previous code.

- [ ] **Step 1: Write the failing test**

Create `components/Account/__tests__/VerificationCodeForm.test.tsx`:

```tsx
/** @jest-environment jsdom */
import { afterEach, describe, expect, jest, test } from '@jest/globals';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { VerificationCodeForm } from "../VerificationCodeForm";

function refused(detail: string) {
    return { response: { status: 400, data: { detail } } };
}

function typeCode(code: string) {
    fireEvent.paste(screen.getByLabelText("Digit 1 of 6"), { clipboardData: { getData: () => code } });
}

afterEach(() => {
    jest.useRealTimers();
});

describe("VerificationCodeForm", () => {
    test("says where the code went and that it can take a minute", () => {
        const { container } = render(<VerificationCodeForm email="ana@usp.br" onSubmit={jest.fn<() => Promise<void>>()} onResend={jest.fn<() => Promise<void>>()} />);

        expect(screen.getByText("ana@usp.br")).toBeTruthy();
        expect(container.textContent).toContain("We sent a 6-digit code to ana@usp.br. It can take up to a minute to arrive and expires in 15 minutes.");
    });

    test("submits as soon as the sixth digit is in", async () => {
        const onSubmit = jest.fn<(code: string) => Promise<void>>().mockResolvedValue(undefined);
        render(<VerificationCodeForm email="ana@usp.br" onSubmit={onSubmit} onResend={jest.fn<() => Promise<void>>()} />);

        await act(async () => typeCode("123456"));

        expect(onSubmit).toHaveBeenCalledWith("123456");
        expect(onSubmit).toHaveBeenCalledTimes(1);
    });

    test("Confirm sends the code in the boxes again", async () => {
        const onSubmit = jest.fn<(code: string) => Promise<void>>().mockResolvedValue(undefined);
        render(<VerificationCodeForm email="ana@usp.br" onSubmit={onSubmit} onResend={jest.fn<() => Promise<void>>()} />);
        await act(async () => typeCode("123456"));

        await act(async () => fireEvent.click(screen.getByRole("button", { name: "Confirm" })));

        expect(onSubmit).toHaveBeenCalledTimes(2);
        expect(onSubmit).toHaveBeenLastCalledWith("123456");
    });

    test("Confirm waits for six digits", () => {
        render(<VerificationCodeForm email="ana@usp.br" onSubmit={jest.fn<() => Promise<void>>()} onResend={jest.fn<() => Promise<void>>()} />);

        typeCode("123");

        expect((screen.getByRole("button", { name: "Confirm" }) as HTMLButtonElement).disabled).toBe(true);
    });

    test.each`
        detail                      | message
        ${"code_invalid"}           | ${"Invalid code."}
        ${"code_expired"}           | ${"Code expired, request a new one."}
        ${"code_attempts_exceeded"} | ${"Too many attempts. Request a new code."}
    `("explains $detail and clears the boxes", async ({ detail, message }) => {
        const onSubmit = jest.fn<(code: string) => Promise<void>>().mockRejectedValue(refused(detail as string));
        render(<VerificationCodeForm email="ana@usp.br" onSubmit={onSubmit} onResend={jest.fn<() => Promise<void>>()} />);

        await act(async () => typeCode("123456"));

        expect(screen.getByRole("alert").textContent).toBe(message);
        expect((screen.getByLabelText("Digit 1 of 6") as HTMLInputElement).value).toBe("");
        expect(screen.getByLabelText("Digit 1 of 6").getAttribute("aria-invalid")).toBe("true");
    });

    test("cannot resend until the countdown ends", () => {
        jest.useFakeTimers();
        render(<VerificationCodeForm email="ana@usp.br" onSubmit={jest.fn<() => Promise<void>>()} onResend={jest.fn<() => Promise<void>>()} />);

        const button = screen.getByRole("button", { name: "Resend code in 90s" }) as HTMLButtonElement;
        expect(button.disabled).toBe(true);

        act(() => { jest.advanceTimersByTime(89_000); });
        expect(screen.getByRole("button", { name: "Resend code in 1s" })).toBeTruthy();

        act(() => { jest.advanceTimersByTime(1_000); });
        expect((screen.getByRole("button", { name: "Resend code" }) as HTMLButtonElement).disabled).toBe(false);
    });

    test("resending says so and starts the countdown again", async () => {
        jest.useFakeTimers();
        const onResend = jest.fn<() => Promise<void>>().mockResolvedValue(undefined);
        render(<VerificationCodeForm email="ana@usp.br" onSubmit={jest.fn<() => Promise<void>>()} onResend={onResend} />);
        act(() => { jest.advanceTimersByTime(90_000); });

        await act(async () => fireEvent.click(screen.getByRole("button", { name: "Resend code" })));

        expect(onResend).toHaveBeenCalledTimes(1);
        expect(screen.getByRole("status").textContent).toBe("We sent a new code to ana@usp.br.");
        expect(screen.getByRole("button", { name: "Resend code in 90s" })).toBeTruthy();
    });

    test("a refused resend is explained", async () => {
        jest.useFakeTimers();
        const onResend = jest.fn<() => Promise<void>>().mockRejectedValue({ response: { status: 429, data: { detail: "resend_too_soon" } } });
        render(<VerificationCodeForm email="ana@usp.br" onSubmit={jest.fn<() => Promise<void>>()} onResend={onResend} />);
        act(() => { jest.advanceTimersByTime(90_000); });

        await act(async () => fireEvent.click(screen.getByRole("button", { name: "Resend code" })));

        await waitFor(() => expect(screen.getByRole("alert").textContent).toBe("Wait a moment before asking for another code."));
    });
});
```

- [ ] **Step 2: Run it and watch it fail**

Run: `npx jest --coverage=false components/Account/__tests__/VerificationCodeForm.test.tsx`

Expected: FAIL — `Cannot find module '../VerificationCodeForm'`.

- [ ] **Step 3: Write the component**

Create `components/Account/VerificationCodeForm.tsx`:

```tsx
import { FormEvent, useEffect, useState } from "react";
import { CODE_LENGTH, RESEND_COOLDOWN_SECONDS, accountErrorMessage } from "../../contants/AccountConstants";
import { CodeInput } from "./CodeInput";

interface Props {
    email: string
    onSubmit: (code: string) => Promise<void>
    onResend: () => Promise<void>
}

function detailOf(error: unknown): string | undefined {
    return (error as { response?: { data?: { detail?: string } } })?.response?.data?.detail;
}

// One auto-submitting field: Formik's submitForm reads the values of the last render, so the code is passed directly.
export function VerificationCodeForm({ email, onSubmit, onResend }: Props) {
    const [code, setCode] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [notice, setNotice] = useState<string | null>(null);
    const [secondsLeft, setSecondsLeft] = useState(RESEND_COOLDOWN_SECONDS);
    const [resending, setResending] = useState(false);
    const counting = secondsLeft > 0;

    useEffect(() => {
        if (!counting) {
            return;
        }
        const timer = setInterval(() => setSecondsLeft((seconds) => Math.max(0, seconds - 1)), 1000);
        return () => clearInterval(timer);
    }, [counting]);

    async function submit(value: string) {
        if (submitting || value.length !== CODE_LENGTH) {
            return;
        }
        setSubmitting(true);
        setError(null);
        setNotice(null);
        try {
            await onSubmit(value);
        } catch (e) {
            setError(accountErrorMessage(detailOf(e)));
            setCode("");
        } finally {
            setSubmitting(false);
        }
    }

    async function resend() {
        setResending(true);
        setError(null);
        setNotice(null);
        try {
            await onResend();
            setCode("");
            setNotice(`We sent a new code to ${email}.`);
            setSecondsLeft(RESEND_COOLDOWN_SECONDS);
        } catch (e) {
            setError(accountErrorMessage(detailOf(e)));
        } finally {
            setResending(false);
        }
    }

    function onFormSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        submit(code);
    }

    return (
        <form onSubmit={onFormSubmit} className="flex flex-col gap-4">
            <p className="m-0 text-sm text-primary-700">
                We sent a {CODE_LENGTH}-digit code to <span className="font-semibold text-primary-900">{email}</span>. It can take up to a minute to arrive and expires in 15 minutes.
            </p>
            <CodeInput value={code} onChange={setCode} onComplete={submit} disabled={submitting} invalid={error !== null} />
            {error && <p role="alert" className="m-0 text-sm text-error-600">{error}</p>}
            {notice && <p role="status" className="m-0 text-sm text-primary-700">{notice}</p>}
            <div className="flex flex-wrap items-center gap-3">
                <button type="submit" className="btn-primary m-0" disabled={submitting || code.length !== CODE_LENGTH}>
                    {submitting ? "Checking…" : "Confirm"}
                </button>
                <button type="button" className="btn-primary-outline m-0" disabled={counting || resending} onClick={resend}>
                    {counting ? `Resend code in ${secondsLeft}s` : "Resend code"}
                </button>
            </div>
        </form>
    );
}
```

- [ ] **Step 4: Run it and watch it pass**

Run: `npx jest --coverage=false components/Account/__tests__/VerificationCodeForm.test.tsx`
Expected: PASS, 10 tests.

- [ ] **Step 5: Commit**

```bash
git add components/Account/VerificationCodeForm.tsx components/Account/__tests__/VerificationCodeForm.test.tsx
git commit -m "$(cat <<'EOF'
feat: VerificationCodeForm with code errors and a resend countdown

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 8: `SignInForm` and the shared Yup fields

**Files:**
- Create: `lib/accountValidation.ts`, `components/Account/SignInForm.tsx`, `components/Account/__tests__/SignInForm.test.tsx`

**Interfaces:**
- Consumes: `signIn` from `next-auth/react` (returns `{ ok, error, status, url } | undefined` with `redirect: false`); `Router.push` from `next/router`; `INVALID_SIGN_IN_MESSAGE`, `PASSWORD_LENGTH_MESSAGE`, `PASSWORD_MIN_LENGTH`, `PASSWORD_MAX_LENGTH` (Task 1); `GENERIC_ERROR_MESSAGE`; `ROUTE_PAGE_FORGOT_PASSWORD`; `EDIT_FORM_*` classes.
- Produces: `emailField` and `newPasswordField` (Yup string schemas) in `lib/accountValidation.ts`; `SignInForm({ callbackUrl }: { callbackUrl: string })`, a named export. It calls `signIn("credentials", { email: <trimmed>, password, redirect: false, callbackUrl })`, pushes `result.url ?? callbackUrl` on success, shows `INVALID_SIGN_IN_MESSAGE` for `CredentialsSignin` and `GENERIC_ERROR_MESSAGE` for any other error.

- [ ] **Step 1: Write the failing test**

Create `components/Account/__tests__/SignInForm.test.tsx`:

```tsx
/** @jest-environment jsdom */
import { beforeEach, describe, expect, jest, test } from '@jest/globals';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';

const signIn = jest.fn() as any;
const push = jest.fn() as any;

jest.mock("next-auth/react", () => ({ signIn: (...args: unknown[]) => signIn(...args) }));
jest.mock("next/router", () => ({ __esModule: true, default: { push: (...args: unknown[]) => push(...args) } }));

import { SignInForm } from "../SignInForm";

function fill(email: string, password: string) {
    fireEvent.change(screen.getByLabelText("Email"), { target: { value: email } });
    fireEvent.change(screen.getByLabelText("Password"), { target: { value: password } });
}

async function submit() {
    await act(async () => {
        fireEvent.click(screen.getByRole("button", { name: "Sign in" }));
    });
}

beforeEach(() => {
    signIn.mockReset();
    push.mockReset();
});

describe("SignInForm", () => {
    test("signs in with the trimmed email and goes to the callback", async () => {
        signIn.mockResolvedValue({ ok: true, error: null, status: 200, url: "http://localhost:3000/app/datasets" });
        render(<SignInForm callbackUrl="/app/datasets" />);
        fill(" ana@usp.br ", "a long password");

        await submit();

        await waitFor(() => expect(signIn).toHaveBeenCalledWith("credentials", {
            email: "ana@usp.br", password: "a long password", redirect: false, callbackUrl: "/app/datasets",
        }));
        expect(push).toHaveBeenCalledWith("http://localhost:3000/app/datasets");
    });

    test("a refused password says so, and stays", async () => {
        signIn.mockResolvedValue({ ok: false, error: "CredentialsSignin", status: 401, url: null });
        render(<SignInForm callbackUrl="/" />);
        fill("ana@usp.br", "wrong password");

        await submit();

        await waitFor(() => expect(screen.getByRole("alert").textContent).toBe("Invalid email or password."));
        expect(push).not.toHaveBeenCalled();
    });

    test("a sign-in that failed for another reason does not blame the password", async () => {
        signIn.mockResolvedValue({ ok: false, error: "sign_in_unavailable", status: 401, url: null });
        render(<SignInForm callbackUrl="/" />);
        fill("ana@usp.br", "a long password");

        await submit();

        await waitFor(() => expect(screen.getByRole("alert").textContent).toBe("Something went wrong. Please try again."));
    });

    test("empty fields are explained and nothing is sent", async () => {
        render(<SignInForm callbackUrl="/" />);

        await submit();

        await waitFor(() => expect(screen.getByText("Enter your email address.")).toBeTruthy());
        expect(screen.getByText("Enter your password.")).toBeTruthy();
        expect(signIn).not.toHaveBeenCalled();
    });

    test("offers the way back into an account whose password is forgotten", () => {
        render(<SignInForm callbackUrl="/" />);

        expect(screen.getByRole("link", { name: "Forgot password?" }).getAttribute("href")).toBe("/account/forgot-password");
    });
});
```

- [ ] **Step 2: Run it and watch it fail**

Run: `npx jest --coverage=false components/Account/__tests__/SignInForm.test.tsx`

Expected: FAIL — `Cannot find module '../SignInForm'`.

- [ ] **Step 3: Write the shared fields and the form**

Create `lib/accountValidation.ts`:

```ts
import * as Yup from "yup";
import { PASSWORD_LENGTH_MESSAGE, PASSWORD_MAX_LENGTH, PASSWORD_MIN_LENGTH } from "../contants/AccountConstants";

export const emailField = Yup.string()
    .email("Enter a valid email address.")
    .required("Enter your email address.");

export const newPasswordField = Yup.string()
    .min(PASSWORD_MIN_LENGTH, PASSWORD_LENGTH_MESSAGE)
    .max(PASSWORD_MAX_LENGTH, PASSWORD_LENGTH_MESSAGE)
    .required("Choose a password.");
```

Create `components/Account/SignInForm.tsx`:

```tsx
import { ErrorMessage, Field, Form, Formik } from "formik";
import { signIn } from "next-auth/react";
import Link from "next/link";
import Router from "next/router";
import { useState } from "react";
import * as Yup from "yup";
import { INVALID_SIGN_IN_MESSAGE } from "../../contants/AccountConstants";
import { EDIT_FORM_ERROR_CLASS, EDIT_FORM_INPUT_CLASS, EDIT_FORM_LABEL_CLASS } from "../../contants/EditFormConstants";
import { GENERIC_ERROR_MESSAGE } from "../../contants/EmbargoConstants";
import { ROUTE_PAGE_FORGOT_PASSWORD } from "../../contants/InternalRoutesConstants";
import { emailField } from "../../lib/accountValidation";

const schema = Yup.object({
    email: emailField,
    password: Yup.string().required("Enter your password."),
});

export function SignInForm({ callbackUrl }: { callbackUrl: string }) {
    const [error, setError] = useState<string | null>(null);

    async function onSubmit(values: { email: string, password: string }) {
        setError(null);
        const result = await signIn("credentials", {
            email: values.email.trim(),
            password: values.password,
            redirect: false,
            callbackUrl,
        });
        if (!result || result.error) {
            setError(result?.error === "CredentialsSignin" ? INVALID_SIGN_IN_MESSAGE : GENERIC_ERROR_MESSAGE);
            return;
        }
        await Router.push(result.url ?? callbackUrl);
    }

    return (
        <Formik initialValues={{ email: "", password: "" }} validationSchema={schema} onSubmit={onSubmit}>
            {({ isSubmitting }) => (
                <Form noValidate className="flex flex-col gap-4">
                    <div>
                        <label htmlFor="sign-in-email" className={EDIT_FORM_LABEL_CLASS}>Email</label>
                        <Field id="sign-in-email" name="email" type="email" autoComplete="email" className={EDIT_FORM_INPUT_CLASS} />
                        <ErrorMessage name="email" component="p" className={EDIT_FORM_ERROR_CLASS} />
                    </div>
                    <div>
                        <label htmlFor="sign-in-password" className={EDIT_FORM_LABEL_CLASS}>Password</label>
                        <Field id="sign-in-password" name="password" type="password" autoComplete="current-password" className={EDIT_FORM_INPUT_CLASS} />
                        <ErrorMessage name="password" component="p" className={EDIT_FORM_ERROR_CLASS} />
                    </div>
                    {error && <p role="alert" className="m-0 text-sm text-error-600">{error}</p>}
                    <button type="submit" disabled={isSubmitting} className="btn-primary m-0">Sign in</button>
                    <Link href={ROUTE_PAGE_FORGOT_PASSWORD} className="self-start text-sm underline underline-offset-2">Forgot password?</Link>
                </Form>
            )}
        </Formik>
    );
}
```

- [ ] **Step 4: Run it and watch it pass**

Run: `npx jest --coverage=false components/Account/__tests__/SignInForm.test.tsx`
Expected: PASS, 5 tests.

- [ ] **Step 5: Commit**

```bash
git add lib/accountValidation.ts components/Account/SignInForm.tsx components/Account/__tests__/SignInForm.test.tsx
git commit -m "$(cat <<'EOF'
feat: email and password sign-in form

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 9: `SignUpForm`

**Files:**
- Create: `components/Account/SignUpForm.tsx`, `components/Account/__tests__/SignUpForm.test.tsx`

**Interfaces:**
- Consumes: `BFFAPI.signUp`, `BFFAPI.confirmSignUp`, `BFFAPI.resendChallenge` (Task 5); `VerificationCodeForm` (Task 7); `emailField`, `newPasswordField` (Task 8); `signIn`; `Router.push`; `loginUrlFor` from `lib/authRoutes.ts`; `accountErrorMessage`, `PASSWORD_MIN_LENGTH`.
- Produces: `SignUpForm({ callbackUrl }: { callbackUrl: string })`, a named export. Step 1: Formik name/email/password (Yup: name required after trim, email valid, password 10–128) → `signUp` with trimmed name and email. Step 2, same tab: `VerificationCodeForm` whose `onSubmit` confirms, then `signIn("credentials", { email, password, redirect: false, callbackUrl })` and pushes `result.url`, or the sign-in page if that sign-in fails; "Use a different email" returns to step 1 with the values kept.

- [ ] **Step 1: Write the failing test**

Create `components/Account/__tests__/SignUpForm.test.tsx`:

```tsx
/** @jest-environment jsdom */
import { beforeEach, describe, expect, jest, test } from '@jest/globals';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';

const signIn = jest.fn() as any;
const push = jest.fn() as any;
const signUp = jest.fn() as any;
const confirmSignUp = jest.fn() as any;
const resendChallenge = jest.fn() as any;

jest.mock("next-auth/react", () => ({ signIn: (...args: unknown[]) => signIn(...args) }));
jest.mock("next/router", () => ({ __esModule: true, default: { push: (...args: unknown[]) => push(...args) } }));
jest.mock("../../../gateways/BFFAPI", () => ({
    BFFAPI: jest.fn().mockImplementation(() => ({ signUp, confirmSignUp, resendChallenge })),
}));

import { SignUpForm } from "../SignUpForm";

function fill(name: string, email: string, password: string) {
    fireEvent.change(screen.getByLabelText("Name"), { target: { value: name } });
    fireEvent.change(screen.getByLabelText("Email"), { target: { value: email } });
    fireEvent.change(screen.getByLabelText("Password"), { target: { value: password } });
}

async function createAccount() {
    await act(async () => {
        fireEvent.click(screen.getByRole("button", { name: "Create account" }));
    });
}

async function typeCode(code: string) {
    await act(async () => {
        fireEvent.paste(screen.getByLabelText("Digit 1 of 6"), { clipboardData: { getData: () => code } });
    });
}

beforeEach(() => {
    for (const mock of [signIn, push, signUp, confirmSignUp, resendChallenge]) {
        mock.mockReset();
    }
    signUp.mockResolvedValue({ challengeId: "c1" });
});

describe("SignUpForm", () => {
    test("a password shorter than ten characters is refused before anything is sent", async () => {
        render(<SignUpForm callbackUrl="/" />);
        fill("Ana", "ana@usp.br", "short");

        await createAccount();

        await waitFor(() => expect(screen.getByText("Use 10 to 128 characters.")).toBeTruthy());
        expect(signUp).not.toHaveBeenCalled();
    });

    test("a password longer than 128 characters is refused too", async () => {
        render(<SignUpForm callbackUrl="/" />);
        fill("Ana", "ana@usp.br", "x".repeat(129));

        await createAccount();

        await waitFor(() => expect(screen.getByText("Use 10 to 128 characters.")).toBeTruthy());
        expect(signUp).not.toHaveBeenCalled();
    });

    test("a name and a valid email are required", async () => {
        render(<SignUpForm callbackUrl="/" />);
        fill("   ", "not-an-email", "a long password");

        await createAccount();

        await waitFor(() => expect(screen.getByText("Enter your name.")).toBeTruthy());
        expect(screen.getByText("Enter a valid email address.")).toBeTruthy();
        expect(signUp).not.toHaveBeenCalled();
    });

    test("the details are sent trimmed, then the same tab asks for the code", async () => {
        render(<SignUpForm callbackUrl="/" />);
        fill(" Ana ", " ana@usp.br ", "a long password");

        await createAccount();

        await waitFor(() => expect(screen.getByLabelText("Digit 1 of 6")).toBeTruthy());
        expect(signUp).toHaveBeenCalledWith({ name: "Ana", email: "ana@usp.br", password: "a long password" });
        expect(screen.getByText("ana@usp.br")).toBeTruthy();
    });

    test("a confirmed code signs in with the same email and password, then goes to the callback", async () => {
        confirmSignUp.mockResolvedValue(undefined);
        signIn.mockResolvedValue({ ok: true, error: null, status: 200, url: "http://localhost:3000/app/home" });
        render(<SignUpForm callbackUrl="/app/home" />);
        fill("Ana", "ana@usp.br", "a long password");
        await createAccount();
        await waitFor(() => expect(screen.getByLabelText("Digit 1 of 6")).toBeTruthy());

        await typeCode("123456");

        await waitFor(() => expect(push).toHaveBeenCalledWith("http://localhost:3000/app/home"));
        expect(confirmSignUp).toHaveBeenCalledWith("c1", "123456");
        expect(signIn).toHaveBeenCalledWith("credentials", {
            email: "ana@usp.br", password: "a long password", redirect: false, callbackUrl: "/app/home",
        });
    });

    test("a wrong code is explained and nobody is signed in", async () => {
        confirmSignUp.mockRejectedValue({ response: { status: 400, data: { detail: "code_invalid" } } });
        render(<SignUpForm callbackUrl="/" />);
        fill("Ana", "ana@usp.br", "a long password");
        await createAccount();
        await waitFor(() => expect(screen.getByLabelText("Digit 1 of 6")).toBeTruthy());

        await typeCode("000000");

        await waitFor(() => expect(screen.getByRole("alert").textContent).toBe("Invalid code."));
        expect(signIn).not.toHaveBeenCalled();
    });

    test("resending asks the gatekeeper for the same challenge", async () => {
        jest.useFakeTimers();
        try {
            resendChallenge.mockResolvedValue(undefined);
            render(<SignUpForm callbackUrl="/" />);
            fill("Ana", "ana@usp.br", "a long password");
            await createAccount();
            await waitFor(() => expect(screen.getByLabelText("Digit 1 of 6")).toBeTruthy());
            act(() => { jest.advanceTimersByTime(90_000); });

            await act(async () => {
                fireEvent.click(screen.getByRole("button", { name: "Resend code" }));
            });

            expect(resendChallenge).toHaveBeenCalledWith("c1");
        } finally {
            jest.useRealTimers();
        }
    });

    test("another email goes back to the details, keeping them", async () => {
        render(<SignUpForm callbackUrl="/" />);
        fill("Ana", "ana@usp.br", "a long password");
        await createAccount();
        await waitFor(() => expect(screen.getByLabelText("Digit 1 of 6")).toBeTruthy());

        fireEvent.click(screen.getByRole("button", { name: "Use a different email" }));

        expect((screen.getByLabelText("Name") as HTMLInputElement).value).toBe("Ana");
        expect((screen.getByLabelText("Email") as HTMLInputElement).value).toBe("ana@usp.br");
    });

    test("a refused sign-up stays on the details and says why", async () => {
        signUp.mockRejectedValue({ response: { status: 400, data: { detail: "something_new" } } });
        render(<SignUpForm callbackUrl="/" />);
        fill("Ana", "ana@usp.br", "a long password");

        await createAccount();

        await waitFor(() => expect(screen.getByRole("alert").textContent).toBe("Something went wrong. Please try again."));
        expect(screen.queryByLabelText("Digit 1 of 6")).toBeNull();
    });
});
```

- [ ] **Step 2: Run it and watch it fail**

Run: `npx jest --coverage=false components/Account/__tests__/SignUpForm.test.tsx`

Expected: FAIL — `Cannot find module '../SignUpForm'`.

- [ ] **Step 3: Write the form**

Create `components/Account/SignUpForm.tsx`:

```tsx
import { ErrorMessage, Field, Form, Formik } from "formik";
import { signIn } from "next-auth/react";
import Router from "next/router";
import { useState } from "react";
import * as Yup from "yup";
import { PASSWORD_MIN_LENGTH, accountErrorMessage } from "../../contants/AccountConstants";
import { EDIT_FORM_ERROR_CLASS, EDIT_FORM_HINT_CLASS, EDIT_FORM_INPUT_CLASS, EDIT_FORM_LABEL_CLASS } from "../../contants/EditFormConstants";
import { BFFAPI } from "../../gateways/BFFAPI";
import { emailField, newPasswordField } from "../../lib/accountValidation";
import { loginUrlFor } from "../../lib/authRoutes";
import { VerificationCodeForm } from "./VerificationCodeForm";

interface Details {
    name: string
    email: string
    password: string
}

const schema = Yup.object({
    name: Yup.string().trim().required("Enter your name."),
    email: emailField,
    password: newPasswordField,
});

export function SignUpForm({ callbackUrl }: { callbackUrl: string }) {
    const [bffGateway] = useState(() => new BFFAPI());
    const [details, setDetails] = useState<Details>({ name: "", email: "", password: "" });
    const [challengeId, setChallengeId] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    async function onSubmit(values: Details) {
        setError(null);
        const submitted = { name: values.name.trim(), email: values.email.trim(), password: values.password };
        try {
            const challenge = await bffGateway.signUp(submitted);
            setDetails(submitted);
            setChallengeId(challenge.challengeId);
        } catch (e) {
            setError(accountErrorMessage(e?.response?.data?.detail));
        }
    }

    async function confirm(code: string) {
        await bffGateway.confirmSignUp(challengeId, code);
        const result = await signIn("credentials", {
            email: details.email,
            password: details.password,
            redirect: false,
            callbackUrl,
        });
        await Router.push(result && !result.error && result.url ? result.url : loginUrlFor(callbackUrl));
    }

    if (challengeId) {
        return (
            <div className="flex flex-col gap-4">
                <VerificationCodeForm email={details.email} onSubmit={confirm} onResend={() => bffGateway.resendChallenge(challengeId)} />
                <button type="button" className="self-start text-sm font-medium text-primary-900 underline underline-offset-2" onClick={() => setChallengeId(null)}>
                    Use a different email
                </button>
            </div>
        );
    }

    return (
        <Formik initialValues={details} validationSchema={schema} onSubmit={onSubmit}>
            {({ isSubmitting }) => (
                <Form noValidate className="flex flex-col gap-4">
                    <div>
                        <label htmlFor="sign-up-name" className={EDIT_FORM_LABEL_CLASS}>Name</label>
                        <Field id="sign-up-name" name="name" type="text" autoComplete="name" className={EDIT_FORM_INPUT_CLASS} />
                        <ErrorMessage name="name" component="p" className={EDIT_FORM_ERROR_CLASS} />
                    </div>
                    <div>
                        <label htmlFor="sign-up-email" className={EDIT_FORM_LABEL_CLASS}>Email</label>
                        <Field id="sign-up-email" name="email" type="email" autoComplete="email" className={EDIT_FORM_INPUT_CLASS} />
                        <ErrorMessage name="email" component="p" className={EDIT_FORM_ERROR_CLASS} />
                    </div>
                    <div>
                        <label htmlFor="sign-up-password" className={EDIT_FORM_LABEL_CLASS}>Password</label>
                        <Field id="sign-up-password" name="password" type="password" autoComplete="new-password" className={EDIT_FORM_INPUT_CLASS} />
                        <p className={`${EDIT_FORM_HINT_CLASS} mt-1`}>At least {PASSWORD_MIN_LENGTH} characters.</p>
                        <ErrorMessage name="password" component="p" className={EDIT_FORM_ERROR_CLASS} />
                    </div>
                    {error && <p role="alert" className="m-0 text-sm text-error-600">{error}</p>}
                    <button type="submit" disabled={isSubmitting} className="btn-primary m-0">Create account</button>
                </Form>
            )}
        </Formik>
    );
}
```

- [ ] **Step 4: Run it and watch it pass**

Run: `npx jest --coverage=false components/Account/__tests__/SignUpForm.test.tsx`
Expected: PASS, 9 tests.

- [ ] **Step 5: Commit**

```bash
git add components/Account/SignUpForm.tsx components/Account/__tests__/SignUpForm.test.tsx
git commit -m "$(cat <<'EOF'
feat: sign-up form with the code step in the same tab

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 10: Login page tabs from `phase`

**Files:**
- Modify: `lib/authRoutes.ts`, `lib/__tests__/authRoutes.test.ts`, `pages/account/login/index.tsx`

**Interfaces:**
- Consumes: `SignInForm` (Task 8), `SignUpForm` (Task 9), `Tabs`/`TabPanel` from `components/DatasetDetails/` (`defaultSelectedIndex`, `onTabChanged(tabId)`; only the selected child is rendered).
- Produces: `loginTabFor(phase?: string | string[]): number` (`"sign-up"` → 1, anything else → 0) and `loginPhaseFor(tabIndex: number): string` (`0` → `"sign-in"`, `1` → `"sign-up"`, else `"sign-in"`) in `lib/authRoutes.ts`. The page renders tabs "Sign in" and "Create account"; switching tab rewrites `phase` with a shallow `Router.replace`; `callbackUrl`, `error` and `isDoi` keep their current behaviour; the John Doe form is gone.

- [ ] **Step 1: Write the failing test**

Append to `lib/__tests__/authRoutes.test.ts`:

```ts

import { loginPhaseFor, loginTabFor } from "../authRoutes";

test.each([
  ["sign-in", 0],
  ["sign-up", 1],
  [undefined, 0],
  ["made-up", 0],
  [["sign-up", "sign-in"], 0],
] as [string | string[] | undefined, number][])("the login page opens the tab for phase %p", (phase, tab) => {
  expect(loginTabFor(phase)).toBe(tab);
});

test("each tab writes its phase back", () => {
  expect(loginPhaseFor(0)).toBe("sign-in");
  expect(loginPhaseFor(1)).toBe("sign-up");
  expect(loginPhaseFor(7)).toBe("sign-in");
});
```

- [ ] **Step 2: Run it and watch it fail**

Run: `npx jest --coverage=false lib/__tests__/authRoutes.test.ts`

Expected: FAIL — `Module '"../authRoutes"' has no exported member 'loginPhaseFor'`.

- [ ] **Step 3: Add the helpers**

Append to `lib/authRoutes.ts`:

```ts

const LOGIN_PHASES = ["sign-in", "sign-up"];

/** Tab of the login page for its `phase` query parameter: "sign-up" opens Create account. */
export function loginTabFor(phase?: string | string[]): number {
    return phase === "sign-up" ? 1 : 0;
}

export function loginPhaseFor(tabIndex: number): string {
    return LOGIN_PHASES[tabIndex] ?? LOGIN_PHASES[0];
}
```

- [ ] **Step 4: Run it and watch it pass**

Run: `npx jest --coverage=false lib/__tests__/authRoutes.test.ts`
Expected: PASS, 13 tests.

- [ ] **Step 5: Rewrite the login page**

All edits are in `pages/account/login/index.tsx`.

(a) Replace the import block

```tsx
import { signIn } from "next-auth/react";
import Head from "next/head";
import Link from "next/link";
import Router from "next/router";
import { FormEventHandler, useState } from "react";
import { TabPanel } from "../../../components/DatasetDetails/TabPanel";
import { Tabs } from "../../../components/DatasetDetails/Tabs";
import { ROUTE_PAGE_SEARCH } from "../../../contants/InternalRoutesConstants";
```

with

```tsx
import { signIn } from "next-auth/react";
import Head from "next/head";
import Link from "next/link";
import Router from "next/router";
import { SignInForm } from "../../../components/Account/SignInForm";
import { SignUpForm } from "../../../components/Account/SignUpForm";
import { TabPanel } from "../../../components/DatasetDetails/TabPanel";
import { Tabs } from "../../../components/DatasetDetails/Tabs";
import { ROUTE_PAGE_SEARCH } from "../../../contants/InternalRoutesConstants";
import { loginPhaseFor, loginTabFor } from "../../../lib/authRoutes";
```

(b) The page now decodes `callbackUrl` once. In `OrcidButton` replace

```tsx
      onClick={() => signIn("orcid", { callbackUrl: decodeURIComponent(props.callbackUrl || "/") })}
```

with

```tsx
      onClick={() => signIn("orcid", { callbackUrl: props.callbackUrl })}
```

and in `GithubButton` replace

```tsx
      onClick={() => signIn("github", { callbackUrl: decodeURIComponent(props.callbackUrl || "/") })}
```

with

```tsx
      onClick={() => signIn("github", { callbackUrl: props.callbackUrl })}
```

(c) Replace

```tsx
interface Props {
  error?: string
  callbackUrl?: string
  isDoi?: boolean
}

export default function LoginPage(props: Props) {
  function getSelectedTabIndex() {
    return 0;
  }

  const defaultTabIndex = getSelectedTabIndex();
```

with

```tsx
function OrDivider() {
  return (
    <div className="my-6 flex flex-row justify-center items-center">
      <hr className="w-full" />
      <span className="px-4 text-sm text-primary-500">or</span>
      <hr className="w-full" />
    </div>
  );
}

function onTabChanged(tabIndex: number) {
  Router.replace({ pathname: Router.pathname, query: { ...Router.query, phase: loginPhaseFor(tabIndex) } }, undefined, { shallow: true });
}

interface Props {
  error?: string
  callbackUrl?: string
  isDoi?: boolean
  phase?: string
}

export default function LoginPage(props: Props) {
  const callbackUrl = decodeURIComponent(props.callbackUrl || "/");
```

(d) Replace everything from the line `      <div className="w-10/12 md:w-4/12 h-fit border border-primary-200 self-center rounded-lg bg-primary-0">` to the end of the file (the tabs, the end of `LoginPage`, the whole `SignInForm` function with the John Doe defaults, and `LoginPage.getInitialProps`) with:

```tsx
      <div className="w-11/12 max-w-[440px] h-fit border border-primary-200 self-center rounded-lg bg-primary-0">
        <Tabs className="px-6 py-8" headerClassName="px-6 pt-5" defaultSelectedIndex={loginTabFor(props.phase)} onTabChanged={onTabChanged}>
          <TabPanel title="Sign in">
            <div className="flex flex-col">
              <OrcidButton callbackUrl={callbackUrl}>Sign in with ORCID</OrcidButton>
              {process.env.NODE_ENV == "development" &&
                <GithubButton callbackUrl={callbackUrl}>Sign in with GitHub</GithubButton>
              }
              <OrDivider />
              <SignInForm callbackUrl={callbackUrl} />
            </div>
          </TabPanel>
          <TabPanel title="Create account">
            <div className="flex flex-col">
              <OrcidButton callbackUrl={callbackUrl}>Sign up with ORCID</OrcidButton>
              <OrDivider />
              <SignUpForm callbackUrl={callbackUrl} />
            </div>
          </TabPanel>
        </Tabs>
      </div>
    </div >
  );
}

LoginPage.getInitialProps = async ({ query }) => {
  const { callbackUrl, error, isDoi, phase } = query
  return { callbackUrl: (callbackUrl ?? "/"), error, isDoi, phase }
}
```

The two alert blocks above (`props.error && !props.isDoi` and `props.isDoi`) stay as they are. The card is `max-w-[440px]` instead of `md:w-4/12` because six 40 px code boxes plus padding need about 330 px, more than a third of the `md` container.

- [ ] **Step 6: Type-check and run the related tests**

Run: `npx tsc --noEmit -p .`
Expected: no output.

Run: `npx jest --coverage=false lib/__tests__/authRoutes.test.ts contants/__tests__/TelemetryConstants.test.ts`
Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add lib/authRoutes.ts lib/__tests__/authRoutes.test.ts pages/account/login/index.tsx
git commit -m "$(cat <<'EOF'
feat: Sign in and Create account tabs on the login page

The tab follows the phase parameter, which the page received and ignored.
The development-only John Doe form is gone: local work signs up for real
and reads the code from Mailpit.

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 11: Forgot and reset password pages

**Files:**
- Create: `components/Account/ForgotPasswordForm.tsx`, `components/Account/ResetPasswordForm.tsx`, `components/Account/__tests__/ForgotPasswordForm.test.tsx`, `components/Account/__tests__/ResetPasswordForm.test.tsx`, `pages/account/forgot-password/index.tsx`, `pages/account/reset-password/[token].tsx`
- Modify: `contants/TelemetryConstants.ts`

**Interfaces:**
- Consumes: `BFFAPI.requestPasswordReset`, `BFFAPI.confirmPasswordReset` (Task 5); `emailField`, `newPasswordField` (Task 8); `accountErrorMessage`, `PASSWORD_MIN_LENGTH`; `ROUTE_PAGE_FORGOT_PASSWORD`, `ROUTE_PAGE_HOME`; `loginUrlFor`; `BareLayout`.
- Produces: `ForgotPasswordForm()` and `ResetPasswordForm({ token }: { token: string })`, named exports; pages `/account/forgot-password` and `/account/reset-password/[token]` (token from `getServerSideProps`, `<meta name="referrer" content="no-referrer">`); both templates listed in `PAGES`.

- [ ] **Step 1: Write the failing tests**

Create `components/Account/__tests__/ForgotPasswordForm.test.tsx`:

```tsx
/** @jest-environment jsdom */
import { beforeEach, describe, expect, jest, test } from '@jest/globals';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';

const requestPasswordReset = jest.fn() as any;

jest.mock("../../../gateways/BFFAPI", () => ({
    BFFAPI: jest.fn().mockImplementation(() => ({ requestPasswordReset })),
}));

import { ForgotPasswordForm } from "../ForgotPasswordForm";

async function send(email: string) {
    fireEvent.change(screen.getByLabelText("Email"), { target: { value: email } });
    await act(async () => {
        fireEvent.click(screen.getByRole("button", { name: "Send link" }));
    });
}

beforeEach(() => {
    requestPasswordReset.mockReset();
});

describe("ForgotPasswordForm", () => {
    test("sends the trimmed email and says the same thing whether or not it has an account", async () => {
        requestPasswordReset.mockResolvedValue(undefined);
        render(<ForgotPasswordForm />);

        await send(" ana@usp.br ");

        await waitFor(() => expect(screen.getByRole("status").textContent).toBe("If an account exists for ana@usp.br, we sent a link. It works for one hour."));
        expect(requestPasswordReset).toHaveBeenCalledWith("ana@usp.br");
        expect(screen.queryByLabelText("Email")).toBeNull();
    });

    test("an invalid email is refused before anything is sent", async () => {
        render(<ForgotPasswordForm />);

        await send("ana");

        await waitFor(() => expect(screen.getByText("Enter a valid email address.")).toBeTruthy());
        expect(requestPasswordReset).not.toHaveBeenCalled();
    });

    test("a failure keeps the form and says so", async () => {
        requestPasswordReset.mockRejectedValue(new Error("Network Error"));
        render(<ForgotPasswordForm />);

        await send("ana@usp.br");

        await waitFor(() => expect(screen.getByRole("alert").textContent).toBe("Something went wrong. Please try again."));
        expect(screen.getByLabelText("Email")).toBeTruthy();
    });

    test("leads back to sign in", () => {
        render(<ForgotPasswordForm />);

        expect(screen.getByRole("link", { name: "Back to sign in" }).getAttribute("href")).toBe("/account/login?phase=sign-in&callbackUrl=%2Fapp%2Fhome");
    });
});
```

Create `components/Account/__tests__/ResetPasswordForm.test.tsx`:

```tsx
/** @jest-environment jsdom */
import { beforeEach, describe, expect, jest, test } from '@jest/globals';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';

const confirmPasswordReset = jest.fn() as any;

jest.mock("../../../gateways/BFFAPI", () => ({
    BFFAPI: jest.fn().mockImplementation(() => ({ confirmPasswordReset })),
}));

import { ResetPasswordForm } from "../ResetPasswordForm";

async function choose(password: string, confirmation: string) {
    fireEvent.change(screen.getByLabelText("New password"), { target: { value: password } });
    fireEvent.change(screen.getByLabelText("Confirm new password"), { target: { value: confirmation } });
    await act(async () => {
        fireEvent.click(screen.getByRole("button", { name: "Change password" }));
    });
}

beforeEach(() => {
    confirmPasswordReset.mockReset();
});

describe("ResetPasswordForm", () => {
    test("sets the new password with the token from the link, then leads to sign in", async () => {
        confirmPasswordReset.mockResolvedValue(undefined);
        render(<ResetPasswordForm token="tok" />);

        await choose("a new long password", "a new long password");

        await waitFor(() => expect(screen.getByText("Your password was changed")).toBeTruthy());
        expect(confirmPasswordReset).toHaveBeenCalledWith("tok", "a new long password");
        expect(screen.getByRole("link", { name: "Sign in" }).getAttribute("href")).toBe("/account/login?phase=sign-in&callbackUrl=%2Fapp%2Fhome");
    });

    test("two different passwords are refused before anything is sent", async () => {
        render(<ResetPasswordForm token="tok" />);

        await choose("a new long password", "another long password");

        await waitFor(() => expect(screen.getByText("The passwords do not match.")).toBeTruthy());
        expect(confirmPasswordReset).not.toHaveBeenCalled();
    });

    test("a short password is refused before anything is sent", async () => {
        render(<ResetPasswordForm token="tok" />);

        await choose("short", "short");

        await waitFor(() => expect(screen.getByText("Use 10 to 128 characters.")).toBeTruthy());
        expect(confirmPasswordReset).not.toHaveBeenCalled();
    });

    test("a dead link says so and offers a new one", async () => {
        confirmPasswordReset.mockRejectedValue({ response: { status: 400, data: { detail: "token_invalid" } } });
        render(<ResetPasswordForm token="old" />);

        await choose("a new long password", "a new long password");

        await waitFor(() => expect(screen.getByRole("alert").textContent).toContain("This link is invalid or has expired."));
        expect(screen.getByRole("link", { name: "Ask for a new link" }).getAttribute("href")).toBe("/account/forgot-password");
    });
});
```

- [ ] **Step 2: Run them and watch them fail**

Run: `npx jest --coverage=false components/Account/__tests__/ForgotPasswordForm.test.tsx components/Account/__tests__/ResetPasswordForm.test.tsx`

Expected: FAIL — `Cannot find module '../ForgotPasswordForm'` and `Cannot find module '../ResetPasswordForm'`.

- [ ] **Step 3: Write the two forms**

Create `components/Account/ForgotPasswordForm.tsx`:

```tsx
import { ErrorMessage, Field, Form, Formik } from "formik";
import Link from "next/link";
import { useState } from "react";
import * as Yup from "yup";
import { accountErrorMessage } from "../../contants/AccountConstants";
import { EDIT_FORM_ERROR_CLASS, EDIT_FORM_INPUT_CLASS, EDIT_FORM_LABEL_CLASS } from "../../contants/EditFormConstants";
import { ROUTE_PAGE_HOME } from "../../contants/InternalRoutesConstants";
import { BFFAPI } from "../../gateways/BFFAPI";
import { emailField } from "../../lib/accountValidation";
import { loginUrlFor } from "../../lib/authRoutes";

const schema = Yup.object({ email: emailField });

export function ForgotPasswordForm() {
    const [bffGateway] = useState(() => new BFFAPI());
    const [sentTo, setSentTo] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    async function onSubmit(values: { email: string }) {
        setError(null);
        const email = values.email.trim();
        try {
            await bffGateway.requestPasswordReset(email);
            setSentTo(email);
        } catch (e) {
            setError(accountErrorMessage(e?.response?.data?.detail));
        }
    }

    return (
        <div className="flex flex-col gap-5">
            <div className="flex flex-col gap-2">
                <h1 className="m-0 text-[26px] leading-[1.2] font-semibold tracking-[-0.02em] text-primary-900">Reset your password</h1>
                <p className="m-0 text-[15px] leading-6 text-primary-600">Type the email of your DataMap account. We will send a link to choose a new password.</p>
            </div>
            {sentTo ? (
                <p role="status" className="m-0 text-[15px] leading-6 text-primary-900">
                    If an account exists for {sentTo}, we sent a link. It works for one hour.
                </p>
            ) : (
                <Formik initialValues={{ email: "" }} validationSchema={schema} onSubmit={onSubmit}>
                    {({ isSubmitting }) => (
                        <Form noValidate className="flex flex-col gap-4">
                            <div>
                                <label htmlFor="forgot-password-email" className={EDIT_FORM_LABEL_CLASS}>Email</label>
                                <Field id="forgot-password-email" name="email" type="email" autoComplete="email" className={EDIT_FORM_INPUT_CLASS} />
                                <ErrorMessage name="email" component="p" className={EDIT_FORM_ERROR_CLASS} />
                            </div>
                            {error && <p role="alert" className="m-0 text-sm text-error-600">{error}</p>}
                            <button type="submit" disabled={isSubmitting} className="btn-primary m-0 self-start">Send link</button>
                        </Form>
                    )}
                </Formik>
            )}
            <Link href={loginUrlFor(ROUTE_PAGE_HOME)} className="self-start text-sm underline underline-offset-2">Back to sign in</Link>
        </div>
    );
}
```

Create `components/Account/ResetPasswordForm.tsx`:

```tsx
import { ErrorMessage, Field, Form, Formik } from "formik";
import Link from "next/link";
import { useState } from "react";
import * as Yup from "yup";
import { PASSWORD_MIN_LENGTH, accountErrorMessage } from "../../contants/AccountConstants";
import { EDIT_FORM_ERROR_CLASS, EDIT_FORM_HINT_CLASS, EDIT_FORM_INPUT_CLASS, EDIT_FORM_LABEL_CLASS } from "../../contants/EditFormConstants";
import { ROUTE_PAGE_FORGOT_PASSWORD, ROUTE_PAGE_HOME } from "../../contants/InternalRoutesConstants";
import { BFFAPI } from "../../gateways/BFFAPI";
import { newPasswordField } from "../../lib/accountValidation";
import { loginUrlFor } from "../../lib/authRoutes";

const schema = Yup.object({
    password: newPasswordField,
    confirmation: Yup.string()
        .oneOf([Yup.ref("password")], "The passwords do not match.")
        .required("Type the new password again."),
});

const TITLE_CLASS = "m-0 text-[26px] leading-[1.2] font-semibold tracking-[-0.02em] text-primary-900";

export function ResetPasswordForm({ token }: { token: string }) {
    const [bffGateway] = useState(() => new BFFAPI());
    const [done, setDone] = useState(false);
    const [error, setError] = useState<{ message: string, tokenDead: boolean } | null>(null);

    async function onSubmit(values: { password: string, confirmation: string }) {
        setError(null);
        try {
            await bffGateway.confirmPasswordReset(token, values.password);
            setDone(true);
        } catch (e) {
            const detail = e?.response?.data?.detail;
            setError({ message: accountErrorMessage(detail), tokenDead: detail === "token_invalid" });
        }
    }

    if (done) {
        return (
            <div role="status" className="flex flex-col gap-4">
                <h1 className={TITLE_CLASS}>Your password was changed</h1>
                <p className="m-0 text-[15px] leading-6 text-primary-600">Sign in with your email and the new password.</p>
                <Link href={loginUrlFor(ROUTE_PAGE_HOME)} className="btn-primary m-0 self-start text-primary-50 hover:text-primary-50">Sign in</Link>
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-5">
            <h1 className={TITLE_CLASS}>Choose a new password</h1>
            <Formik initialValues={{ password: "", confirmation: "" }} validationSchema={schema} onSubmit={onSubmit}>
                {({ isSubmitting }) => (
                    <Form noValidate className="flex flex-col gap-4">
                        <div>
                            <label htmlFor="reset-password" className={EDIT_FORM_LABEL_CLASS}>New password</label>
                            <Field id="reset-password" name="password" type="password" autoComplete="new-password" className={EDIT_FORM_INPUT_CLASS} />
                            <p className={`${EDIT_FORM_HINT_CLASS} mt-1`}>At least {PASSWORD_MIN_LENGTH} characters.</p>
                            <ErrorMessage name="password" component="p" className={EDIT_FORM_ERROR_CLASS} />
                        </div>
                        <div>
                            <label htmlFor="reset-password-confirmation" className={EDIT_FORM_LABEL_CLASS}>Confirm new password</label>
                            <Field id="reset-password-confirmation" name="confirmation" type="password" autoComplete="new-password" className={EDIT_FORM_INPUT_CLASS} />
                            <ErrorMessage name="confirmation" component="p" className={EDIT_FORM_ERROR_CLASS} />
                        </div>
                        {error && (
                            <p role="alert" className="m-0 text-sm text-error-600">
                                {error.message}
                                {error.tokenDead && <> <Link href={ROUTE_PAGE_FORGOT_PASSWORD} className="text-sm underline underline-offset-2">Ask for a new link</Link></>}
                            </p>
                        )}
                        <button type="submit" disabled={isSubmitting} className="btn-primary m-0 self-start">Change password</button>
                    </Form>
                )}
            </Formik>
        </div>
    );
}
```

- [ ] **Step 4: Run them and watch them pass**

Run: `npx jest --coverage=false components/Account/__tests__/ForgotPasswordForm.test.tsx components/Account/__tests__/ResetPasswordForm.test.tsx`
Expected: PASS, 8 tests.

- [ ] **Step 5: Add the pages**

Create `pages/account/forgot-password/index.tsx`:

```tsx
import { ForgotPasswordForm } from "../../../components/Account/ForgotPasswordForm";
import { BareLayout } from "../../../components/Public/BareLayout";

export default function ForgotPasswordPage() {
    return (
        <BareLayout>
            <div className="mx-auto w-full max-w-[560px] px-4 md:px-8 pt-20 pb-24">
                <ForgotPasswordForm />
            </div>
        </BareLayout>
    );
}
```

Create `pages/account/reset-password/[token].tsx`:

```tsx
import Head from "next/head";
import { ResetPasswordForm } from "../../../components/Account/ResetPasswordForm";
import { BareLayout } from "../../../components/Public/BareLayout";

interface Props {
    token: string
}

export default function ResetPasswordPage(props: Props) {
    return (
        <BareLayout>
            <Head>
                {/* The token is in this page's URL. */}
                <meta name="referrer" content="no-referrer" />
            </Head>
            <div className="mx-auto w-full max-w-[560px] px-4 md:px-8 pt-20 pb-24">
                <ResetPasswordForm token={props.token} />
            </div>
        </BareLayout>
    );
}

export async function getServerSideProps({ query }) {
    return { props: { token: query.token as string } };
}
```

- [ ] **Step 6: Watch the telemetry page list fail**

Run: `npx jest --coverage=false contants/__tests__/TelemetryConstants.test.ts`

Expected: FAIL in "include every page the app has, so a new one is not filed as other" — received `["/account/forgot-password", "/account/reset-password/[token]"]`, expected `[]`.

- [ ] **Step 7: List the two pages**

In `contants/TelemetryConstants.ts`, replace

```ts
  "/account/login",
```

with

```ts
  "/account/forgot-password",
  "/account/login",
  "/account/reset-password/[token]",
```

- [ ] **Step 8: Run it and watch it pass**

Run: `npx jest --coverage=false contants/__tests__/TelemetryConstants.test.ts lib/__tests__/serverLogging.invariant.test.ts`
Expected: PASS.

- [ ] **Step 9: Commit**

```bash
git add components/Account/ForgotPasswordForm.tsx components/Account/ResetPasswordForm.tsx components/Account/__tests__/ForgotPasswordForm.test.tsx components/Account/__tests__/ResetPasswordForm.test.tsx pages/account/forgot-password pages/account/reset-password contants/TelemetryConstants.ts
git commit -m "$(cat <<'EOF'
feat: forgot password and reset password pages

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 12: Password row in the profile's sign-in methods

**Files:**
- Create: `components/Account/ChangePasswordDialog.tsx`, `components/Account/PasswordSignInMethod.tsx`, `components/Account/__tests__/ChangePasswordDialog.test.tsx`, `components/Account/__tests__/PasswordSignInMethod.test.tsx`
- Modify: `pages/app/profile/index.tsx`

**Interfaces:**
- Consumes: `BFFAPI.changePassword`, `BFFAPI.requestPasswordReset` (Task 5); `newPasswordField` (Task 8); `CURRENT_PASSWORD_INCORRECT_MESSAGE`, `PASSWORD_MIN_LENGTH`, `accountErrorMessage` (Task 1); `Modal` from `components/base/PopupModal.tsx`; `UserDetailsResponse` with `has_password` and `email_verified_at` (Task 2).
- Produces: `ChangePasswordDialog(props: { show: boolean; onClose(): void; onChanged(): void })` and `PasswordSignInMethod({ user }: { user: Pick<UserDetailsResponse, "email" | "has_password" | "email_verified_at"> })`, named exports. The row shows "Set" + "Change password" when `has_password`; "Not set" + "Set a password" (sends the reset link to `user.email`, then "We sent a link to {email}.") when the email is confirmed; "Not set. Available once your email is confirmed." and no button otherwise (the gatekeeper sends a reset link only to a confirmed email).

- [ ] **Step 1: Write the failing tests**

Create `components/Account/__tests__/ChangePasswordDialog.test.tsx`:

```tsx
/** @jest-environment jsdom */
import { beforeEach, describe, expect, jest, test } from '@jest/globals';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';

const changePassword = jest.fn() as any;

jest.mock("../../../gateways/BFFAPI", () => ({
    BFFAPI: jest.fn().mockImplementation(() => ({ changePassword })),
}));

import { ChangePasswordDialog } from "../ChangePasswordDialog";

async function change(current: string, next: string) {
    fireEvent.change(screen.getByLabelText("Current password"), { target: { value: current } });
    fireEvent.change(screen.getByLabelText("New password"), { target: { value: next } });
    await act(async () => {
        fireEvent.click(screen.getByRole("button", { name: "Change password" }));
    });
}

beforeEach(() => {
    changePassword.mockReset();
});

describe("ChangePasswordDialog", () => {
    test("sends the current and the new password, then reports the change", async () => {
        changePassword.mockResolvedValue(undefined);
        const onChanged = jest.fn();
        render(<ChangePasswordDialog show onClose={jest.fn()} onChanged={onChanged} />);

        await change("the old password", "the new password");

        await waitFor(() => expect(onChanged).toHaveBeenCalledTimes(1));
        expect(changePassword).toHaveBeenCalledWith("the old password", "the new password");
    });

    test("a wrong current password says so and keeps the dialog", async () => {
        changePassword.mockRejectedValue({ response: { status: 401, data: { detail: "invalid_credentials" } } });
        const onChanged = jest.fn();
        render(<ChangePasswordDialog show onClose={jest.fn()} onChanged={onChanged} />);

        await change("wrong password", "the new password");

        await waitFor(() => expect(screen.getByRole("alert").textContent).toBe("The current password is not correct."));
        expect(onChanged).not.toHaveBeenCalled();
    });

    test("a short new password is refused before anything is sent", async () => {
        render(<ChangePasswordDialog show onClose={jest.fn()} onChanged={jest.fn()} />);

        await change("the old password", "short");

        await waitFor(() => expect(screen.getByText("Use 10 to 128 characters.")).toBeTruthy());
        expect(changePassword).not.toHaveBeenCalled();
    });

    test("Cancel closes without sending", () => {
        const onClose = jest.fn();
        render(<ChangePasswordDialog show onClose={onClose} onChanged={jest.fn()} />);

        fireEvent.click(screen.getByRole("button", { name: "Cancel" }));

        expect(onClose).toHaveBeenCalledTimes(1);
        expect(changePassword).not.toHaveBeenCalled();
    });
});
```

Create `components/Account/__tests__/PasswordSignInMethod.test.tsx`:

```tsx
/** @jest-environment jsdom */
import { beforeEach, describe, expect, jest, test } from '@jest/globals';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';

const requestPasswordReset = jest.fn() as any;
const changePassword = jest.fn() as any;

jest.mock("../../../gateways/BFFAPI", () => ({
    BFFAPI: jest.fn().mockImplementation(() => ({ requestPasswordReset, changePassword })),
}));

import { PasswordSignInMethod } from "../PasswordSignInMethod";

const withPassword = { email: "ana@usp.br", has_password: true, email_verified_at: "2026-10-03T10:00:00Z" };
const withoutPassword = { email: "ana@usp.br", has_password: false, email_verified_at: "2026-10-03T10:00:00Z" };
const unconfirmed = { email: "0000-0002@fake.mail.com", has_password: false, email_verified_at: null };

function renderRow(user: typeof withPassword | typeof unconfirmed) {
    return render(<ul><PasswordSignInMethod user={user} /></ul>);
}

beforeEach(() => {
    requestPasswordReset.mockReset();
    changePassword.mockReset();
});

describe("PasswordSignInMethod", () => {
    test("an account with a password can change it in a dialog", () => {
        renderRow(withPassword);

        fireEvent.click(screen.getByRole("button", { name: "Change password" }));

        expect(screen.getByRole("dialog")).toBeTruthy();
        expect(screen.getByLabelText("Current password")).toBeTruthy();
    });

    test("a changed password closes the dialog and says so", async () => {
        changePassword.mockResolvedValue(undefined);
        renderRow(withPassword);
        fireEvent.click(screen.getByRole("button", { name: "Change password" }));
        fireEvent.change(screen.getByLabelText("Current password"), { target: { value: "the old password" } });
        fireEvent.change(screen.getByLabelText("New password"), { target: { value: "the new password" } });

        await act(async () => {
            fireEvent.click(screen.getAllByRole("button", { name: "Change password" })[1]);
        });

        await waitFor(() => expect(screen.getByRole("status").textContent).toBe("Password changed."));
        expect(screen.queryByRole("dialog")).toBeNull();
    });

    test("an account without one is sent the link to set it", async () => {
        requestPasswordReset.mockResolvedValue(undefined);
        renderRow(withoutPassword);

        await act(async () => {
            fireEvent.click(screen.getByRole("button", { name: "Set a password" }));
        });

        expect(requestPasswordReset).toHaveBeenCalledWith("ana@usp.br");
        expect(screen.getByRole("status").textContent).toBe("We sent a link to ana@usp.br.");
        expect((screen.getByRole("button", { name: "Set a password" }) as HTMLButtonElement).disabled).toBe(true);
    });

    test("an unconfirmed email is offered no link the gatekeeper would not send", () => {
        renderRow(unconfirmed);

        expect(screen.queryByRole("button", { name: "Set a password" })).toBeNull();
        expect(screen.getByText("Not set. Available once your email is confirmed.")).toBeTruthy();
    });
});
```

- [ ] **Step 2: Run them and watch them fail**

Run: `npx jest --coverage=false components/Account/__tests__/ChangePasswordDialog.test.tsx components/Account/__tests__/PasswordSignInMethod.test.tsx`

Expected: FAIL — `Cannot find module '../ChangePasswordDialog'` and `Cannot find module '../PasswordSignInMethod'`.

- [ ] **Step 3: Write the dialog and the row**

Create `components/Account/ChangePasswordDialog.tsx`:

```tsx
import { useFormik } from "formik";
import { useState } from "react";
import * as Yup from "yup";
import { CURRENT_PASSWORD_INCORRECT_MESSAGE, PASSWORD_MIN_LENGTH, accountErrorMessage } from "../../contants/AccountConstants";
import { EDIT_FORM_ERROR_CLASS, EDIT_FORM_HINT_CLASS, EDIT_FORM_INPUT_CLASS, EDIT_FORM_LABEL_CLASS } from "../../contants/EditFormConstants";
import { BFFAPI } from "../../gateways/BFFAPI";
import { newPasswordField } from "../../lib/accountValidation";
import Modal from "../base/PopupModal";

const schema = Yup.object({
    currentPassword: Yup.string().required("Enter your current password."),
    newPassword: newPasswordField,
});

interface Props {
    show: boolean
    onClose(): void
    onChanged(): void
}

export function ChangePasswordDialog(props: Props) {
    const [bffGateway] = useState(() => new BFFAPI());
    const [error, setError] = useState<string | null>(null);
    const formik = useFormik({
        initialValues: { currentPassword: "", newPassword: "" },
        validationSchema: schema,
        onSubmit: async (values, helpers) => {
            setError(null);
            try {
                await bffGateway.changePassword(values.currentPassword, values.newPassword);
                helpers.resetForm();
                props.onChanged();
            } catch (e) {
                setError(e?.response?.status === 401 ? CURRENT_PASSWORD_INCORRECT_MESSAGE : accountErrorMessage(e?.response?.data?.detail));
            }
        },
    });

    function close() {
        formik.resetForm();
        setError(null);
        props.onClose();
    }

    return (
        <Modal
            title="Change password"
            show={props.show}
            confimButtonText="Change password"
            cancelButtonText="Cancel"
            cancel={close}
            confim={() => { if (!formik.isSubmitting) formik.submitForm(); }}
            confirmDisabled={formik.isSubmitting}
        >
            <form noValidate onSubmit={formik.handleSubmit} className="flex flex-col gap-4">
                <div>
                    <label htmlFor="current-password" className={EDIT_FORM_LABEL_CLASS}>Current password</label>
                    <input id="current-password" type="password" autoComplete="current-password" className={EDIT_FORM_INPUT_CLASS} {...formik.getFieldProps("currentPassword")} />
                    {formik.touched.currentPassword && formik.errors.currentPassword && <p className={EDIT_FORM_ERROR_CLASS}>{formik.errors.currentPassword}</p>}
                </div>
                <div>
                    <label htmlFor="new-password" className={EDIT_FORM_LABEL_CLASS}>New password</label>
                    <input id="new-password" type="password" autoComplete="new-password" className={EDIT_FORM_INPUT_CLASS} {...formik.getFieldProps("newPassword")} />
                    <p className={`${EDIT_FORM_HINT_CLASS} mt-1`}>At least {PASSWORD_MIN_LENGTH} characters.</p>
                    {formik.touched.newPassword && formik.errors.newPassword && <p className={EDIT_FORM_ERROR_CLASS}>{formik.errors.newPassword}</p>}
                </div>
                {error && <p role="alert" className="m-0 text-sm text-error-600">{error}</p>}
                <button type="submit" hidden aria-hidden="true" tabIndex={-1} />
            </form>
        </Modal>
    );
}
```

Create `components/Account/PasswordSignInMethod.tsx`:

```tsx
import { useState } from "react";
import { accountErrorMessage } from "../../contants/AccountConstants";
import { BFFAPI } from "../../gateways/BFFAPI";
import { UserDetailsResponse } from "../../lib/users";
import { ChangePasswordDialog } from "./ChangePasswordDialog";

interface Props {
    user: Pick<UserDetailsResponse, "email" | "has_password" | "email_verified_at">
}

/** The "Password" row of the profile's sign-in methods. */
export function PasswordSignInMethod({ user }: Props) {
    const [bffGateway] = useState(() => new BFFAPI());
    const [changing, setChanging] = useState(false);
    const [sending, setSending] = useState(false);
    const [notice, setNotice] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    async function sendSetPasswordLink() {
        setSending(true);
        setError(null);
        try {
            await bffGateway.requestPasswordReset(user.email);
            setNotice(`We sent a link to ${user.email}.`);
        } catch (e) {
            setError(accountErrorMessage(e?.response?.data?.detail));
        } finally {
            setSending(false);
        }
    }

    function state(): string {
        if (user.has_password) {
            return "Set";
        }
        return user.email_verified_at ? "Not set" : "Not set. Available once your email is confirmed.";
    }

    return (
        <li className="grid grid-cols-[140px_minmax(0,1fr)_auto] items-center gap-4 px-4 py-3 text-sm">
            <span className="text-primary-500">Password</span>
            <span className="flex flex-col gap-1 min-w-0 text-primary-900">
                <span>{state()}</span>
                {notice && <span role="status" className="text-primary-700">{notice}</span>}
                {error && <span role="alert" className="text-error-600">{error}</span>}
            </span>
            {user.has_password && (
                <button type="button" className="btn-primary-outline btn-small m-0" onClick={() => setChanging(true)}>Change password</button>
            )}
            {!user.has_password && user.email_verified_at && (
                <button type="button" className="btn-primary-outline btn-small m-0" disabled={sending || notice !== null} onClick={sendSetPasswordLink}>Set a password</button>
            )}
            <ChangePasswordDialog
                show={changing}
                onClose={() => setChanging(false)}
                onChanged={() => { setChanging(false); setNotice("Password changed."); }}
            />
        </li>
    );
}
```

- [ ] **Step 4: Run them and watch them pass**

Run: `npx jest --coverage=false components/Account/__tests__/ChangePasswordDialog.test.tsx components/Account/__tests__/PasswordSignInMethod.test.tsx`
Expected: PASS, 8 tests.

- [ ] **Step 5: Put the row in the profile**

In `pages/app/profile/index.tsx`, replace

```tsx
import LoggedLayout from "../../../components/LoggedLayout";
```

with

```tsx
import { PasswordSignInMethod } from "../../../components/Account/PasswordSignInMethod";
import LoggedLayout from "../../../components/LoggedLayout";
```

and replace

```tsx
              <ProfileSection title="Sign-in methods">
                {user?.providers?.length > 0 ? (
                  <ul className="divide-y divide-primary-100">
                    {user.providers.map((provider, index) => (
```

with

```tsx
              <ProfileSection title="Sign-in methods">
                {user ? (
                  <ul className="divide-y divide-primary-100">
                    {(user.providers ?? []).map((provider, index) => (
```

and, in the same block, replace

```tsx
                    ))}
                  </ul>
                ) : (
                  <p className="m-0 px-4 py-3 text-sm italic text-primary-500">No sign-in method linked.</p>
```

with

```tsx
                    ))}
                    <PasswordSignInMethod user={user} />
                  </ul>
                ) : (
                  <p className="m-0 px-4 py-3 text-sm italic text-primary-500">No sign-in method linked.</p>
```

- [ ] **Step 6: Type-check**

Run: `npx tsc --noEmit -p .`
Expected: no output.

- [ ] **Step 7: Commit**

```bash
git add components/Account/ChangePasswordDialog.tsx components/Account/PasswordSignInMethod.tsx components/Account/__tests__/ChangePasswordDialog.test.tsx components/Account/__tests__/PasswordSignInMethod.test.tsx pages/app/profile/index.tsx
git commit -m "$(cat <<'EOF'
feat: change or set the password from the profile

"Set a password" sends the reset link, so no new endpoint is needed. It is
offered only for a confirmed email, because the gatekeeper sends reset
links only there; ORCID accounts confirm their email in PR 3.

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 13: Verify the suite, the build, and the flows against a local gatekeeper and Mailpit

**Files:** none changed.

**Interfaces:**
- Consumes: everything above; the gatekeeper with PR 1 merged.
- Produces: evidence for the PR description.

- [ ] **Step 1: Run the whole Jest suite**

Run (from the worktree): `npx jest --coverage=false`

Expected: every suite passes — 13 suites more than after PR 0 (83 suites, 573 tests when PR 0 left 70 and 451).

- [ ] **Step 2: Build for production**

Run: `npm run build`

Expected: exit code 0; the route table lists `/account/forgot-password`, `/account/login`, `/account/reset-password/[token]` and the six `/api/account/...` routes.

- [ ] **Step 3: Start Mailpit and a local gatekeeper with PR 1**

```bash
docker run -d --name datamap_mailpit_local -p 1025:1025 -p 8025:8025 axllent/mailpit:v1.20
```

In `/Users/caio.maia/workspace/datamap/gatekeeper/local.env` set (keep the other values):

```
EMAIL_ENABLED=True
SMTP_HOST=localhost
SMTP_PORT=1025
SMTP_STARTTLS=False
PUBLIC_BASE_URL=http://localhost:3000
AUTH_PASSWORD_PEPPER=<output of: openssl rand -hex 16>
AUTH_CHALLENGE_PEPPER=<output of: openssl rand -hex 16>
ADMIN_NOTIFICATION_EMAILS=admins@datamap.local
```

Then, in the gatekeeper directory on a `main` that contains PR 1:

```bash
make ENV_FILE_PATH=local.env docker-run-db
make ENV_FILE_PATH=local.env db-upgrade
make ENV_FILE_PATH=local.env python-run
```

Check: `curl -s -o /dev/null -w "%{http_code}" http://localhost:9092/api/v1/health-check/` → `200`.

- [ ] **Step 4: Start the webapp in development**

In `.env.local`, `DATAMAP_BASE_URL` must point at the local gatekeeper (`http://localhost:9092/api/v1`). Then `npm run dev`.

Check: `curl -s http://localhost:3000/api/auth/providers` lists `orcid`, `credentials` and `github`.

- [ ] **Step 5: Sign up**

1. Open `http://localhost:3000/account/login?phase=sign-up`. "Create account" is the selected tab.
2. Type a 9-character password: "Use 10 to 128 characters." appears and nothing is sent.
3. Fill name, a new email and a 12-character password; "Create account". The tab now shows six boxes and "Resend code in 90s".
4. Open Mailpit at `http://localhost:8025`. The code email is there (and `admins@datamap.local` receives the new-account notice after confirmation). Codes go through the outbox, which is dispatched every minute, so allow up to a minute (the screen says so). Locally, if the Archivist is not running, trigger delivery with `curl -s -X POST http://localhost:9092/api/v1/internal/notifications/dispatch -H "X-Api-Key: <archivist client key>" -H "X-Api-Secret: <archivist client secret>"`.
5. Type `000000`: "Invalid code." and the boxes clear.
6. Copy the real code from Mailpit and paste it into the first box: all six fill, it submits, and the browser lands on `/app/home` signed in. A new account has no tenancy yet, so the "Your access is not set up yet" panel is expected.
7. Check the Resend button: it enables after 90 s; clicking it shows "We sent a new code to …" and a second email arrives.

- [ ] **Step 6: Sign in and out**

1. Sign out from the profile; open `http://localhost:3000/account/login`.
2. Wrong password: "Invalid email or password.", still on the page.
3. Right password: lands on the `callbackUrl` (`/` → `/app/home`).
4. `http://localhost:3000/account/login?phase=sign-in&callbackUrl=%2Fapp%2Fdatasets` with the right password lands on `/app/datasets`.

- [ ] **Step 7: Reset the password**

1. "Forgot password?" → `/account/forgot-password`; submit the account's email, then an unknown email: both show "If an account exists for …, we sent a link. It works for one hour."; only the first produces an email in Mailpit.
2. Open the link from Mailpit (`http://localhost:3000/account/reset-password/<token>`); mismatched confirmation shows "The passwords do not match."; a valid new password shows "Your password was changed" and "Sign in" signs in with it.
3. Open the same link again and submit: "This link is invalid or has expired." with "Ask for a new link".

- [ ] **Step 8: Change and set the password from the profile**

`/app/profile` reads the user through `GET /users/{id}` and the change goes through `PUT /users/{id}/password`; the gatekeeper lets a user do both on itself, so the new account needs no role.

1. "Sign-in methods" shows "Password — Set — Change password". A wrong current password shows "The current password is not correct."; a correct one closes the dialog and shows "Password changed."; sign out and in with the new password.
2. Sign in with GitHub (development only) as an account without a password: the row reads "Not set. Available once your email is confirmed." Mark that account's email as confirmed (`docker exec -it datamap_gatekeeper_db psql -U gk_admin -d gatekeeper_db -c "UPDATE users SET email_verified_at = now() WHERE email = '<github email>';"`), reload: "Set a password" sends a reset email to Mailpit and the row shows "We sent a link to …".

- [ ] **Step 9: Check the production providers**

```bash
npm run build
npm run start -- -p 3001
curl -s http://localhost:3001/api/auth/providers
```

Expected: keys `orcid` and `credentials`, no `github`. Stop the server, `docker rm -f datamap_mailpit_local`.

- [ ] **Step 10: Push and open the PR**

```bash
git push -u origin feat/rfc-008-password-sign-in
gh pr create --title "feat: password sign-in, sign-up, reset and change (RFC 008, PR 2)" --body "$(cat <<'EOF'
RFC 008, PR 2. Needs gatekeeper PR 1 deployed.

- Credentials provider calls `POST /auth/login`; registered in every environment (GitHub stays development-only). The `@local.datamap.com` stub and the John Doe form are gone.
- Login page: "Sign in" / "Create account" tabs from `phase`; sign-up confirms the email with a 6-digit code in the same tab, then signs in.
- `/account/forgot-password` and `/account/reset-password/[token]`.
- Profile: "Change password", or "Set a password" (reset link) for a confirmed email.
- BFF routes under `/api/account/*` forward the gatekeeper's status and `detail`; `CodeInput` and `VerificationCodeForm` are ready for PR 3.

Checked against a local gatekeeper and Mailpit: sign-up (wrong code, paste, resend), sign-in (wrong and right password, callbackUrl), reset (unknown email, mismatch, reused link), change and set password. Production build lists `orcid` and `credentials` only.

🤖 Generated with [Claude Code](https://claude.com/claude-code)
EOF
)"
```

---

## Self-review

| Requirement (RFC 008 and the contract) | Task |
|---|---|
| `lib/account.ts` with `signUp`, `confirmSignUp`, `resendChallenge`, `login`, `requestPasswordReset`, `confirmPasswordReset`, `changePassword` — camelCase TS, snake_case wire, Axios error on non-2xx | 2 |
| `has_password`, `email_verified_at` on user responses | 2 |
| Credentials `authorize()` calls `POST /auth/login`, returns the gatekeeper `user_id` | 3 |
| `jwt` callback hydrates a password sign-in with `getUserByUID`, not a provider lookup | 3 |
| `@local.datamap.com` shortcut removed; local development uses the real flow and Mailpit | 3, 10, 13 |
| Credentials registered in all environments, GitHub still development-only (PR 0 kept) | 3 |
| `recordLogin` kept: failure in `authorize`, success in `events.signIn` | 3 |
| One `401` for every sign-in failure reaches the user as one message | 3 (`null` → `CredentialsSignin`), 8 |
| BFF routes `sign-up`, `sign-up/[challengeId]/confirm`, `challenges/[challengeId]/resend`, `password-reset`, `password-reset/confirm` public; `password` on `authOnlyChain`; status and `{detail}` forwarded unchanged | 4 |
| The browser never sends a user id | 4 (`changing the password` test) |
| BFFAPI methods with the contract signatures, rejecting with the Axios error | 5 |
| `AccountConstants.ts` (`PASSWORD_MIN_LENGTH`, `PASSWORD_MAX_LENGTH`, `CODE_LENGTH`, `RESEND_COOLDOWN_SECONDS`, `accountErrorMessage`) mapping every contract `detail` | 1 |
| `ROUTE_PAGE_FORGOT_PASSWORD`, `ROUTE_PAGE_RESET_PASSWORD` | 1 |
| `CodeInput`: six boxes, digits only, typing advances, Backspace on empty moves back, arrows, paste fills six, `inputMode="numeric"`, `autocomplete="one-time-code"` on the first, submits on the sixth digit, "Digit n of 6", invalid styling | 6 |
| `VerificationCodeForm`: errors "Invalid code", "Code expired, request a new one", "Too many attempts"; "Resend code" behind 90 s | 7 |
| Login: tabs by `phase`, ORCID button, "or" divider, email + password, "Forgot password?", "Invalid email or password."; Create account: ORCID, divider, name/email/password (10–128), code step in the tab, then sign-in to `callbackUrl`; `error`/`isDoi` unchanged | 8, 9, 10 |
| `/account/forgot-password` ("If an account exists, we sent a link.") and `/account/reset-password/[token]` (new password + confirmation, then sign-in), `BareLayout`, 560 px column, Formik + Yup, `role="alert"` | 11 |
| Profile "Sign-in methods": "Change password" dialog (current and new) or "Set a password" via the reset link | 12 |
| New pages counted by telemetry, not as "other" | 11 |
| `npm run test`, `npm run build`, manual check with Mailpit | 13 |

Deliberate departures, each stated where it happens: `VerificationCodeForm` uses component state rather than Formik (Task 7); `bffHandler` is not reused for the account routes (Task 4); "Set a password" is offered only for a confirmed email (Task 12); a password sign-in whose user read fails (a genuine error, not a missing role: the gatekeeper lets a user read itself) carries only `uid` (Task 3). Copy follows the RFC's wording with sentence punctuation ("Invalid code.", "Too many attempts. Request a new code.").
