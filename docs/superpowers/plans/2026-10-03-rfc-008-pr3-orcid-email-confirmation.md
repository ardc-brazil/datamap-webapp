# RFC 008 PR 3 — ORCID email confirmation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** An ORCID sign-in only produces a usable session once the account behind it has a confirmed, real email; until then the session is *pending* (no `uid`), can reach only `/account/confirm-email` and the two email-verification BFF routes, and tokens issued before this change are signed out.

**Architecture:** The NextAuth `jwt` callback gains three behaviours: a version gate (`token.v === TOKEN_VERSION`, otherwise it throws, which NextAuth 4.24.9 turns into a deleted cookie and an empty session), an ORCID sign-in branch that either hydrates a verified account or sets `token.pending = {orcid, name, emailHint?}`, and an `update` branch that re-reads the ORCID iD already in the token. The BFF's `auth` step requires `uid` and the current version; a new `pendingOnlyChain` (next to PR 2's `publicChain`, wrapped as `pendingAccountRouter()` beside PR 2's `publicAccountRouter()` and with the same JSON Content-Type gate) admits only pending tokens to `pages/api/account/email-verifications/*`, which take the ORCID iD and name from the token and only the email or code from the browser, validate the challenge id with PR 2's `challengeIdOr404`, and answer errors through PR 2's `accountHandler`. `_app.tsx` and PR 2's login page (which already sanitises its `callbackUrl` with `safeCallbackUrl`) route a pending session to `/account/confirm-email`, where `ConfirmEmailForm` (Formik + Yup, then PR 2's `VerificationCodeForm`) confirms the email, calls `update()` and returns to the `callbackUrl`. The profile gets "Connect ORCID", which reuses the same flow. Production ORCID accepts only HTTPS redirect URIs, so for local testing a development-only Credentials provider `orcid-dev` stands in for ORCID. It is double-gated on `NODE_ENV` and `ENABLE_DEV_ORCID_MOCK`, and `orcidSignIn(account, user)` sends it down the same `jwt` branch. The login page shows its form under the ORCID button when `getProviders()` lists it.

**Tech Stack:** Next.js 14 (pages router), NextAuth 4.24.9 (JWT strategy), next-connect 1.0.0-next.4, Axios, Formik 2.4 + Yup 1, Jest 29 + ts-jest, @testing-library/react 14 with `jest-environment-jsdom`.

## Global Constraints

- Worktree: already created. `/Users/caio.maia/workspace/datamap/datamap-webapp/.claude/worktrees/rfc-008-orcid-email-confirmation`, branch `feat/rfc-008-orcid-email-confirmation` from `main` at `2552647` (webapp PR 2, #109, merged). `npm ci` is done (a real `node_modules`, not a symlink) and `.env.local` is copied in. Baseline: **83 suites, 614 tests**. Every command in this plan runs from that directory, and every git call is spelled `command git` so a shell alias cannot change it.
- Jest from the worktree: `npx jest --coverage=false <paths>`. Jest runs `ts-jest` with type-checking (`tsconfig.json` has `strict: false`), so a test file or the code under test that does not type-check fails as a suite.
- `next-auth/package.json` has an `exports` map that does not list `core/*`: Jest cannot resolve `next-auth/core/routes/session`. A test that needs NextAuth's session route imports it by relative path, `../../node_modules/next-auth/core/routes/session`.
- `TOKEN_VERSION = 2`, defined in `lib/sessionToken.ts` and re-exported from `pages/api/auth/[...nextauth].ts`; every token the `jwt` callback returns carries `token.v = 2`.
- A token without `v === 2` read outside a sign-in makes the `jwt` callback throw `new Error(STALE_SESSION_ERROR)`; NextAuth 4.24.9 then clears the session cookie and answers `{}`, which `next-auth/react` reads as `unauthenticated`.
- `token.pending?: { orcid: string; name: string; emailHint?: string }`; a pending token never has `uid` or `tenancies`.
- `session.user.pending: boolean` always set; `session.user.emailHint?: string` only when known; the ORCID iD is never put in the session.
- Placeholder emails are those ending in `@fake.mail.com` (case-insensitive).
- ORCID public email: `GET https://pub.orcid.org/v3.0/{orcid}/email`, `Accept: application/json`, `Authorization: Bearer <ORCID access token>`, timeout 3000 ms, any failure → `undefined`.
- An ORCID sign-in never calls `createUser`; accounts are created by the gatekeeper on email-verification confirm.
- `ROUTE_PAGE_CONFIRM_EMAIL = "/account/confirm-email"`.
- Return paths have one sanitiser for what comes in and one rule for what goes out. A `callbackUrl` read from a query string goes through PR 2's `safeCallbackUrl(raw)` (decodes inside a `try`, keeps only an internal path, else `"/"`): the login page already does this, and the confirmation page does the same. A URL this PR builds goes through `confirmEmailUrlFor(returnTo)`, which keeps `returnTo` only when it is an internal path, exactly as PR 2's `loginUrlFor` does. There is no third helper.
- Gatekeeper: `POST /auth/email-verifications {orcid, email, name}` → `202 {challenge_id}`; `POST /auth/email-verifications/{challenge_id}/confirm {code}` → `200 {user_id}`, `400 code_invalid|code_expired|code_attempts_exceeded`, `404 challenge_not_found`, `409 email_belongs_to_another_account`.
- Gatekeeper validation `400`s carry `{"detail": "invalid_email" | "invalid_name" | "invalid_password" | "invalid_orcid"}`; a body it cannot parse is `400 {"detail": "invalid_request"}`. A `{challenge_id}` that is not a UUID is `404 challenge_not_found`. `POST /auth/challenges/{id}/resend` accepts an email-verification challenge (only sign-up challenges without a password and password-reset challenges are refused).
- BFF: `POST /api/account/email-verifications` (`pendingAccountRouter()`: `pendingOnlyChain` + JSON gate, body `{email}`) → `202 {challengeId}`; `POST /api/account/email-verifications/[challengeId]/confirm` (same router, body `{code}`) → `204`, a non-UUID `challengeId` → `404 {detail: "challenge_not_found"}` from PR 2's `challengeIdOr404` without calling the gatekeeper; a `POST` whose `Content-Type` is present and not `application/json` → `415 {detail: "invalid_request"}` (PR 2's gate; a missing `Content-Type` passes); errors through PR 2's `accountHandler` (gatekeeper status and `{detail}` unchanged; no response → `500 {detail: "unavailable"}`).
- Resend cooldown is PR 2's `RESEND_COOLDOWN_SECONDS = 90`, owned by `VerificationCodeForm`; this PR does not restate it.
- BFFAPI: `requestEmailVerification(email: string): Promise<{ challengeId: string }>`, `confirmEmailVerification(challengeId: string, code: string): Promise<void>`; both reject with the Axios error.
- 409 copy: `accountErrorMessage("email_belongs_to_another_account")` = `"This email belongs to another DataMap account. Contact the DataMap team."`.
- The browser never sends an ORCID iD or a user id. The one exception is the development ORCID mock's form, which sends an iD to NextAuth's own `/api/auth/callback/orcid-dev` and exists only behind the double gate below.
- Development ORCID mock: a `CredentialsProvider` with `id: "orcid-dev"`, `name: "ORCID (development mock)"`. It is registered only when `process.env.NODE_ENV === "development"` **and** `process.env.ENABLE_DEV_ORCID_MOCK === "true"` (exactly that string). It lets anyone sign in as any ORCID iD, so neither condition is enough on its own. It lives in PR 2's `developmentOnlyProviders`, behind the second condition. `.env.local.template` ships `ENABLE_DEV_ORCID_MOCK=false`.
- Provider ids: production (with or without the flag) `["orcid", "credentials"]`; development `["orcid", "credentials", "github"]`; development with `ENABLE_DEV_ORCID_MOCK=true` `["orcid", "credentials", "github", "orcid-dev"]`.
- A mock sign-in takes the same `jwt` path as a real ORCID sign-in. `orcidSignIn(account, user)` is non-null for both providers and feeds `signInWithOrcid`. The gatekeeper lookup and the stored provider stay `"orcid"`, with the iD as the reference. The mock's public email comes from its form, and `pub.orcid.org` is never called for it.
- UI copy in English; forms with Formik + Yup; component tests start with the `/** @jest-environment jsdom */` docblock and import components from their own file under `components/`.
- Every commit message ends with `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.

### Merged PR 2 code this plan builds on

Checked against the merged code at `2552647` (webapp #109), not against PR 2's plan. Every edit below quotes the line it anchors on as it is in that commit.

- `pages/api/auth/[...nextauth].ts`, imports, in this order: `import axios, { AxiosError } from "axios";`, `import NextAuth, { AuthOptions, User } from "next-auth";`, `import { JWT } from "next-auth/jwt";`, `CredentialsProvider`, `GithubProvider`, `import { login } from "../../../lib/account";`, `OrcidProvider` from `lib/OrcidOAuthProvider`, `import { CreateUserRequest, GetUserByProviderResponse, createUser, getUserByProviderID, getUserByUID } from "../../../lib/users";`, `logError`, `getMetrics`, and last `import { claimInvitations } from "../../../lib/share";`.
- Same file, exported functions: `authorizeCredentials(credentials)` (calls `login`, records a `credentials` failure metric, `null` on 401, throws `sign_in_unavailable` otherwise), `hydrateWithUserInfo(token, user)`, `hydratePasswordSignIn(token: JWT, uid: string): Promise<JWT>` (reads the user by id; a failed read keeps the sign-in with only `uid`), `claimPendingInvitations(uid)`. `getUserByProviderAuthentication(account, token)` is private and still has the `github` and `orcid` branches (PR 2 removed only the `credentials` one), each building a `CreateUserRequest` and creating the user on a 404.
- Same file, the `jwt` callback as merged:

  ```ts
      async jwt({ token, account, trigger, user }) {
        // Persist the OAuth access_token to the token right after signin
        if (account) {
          token.accessToken = account.access_token
        }

        if (trigger == "signIn") {
          if (account?.provider == "credentials") {
            token = await hydratePasswordSignIn(token, user.id);
          } else {
            const signedIn = await getUserByProviderAuthentication(account, token);
            token = hydrateWithUserInfo(token, signedIn);
          }
          await claimPendingInvitations(token.uid as string);
        } else if (trigger == "update" && token.uid) {
          ...
        }

        return token
      },
  ```

  and the `session` callback sets `session.user.uid = token.uid` then `session.user.tenancies = token.tenancies`.
- Same file, providers: `developmentOnlyProviders` holds only `GithubProvider`, under `// GitHub is for local work only; it must not exist in production.`; `providers` is `[OrcidProvider(...), CredentialsProvider({ id: "credentials", name: "Email and password", credentials: {}, authorize: authorizeCredentials }), ...developmentOnlyProviders]`. The credentials provider is registered in every environment, so the merged order is `orcid`, `credentials`, then the development-only ones.
- `lib/__tests__/authProviders.test.ts`: `providerIdsWhen(nodeEnv)` reads `provider.id` inside `jest.isolateModules`, with three tests: production and test `["orcid", "credentials"]`, development `["orcid", "credentials", "github"]`.
- `lib/__tests__/passwordSignIn.test.ts`: PR 2's tests of `authorizeCredentials`, `hydratePasswordSignIn` and one `jwt` call with `account.provider === "credentials"` and `trigger: "signIn"`. It is the only existing test that calls `authOptions.callbacks`, and none of its calls lacks an `account`, so the version gate in Task 2 does not touch it.
- `types/next-auth.d.ts` (untouched by PR 2): `import NextAuth from "next-auth"` and a `Session.user` augmentation with `uid` and `tenancies` only. Nothing augments `JWT` or `User` yet.
- `lib/users.ts`: `GetUserByProviderResponse` and `UserDetailsResponse` already have `has_password: boolean` and `email_verified_at: string | null`. The file ends with `canSeeAccessHistory`.
- `lib/account.ts`: `import axiosInstance from "./rpc";`; exports `signUp`, `confirmSignUp`, `resendChallenge`, `login`, `requestPasswordReset`, `confirmPasswordReset`, and last `changePassword(userId, currentPassword, newPassword)`. `lib/__tests__/account.test.ts` covers them with `jest.mock("../rpc")`.
- `lib/middlewareChain.ts`: `middlewareChain` = `requestLogging, auth, tenancyChecker`; `authOnlyChain` = `requestLogging, auth`; then `// Account routes a signed-out visitor needs: sign-up, code confirmation, password reset.` and `export const publicChain = createRouter<NextApiRequest, NextApiResponse>().use(requestLogging);`. `auth` only checks that `getToken` returned something. (`lib/auth.ts` is an older copy of that check that nothing imports; this plan leaves it alone.)
- `lib/bffRoute.ts`: `bffRouter()` = `createRouter().use(authOnlyChain)`; PR 2's `PUT /api/account/password` uses it with `accountHandler`.
- `lib/accountRoute.ts`: `isUuid(value)`; `challengeIdOr404(req, res): string | undefined` (answers `404 {detail: "challenge_not_found"}` itself for a non-UUID `req.query.challengeId`); a private `requireJsonContentType` step (`POST`/`PUT`/`PATCH` with a `Content-Type` that is present and not `application/json` → `415 {detail: "invalid_request"}`); `publicAccountRouter()` = `createRouter<NextApiRequest, NextApiResponse>().use(publicChain).use(requireJsonContentType)`; `accountHandler(router: ReturnType<typeof createRouter<NextApiRequest, NextApiResponse>>)`, which answers the gatekeeper's status with `{ detail: response.data.detail ?? "unavailable" }`, `500 {detail: "unavailable"}` without a response (logged with `maskPathTokens`), `405` on no match. The file imports `import { publicChain } from "./middlewareChain";`.
- `pages/api/account/sign-up/[challengeId]/confirm.ts`: the pattern this PR copies — `publicAccountRouter().post(...)`, `const challengeId = challengeIdOr404(req, res); if (!challengeId) { return; }`, then the gatekeeper call and `res.status(204).end()`, exported through `accountHandler(router)`.
- `lib/__tests__/accountRoutes.test.ts`: `send(handler, method, query, body = undefined, headers = {})`; UUID constants `CHALLENGE_ID` / `UNKNOWN_CHALLENGE_ID`; `getToken` mocked to `null` in `beforeEach` and to `{ uid: "u1" }` in two "changing the password" tests.
- `lib/externalCalls.ts`: `UNCONDITIONAL_TOKEN_PREFIXES` already includes `"auth/email-verifications"`, and `lib/__tests__/externalCalls.test.ts` already asserts `POST /auth/email-verifications/{token}/confirm`. This plan does not touch metrics templating.
- `gateways/BFFAPI.ts`: `resendChallenge(challengeId: string): Promise<void>` exists; the last method of the class is `async changePassword(currentPassword: string, newPassword: string): Promise<void>`; account methods do not wrap errors, so they reject with the Axios error. `gateways/__tests__/BFFAPI.account.test.ts` mocks only `post` and `put`.
- `components/Account/CodeInput.tsx`: `CodeInput({ value, onChange, onComplete, disabled, invalid, describedBy?, autoFocusKey? })`; changing `autoFocusKey` moves the focus to the first box.
- `components/Account/VerificationCodeForm.tsx`: named export `VerificationCodeForm({ email, onSubmit, onResend })`. It guards double submission with a `submittingRef`, shows `accountErrorMessage(detail)` in `role="alert"` (wired to `CodeInput` through `describedBy`) for a rejected `onSubmit`, then clears the code and bumps `autoFocusKey`; it owns the 90 s resend countdown and its "We sent a new code to …" notice.
- `components/Account/SignUpForm.tsx`: keeps the gateway as `const [bffGateway] = useState(() => new BFFAPI());` and offers "Use a different email" under `VerificationCodeForm`; `ConfirmEmailForm` follows the same shape.
- `contants/AccountConstants.ts`: `PASSWORD_MIN_LENGTH`, `PASSWORD_MAX_LENGTH`, `CODE_LENGTH`, `RESEND_COOLDOWN_SECONDS = 90`, `INVALID_SIGN_IN_MESSAGE`, `CURRENT_PASSWORD_INCORRECT_MESSAGE`, `SESSION_EXPIRED_MESSAGE`, `PASSWORD_LENGTH_MESSAGE`; `ACCOUNT_ERROR_MESSAGES` maps `code_invalid`, `code_expired`, `code_attempts_exceeded`, `challenge_not_found`, `resend_too_soon`, `invalid_credentials`, `token_invalid`, `email_belongs_to_another_account` ("This email belongs to another DataMap account. Contact the DataMap team."), `invalid_email` ("This email address is not valid."), `invalid_name`, `invalid_password`, `invalid_orcid` ("Your ORCID sign-in could not be read. Sign in again.") and `invalid_request`; `accountErrorMessage` falls back to `GENERIC_ERROR_MESSAGE` from `EmbargoConstants`. This plan adds no messages; Task 5 appends three non-message constants (`ORCID_ID_PATTERN`, `DEV_ORCID_MOCK_PROVIDER_ID`, `DEV_ORCID_MOCK_PROVIDER_NAME`).
- `lib/accountValidation.ts`: `emailField` (Yup, "Enter a valid email address." / "Enter your email address.").
- `contants/EditFormConstants.ts`: `EDIT_FORM_LABEL_CLASS`, `EDIT_FORM_INPUT_CLASS`, `EDIT_FORM_ERROR_CLASS`, `EDIT_FORM_HINT_CLASS`; inline alerts use `text-error-600`.
- `contants/InternalRoutesConstants.ts`: `ROUTE_PAGE_HOME = "/app/home"`, `ROUTE_PAGE_PROFILE = "/app/profile"`; PR 2's last route is `export const ROUTE_PAGE_RESET_PASSWORD = (token: string) => "/account/reset-password/" + token;`. The file imports nothing.
- `lib/authRoutes.ts` has no imports. It holds `SIGN_OUT_CALLBACK_URL = "/"`, a private `isInternalPath(path?: string)` (starts with `/`, not `//` or `/\`, no control character), `loginUrlFor(returnTo?)`, `safeCallbackUrl(rawCallbackUrl?: string): string`, and it ends with `loginTabFor` / `loginPhaseFor`. `lib/__tests__/authRoutes.test.ts` starts with `import { expect, test } from '@jest/globals';` and `import { loginPhaseFor, loginTabFor, loginUrlFor, safeCallbackUrl, SIGN_OUT_CALLBACK_URL } from "../authRoutes";`.
- `pages/account/login/index.tsx`: imports `import { signIn } from "next-auth/react";`, `import Router from "next/router";` (no `useRouter`, no `useSession`, no React hooks), `import { SignInForm } from "../../../components/Account/SignInForm";`, `import { loginPhaseFor, loginTabFor, safeCallbackUrl } from "../../../lib/authRoutes";`. `LoginPage` starts with `const callbackUrl = safeCallbackUrl(props.callbackUrl);`, and `getInitialProps` passes the query value through as it came. Not `auth`-gated. The "Sign in" tab starts with `<OrcidButton callbackUrl={callbackUrl}>Sign in with ORCID</OrcidButton>` followed by the GitHub button inside `{process.env.NODE_ENV == "development" && ...}`.
- `pages/_app.tsx`: imports `import { loginUrlFor } from "../lib/authRoutes";`; `Auth` is the last function of the file and returns `authContext.loading` only while `status === "loading"`.
- `pages/app/profile/index.tsx`: `import { PasswordSignInMethod } from "../../../components/Account/PasswordSignInMethod";` and `import { getUserByUID } from "../../../lib/users";`; the "Sign-in methods" `<ul>` (rendered only under `user ? (`) ends with `<PasswordSignInMethod user={user} />`. `getServerSideProps` returns `{ props: {} }` when the token has no `uid`, so a pending session never reaches the gatekeeper from there.
- `components/Account/PasswordSignInMethod.tsx`: the "Password" row. Without a password it says "Not set" and offers "Set a password" when `email_verified_at` is set, and says "Not set. Available once your email is confirmed." with no button otherwise; `components/Account/__tests__/PasswordSignInMethod.test.tsx` asserts that copy for an `unconfirmed` fixture. Task 14 removes the copy (see there).
- Gatekeeper: `GET /users/{id}` and `PUT /users/{id}/password` skip Casbin when `{id} == X-User-Id`, so a role-less new account can read itself; `POST /auth/login` refuses an account whose `email_verified_at` is null. Nothing in this plan works around either.

---

## File Structure

| File | Status | Responsibility |
|---|---|---|
| `lib/sessionToken.ts` | create | `TOKEN_VERSION`, `STALE_SESSION_ERROR`, `PendingSignIn` type |
| `lib/orcidEmail.ts` | create | `isPlaceholderEmail`, `pickOrcidEmail`, `fetchOrcidPublicEmail` (isolated, 3 s timeout, never throws); validates the iD with `ORCID_ID_PATTERN` from Task 5 |
| `contants/AccountConstants.ts` | modify | `ORCID_ID_PATTERN`, `DEV_ORCID_MOCK_PROVIDER_ID`, `DEV_ORCID_MOCK_PROVIDER_NAME` |
| `lib/devOrcidMock.ts` | create | `authorizeDevOrcidMock`, `devOrcidMockProvider()` (the `orcid-dev` Credentials provider) |
| `types/next-auth.d.ts` | modify | `Session.user.pending/emailHint`; `JWT.uid/tenancies/accessToken/v/pending`; `User.publicEmail` (mock only) |
| `lib/users.ts` | modify | `hasSignInProvider` |
| `pages/api/auth/[...nextauth].ts` | modify | version gate, ORCID pending branch, `update` on pending, session exposes `pending`/`emailHint`, ORCID removed from `getUserByProviderAuthentication`; `orcidSignIn` (real ORCID or the mock), mock registered behind the double gate |
| `lib/middlewareChain.ts` | modify | `auth` requires `uid` + current version; `pendingOnlyChain` |
| `lib/account.ts` | modify | `requestEmailVerification`, `confirmEmailVerification` |
| `lib/accountRoute.ts` | modify | `pendingAccountRouter()` next to PR 2's `publicAccountRouter()`: `pendingOnlyChain` + PR 2's JSON Content-Type gate |
| `pages/api/account/email-verifications/index.ts` | create | BFF: request a code for the pending ORCID sign-in |
| `pages/api/account/email-verifications/[challengeId]/confirm.ts` | create | BFF: confirm the code; challenge id through PR 2's `challengeIdOr404` |
| `gateways/BFFAPI.ts` | modify | `requestEmailVerification`, `confirmEmailVerification` |
| `contants/InternalRoutesConstants.ts` | modify | `ROUTE_PAGE_CONFIRM_EMAIL` |
| `lib/authRoutes.ts` | modify | `confirmEmailUrlFor`, `pendingSessionRedirect` (PR 2's `safeCallbackUrl` is reused, not duplicated) |
| `pages/_app.tsx` | modify | `Auth` sends pending sessions to confirm-email and non-pending ones away from it |
| `pages/account/login/index.tsx` | modify | `DevOrcidMockForm` under the ORCID button (development only); a pending session that reaches the login page goes to confirm-email with the login's `callbackUrl` as PR 2's `safeCallbackUrl` already sanitised it |
| `components/Account/DevOrcidMockForm.tsx` | create | the mock's form (Formik + Yup), rendered only when `getProviders()` lists `orcid-dev` |
| `.env.local.template` | modify | `ENABLE_DEV_ORCID_MOCK=false` |
| `components/Account/ConfirmEmailForm.tsx` | create | email step (Formik) → `VerificationCodeForm` → `update()` → `callbackUrl`; 409; sign out |
| `pages/account/confirm-email.tsx` | create | the page, `BareLayout`, 560 px column, `auth` gated; `callbackUrl` through `safeCallbackUrl` |
| `components/Account/ConnectOrcid.tsx` | create | profile row with "Connect ORCID" |
| `pages/app/profile/index.tsx` | modify | shows `ConnectOrcid` after `PasswordSignInMethod` when the account has no `orcid` provider |
| `components/Account/PasswordSignInMethod.tsx` | modify | drops "Not set. Available once your email is confirmed.", which no production session can reach after this PR |
| `components/Account/__tests__/PasswordSignInMethod.test.tsx` | modify | the unconfirmed case now reads "Not set" and still has no button |
| `lib/__tests__/orcidEmail.test.ts` | create | tests for `lib/orcidEmail.ts` |
| `lib/__tests__/sessionTokenVersion.test.ts` | create | version gate + NextAuth session-route behaviour |
| `lib/__tests__/orcidPendingSignIn.test.ts` | create | ORCID sign-in, `update` on pending, session callback |
| `lib/__tests__/authProviders.test.ts` | modify | provider ids with and without `ENABLE_DEV_ORCID_MOCK`, in each `NODE_ENV` |
| `lib/__tests__/devOrcidMock.test.ts` | create | the mock's `authorize`; a mock sign-in through the `jwt` callback (pending, hydrated, `update()`) |
| `components/Account/__tests__/DevOrcidMockForm.test.tsx` | create | component tests |
| `lib/__tests__/middlewareChain.test.ts` | modify | `uid`/version required; `pendingOnlyChain` |
| `lib/__tests__/embargoRoutes.test.ts`, `lib/__tests__/membersAccessRoute.test.ts`, `lib/__tests__/shareRoutes.test.ts`, `lib/__tests__/accountRoutes.test.ts` | modify | mocked signed-in tokens carry `v: 2` |
| `lib/__tests__/accountEmailVerification.test.ts` | create | tests for the two `lib/account.ts` functions |
| `lib/__tests__/emailVerificationRoutes.test.ts` | create | tests for the two BFF routes, including the 415 and the non-UUID 404 |
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

- [ ] **Step 0: Check the worktree (already created)**

The worktree exists, `npm ci` has run in it and `.env.local` is in place. Confirm it is the merged PR 2 and the suite is green before changing anything:

```bash
cd /Users/caio.maia/workspace/datamap/datamap-webapp/.claude/worktrees/rfc-008-orcid-email-confirmation
command git log --oneline -1
command git status --short
npx jest --coverage=false
```

Expected: `2552647 feat: email and password sign-in (RFC 008, PR 2) (#109)` (or a later commit of this branch, such as this plan's); a clean status; `Test Suites: 83 passed, 83 total` and `Tests: 614 passed, 614 total`.

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
Expected: PASS — 16 tests.

- [ ] **Step 5: Commit**

```bash
command git add lib/orcidEmail.ts lib/__tests__/orcidEmail.test.ts
command git commit -m "$(cat <<'EOF'
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
- Consumes: `authOptions.callbacks.jwt` / `.session` (merged); NextAuth 4.24.9's internal session route `node_modules/next-auth/core/routes/session` (default export), used only in the test to prove the cookie is deleted. The package's `exports` map does not list `core/*`, so `import ... from "next-auth/core/routes/session"` fails in Jest with `Cannot find module`; the test imports it by relative path, which Jest and `tsc` (`moduleResolution: "node"`, types from the neighbouring `session.d.ts`) both resolve.
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

// next-auth's exports map does not list core/*, so the internal route is reached by path.
import sessionRoute from "../../node_modules/next-auth/core/routes/session";
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
Expected: FAIL — "Test suite failed to run": `Cannot find module '../sessionToken' from 'lib/__tests__/sessionTokenVersion.test.ts'` (ts-jest also reports that `[...nextauth]` has no exported member `TOKEN_VERSION`).

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

Replace the whole of `types/next-auth.d.ts` (as merged it imports `NextAuth` without using it and augments only `Session.user` with `uid` and `tenancies`):

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
Expected: PASS — 3 suites: the new file (8 tests), PR 2's `passwordSignIn.test.ts` (its only `jwt` call carries an `account`, so the version gate does not apply) and the existing `[...nextauth].test.ts`.

- [ ] **Step 5: Commit**

```bash
command git add lib/sessionToken.ts types/next-auth.d.ts "pages/api/auth/[...nextauth].ts" lib/__tests__/sessionTokenVersion.test.ts
command git commit -m "$(cat <<'EOF'
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
- Consumes: `getUserByProviderID(request: GetUserByProviderRequest): Promise<GetUserByProviderResponse>` (throws the Axios error, 404 when unknown; `email_verified_at: string | null` is already on the merged type); `fetchOrcidPublicEmail`, `isPlaceholderEmail` (Task 1); `hydrateWithUserInfo`, `claimPendingInvitations` (merged); `axios` and `GetUserByProviderResponse`, both already imported by the merged file.
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
Expected: FAIL. The merged `else` branch still runs `getUserByProviderAuthentication`, so: the confirmed-account test fails because `getUserByProviderID` is called with the `CreateUserRequest`-shaped object (`personName`, `userName`, `email` too); the placeholder and unconfirmed-email tests fail because the account is hydrated (`token.uid` is `"u1"`, `token.pending` undefined); the two no-account tests reject with `User not found and not created` (the 404 makes it call the mocked `createUser`, which returns nothing); the session tests fail on the missing `pending`. "A gatekeeper failure fails the sign-in" already passes and must keep passing.

- [ ] **Step 3: Implement**

In `pages/api/auth/[...nextauth].ts` (the merged file already imports `axios`, `JWT` from `next-auth/jwt`, `GetUserByProviderResponse`, `getUserByProviderID` and `logError`; do not import them again):

1. Replace the merged line

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

2. Replace the first two lines of the merged sign-in block:

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

The ORCID branch claims invitations itself, and only for a verified account; the merged `await claimPendingInvitations(token.uid as string);` stays inside the `else if` and keeps serving password and GitHub sign-ins. The merged inner `else` (`getUserByProviderAuthentication` + `hydrateWithUserInfo`) is now reached only by GitHub.

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

so that the `github` branch is followed directly by the merged `  } else {` / `    throw new Error("Invalid provider authentication: " + account.provider);`.

5. Immediately after the closing `}` of `export async function claimPendingInvitations(uid: string): Promise<void> { ... }` (and so before `async function getUserByProviderAuthentication(account, token)`), insert:

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
Expected: PASS — 4 suites; `orcidPendingSignIn.test.ts` has 8 tests at this point.

- [ ] **Step 5: Commit**

```bash
command git add "pages/api/auth/[...nextauth].ts" lib/__tests__/orcidPendingSignIn.test.ts
command git commit -m "$(cat <<'EOF'
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
Expected: FAIL — "signs in once the account has a confirmed email" fails: `getUserByProviderID` was not called and `token.uid` is undefined (the merged `update` branch is `else if (trigger == "update" && token.uid)`, and a pending token has no `uid`). The other three already pass: with no branch taken the token comes back unchanged, which is what they expect.

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
Expected: PASS — 4 suites; `orcidPendingSignIn.test.ts` now has 12 tests.

- [ ] **Step 5: Commit**

```bash
command git add "pages/api/auth/[...nextauth].ts" lib/__tests__/orcidPendingSignIn.test.ts
command git commit -m "$(cat <<'EOF'
feat: update() completes a pending ORCID sign-in

The jwt callback re-reads the ORCID iD already in the token, never one
sent by the browser, and hydrates once the email is confirmed.

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 5: A development-only ORCID mock

**Files:**
- Modify: `contants/AccountConstants.ts` (PR 2)
- Modify: `lib/orcidEmail.ts` (Task 1)
- Create: `lib/devOrcidMock.ts`
- Modify: `types/next-auth.d.ts` (Task 2)
- Modify: `pages/api/auth/[...nextauth].ts`
- Create: `components/Account/DevOrcidMockForm.tsx`
- Modify: `pages/account/login/index.tsx` (PR 2)
- Modify: `.env.local.template`
- Test: `lib/__tests__/authProviders.test.ts` (PR 0, changed by PR 2), `lib/__tests__/devOrcidMock.test.ts`, `components/Account/__tests__/DevOrcidMockForm.test.tsx`

**Interfaces:**
- Consumes: `signInWithOrcid`, `findUserByOrcid`, `emailHintFor` (Task 3); `refreshPendingSignIn` (Task 4); `fetchOrcidPublicEmail` (Task 1); PR 2's `developmentOnlyProviders` (GitHub only), `CredentialsProvider` import and `async jwt({ token, account, trigger, user })`; `EDIT_FORM_LABEL_CLASS` / `EDIT_FORM_INPUT_CLASS` / `EDIT_FORM_ERROR_CLASS`; `getProviders`, `signIn` from `next-auth/react`.
- Produces:
  - `contants/AccountConstants.ts`: `ORCID_ID_PATTERN = /^\d{4}-\d{4}-\d{4}-\d{3}[\dX]$/`, `DEV_ORCID_MOCK_PROVIDER_ID = "orcid-dev"`, `DEV_ORCID_MOCK_PROVIDER_NAME = "ORCID (development mock)"`; `lib/orcidEmail.ts` uses `ORCID_ID_PATTERN` instead of its private copy.
  - `lib/devOrcidMock.ts`: `authorizeDevOrcidMock(credentials?: Record<string, string>): Promise<User | null>` — `{ id: <iD>, name, publicEmail? }` for a well-formed iD (name defaults to `"Dev User <iD>"`), `null` otherwise; `devOrcidMockProvider()` — a `CredentialsProvider` with that id, name and `authorize`.
  - `pages/api/auth/[...nextauth].ts`: `interface OrcidSignIn { orcid: string; name?: string; publicEmail: () => Promise<string | undefined> }`; `orcidSignIn(account: Account | null | undefined, user?: User | null): OrcidSignIn | null` — non-null for provider `"orcid"` (iD from `account.orcid`, public email read lazily from `pub.orcid.org`) and for `"orcid-dev"` (iD from `account.providerAccountId`, public email from the form, never `pub.orcid.org`); `signInWithOrcid(token: JWT, attempt: OrcidSignIn): Promise<JWT>` (was `(token, account)` in Task 3). The mock is registered only when `NODE_ENV === "development"` and `ENABLE_DEV_ORCID_MOCK === "true"`.
  - `types/next-auth.d.ts`: `User.publicEmail?: string`.
  - `DevOrcidMockForm({ callbackUrl }: { callbackUrl: string })` — renders nothing unless `getProviders()` lists `"orcid-dev"`; otherwise a dashed box titled "ORCID (development mock)", marked "Development only", with "ORCID iD", "Name (optional)", "Public email (optional)" and "Sign in as this iD" → `signIn("orcid-dev", { orcid, name, email, callbackUrl })`.
  - `.env.local.template`: `ENABLE_DEV_ORCID_MOCK=false`.

Why a mock: production ORCID accepts only HTTPS redirect URIs, so no ORCID flow in this PR can be signed into from `http://localhost:3000`. The mock replaces only the OAuth round trip. After `authorize`, NextAuth calls the `jwt` callback with `account.provider === "orcid-dev"`, and `orcidSignIn` turns that into the same `OrcidSignIn` a real ORCID sign-in produces. From then on the pending state, the `emailHint`, the gatekeeper lookup (provider `"orcid"`, reference = the iD), `claimPendingInvitations` and Task 4's `update()` re-lookup are the same code. The only difference is where the public email comes from: the form instead of `pub.orcid.org`.

Why two switches: anyone who can reach a server with this provider can sign in as any ORCID iD, and so as any ORCID account. `NODE_ENV` is inlined by `next build`, so a production bundle does not contain the provider at all. `ENABLE_DEV_ORCID_MOCK` keeps it off in a plain `npm run dev` too, so a dev server exposed on a shared network does not offer it unless someone turned it on.

How the login page knows: the page already shows development-only UI (the GitHub button) with an inline `process.env.NODE_ENV == "development"`. That mirrors the server exactly because `NODE_ENV` is inlined in both bundles. The second switch is a server-only runtime variable, so the page cannot read it. A `NEXT_PUBLIC_` copy would be a second flag that can disagree with the server (form shown, provider missing, or the other way round), and it would be baked into the client bundle at build time. So the page keeps its `NODE_ENV` guard, which also keeps the component and its request out of a production bundle. Inside that guard, `DevOrcidMockForm` asks the server with `getProviders()` (`GET /api/auth/providers`) and renders only when `"orcid-dev"` is listed. What the page shows is then exactly what the server will accept.

`CredentialsProvider(options)` returns `{ id: "credentials", name: "Credentials", ..., options }`, and NextAuth merges `options` over it only when it parses the providers. So `authOptions.providers[i].id` is `"credentials"` for every credentials provider, including this one. The provider-id test therefore reads `provider.options?.id ?? provider.id`, which is what NextAuth itself ends up using.

- [ ] **Step 1: Write the failing tests**

Replace the whole of `lib/__tests__/authProviders.test.ts` (as merged: `providerIdsWhen(nodeEnv)` reading `provider.id`, three tests) with:

```ts
jest.mock("../share", () => ({ claimInvitations: jest.fn() }));

import { describe, expect, test } from '@jest/globals';

type Provider = { id: string; name: string; options?: { id?: string; name?: string } };

// next build compiles everything under pages/, and inlines NODE_ENV there: this test cannot live next to the route.
function providersWhen(nodeEnv: string, orcidMock?: string): { id: string; name: string }[] {
    const env = process.env as Record<string, string | undefined>;
    const original = { NODE_ENV: env.NODE_ENV, ENABLE_DEV_ORCID_MOCK: env.ENABLE_DEV_ORCID_MOCK };
    env.NODE_ENV = nodeEnv;
    if (orcidMock === undefined) {
        delete env.ENABLE_DEV_ORCID_MOCK;
    } else {
        env.ENABLE_DEV_ORCID_MOCK = orcidMock;
    }
    try {
        let providers: Provider[] = [];
        jest.isolateModules(() => {
            providers = require("../../pages/api/auth/[...nextauth]").authOptions.providers;
        });
        // NextAuth merges a provider's options over its defaults; a credentials provider's own id lives in options.
        return providers.map((provider) => ({
            id: provider.options?.id ?? provider.id,
            name: provider.options?.name ?? provider.name,
        }));
    } finally {
        for (const [key, value] of Object.entries(original)) {
            if (value === undefined) {
                delete env[key];
            } else {
                env[key] = value;
            }
        }
    }
}

function providerIdsWhen(nodeEnv: string, orcidMock?: string): string[] {
    return providersWhen(nodeEnv, orcidMock).map((provider) => provider.id);
}

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

describe("the development ORCID mock", () => {
    test("never exists in production, even with the flag on", () => {
        expect(providerIdsWhen("production", "true")).toEqual(["orcid", "credentials"]);
        expect(providerIdsWhen("test", "true")).toEqual(["orcid", "credentials"]);
    });

    test.each`
        flag
        ${undefined}
        ${"false"}
        ${"TRUE"}
        ${"1"}
    `("is off in development unless the flag is exactly \"true\" ($flag)", ({ flag }) => {
        expect(providerIdsWhen("development", flag)).toEqual(["orcid", "credentials", "github"]);
    });

    test("is offered in development with the flag on, after the others", () => {
        expect(providerIdsWhen("development", "true")).toEqual(["orcid", "credentials", "github", "orcid-dev"]);
    });

    test("says it is a mock", () => {
        expect(providersWhen("development", "true").find((provider) => provider.id === "orcid-dev").name)
            .toBe("ORCID (development mock)");
    });
});
```

Create `lib/__tests__/devOrcidMock.test.ts`:

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
import { DEV_ORCID_MOCK_PROVIDER_ID } from "../../contants/AccountConstants";
import { authorizeDevOrcidMock } from "../devOrcidMock";
import { fetchOrcidPublicEmail } from "../orcidEmail";
import { claimInvitations } from "../share";
import { createUser, getUserByProviderID } from "../users";

const ORCID = "0000-0001-2345-6789";
const TENANCY = "datamap/production/data-amazon";

const jwt = (params: Record<string, unknown>): Promise<any> => authOptions.callbacks.jwt(params as any);

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

/** What NextAuth 4.24.9's credentials callback does after authorize: default token from the user, then jwt. */
async function signInWithMock(fields: Record<string, string>) {
    const user = await authorizeDevOrcidMock(fields);
    return jwt({
        token: { name: user.name, sub: user.id },
        user,
        account: { provider: DEV_ORCID_MOCK_PROVIDER_ID, type: "credentials", providerAccountId: user.id },
        trigger: "signIn",
    });
}

beforeEach(() => {
    jest.mocked(claimInvitations).mockResolvedValue({ accepted: [] } as any);
    jest.mocked(fetchOrcidPublicEmail).mockResolvedValue("never-used@orcid.org");
});

describe("the mock's authorize", () => {
    test("signs in as the typed iD, with the name and public email", async () => {
        expect(await authorizeDevOrcidMock({ orcid: ` ${ORCID} `, name: " Ada Lovelace ", email: " ada.public@example.org " }))
            .toEqual({ id: ORCID, name: "Ada Lovelace", publicEmail: "ada.public@example.org" });
    });

    test("without a name it makes one up from the iD, and without an email it has none", async () => {
        const user = await authorizeDevOrcidMock({ orcid: ORCID, name: "", email: "" });

        expect(user).toEqual({ id: ORCID, name: `Dev User ${ORCID}` });
        expect("publicEmail" in user).toBe(false);
    });

    test("accepts an iD whose check digit is X", async () => {
        expect((await authorizeDevOrcidMock({ orcid: "0000-0002-1694-233X" })).id).toBe("0000-0002-1694-233X");
    });

    test.each`
        orcid
        ${""}
        ${"0000-0001-2345-678"}
        ${"0000-0001-2345-678x"}
        ${"0000000123456789"}
        ${"0000-0001-2345-6789-0000"}
        ${"../../admin"}
    `("refuses a malformed iD ($orcid)", async ({ orcid }) => {
        expect(await authorizeDevOrcidMock({ orcid, name: "Mallory" })).toBeNull();
    });

    test("refuses a request without fields", async () => {
        expect(await authorizeDevOrcidMock(undefined)).toBeNull();
    });
});

describe("a mock sign-in takes the ORCID path", () => {
    test("an iD with no account is pending, pre-filled with the email typed in the form, and ORCID is never asked", async () => {
        jest.mocked(getUserByProviderID).mockRejectedValue(gatekeeperError(404));

        const token = await signInWithMock({ orcid: ORCID, name: "Ada Lovelace", email: "ada.public@example.org" });

        expect(token.uid).toBeUndefined();
        expect(token.tenancies).toBeUndefined();
        expect(token.pending).toEqual({ orcid: ORCID, name: "Ada Lovelace", emailHint: "ada.public@example.org" });
        expect(token.v).toBe(TOKEN_VERSION);
        expect(getUserByProviderID).toHaveBeenCalledWith({ providerName: "orcid", providerID: ORCID });
        expect(fetchOrcidPublicEmail).not.toHaveBeenCalled();
        expect(createUser).not.toHaveBeenCalled();
        expect(claimInvitations).not.toHaveBeenCalled();
    });

    test("without a public email in the form, the hint is left out", async () => {
        jest.mocked(getUserByProviderID).mockRejectedValue(gatekeeperError(404));

        const token = await signInWithMock({ orcid: ORCID, name: "", email: "" });

        expect(token.pending).toEqual({ orcid: ORCID, name: `Dev User ${ORCID}` });
        expect(fetchOrcidPublicEmail).not.toHaveBeenCalled();
    });

    test("an account with a placeholder email is pending, pre-filled from the form", async () => {
        jest.mocked(getUserByProviderID).mockResolvedValue(account({ email: `${ORCID}@fake.mail.com`, email_verified_at: null }));

        const token = await signInWithMock({ orcid: ORCID, name: "Ada Lovelace", email: "ada.public@example.org" });

        expect(token.pending).toEqual({ orcid: ORCID, name: "Ada Lovelace", emailHint: "ada.public@example.org" });
    });

    test("an account with a real but unconfirmed email is pre-filled with that email, not the form's", async () => {
        jest.mocked(getUserByProviderID).mockResolvedValue(account({ email: "ada@usp.br", email_verified_at: null }));

        const token = await signInWithMock({ orcid: ORCID, name: "Ada Lovelace", email: "ada.public@example.org" });

        expect(token.pending).toEqual({ orcid: ORCID, name: "Ada Lovelace", emailHint: "ada@usp.br" });
    });

    test("an account with a confirmed email signs in as that account and claims its invitations", async () => {
        jest.mocked(getUserByProviderID).mockResolvedValue(account());

        const token = await signInWithMock({ orcid: ORCID, name: "Ada Lovelace", email: "" });

        expect(token.uid).toBe("u1");
        expect(token.tenancies).toEqual([TENANCY]);
        expect(token.pending).toBeUndefined();
        expect(token.v).toBe(TOKEN_VERSION);
        expect(getUserByProviderID).toHaveBeenCalledWith({ providerName: "orcid", providerID: ORCID });
        expect(claimInvitations).toHaveBeenCalledWith("u1");
    });

    test("update() finishes a pending mock sign-in once the email is confirmed", async () => {
        jest.mocked(getUserByProviderID).mockRejectedValueOnce(gatekeeperError(404));
        const pending = await signInWithMock({ orcid: ORCID, name: "Ada Lovelace", email: "ada.public@example.org" });
        jest.mocked(getUserByProviderID).mockResolvedValue(account());

        const token = await jwt({ token: pending, trigger: "update" });

        expect(token.uid).toBe("u1");
        expect(token.pending).toBeUndefined();
        expect(getUserByProviderID).toHaveBeenLastCalledWith({ providerName: "orcid", providerID: ORCID });
    });
});
```

Create `components/Account/__tests__/DevOrcidMockForm.test.tsx`:

```tsx
/**
 * @jest-environment jsdom
 */
import { fireEvent, render, screen, waitFor } from "@testing-library/react";

const mockSignIn = jest.fn();
const mockGetProviders = jest.fn();

jest.mock("next-auth/react", () => ({
    signIn: (...args: unknown[]) => mockSignIn(...args),
    getProviders: () => mockGetProviders(),
}));

import { DevOrcidMockForm } from "../DevOrcidMockForm";

const ORCID = "0000-0001-2345-6789";
const ORCID_PROVIDER = { id: "orcid", name: "Orcid" };
const PASSWORD = { id: "credentials", name: "Email and password" };
const MOCK = { id: "orcid-dev", name: "ORCID (development mock)" };

async function renderRegistered(callbackUrl = "/app/home") {
    render(<DevOrcidMockForm callbackUrl={callbackUrl} />);
    return screen.findByLabelText("ORCID iD");
}

beforeEach(() => {
    mockSignIn.mockResolvedValue(undefined);
    mockGetProviders.mockResolvedValue({ orcid: ORCID_PROVIDER, credentials: PASSWORD, "orcid-dev": MOCK });
});

describe("DevOrcidMockForm", () => {
    test.each`
        case                         | providers
        ${"not registered"}          | ${{ orcid: ORCID_PROVIDER, credentials: PASSWORD }}
        ${"providers not readable"}  | ${null}
    `("shows nothing when the mock is $case", async ({ providers }) => {
        mockGetProviders.mockResolvedValue(providers);

        const { container } = render(<DevOrcidMockForm callbackUrl="/app/home" />);

        await waitFor(() => expect(mockGetProviders).toHaveBeenCalled());
        expect(container.innerHTML).toBe("");
    });

    test("shows nothing when the providers request fails", async () => {
        mockGetProviders.mockRejectedValue(new Error("offline"));

        const { container } = render(<DevOrcidMockForm callbackUrl="/app/home" />);

        await waitFor(() => expect(mockGetProviders).toHaveBeenCalled());
        expect(container.innerHTML).toBe("");
    });

    test("says it is a development-only mock", async () => {
        await renderRegistered();

        expect(screen.getByTestId("dev-orcid-mock").textContent).toContain("ORCID (development mock)");
        expect(screen.getByTestId("dev-orcid-mock").textContent).toContain("Development only");
    });

    test("signs in through the mock as the typed iD, with the name and public email", async () => {
        fireEvent.change(await renderRegistered("/app/datasets/d1"), { target: { value: ` ${ORCID} ` } });
        fireEvent.change(screen.getByLabelText("Name (optional)"), { target: { value: " Ada Lovelace " } });
        fireEvent.change(screen.getByLabelText("Public email (optional)"), { target: { value: "ada.public@example.org" } });
        fireEvent.click(screen.getByRole("button", { name: "Sign in as this iD" }));

        await waitFor(() => expect(mockSignIn).toHaveBeenCalledWith("orcid-dev", {
            orcid: ORCID,
            name: "Ada Lovelace",
            email: "ada.public@example.org",
            callbackUrl: "/app/datasets/d1",
        }));
    });

    test("the name and the public email may be left empty", async () => {
        fireEvent.change(await renderRegistered(), { target: { value: ORCID } });
        fireEvent.click(screen.getByRole("button", { name: "Sign in as this iD" }));

        await waitFor(() => expect(mockSignIn).toHaveBeenCalledWith("orcid-dev", {
            orcid: ORCID, name: "", email: "", callbackUrl: "/app/home",
        }));
    });

    test.each`
        orcid                    | message
        ${""}                    | ${"Enter an ORCID iD."}
        ${"0000-0001-2345-678"}  | ${"Use the form 0000-0000-0000-0000 (the last character may be X)."}
        ${"0000000123456789"}    | ${"Use the form 0000-0000-0000-0000 (the last character may be X)."}
    `("refuses the iD \"$orcid\"", async ({ orcid, message }) => {
        fireEvent.change(await renderRegistered(), { target: { value: orcid } });
        fireEvent.click(screen.getByRole("button", { name: "Sign in as this iD" }));

        expect(await screen.findByText(message)).toBeTruthy();
        expect(mockSignIn).not.toHaveBeenCalled();
    });

    test("refuses a public email that is not an email", async () => {
        fireEvent.change(await renderRegistered(), { target: { value: ORCID } });
        fireEvent.change(screen.getByLabelText("Public email (optional)"), { target: { value: "not-an-email" } });
        fireEvent.click(screen.getByRole("button", { name: "Sign in as this iD" }));

        expect(await screen.findByText("Enter a valid email address.")).toBeTruthy();
        expect(mockSignIn).not.toHaveBeenCalled();
    });
});
```

- [ ] **Step 2: Run them and watch them fail**

Run: `npx jest --coverage=false lib/__tests__/authProviders.test.ts lib/__tests__/devOrcidMock.test.ts components/Account/__tests__/DevOrcidMockForm.test.tsx`
Expected: FAIL.
- `authProviders.test.ts`: "is offered in development with the flag on, after the others" fails (received `["orcid", "credentials", "github"]`), and "says it is a mock" fails with `Cannot read properties of undefined (reading 'name')`. The other tests pass already: they guard the gates, and the gates must still hold after the change.
- `devOrcidMock.test.ts`: "Test suite failed to run", `Cannot find module '../devOrcidMock'`.
- `DevOrcidMockForm.test.tsx`: "Test suite failed to run", `Cannot find module '../DevOrcidMockForm'`.

- [ ] **Step 3: Implement the provider and the shared ORCID path**

Append to the end of `contants/AccountConstants.ts`:

```ts

export const ORCID_ID_PATTERN = /^\d{4}-\d{4}-\d{4}-\d{3}[\dX]$/;

export const DEV_ORCID_MOCK_PROVIDER_ID = "orcid-dev";

export const DEV_ORCID_MOCK_PROVIDER_NAME = "ORCID (development mock)";
```

In `lib/orcidEmail.ts` (Task 1), replace

```ts
import axios from "axios";
```

with

```ts
import axios from "axios";
import { ORCID_ID_PATTERN } from "../contants/AccountConstants";
```

delete the line `const ORCID_ID = /^\d{4}-\d{4}-\d{4}-\d{3}[\dX]$/;` and the blank line after it, and replace `    if (!ORCID_ID.test(orcid)) {` with `    if (!ORCID_ID_PATTERN.test(orcid)) {`.

Create `lib/devOrcidMock.ts`:

```ts
import { User } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { DEV_ORCID_MOCK_PROVIDER_ID, DEV_ORCID_MOCK_PROVIDER_NAME, ORCID_ID_PATTERN } from "../contants/AccountConstants";

export async function authorizeDevOrcidMock(credentials?: Record<string, string>): Promise<User | null> {
    const orcid = credentials?.orcid?.trim() ?? "";
    if (!ORCID_ID_PATTERN.test(orcid)) {
        return null;
    }
    const name = credentials?.name?.trim() || `Dev User ${orcid}`;
    const publicEmail = credentials?.email?.trim();
    return { id: orcid, name, ...(publicEmail ? { publicEmail } : {}) };
}

/** Signs in as any ORCID iD: register it only behind NODE_ENV === "development" and ENABLE_DEV_ORCID_MOCK === "true". */
export function devOrcidMockProvider() {
    return CredentialsProvider({
        id: DEV_ORCID_MOCK_PROVIDER_ID,
        name: DEV_ORCID_MOCK_PROVIDER_NAME,
        credentials: {},
        authorize: authorizeDevOrcidMock,
    });
}
```

In `types/next-auth.d.ts` (as Task 2 left it), replace

```ts
        } & DefaultSession["user"]
    }
}
```

with

```ts
        } & DefaultSession["user"]
    }

    interface User {
        /** Set only by the development ORCID mock: the public email ORCID would have returned. */
        publicEmail?: string
    }
}
```

In `pages/api/auth/[...nextauth].ts`:

1. Immediately after the line `import { fetchOrcidPublicEmail, isPlaceholderEmail } from "../../../lib/orcidEmail";` (Task 3) insert:

```ts
import { DEV_ORCID_MOCK_PROVIDER_ID } from "../../../contants/AccountConstants";
import { devOrcidMockProvider } from "../../../lib/devOrcidMock";
```

2. Replace PR 2's block

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
```

with

```ts
// GitHub is for local work, and the ORCID mock signs in as any iD: neither may exist in production.
const developmentOnlyProviders = process.env.NODE_ENV === "development"
  ? [
    GithubProvider({
      clientId: process.env.GITHUB_ID,
      clientSecret: process.env.GITHUB_SECRET,
    }),
    ...(process.env.ENABLE_DEV_ORCID_MOCK === "true" ? [devOrcidMockProvider()] : []),
  ]
  : [];
```

3. Replace Task 3's lines

```ts
      if (trigger == "signIn" && account?.provider == "orcid") {
        token = await signInWithOrcid(token, account as Account);
      } else if (trigger == "signIn") {
```

with

```ts
      const orcid = trigger == "signIn" ? orcidSignIn(account, user) : null;
      if (orcid) {
        token = await signInWithOrcid(token, orcid);
      } else if (trigger == "signIn") {
```

4. Immediately before Task 3's line `async function findUserByOrcid(orcid: string): Promise<GetUserByProviderResponse | null> {` insert:

```ts
export interface OrcidSignIn {
  orcid: string
  name?: string
  publicEmail: () => Promise<string | undefined>
}

/** A real ORCID sign-in, or the development mock standing in for one; null for any other provider. */
export function orcidSignIn(account: Account | null | undefined, user?: User | null): OrcidSignIn | null {
  if (account?.provider === "orcid") {
    const orcid = account.orcid as string;
    return {
      orcid,
      name: user?.name ?? undefined,
      publicEmail: () => fetchOrcidPublicEmail(orcid, account.access_token),
    };
  }
  if (account?.provider === DEV_ORCID_MOCK_PROVIDER_ID && account.providerAccountId) {
    return {
      orcid: account.providerAccountId,
      name: user?.name ?? undefined,
      publicEmail: async () => user?.publicEmail,
    };
  }
  return null;
}

```

5. Replace Task 3's

```ts
async function emailHintFor(user: GetUserByProviderResponse | null, orcid: string, accessToken?: string): Promise<string | undefined> {
  if (user && !isPlaceholderEmail(user.email)) {
    return user.email;
  }
  return fetchOrcidPublicEmail(orcid, accessToken);
}

export async function signInWithOrcid(token: JWT, account: Account): Promise<JWT> {
  const orcid = account.orcid as string;
  const user = await findUserByOrcid(orcid);
```

with

```ts
async function emailHintFor(user: GetUserByProviderResponse | null, attempt: OrcidSignIn): Promise<string | undefined> {
  if (user && !isPlaceholderEmail(user.email)) {
    return user.email;
  }
  return attempt.publicEmail();
}

export async function signInWithOrcid(token: JWT, attempt: OrcidSignIn): Promise<JWT> {
  const { orcid } = attempt;
  const user = await findUserByOrcid(orcid);
```

and, further down in `signInWithOrcid`, replace

```ts
  const emailHint = await emailHintFor(user, orcid, account.access_token);
  token.pending = {
    orcid,
    name: (token.name as string) || user?.name || orcid,
```

with

```ts
  const emailHint = await emailHintFor(user, attempt);
  token.pending = {
    orcid,
    name: (token.name as string) || attempt.name || user?.name || orcid,
```

The gatekeeper never sees `"orcid-dev"`: `findUserByOrcid` always looks up provider `"orcid"`, and the account the email verification creates or links carries provider `"orcid"` with the iD as its reference, exactly as after a real ORCID sign-in. `refreshPendingSignIn` (Task 4) reads `token.pending.orcid`, so it needs no change.

In `.env.local.template`, immediately after the line `OAUTH_ORCID_REDIRECT_URI_BASE=https://localhost:3000/orcid-oauth-callback` insert:

```
ENABLE_DEV_ORCID_MOCK=false
```

- [ ] **Step 4: Implement the form and put it on the login page**

Create `components/Account/DevOrcidMockForm.tsx`:

```tsx
import { ErrorMessage, Field, Form, Formik } from "formik";
import { getProviders, signIn } from "next-auth/react";
import { useEffect, useState } from "react";
import * as Yup from "yup";
import { DEV_ORCID_MOCK_PROVIDER_ID, DEV_ORCID_MOCK_PROVIDER_NAME, ORCID_ID_PATTERN } from "../../contants/AccountConstants";
import { EDIT_FORM_ERROR_CLASS, EDIT_FORM_INPUT_CLASS, EDIT_FORM_LABEL_CLASS } from "../../contants/EditFormConstants";

interface Values {
    orcid: string
    name: string
    email: string
}

const INITIAL_VALUES: Values = { orcid: "", name: "", email: "" };

const SCHEMA = Yup.object({
    orcid: Yup.string()
        .trim()
        .required("Enter an ORCID iD.")
        .matches(ORCID_ID_PATTERN, "Use the form 0000-0000-0000-0000 (the last character may be X)."),
    name: Yup.string().trim(),
    email: Yup.string().trim().email("Enter a valid email address."),
});

/** Shown only when the server registered the mock, which it does only in development with ENABLE_DEV_ORCID_MOCK=true. */
export function DevOrcidMockForm(props: { callbackUrl: string }) {
    const [registered, setRegistered] = useState(false);

    useEffect(() => {
        let mounted = true;
        getProviders()
            .then((providers) => {
                if (mounted) {
                    setRegistered(Boolean(providers?.[DEV_ORCID_MOCK_PROVIDER_ID]));
                }
            })
            .catch(() => undefined);
        return () => {
            mounted = false;
        };
    }, []);

    if (!registered) {
        return null;
    }

    function submit(values: Values) {
        return signIn(DEV_ORCID_MOCK_PROVIDER_ID, {
            orcid: values.orcid.trim(),
            name: values.name.trim(),
            email: values.email.trim(),
            callbackUrl: props.callbackUrl,
        });
    }

    return (
        <section data-testid="dev-orcid-mock" className="mt-2 mb-2 flex flex-col gap-2 rounded-lg border border-dashed border-primary-300 p-4">
            <p className="m-0 text-sm font-semibold text-primary-900">{DEV_ORCID_MOCK_PROVIDER_NAME}</p>
            <p className="m-0 text-[13px] leading-5 text-primary-500">
                Development only. Signs in as any ORCID iD without asking ORCID; the public email stands in for the one ORCID would return.
            </p>
            <Formik initialValues={INITIAL_VALUES} validationSchema={SCHEMA} onSubmit={submit}>
                {({ isSubmitting }) => (
                    <Form noValidate className="flex flex-col gap-2">
                        <label htmlFor="dev-orcid-id" className={EDIT_FORM_LABEL_CLASS}>ORCID iD</label>
                        <Field id="dev-orcid-id" name="orcid" placeholder="0000-0000-0000-0000" autoComplete="off" className={EDIT_FORM_INPUT_CLASS} />
                        <ErrorMessage name="orcid" component="p" className={EDIT_FORM_ERROR_CLASS} />

                        <label htmlFor="dev-orcid-name" className={EDIT_FORM_LABEL_CLASS}>Name (optional)</label>
                        <Field id="dev-orcid-name" name="name" autoComplete="off" className={EDIT_FORM_INPUT_CLASS} />

                        <label htmlFor="dev-orcid-email" className={EDIT_FORM_LABEL_CLASS}>Public email (optional)</label>
                        <Field id="dev-orcid-email" name="email" type="email" autoComplete="off" className={EDIT_FORM_INPUT_CLASS} />
                        <ErrorMessage name="email" component="p" className={EDIT_FORM_ERROR_CLASS} />

                        <button type="submit" disabled={isSubmitting} className="btn-primary-outline m-0 mt-2 self-start disabled:opacity-60">
                            Sign in as this iD
                        </button>
                    </Form>
                )}
            </Formik>
        </section>
    );
}
```

In `pages/account/login/index.tsx` (as merged):

1. Immediately before PR 2's line `import { SignInForm } from "../../../components/Account/SignInForm";` insert:

```tsx
import { DevOrcidMockForm } from "../../../components/Account/DevOrcidMockForm";
```

2. Replace PR 2's line (in the "Sign in" tab)

```tsx
              <OrcidButton callbackUrl={callbackUrl}>Sign in with ORCID</OrcidButton>
```

with

```tsx
              <OrcidButton callbackUrl={callbackUrl}>Sign in with ORCID</OrcidButton>
              {process.env.NODE_ENV == "development" &&
                <DevOrcidMockForm callbackUrl={callbackUrl} />
              }
```

The "Create account" tab is left alone: an ORCID sign-in and an ORCID sign-up are the same flow, so one form covers both.

- [ ] **Step 5: Run them and watch them pass, then type-check**

Run: `npx jest --coverage=false lib/__tests__/authProviders.test.ts lib/__tests__/devOrcidMock.test.ts components/Account/__tests__/DevOrcidMockForm.test.tsx lib/__tests__/orcidPendingSignIn.test.ts lib/__tests__/orcidEmail.test.ts lib/__tests__/sessionTokenVersion.test.ts lib/__tests__/passwordSignIn.test.ts "pages/api/auth/__tests__"`
Expected: PASS — 8 suites: `authProviders.test.ts` 10 tests (was 3), `devOrcidMock.test.ts` 16, `DevOrcidMockForm.test.tsx` 10, `orcidPendingSignIn.test.ts` 12, `orcidEmail.test.ts` 16, `sessionTokenVersion.test.ts` 8, plus PR 2's `passwordSignIn.test.ts` and `[...nextauth].test.ts`. `orcidPendingSignIn.test.ts` is unchanged and still passes: a real ORCID sign-in still reads the public email from `pub.orcid.org` with the access token, now through `orcidSignIn`.

Run: `npx tsc --noEmit -p .`
Expected: no output.

- [ ] **Step 6: Commit**

```bash
command git add contants/AccountConstants.ts lib/orcidEmail.ts lib/devOrcidMock.ts types/next-auth.d.ts "pages/api/auth/[...nextauth].ts" components/Account/DevOrcidMockForm.tsx pages/account/login/index.tsx .env.local.template lib/__tests__/authProviders.test.ts lib/__tests__/devOrcidMock.test.ts components/Account/__tests__/DevOrcidMockForm.test.tsx
command git commit -m "$(cat <<'EOF'
feat: a development-only ORCID mock to test the ORCID flows locally

Production ORCID accepts only HTTPS redirect URIs, so no ORCID flow could
be signed into from localhost. The orcid-dev credentials provider signs in
as any iD and feeds the same jwt path as ORCID (pending state, email hint,
lookup by provider orcid, update(), invitations), with the public email
typed in the form instead of read from pub.orcid.org.

It is registered only when NODE_ENV is development and
ENABLE_DEV_ORCID_MOCK is "true"; the login page shows its form only when
/api/auth/providers lists it.

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 6: The BFF requires a user id; pending tokens get their own chain

**Files:**
- Modify: `lib/middlewareChain.ts`
- Modify: `lib/__tests__/middlewareChain.test.ts`
- Modify: `lib/__tests__/embargoRoutes.test.ts`, `lib/__tests__/membersAccessRoute.test.ts`, `lib/__tests__/shareRoutes.test.ts`, `lib/__tests__/accountRoutes.test.ts` (PR 2)

**Interfaces:**
- Consumes: `getToken({ req })`, `TOKEN_VERSION`; the merged `auth` step (`if (!token)` only) used by `middlewareChain` and `authOnlyChain`, and so by `bffRouter()` and PR 2's `PUT /api/account/password`.
- Produces: `auth` step requires `token.uid` and `token.v === TOKEN_VERSION` (PR 2's `publicChain` is untouched; the unused `lib/auth.ts` is left alone); `export const pendingOnlyChain`, declared next to `publicChain`, = `requestLogging` + a step requiring `token.pending`, no `token.uid`, and `token.v === TOKEN_VERSION`; 401 `"401 Unauthorized"` otherwise.

The version check here is defence in depth: `getToken` decodes the cookie without running the `jwt` callback, so between deploy and the browser's next `/api/auth/session` call an old cookie would still pass the BFF.

- [ ] **Step 1: Write the failing test**

In `lib/__tests__/middlewareChain.test.ts`:

1. Replace the merged line `import middlewareChain, { authOnlyChain, publicChain } from "../middlewareChain";` with:

```ts
import middlewareChain, { authOnlyChain, pendingOnlyChain, publicChain } from "../middlewareChain";
import { TOKEN_VERSION } from "../sessionToken";
```

2. Replace every `mockGetToken.mockResolvedValue({ uid: "u1" } as any);` with `mockGetToken.mockResolvedValue({ uid: "u1", v: TOKEN_VERSION } as any);` (three occurrences, in "the dataset chain lets a signed-in account with no tenancy through", "the default chain still requires a tenancy" and "the default chain passes with a tenancy cookie"; the anonymous test and PR 2's public-chain test mock `null` and stay as they are).

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

2. Immediately after the merged line `export const publicChain = createRouter<NextApiRequest, NextApiResponse>().use(requestLogging);` (under its comment `// Account routes a signed-out visitor needs: sign-up, code confirmation, password reset.`) insert:

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

Every test whose route goes through `middlewareChain`, `authOnlyChain` or `bffRouter` with a signed-in token now needs `v: 2`. In the merged tree those are the module-level `getToken` mocks of `embargoRoutes.test.ts`, `membersAccessRoute.test.ts` and `shareRoutes.test.ts`, and the two "changing the password" tests of `accountRoutes.test.ts`. `telemetryRoute.test.ts` (`pages/api/telemetry.ts` reads `getToken` itself) and `appLocalContext.test.ts` (`NewContext`, no chain) are left alone.

```bash
sed -i '' 's/getToken: jest.fn(async () => ({ uid: "u1" }))/getToken: jest.fn(async () => ({ uid: "u1", v: 2 }))/' \
  lib/__tests__/embargoRoutes.test.ts \
  lib/__tests__/membersAccessRoute.test.ts \
  lib/__tests__/shareRoutes.test.ts
sed -i '' 's/jest.mocked(getToken).mockResolvedValue({ uid: "u1" } as any);/jest.mocked(getToken).mockResolvedValue({ uid: "u1", v: 2 } as any);/' \
  lib/__tests__/accountRoutes.test.ts
grep -n 'getToken.*uid: "u1" }' lib/__tests__/embargoRoutes.test.ts lib/__tests__/membersAccessRoute.test.ts lib/__tests__/shareRoutes.test.ts lib/__tests__/accountRoutes.test.ts
grep -c 'v: 2' lib/__tests__/embargoRoutes.test.ts lib/__tests__/membersAccessRoute.test.ts lib/__tests__/shareRoutes.test.ts lib/__tests__/accountRoutes.test.ts
```

Expected: the first `grep` prints nothing; the second prints `:1` for `embargoRoutes`, `membersAccessRoute` and `shareRoutes` and `:2` for `accountRoutes` (it was `:0` for all four; both `PUT /api/account/password` tests in `accountRoutes.test.ts` now carry `v: 2`). The first `grep` is anchored on `getToken` because `shareRoutes.test.ts` also has `expect.objectContaining({ uid: "u1" })`, which is an assertion, not a token.

- [ ] **Step 5: Run it and watch it pass**

Run: `npx jest --coverage=false lib/__tests__/middlewareChain.test.ts lib/__tests__/embargoRoutes.test.ts lib/__tests__/membersAccessRoute.test.ts lib/__tests__/shareRoutes.test.ts lib/__tests__/accountRoutes.test.ts`
Expected: PASS.

Then run the whole suite to catch any other chained route test: `npx jest --coverage=false`
Expected: PASS — `Test Suites: 88 passed, 88 total`, `Tests: 690 passed, 690 total` (the baseline 83 / 614, plus Tasks 1–5's five new suites with 62 tests, `authProviders.test.ts` +7 and `middlewareChain.test.ts` +7). A failure with status 401 in a route test means its mocked token needs `v: 2`.

- [ ] **Step 6: Commit**

```bash
command git add lib/middlewareChain.ts lib/__tests__/middlewareChain.test.ts lib/__tests__/embargoRoutes.test.ts lib/__tests__/membersAccessRoute.test.ts lib/__tests__/shareRoutes.test.ts lib/__tests__/accountRoutes.test.ts
command git commit -m "$(cat <<'EOF'
feat: the BFF requires a user id and the current token version

A pending ORCID sign-in has no uid and would otherwise reach the
gatekeeper with an empty X-User-Id. pendingOnlyChain admits only
pending tokens, for the email-verification routes.

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 7: Gatekeeper calls for email verification

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

Append to the end of `lib/account.ts` (after the merged `changePassword`, the file's last function):

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

Run: `npx jest --coverage=false lib/__tests__/accountEmailVerification.test.ts lib/__tests__/account.test.ts`
Expected: PASS — the new file's 3 tests and PR 2's 9.

- [ ] **Step 5: Commit**

```bash
command git add lib/account.ts lib/__tests__/accountEmailVerification.test.ts
command git commit -m "$(cat <<'EOF'
feat: gatekeeper calls to request and confirm an email verification

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 8: BFF routes for the pending sign-in

**Files:**
- Modify: `lib/accountRoute.ts`
- Create: `pages/api/account/email-verifications/index.ts`
- Create: `pages/api/account/email-verifications/[challengeId]/confirm.ts`
- Test: `lib/__tests__/emailVerificationRoutes.test.ts`

**Interfaces:**
- Consumes: `pendingOnlyChain` (Task 6); from the merged `lib/accountRoute.ts`: the private `requireJsonContentType` step, `challengeIdOr404(req, res): string | undefined` and `accountHandler(router)` (gatekeeper status and `{detail}` unchanged, `500 {detail: "unavailable"}` without a response, `405` on another verb); `requestEmailVerification`, `confirmEmailVerification` (Task 7); `getToken`.
- Produces:
  - `pendingAccountRouter()` in `lib/accountRoute.ts`, next to `publicAccountRouter()`: `createRouter<NextApiRequest, NextApiResponse>().use(pendingOnlyChain).use(requireJsonContentType)`. Its return type is the same `NodeRouter` that `accountHandler` takes.
  - `POST /api/account/email-verifications` body `{email}` → `202 {challengeId}`
  - `POST /api/account/email-verifications/[challengeId]/confirm` body `{code}` → `204`; a non-UUID `challengeId` → `404 {detail: "challenge_not_found"}` without a gatekeeper call
  - either route: a non-pending token → `401`; a `Content-Type` that is present and not JSON → `415 {detail: "invalid_request"}`

The pending chain runs before the JSON gate, so an anonymous or signed-in request is a `401` whatever it sends. The JSON gate is the same step PR 2 puts on the public routes, for the same reason: these routes act on a session cookie, and a cross-site form can only post `application/x-www-form-urlencoded`, `multipart/form-data` or `text/plain`.

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
const CHALLENGE_ID = "550e8400-e29b-41d4-a716-446655440000";
const pendingToken = { pending: { orcid: ORCID, name: "Ada Lovelace" }, v: 2 };
const JSON_BODY = { "content-type": "application/json" };

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

async function send(handler: any, method: string, query: Record<string, string>, body: unknown = undefined, headers: Record<string, string> = JSON_BODY) {
    const res = fakeRes();
    const original = process.stdout.write;
    // @ts-ignore
    process.stdout.write = () => true;
    try {
        await handler({ method, url: "/api/account/email-verifications", headers, cookies: {}, query, body } as any, res);
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
        jest.mocked(requestEmailVerification).mockResolvedValue({ challengeId: CHALLENGE_ID });

        const res = await send(requestHandler, "POST", {}, { email: " ada@usp.br ", orcid: "9999-9999-9999-9999", name: "Mallory" });

        expect(res.statusCode).toBe(202);
        expect(res.json).toHaveBeenCalledWith({ challengeId: CHALLENGE_ID });
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

    test("a cross-site form post is refused before the gatekeeper is asked", async () => {
        const res = await send(requestHandler, "POST", {}, "email=ada@usp.br", { "content-type": "application/x-www-form-urlencoded" });

        expect(res.statusCode).toBe(415);
        expect(res.json).toHaveBeenCalledWith({ detail: "invalid_request" });
        expect(requestEmailVerification).not.toHaveBeenCalled();
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

        const res = await send(confirmHandler, "POST", { challengeId: CHALLENGE_ID }, { code: "123456" });

        expect(res.statusCode).toBe(204);
        expect(res.end).toHaveBeenCalled();
        expect(res.json).not.toHaveBeenCalled();
        expect(confirmEmailVerification).toHaveBeenCalledWith(CHALLENGE_ID, "123456");
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

        const res = await send(confirmHandler, "POST", { challengeId: CHALLENGE_ID }, { code: "123456" });

        expect(res.statusCode).toBe(status);
        expect(res.json).toHaveBeenCalledWith({ detail });
    });

    test("a challenge id that is not a UUID never reaches the gatekeeper", async () => {
        const res = await send(confirmHandler, "POST", { challengeId: "../../users" }, { code: "123456" });

        expect(res.statusCode).toBe(404);
        expect(res.json).toHaveBeenCalledWith({ detail: "challenge_not_found" });
        expect(confirmEmailVerification).not.toHaveBeenCalled();
    });

    test("a gatekeeper that does not answer is a 500 with a code", async () => {
        jest.mocked(confirmEmailVerification).mockRejectedValue(new Error("ECONNREFUSED"));

        const res = await send(confirmHandler, "POST", { challengeId: CHALLENGE_ID }, { code: "123456" });

        expect(res.statusCode).toBe(500);
        expect(res.json).toHaveBeenCalledWith({ detail: "unavailable" });
    });

    test("a signed-in user cannot use it", async () => {
        jest.mocked(getToken).mockResolvedValue({ uid: "u1", v: 2 } as any);

        const res = await send(confirmHandler, "POST", { challengeId: CHALLENGE_ID }, { code: "123456" });

        expect(res.statusCode).toBe(401);
        expect(confirmEmailVerification).not.toHaveBeenCalled();
    });
});
```

`jest.config.ts` sets `clearMocks: true`, so every test starts with no recorded calls and the `not.toHaveBeenCalled()` assertions hold whatever ran before.

- [ ] **Step 2: Run it and watch it fail**

Run: `npx jest --coverage=false lib/__tests__/emailVerificationRoutes.test.ts`
Expected: FAIL — "Test suite failed to run": `Cannot find module '../../pages/api/account/email-verifications/[challengeId]/confirm'`.

- [ ] **Step 3: Implement**

In `lib/accountRoute.ts`:

1. Replace the merged line `import { publicChain } from "./middlewareChain";` with:

```ts
import { pendingOnlyChain, publicChain } from "./middlewareChain";
```

2. Replace the merged function

```ts
export function publicAccountRouter() {
    return createRouter<NextApiRequest, NextApiResponse>().use(publicChain).use(requireJsonContentType);
}
```

with

```ts
export function publicAccountRouter() {
    return createRouter<NextApiRequest, NextApiResponse>().use(publicChain).use(requireJsonContentType);
}

/** Email verification of an ORCID sign-in that has no account, or no confirmed email, yet. */
export function pendingAccountRouter() {
    return createRouter<NextApiRequest, NextApiResponse>().use(pendingOnlyChain).use(requireJsonContentType);
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
import { accountHandler, challengeIdOr404, pendingAccountRouter } from "../../../../../lib/accountRoute";

const router = pendingAccountRouter()
    .post(async (req, res) => {
        const challengeId = challengeIdOr404(req, res);
        if (!challengeId) {
            return;
        }
        await confirmEmailVerification(challengeId, req.body?.code);
        res.status(204).end();
    });

export default accountHandler(router);
```

The request route reads `getToken` a second time instead of passing the token down the chain; `pendingOnlyChain` has already refused any token without `pending`, so the destructuring cannot meet `null`.

- [ ] **Step 4: Run it and watch it pass**

Run: `npx jest --coverage=false lib/__tests__/emailVerificationRoutes.test.ts lib/__tests__/accountRoutes.test.ts lib/__tests__/serverLogging.invariant.test.ts`
Expected: PASS — `emailVerificationRoutes.test.ts` 17 tests; PR 2's `accountRoutes.test.ts` unchanged apart from Task 6's `v: 2`.

- [ ] **Step 5: Commit**

```bash
command git add lib/accountRoute.ts pages/api/account/email-verifications lib/__tests__/emailVerificationRoutes.test.ts
command git commit -m "$(cat <<'EOF'
feat: BFF routes to confirm the email of a pending ORCID sign-in

The ORCID iD and name come from the token; the browser sends only the
email or the code. The routes take the same JSON-only gate and the same
challenge-id check as the public account routes, and errors go through
accountHandler, so the gatekeeper's status and detail reach the screen
unchanged.

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 9: BFFAPI methods

**Files:**
- Modify: `gateways/BFFAPI.ts`
- Test: `gateways/__tests__/BFFAPI.emailVerification.test.ts`

**Interfaces:**
- Consumes: the two BFF routes (Task 8).
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

In `gateways/BFFAPI.ts`, immediately after the closing `}` of the merged last method:

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

Run: `npx jest --coverage=false gateways/__tests__/BFFAPI.emailVerification.test.ts gateways/__tests__/BFFAPI.account.test.ts`
Expected: PASS — the new file's 3 tests, and PR 2's account tests unchanged.

- [ ] **Step 5: Commit**

```bash
command git add gateways/BFFAPI.ts gateways/__tests__/BFFAPI.emailVerification.test.ts
command git commit -m "$(cat <<'EOF'
feat: BFFAPI methods for the ORCID email confirmation

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 10: Route a pending session to the confirmation page

**Files:**
- Modify: `contants/InternalRoutesConstants.ts`
- Modify: `lib/authRoutes.ts`
- Modify: `pages/_app.tsx`
- Test: `lib/__tests__/authRoutes.test.ts` (change the import, append)

**Interfaces:**
- Consumes: the merged private `isInternalPath(path?: string)` and `safeCallbackUrl(rawCallbackUrl?: string)` in `lib/authRoutes.ts`; `ROUTE_PAGE_HOME`.
- Produces:
  - `ROUTE_PAGE_CONFIRM_EMAIL = "/account/confirm-email"`
  - `confirmEmailUrlFor(returnTo?: string): string` — `"/account/confirm-email?callbackUrl=<encoded returnTo>"` when `returnTo` is an internal path, else `callbackUrl=%2F`; the same rule as `loginUrlFor`.
  - `pendingSessionRedirect(pending: boolean, pathname: string, asPath: string): string | null`
- `_app.tsx` `Auth`: once `status === "authenticated"`, a pending session on any `auth` page other than confirm-email goes to `confirmEmailUrlFor(router.asPath)`; a non-pending session on confirm-email goes to `ROUTE_PAGE_HOME`; while a redirect is due, the page's `loading` element is shown.

The earlier draft of this task added a `safeReturnPath` helper. The merged PR 2 code already has `safeCallbackUrl` for every `callbackUrl` read from a query, so this task adds no sanitiser: the confirmation page (Task 13) reads its query with `safeCallbackUrl`, as the login page does, and only the URL this PR builds needs `confirmEmailUrlFor`.

- [ ] **Step 1: Write the failing test**

In `lib/__tests__/authRoutes.test.ts`:

1. Replace the merged second line

```ts
import { loginPhaseFor, loginTabFor, loginUrlFor, safeCallbackUrl, SIGN_OUT_CALLBACK_URL } from "../authRoutes";
```

with

```ts
import { confirmEmailUrlFor, loginPhaseFor, loginTabFor, loginUrlFor, pendingSessionRedirect, safeCallbackUrl, SIGN_OUT_CALLBACK_URL } from "../authRoutes";
import { ROUTE_PAGE_CONFIRM_EMAIL } from "../../contants/InternalRoutesConstants";
```

2. Append at the end of the file:

```ts

test("the confirmation page lives at /account/confirm-email", () => {
  expect(ROUTE_PAGE_CONFIRM_EMAIL).toBe("/account/confirm-email");
});

test("the confirmation page remembers where the person was going", () => {
  expect(confirmEmailUrlFor("/app/datasets/80f230be?tab=settings"))
    .toBe("/account/confirm-email?callbackUrl=%2Fapp%2Fdatasets%2F80f230be%3Ftab%3Dsettings");
});

test.each`
  returnTo
  ${"https://evil.example/app"}
  ${"//evil.example/app"}
  ${"/\\evil.example/app"}
  ${""}
  ${undefined}
`("a return path that is not internal becomes the home page ($returnTo)", ({ returnTo }) => {
  expect(confirmEmailUrlFor(returnTo)).toBe("/account/confirm-email?callbackUrl=%2F");
});

test("the confirmation page reads its callbackUrl back with the login page's sanitiser", () => {
  const url = new URL(confirmEmailUrlFor("/invitations/tok?x=1"), "http://localhost");

  expect(safeCallbackUrl(url.searchParams.get("callbackUrl"))).toBe("/invitations/tok?x=1");
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

test("on the login page, a pending session goes to confirm with the callbackUrl the login page already sanitised", () => {
  expect(pendingSessionRedirect(true, "/account/login", safeCallbackUrl("%2Finvitations%2Ftok")))
    .toBe("/account/confirm-email?callbackUrl=%2Finvitations%2Ftok");
  expect(pendingSessionRedirect(true, "/account/login", safeCallbackUrl("https%3A%2F%2Fevil.example")))
    .toBe("/account/confirm-email?callbackUrl=%2F");
  expect(pendingSessionRedirect(false, "/account/login", safeCallbackUrl("%2Finvitations%2Ftok"))).toBeNull();
});
```

- [ ] **Step 2: Run it and watch it fail**

Run: `npx jest --coverage=false lib/__tests__/authRoutes.test.ts`
Expected: FAIL — "Test suite failed to run": ts-jest reports `Module '"../authRoutes"' has no exported member 'confirmEmailUrlFor'` (and `pendingSessionRedirect`), and `Module '"../../contants/InternalRoutesConstants"' has no exported member 'ROUTE_PAGE_CONFIRM_EMAIL'`.

- [ ] **Step 3: Implement**

In `contants/InternalRoutesConstants.ts`, immediately after the merged line `export const ROUTE_PAGE_RESET_PASSWORD = (token: string) => "/account/reset-password/" + token;` insert:

```ts

/**
 * Route to the email confirmation of a pending ORCID sign-in.
 * @constant
 */
export const ROUTE_PAGE_CONFIRM_EMAIL = "/account/confirm-email";
```

In `lib/authRoutes.ts`:

1. The merged file has no imports. Insert, above its first line `export const SIGN_OUT_CALLBACK_URL = "/";`:

```ts
import { ROUTE_PAGE_CONFIRM_EMAIL, ROUTE_PAGE_HOME } from "../contants/InternalRoutesConstants";

```

(`InternalRoutesConstants.ts` imports nothing, so this adds no cycle.)

2. Append to the end of the file (after the merged `loginPhaseFor`):

```ts

/** Confirmation page URL that returns the person to `returnTo`; the same internal-path rule as `loginUrlFor`. */
export function confirmEmailUrlFor(returnTo?: string): string {
    const callbackUrl = typeof returnTo === "string" && isInternalPath(returnTo) ? returnTo : "/";
    return `${ROUTE_PAGE_CONFIRM_EMAIL}?callbackUrl=${encodeURIComponent(callbackUrl)}`;
}

/** A pending session must confirm its email first, and only a pending session belongs on the confirmation page. */
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

1. Replace the merged line `import { loginUrlFor } from "../lib/authRoutes";` with:

```ts
import { loginUrlFor, pendingSessionRedirect } from "../lib/authRoutes";
```

2. Replace the whole merged `Auth` function (from `function Auth({ authContext, children }) {` to the end of the file) with:

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

(`useEffect`, `Router` and `useRouter` are already imported by the merged `_app.tsx`.)

- [ ] **Step 4: Run it and watch it pass**

Run: `npx jest --coverage=false lib/__tests__/authRoutes.test.ts`
Expected: PASS — the merged tests plus the 12 new ones.

- [ ] **Step 5: Commit**

```bash
command git add contants/InternalRoutesConstants.ts lib/authRoutes.ts pages/_app.tsx lib/__tests__/authRoutes.test.ts
command git commit -m "$(cat <<'EOF'
feat: a pending session is sent to confirm its email

Every auth-gated page sends a pending ORCID session to
/account/confirm-email, keeping where it was going; the confirmation
page sends anyone else home.

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 11: A pending session that reaches the login page goes to confirm its email

**Files:**
- Modify: `pages/account/login/index.tsx`

**Interfaces:**
- Consumes: `pendingSessionRedirect(pending, pathname, asPath)` (Task 10, including its login-page test), `useSession`, and the merged login page's `const callbackUrl = safeCallbackUrl(props.callbackUrl);`.
- Produces: on `/account/login`, a pending session is replaced with `/account/confirm-email?callbackUrl=<the login's callbackUrl, as safeCallbackUrl left it>`; any other visitor sees the page as before.

Why: the login page is not `auth`-gated, so `_app.tsx` does not route it. Several pages send a session without `uid` to login: the invitation page (server-rendered; the merged `invitationAccount` returns `null` without `uid`, and `invitationPageProps` then redirects to `loginUrlFor(ROUTE_PAGE_INVITATION({ token }))`), the DOI landing's "Sign in", a bookmarked login URL. A person invited by email who signs in with ORCID for the first time is pending, so ORCID returns them to `/invitations/<token>`, which sends them to `/account/login?phase=sign-in&callbackUrl=%2Finvitations%2F<token>`; without this redirect they would pick ORCID again and go round in a circle. With it they confirm their email and come back to the invitation, which the confirmed account then claims in the `jwt` callback. The page reuses the `callbackUrl` PR 2 already sanitised; it does not decode or check the query again. The decision is the pure function tested in Task 10; the page only wires it, so it is covered by `npm run build` and manual checks 8 and 9 in Task 15.

- [ ] **Step 1: Implement**

In `pages/account/login/index.tsx` (as Task 5 left it):

1. Replace the merged import lines

```tsx
import { signIn } from "next-auth/react";
```

```tsx
import Router from "next/router";
```

```tsx
import { loginPhaseFor, loginTabFor, safeCallbackUrl } from "../../../lib/authRoutes";
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
import { loginPhaseFor, loginTabFor, pendingSessionRedirect, safeCallbackUrl } from "../../../lib/authRoutes";
```

2. Replace the merged first line of `LoginPage`

```tsx
  const callbackUrl = safeCallbackUrl(props.callbackUrl);
```

with

```tsx
  const callbackUrl = safeCallbackUrl(props.callbackUrl);
  const router = useRouter();
  const { data: session } = useSession();
  const pendingRedirect = pendingSessionRedirect(session?.user?.pending === true, router.pathname, callbackUrl);

  useEffect(() => {
    if (pendingRedirect) {
      Router.replace(pendingRedirect);
    }
  }, [pendingRedirect]);
```

`LoginPage` has no early return, so the hooks run in the same order on every render.

- [ ] **Step 2: Build**

Run: `npm run build`
Expected: exit code 0; `/account/login` still listed.

- [ ] **Step 3: Commit**

```bash
command git add pages/account/login/index.tsx
command git commit -m "$(cat <<'EOF'
fix: a pending ORCID sign-in on the login page confirms its email first

The invitation page sends a session without uid to login, and ORCID
sent it straight back: the person went round in a circle.

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 12: `ConfirmEmailForm`

**Files:**
- Create: `components/Account/ConfirmEmailForm.tsx`
- Test: `components/Account/__tests__/ConfirmEmailForm.test.tsx`

**Interfaces:**
- Consumes: `useSession().update`, `signOut`, `Router.replace`, `BFFAPI.requestEmailVerification` / `confirmEmailVerification` (Task 9) / `resendChallenge` (merged; the gatekeeper resends an email-verification challenge), `VerificationCodeForm({ email, onSubmit, onResend })` (merged, named export; on a rejected `onSubmit` it shows `accountErrorMessage(detail)` in `role="alert"`, clears the boxes and refocuses the first one; it guards double submission and owns the 90 s resend countdown), `ACCOUNT_ERROR_MESSAGES` / `accountErrorMessage(detail?: string): string` (PR 2, already maps `email_belongs_to_another_account` to the exact 409 copy), `emailField` from `lib/accountValidation.ts` (PR 2), `EDIT_FORM_LABEL_CLASS` / `EDIT_FORM_INPUT_CLASS` / `EDIT_FORM_ERROR_CLASS`, `SIGN_OUT_CALLBACK_URL`.
- Produces: `ConfirmEmailForm({ emailHint, callbackUrl }: { emailHint?: string; callbackUrl: string })`.

Behaviour:
- Email step: Formik field "Email" pre-filled with `emailHint`; validated with PR 2's `emailField`; "Send code" → `requestEmailVerification(email)` → code step. A request error shows `accountErrorMessage(detail)` in `role="alert"`.
- Code step: `VerificationCodeForm`; "Use a different email" returns to the email step with the last email typed.
- Confirmed: `await update()` then `Router.replace(callbackUrl)`.
- `409`: back to the email step with `accountErrorMessage("email_belongs_to_another_account")` in `role="alert"`; any other confirm error is re-thrown so `VerificationCodeForm` shows it.
- "Sign out" always available.

- [ ] **Step 1: (no constants to add)**

The merged `ACCOUNT_ERROR_MESSAGES` already maps `email_belongs_to_another_account`, `invalid_email` ("This email address is not valid."), `invalid_name`, `invalid_orcid`, `invalid_request`, the code errors and `resend_too_soon`; this task uses them as they are and adds none.

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
    const [bffGateway] = useState(() => new BFFAPI());
    const [email, setEmail] = useState(props.emailHint ?? "");
    const [challenge, setChallenge] = useState<Challenge | null>(null);
    const [error, setError] = useState<string | null>(null);

    async function requestCode(values: { email: string }) {
        const typed = values.email.trim();
        setError(null);
        setEmail(typed);
        try {
            const { challengeId } = await bffGateway.requestEmailVerification(typed);
            setChallenge({ id: challengeId, email: typed });
        } catch (e) {
            setError(accountErrorMessage(e?.response?.data?.detail));
        }
    }

    async function confirmCode(code: string) {
        try {
            await bffGateway.confirmEmailVerification(challenge.id, code);
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
        await bffGateway.resendChallenge(challenge.id);
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

(The gateway is kept in state as in the merged `SignUpForm`. The field error is not `role="alert"`, as in PR 2's forms; the request and 409 errors are. The 409 hides the code step, so `VerificationCodeForm`'s own alert and this one never show together.)

- [ ] **Step 5: Run it and watch it pass**

Run: `npx jest --coverage=false components/Account/__tests__/ConfirmEmailForm.test.tsx`
Expected: PASS — 12 tests.

- [ ] **Step 6: Commit**

```bash
command git add components/Account/ConfirmEmailForm.tsx components/Account/__tests__/ConfirmEmailForm.test.tsx
command git commit -m "$(cat <<'EOF'
feat: ConfirmEmailForm for a pending ORCID sign-in

Email pre-filled from the hint, then the 6-digit code; on success the
session is refreshed with update() before returning to where the person
was going. An email of another account is refused with a way out.

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 13: The `/account/confirm-email` page

**Files:**
- Create: `pages/account/confirm-email.tsx`

**Interfaces:**
- Consumes: `ConfirmEmailForm` (Task 12), `BareLayout`, the merged `safeCallbackUrl(rawCallbackUrl?: string)`, `useSession().data.user.emailHint`.
- Produces: page at `ROUTE_PAGE_CONFIRM_EMAIL`, `auth`-gated so that `_app.tsx` sends a signed-out visitor to login and a non-pending one home.

The page has no logic of its own beyond reading the session and the query; it is covered by `npm run build` and the manual checks in Task 15. It reads `callbackUrl` with the same `safeCallbackUrl` as the login page, so both pages accept and refuse exactly the same values; `router.query.callbackUrl` can be an array, which is treated as absent.

- [ ] **Step 1: Implement**

Create `pages/account/confirm-email.tsx`:

```tsx
import { useSession } from "next-auth/react";
import { useRouter } from "next/router";
import { ConfirmEmailForm } from "../../components/Account/ConfirmEmailForm";
import { BareLayout } from "../../components/Public/BareLayout";
import { safeCallbackUrl } from "../../lib/authRoutes";

const COLUMN = "mx-auto w-full max-w-[560px] px-4 md:px-8 pt-20 pb-24";

export default function ConfirmEmailPage() {
    const { data: session } = useSession();
    const router = useRouter();
    const rawCallbackUrl = router.query.callbackUrl;

    return (
        <BareLayout>
            <div className={COLUMN}>
                <ConfirmEmailForm
                    emailHint={session?.user?.emailHint}
                    callbackUrl={safeCallbackUrl(typeof rawCallbackUrl === "string" ? rawCallbackUrl : undefined)}
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
command git add pages/account/confirm-email.tsx
command git commit -m "$(cat <<'EOF'
feat: /account/confirm-email page

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 14: "Connect ORCID" on the profile

**Files:**
- Modify: `lib/users.ts`
- Create: `components/Account/ConnectOrcid.tsx`
- Modify: `pages/app/profile/index.tsx`
- Modify: `components/Account/PasswordSignInMethod.tsx`
- Test: `lib/__tests__/users.test.ts` (change the import, append), `components/Account/__tests__/ConnectOrcid.test.tsx`, `components/Account/__tests__/PasswordSignInMethod.test.tsx` (one test changed)

**Interfaces:**
- Produces:
  - `hasSignInProvider(user: { providers?: { name: string }[] } | undefined | null, provider: string): boolean`
  - `ConnectOrcid({ accountEmail }: { accountEmail: string })` — an `<li>` with the same grid as the merged `PasswordSignInMethod` row (`grid grid-cols-[140px_minmax(0,1fr)_auto] items-center gap-4 px-4 py-3 text-sm`: "ORCID" | "Not connected…" | button); the button calls `signIn("orcid", { callbackUrl: ROUTE_PAGE_PROFILE })`.
  - `PasswordSignInMethod`: without a password the row says "Not set" whether or not the email is confirmed; "Set a password" is still offered only when `email_verified_at` is set.

Why this links rather than creating a second account: NextAuth replaces the session with a fresh ORCID one, so the `jwt` callback looks the ORCID iD up. It has no account, so the session is pending and `_app` sends it to `/account/confirm-email?callbackUrl=%2Fapp%2Fprofile`. The person types the email of the account they were signed into; the gatekeeper's email-verification confirm hits the row "ORCID iD has no account, email has an account → attach the ORCID provider to that account, confirm it". `update()` then finds the ORCID iD on that same account, with a confirmed email, and hydrates the same `uid`; the profile now lists ORCID. The row tells the person which email to use, because the session they were in is gone by the time they reach the confirmation page and the hint may differ.

Why the password row loses "Not set. Available once your email is confirmed.": after this PR no production session with a `uid` can belong to an account whose `email_verified_at` is null. A password sign-in is refused by the gatekeeper for an unconfirmed email (`AccountService.login` raises `unverified`); an ORCID sign-in stays pending, with no `uid`, until the email is confirmed (Tasks 3 and 4); and every token issued before this PR is signed out (Task 2). Only the development-only GitHub provider still creates accounts without a confirmed email, and those have no way to confirm one, so the copy promised something nobody can do. The row now says "Not set". The button keeps its `email_verified_at` condition: the gatekeeper sends no reset link to an unconfirmed email, so offering one would end in "We sent a link" for a link that never comes.

- [ ] **Step 1: Write the failing tests**

In `lib/__tests__/users.test.ts`, replace the merged line `import { canEditDataset, canSeeAccessHistory } from "../users";` with:

```ts
import { canEditDataset, canSeeAccessHistory, hasSignInProvider } from "../users";
```

and append at the end of the file:

```ts

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

In `components/Account/__tests__/PasswordSignInMethod.test.tsx`, replace the merged test

```tsx
    test("an unconfirmed email is offered no link the gatekeeper would not send", () => {
        renderRow(unconfirmed);

        expect(screen.queryByRole("button", { name: "Set a password" })).toBeNull();
        expect(screen.getByText("Not set. Available once your email is confirmed.")).toBeTruthy();
    });
```

with

```tsx
    test("an unconfirmed email is offered no link the gatekeeper would not send, and no promise either", () => {
        renderRow(unconfirmed);

        expect(screen.queryByRole("button", { name: "Set a password" })).toBeNull();
        expect(screen.getByText("Not set")).toBeTruthy();
        expect(screen.queryByText(/once your email is confirmed/)).toBeNull();
    });
```

- [ ] **Step 2: Run them and watch them fail**

Run: `npx jest --coverage=false lib/__tests__/users.test.ts components/Account/__tests__/ConnectOrcid.test.tsx components/Account/__tests__/PasswordSignInMethod.test.tsx`
Expected: FAIL — `users.test.ts` and `ConnectOrcid.test.tsx` fail to run (`Module '"../users"' has no exported member 'hasSignInProvider'`, `Cannot find module '../ConnectOrcid'`); in `PasswordSignInMethod.test.tsx` only the changed test fails, on `Unable to find an element with the text: Not set`.

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

(`user` is non-null there: the merged page renders the `<ul>` only under `user ? (`.)

In `components/Account/PasswordSignInMethod.tsx`, replace the merged

```tsx
    function state(): string {
        if (user.has_password) {
            return "Set";
        }
        return user.email_verified_at ? "Not set" : "Not set. Available once your email is confirmed.";
    }
```

with

```tsx
    function state(): string {
        return user.has_password ? "Set" : "Not set";
    }
```

The `{!user.has_password && user.email_verified_at && (` button condition below it stays as it is.

- [ ] **Step 4: Run them and watch them pass**

Run: `npx jest --coverage=false lib/__tests__/users.test.ts components/Account/__tests__/ConnectOrcid.test.tsx components/Account/__tests__/PasswordSignInMethod.test.tsx`
Expected: PASS — `users.test.ts` with 2 more tests, `ConnectOrcid.test.tsx` 2 tests, `PasswordSignInMethod.test.tsx` the same 4 tests.

- [ ] **Step 5: Commit**

```bash
command git add lib/users.ts lib/__tests__/users.test.ts components/Account/ConnectOrcid.tsx components/Account/__tests__/ConnectOrcid.test.tsx pages/app/profile/index.tsx components/Account/PasswordSignInMethod.tsx components/Account/__tests__/PasswordSignInMethod.test.tsx
command git commit -m "$(cat <<'EOF'
feat: Connect ORCID from the profile

It starts an ORCID sign-in that lands on the email confirmation; the
account's own email attaches the iD to it.

The password row no longer says "Available once your email is
confirmed": a signed-in production session always has a confirmed
email now, and the development-only GitHub accounts that do not have
no way to confirm one.

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 15: Verify

**Files:** none changed (fixes, if any, go in their own commit).

- [ ] **Step 1: Unit tests**

From the worktree: `npx jest --coverage=false`
Expected: `Test Suites: 93 passed, 93 total` and `Tests: 741 passed, 741 total`. That is the baseline 83 / 614 plus ten new suites (`orcidEmail` 16, `sessionTokenVersion` 8, `orcidPendingSignIn` 12, `devOrcidMock` 16, `DevOrcidMockForm` 10, `accountEmailVerification` 3, `emailVerificationRoutes` 17, `BFFAPI.emailVerification` 3, `ConfirmEmailForm` 12, `ConnectOrcid` 2 = 99 tests) and 28 tests added to existing suites (`authProviders` +7, `middlewareChain` +7, `authRoutes` +12, `users` +2; `PasswordSignInMethod` changes one test and keeps its count). No route test reports a 401 (a 401 means a mocked signed-in token is missing `v: 2`).

Then: `npx tsc --noEmit -p .`
Expected: no output.

- [ ] **Step 2: Build**

Run: `npm run build`
Expected: exit code 0, `/account/confirm-email` and both `/api/account/email-verifications` routes listed next to PR 2's six `/api/account/...` routes, no type errors.

- [ ] **Step 3: Start the stack**

```bash
cd /Users/caio.maia/workspace/datamap/gatekeeper
make ENV_FILE_PATH=integration-test.env integration-test-up
curl -s -o /dev/null -w "%{http_code}\n" http://localhost:9094/api/v1/health-check/
```

Expected: `200`. Mailpit UI at `http://localhost:8025`. The gatekeeper checkout is on `main`, which has PR 1 (`16e081a feat: email and password authentication (RFC 008, PR 1) (#142)`); check with `command git -C /Users/caio.maia/workspace/datamap/gatekeeper log --oneline -1 main` if in doubt.

The worktree already has a copy of `.env.local`. In it, set `DATAMAP_BASE_URL=http://localhost:9094/api/v1`, the integration API key/secret, and `ENABLE_DEV_ORCID_MOCK=true` (the file is git-ignored; never commit it). Then `npm run dev` from the worktree and check the mock is on:

```bash
curl -s http://localhost:3000/api/auth/providers
```

Expected: keys `orcid`, `credentials`, `github` and `orcid-dev`. `/account/login` shows the dashed "ORCID (development mock)" box under "Sign in with ORCID".

In the checklist, "sign in with the mock" means that form, with the iD, name and public email given in the case. It takes the same `jwt` path as ORCID (Task 5), so the gatekeeper sees provider `orcid` with the iD as reference. Only the OAuth round trip and the `pub.orcid.org` read differ from a real ORCID sign-in, and Tasks 1 and 3 cover those.

- [ ] **Step 4: Manual end-to-end checklist**

Run each against a fresh browser profile (or after signing out). Database edits use psql on the integration database (port 5433).

1. **New ORCID user.** Sign in with the mock: iD `0000-0002-0000-0001` (no DataMap account), name "Ada Lovelace", public email `ada.public@example.org` → lands on `/account/confirm-email?callbackUrl=...` with the field pre-filled `ada.public@example.org`. Enter a new email → code arrives in Mailpit → type it → lands on the callback page signed in; `users` has one row with that email, `email_verified_at` set, provider `orcid` with reference `0000-0002-0000-0001`; admins got `new_account_pending`. Sign out, then sign in with the mock as another new iD (`0000-0002-0000-0002`) with no public email → the field is empty.
2. **Existing ORCID user with a placeholder email.** `UPDATE users SET email = '0000-0002-0000-0001@fake.mail.com', email_verified_at = NULL WHERE id = '<id from case 1>';` Sign in with the mock as `0000-0002-0000-0001` with no public email → confirm-email, field empty; sign out and repeat with public email `ada.public@example.org` → field pre-filled with it. Confirm a new real email → signed in as the same `id`; the row's email replaced and confirmed.
3. **Existing real-email ORCID user (prefill).** `UPDATE users SET email = 'ada@example.org', email_verified_at = NULL WHERE id = '<id>';` Sign in with the mock as that iD with public email `other@example.org` → field pre-filled with `ada@example.org` (the account's own email wins over the public one); confirm → same `id`, `email_verified_at` set. Sign out and in again with the mock → no confirmation step.
4. **409 collision.** Create a password account for `taken@example.org` (sign-up tab). Put the ORCID account back to a placeholder (case 2's SQL). Sign in with the mock as that iD, type `taken@example.org`, enter the code → "This email belongs to another DataMap account. Contact the DataMap team." with the email field back; "Sign out" returns to `/`.
5. **Connect ORCID from a password account.** Sign in with a password account that has no ORCID; `/app/profile` shows the "Connect ORCID" row naming the account's email. The button goes to orcid.org (its `signIn("orcid", { callbackUrl: "/app/profile" })` call is covered by `ConnectOrcid.test.tsx`), so stand in for it: open `/account/login?phase=sign-in&callbackUrl=%2Fapp%2Fprofile` and sign in with the mock as a new iD (`0000-0002-0000-0003`) → confirm-email; type the account's email → code → back on `/app/profile`, same user id, ORCID listed under Sign-in methods.
6. **Old token forced re-login.** Stop the worktree's dev server, run `npm run dev` from the main checkout (`main`, without this PR) and sign in with a password; keep the tab open; stop it and run `npm run dev` from the worktree again; reload any `/app/...` page → lands on `/account/login?phase=sign-in&callbackUrl=...`; DevTools shows `next-auth.session-token` deleted; the dev server logs one `JWT_SESSION_ERROR`.
7. **Pending session cannot reach the API.** While on confirm-email in case 1, copy the `next-auth.session-token` cookie and run `curl -s -o /dev/null -w "%{http_code}\n" -b "next-auth.session-token=<value>" http://localhost:3000/api/datasets/shared` → `401`. Visit `/app/home` directly → back on confirm-email.
8. **Invitation while pending.** Share a dataset with a new email; open the invitation link signed out; on the login page, sign in with the mock as a new iD (`0000-0002-0000-0004`) → after a moment on the login page, confirm-email with `callbackUrl=%2Finvitations%2F<token>`; confirm the invited email → the invitation page, then the dataset under "Shared with me".
9. **Login page while pending.** In a pending session, open `/account/login?phase=sign-in&callbackUrl=%2Fapp%2Fdatasets` → replaced with `/account/confirm-email?callbackUrl=%2Fapp%2Fdatasets`. Signed out, `/account/login` shows both tabs as in PR 2, plus the mock box in the "Sign in" tab.
10. **Validation code from the gatekeeper.** On confirm-email, send a code to an address the gatekeeper rejects but Yup accepts (e.g. one over 256 characters) → "This email address is not valid." and the email step stays.
11. **New account with no role.** After case 1, `/app/profile` loads the account (the gatekeeper lets an account read itself without a Casbin role) and `/app/home` shows the "Your access is not set up yet" card until a tenancy is granted.
12. **The mock needs its flag.** Stop the dev server, set `ENABLE_DEV_ORCID_MOCK=false` in the worktree's `.env.local`, `npm run dev` → `curl -s http://localhost:3000/api/auth/providers` lists `orcid`, `credentials` and `github` but no `orcid-dev`, and `/account/login` shows no mock box. Stop the server and set the flag back to `true` if more checks follow.
13. **The mock never exists in production.** `npm run build`, then `ENABLE_DEV_ORCID_MOCK=true npm run start -- -p 3001`; `curl -s http://localhost:3001/api/auth/providers` → only the keys `orcid` and `credentials`; `/account/login` on port 3001 shows no mock box and no GitHub button. Stop the server.

- [ ] **Step 5: Stop the stack**

```bash
cd /Users/caio.maia/workspace/datamap/gatekeeper
make ENV_FILE_PATH=integration-test.env integration-test-down
```

---

## Self-review

| RFC 008 / contract requirement | Task |
|---|---|
| Tokens carry a version; a token without it is signed out | 2 (callback + proof against NextAuth 4.24.9's session route), 6 (BFF also refuses it), 15.6 |
| `TOKEN_VERSION = 2` exported from `[...nextauth].ts`, `token.v` on every token | 2 |
| ORCID sign-in: verified account → hydrate + claim invitations | 3 |
| ORCID sign-in: no account or `email_verified_at === null` → `pending {orcid, name, emailHint?}`, no `uid` | 3 |
| `emailHint`: account email unless placeholder, else ORCID public email, else none | 1, 3 |
| ORCID never creates users / no `@fake.mail.com` from ORCID | 3 |
| `update()` re-reads the ORCID iD from the token, never from the browser | 4 |
| `session.user.pending: boolean` (+ `emailHint`), no ORCID iD in the session | 3, types in 2 |
| Development ORCID mock `orcid-dev` registered only when `NODE_ENV === "development"` and `ENABLE_DEV_ORCID_MOCK === "true"`; provider ids asserted for every combination | 5, 15.12, 15.13 |
| A mock sign-in takes the real ORCID `jwt` path (pending, `emailHint` from the form, lookup by provider `"orcid"` and the iD, `update()`, invitations) and never calls `pub.orcid.org` | 5 |
| The mock's `authorize` refuses a malformed iD | 5 |
| Login page shows the mock form only when the server lists `orcid-dev`, in its own tested component, marked as development-only | 5 |
| ORCID flows can be checked from localhost without an HTTPS redirect URI | 5, 15 |
| `_app` sends a pending session to `/account/confirm-email`; that page requires pending | 10, 13 |
| `middlewareChain` `auth` requires `uid` | 6 |
| `pendingOnlyChain` requires `pending` and no `uid` | 6 |
| `requestEmailVerification` / `confirmEmailVerification` in `lib/account.ts` | 7 |
| BFF `POST /api/account/email-verifications` and `.../[challengeId]/confirm`, `pendingOnlyChain` (via `pendingAccountRouter`), iD and name from the token, status and `detail` forwarded by PR 2's `accountHandler` | 8 |
| The pending routes take PR 2's JSON Content-Type gate (`415 invalid_request`) and PR 2's `challengeIdOr404` (a non-UUID id never reaches the gatekeeper) | 8 |
| Gatekeeper validation codes shown with PR 2's copy on the confirmation screen | 8 (forwarded), 12 (`invalid_email` test) |
| A pending session reaching `/account/login` goes to confirm its email (covers invitation links), reusing the `callbackUrl` PR 2's `safeCallbackUrl` already sanitised | 10, 11, 15.8, 15.9 |
| One sanitiser for a `callbackUrl` read from a query (PR 2's `safeCallbackUrl`, on the login and confirmation pages) and the `loginUrlFor` rule for the URL this PR builds (`confirmEmailUrlFor`) | 10, 11, 13 |
| BFFAPI `requestEmailVerification(email)`, `confirmEmailVerification(challengeId, code)` rejecting with the Axios error | 9 |
| `ROUTE_PAGE_CONFIRM_EMAIL = "/account/confirm-email"` | 10 |
| Confirm-email screen: `BareLayout`, 560 px column, Formik + PR 2's `emailField`, email pre-filled, then PR 2's `VerificationCodeForm` (90 s resend), `role="alert"` errors, English copy | 12, 13 |
| 409 copy "This email belongs to another DataMap account. Contact the DataMap team." | 12 |
| Sign-out escape on the confirmation screen | 12 |
| Profile "Connect ORCID" → ORCID sign-in → email verification attaches the iD; the row sits after PR 2's `PasswordSignInMethod` | 14, 15.5 |
| PR 2's "Not set. Available once your email is confirmed." becomes unreachable in production and is dropped; the "Set a password" button keeps its confirmed-email condition | 14 |
| Webapp Jest: pending state in `jwt`, token version, `middlewareChain` refusing a token without `uid`, confirm-email form; whole suite 93 suites / 741 tests | 2, 3, 4, 5, 6, 12, 15.1 |
| Manual checks against gatekeeper + Mailpit | 15 |

Not in the contract, added because the flow breaks without it: the login page's pending redirect (Task 11; without it an invitation link loops through login and ORCID), the version check in the BFF `auth` step (Task 6; `getToken` never runs the `jwt` callback), `session.user.emailHint` (Task 3; pre-fill), and the development ORCID mock (Task 5; production ORCID accepts only HTTPS redirect URIs, so without it none of the ORCID cases in Task 15 could be run from localhost).

Re-anchored on the merged PR 2 (`2552647`), not its plan: the login page's `safeCallbackUrl` (the plan had `decodeURIComponent`, and a `safeReturnPath` that would have duplicated it); `challengeIdOr404` and the JSON gate in `lib/accountRoute.ts`; the merged `jwt` callback's inner `else` and `getUserByProviderAuthentication`; the provider order `orcid`, `credentials`, then development-only; `metrics` templating of `auth/email-verifications`, already merged; the full `ACCOUNT_ERROR_MESSAGES`, to which this PR adds nothing; and the session-route test's import path, which the package's `exports` map would otherwise refuse.
