# RFC 009 PR B — tenancies on the user side (webapp) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** A signed-in person always has somewhere to work and a way to ask for more: the tenancy selector appears only with more than one tenancy, an account with none sees "You're not in any tenancy" with **Request access**, requests and their answers live on the selector, the profile and the home, pending tenancy invitations are accepted or declined from the home and the profile, owners and editors invite an existing account into their tenancy from the Share dialog, and nobody is offered "members can edit" on a dataset in Public.

**Architecture:** Gatekeeper calls go through two server-side client modules: a new `lib/tenancies.ts` (self routes, `X-User-Id` only) and three additions to `lib/share.ts` (dataset routes, `buildHeaders(context)`). Ten BFF routes proxy them: the user routes on `bffRouter()` (`authOnlyChain`, so an account with zero tenancies reaches them) and the dataset routes on the same router as `share/candidates.ts`; every route answers errors through `accountHandler`, which forwards the gatekeeper status and `{detail}` verbatim, and every `POST` passes `requireJsonRequest`. The browser reaches them through seven new `BFFAPI` methods (mutations, rejecting with the Axios error) and three SWR hooks in `hooks/UseTenancies.ts` (reads). The UI is a set of components under `components/Tenancy/` — `TenancyIcon` (shared with PR C), `RequestAccessDialog`, `TenancyRequestRow`/`TenancyRequestNotice`, `AccessPending`, `TenancySelector`, `TenancyInvitationsPanel`, `ProfileTenancies` — mounted by the tenancy, home and profile pages and by the avatar menu. Pure rules (which request to show, which selection applies, whether the session is stale, whether a 401 means the tenancy was revoked) live in small `lib/` modules with their own tests. The Share dialog gains an outsider card in `ShareInput` (exact email/ORCID lookup, "Share this dataset only" / "Invite to {tenancy}"), pending tenancy invitations in `AccessList`, and the Public rules in `lib/membersAccess.ts`. The session gains the `admin` flag PR C reads.

**Tech Stack:** Next.js 14 (pages router), NextAuth 4.24.9 (JWT strategy), next-connect 1.0.0-next.4, Axios, SWR 2.2, Zustand 5, Formik 2.4 + Yup 1, TailwindCSS 3, Jest 29 + ts-jest, @testing-library/react 14 with `jest-environment-jsdom`.

## Global Constraints

- Worktree: already created. `/Users/caio.maia/workspace/datamap/datamap-webapp/.claude/worktrees/rfc-009-user-side`, branch `feat/rfc-009-user-side` from `origin/main` at `f632843`. `npm ci` is done and `.env.local` is copied in. Baseline: **102 suites, 841 tests**. Every command runs from that directory, never from the main checkout. Every git call is spelled `command git`. Before every commit: `pwd` (must print the worktree path) and `command git branch --show-current` (must print `feat/rfc-009-user-side`).
- Jest: `npx jest --coverage=false <paths>`. `ts-jest` type-checks every test and the code it imports (`tsconfig.json` has `strict: false`), so a type error fails the suite.
- Tests never live under `pages/`. Route and NextAuth tests go in `lib/__tests__/`, component tests in `components/**/__tests__/`, hook tests in `hooks/__tests__/`. A component test starts with the `/** @jest-environment jsdom */` docblock. Any test whose subject imports `components/TenancyStore` (directly, or through `lib/fetcher`) mocks that module or the importer, because `typescript-cookie` does not resolve under Jest.
- This PR adds no page under `pages/` (the request form is a dialog), so `contants/TelemetryConstants.ts` `PAGES` does not change. It adds three UI events.
- English copy. No comment that narrates code. Constants and copy that are reused live in `contants/TenancyConstants.ts`.
- Every commit message ends with a blank line and `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.

### From the contract (`gatekeeper/docs/superpowers/plans/2026-10-05-rfc-009-contract.md`), fixed

- `DEFAULT_TENANCY = "datamap/production/public"`, `PRODUCTION_PREFIX = "datamap/production/"`, `LEGACY_PREFIX = "datamap/staging/"`, `NAMESPACE_PATTERN = /^[a-z0-9-]+$/`, `NAMESPACE_MIN_LENGTH = 2`, `NAMESPACE_MAX_LENGTH = 63`, `DISPLAY_NAME_MAX_LENGTH = 64`, `TENANCY_NAME_MAX_LENGTH = 128`, `REASON_MAX_LENGTH = 1000`, `MESSAGE_MAX_LENGTH = 1000`, `TENANCY_ICON = "tenancy"`, `PUBLIC_TENANCY_ICON = "public"`, `isDefaultTenancy`, `isLegacyTenancy`, `tenancyNamespace` — `contants/TenancyConstants.ts`, created by this PR with exactly the contract's content, plus `tenancyErrorMessage(detail?: string): string` and B's copy.
- `TenancyIcon({ tenancy, pending }: { tenancy?: Pick<TenancySummary, "is_default">; pending?: boolean })` in `components/Tenancy/TenancyIcon.tsx`: `public` for the default tenancy, `tenancy` otherwise, dashed outline when `pending`.
- `types/GatekeeperAPI.ts`: `TenancySummary { path, display_name, is_default, is_legacy }`, `GatekeeperPage<T> { items, total_count, limit, offset }` (shared), and B's `UserRef`, `UserBrief`, `TenancyRequest`, `TenancyInvitation`, `ShareLookup`, `DatasetTenancyInvitation`; `ShareTenancy` gains `is_default`, `is_legacy`, `datasets`; `ShareState` gains `tenancy_invitations`, `can_invite_to_tenancy`.
- Gatekeeper self routes (send only `X-User-Id`): `GET /users/{id}/tenancies` → `200 TenancySummary[]`; `GET /users/{id}/tenancy-requests` → `200 TenancyRequest[]` (latest 5, newest first); `POST /users/{id}/tenancy-requests {tenancy_name, reason}` → `201 TenancyRequest`, `400 tenancy_name_invalid | reason_invalid`, `409 request_pending`, `429 too_many_requests`; `DELETE /users/{id}/tenancy-requests/{request_id}` → `204`, `404 request_not_found`; `GET /users/{id}/tenancy-invitations` → `200 TenancyInvitation[]`; `POST .../tenancy-invitations/{id}/accept` → `200 {tenancy: TenancySummary}`, `404 invitation_not_found`, `409 tenancy_disabled`; `POST .../decline` → `204`, `404 invitation_not_found`.
- Gatekeeper dataset routes (`buildHeaders(context)`): `GET /datasets/{id}/share/lookup?value=` → `200 ShareLookup`, `400 invalid_request`, `403 forbidden`, `404 no_account`; `POST /datasets/{id}/tenancy-invitations {user_id}` → `201 DatasetTenancyInvitation`, `403 forbidden`, `404 no_account`, `409 already_member | invitation_pending | public_tenancy_locked | legacy_tenancy_read_only | tenancy_disabled`; `DELETE /datasets/{id}/tenancy-invitations/{invitation_id}` → `204`, `403 forbidden`, `404 invitation_not_found`. `PUT /datasets/{id}/members-access` with `true` on Public → `400 public_members_cannot_edit`.
- `lib/tenancies.ts`: `listMyTenancies(uid)`, `listMyTenancyRequests(uid)`, `createTenancyRequest(uid, { tenancyName, reason })`, `withdrawTenancyRequest(uid, requestId)`, `listMyTenancyInvitations(uid)`, `acceptTenancyInvitation(uid, invitationId)`, `declineTenancyInvitation(uid, invitationId)`. `lib/share.ts`: `lookupShareTarget(context, datasetId, value)`, `inviteToTenancy(context, datasetId, userId)`, `withdrawTenancyInvitation(context, datasetId, invitationId)`. Each throws the Axios error on a non-2xx.
- BFF routes: `GET /api/tenancies`; `GET`/`POST /api/tenancy-requests` (browser body `{tenancyName, reason}`); `DELETE /api/tenancy-requests/[requestId]`; `GET /api/tenancy-invitations`; `POST /api/tenancy-invitations/[invitationId]/accept`; `POST /api/tenancy-invitations/[invitationId]/decline`; `GET /api/datasets/[datasetId]/share/lookup?value=`; `POST /api/datasets/[datasetId]/tenancy-invitations` (browser body `{userId}`, the invitee from `ShareLookup.user.id`); `DELETE /api/datasets/[datasetId]/tenancy-invitations/[invitationId]`. Responses pass the gatekeeper JSON through unchanged (snake_case). The user always comes from the NextAuth token.
- BFFAPI: `requestTenancyAccess(input: { tenancyName: string; reason: string }): Promise<TenancyRequest>`, `withdrawTenancyRequest(requestId: string): Promise<void>`, `acceptTenancyInvitation(invitationId: string): Promise<{ tenancy: TenancySummary }>`, `declineTenancyInvitation(invitationId: string): Promise<void>`, `lookupShareTarget(datasetId: string, value: string): Promise<ShareLookup>`, `inviteToTenancy(datasetId: string, userId: string): Promise<DatasetTenancyInvitation>`, `withdrawTenancyInvitation(datasetId: string, invitationId: string): Promise<void>`. They reject with the Axios error; callers show `tenancyErrorMessage(e?.response?.data?.detail)`. `lookupShareTarget` is imperative and debounced 300 ms in the share input, not SWR.
- SWR keys: `/api/tenancies` (default options), `/api/tenancy-requests` and `/api/tenancy-invitations` (`revalidateOnFocus: true`), `/api/datasets/${id}/share` (existing, unchanged).
- Session refresh: accepting an invitation → `update()`, `setTenancySelected(tenancy.path)`, `router.push(ROUTE_PAGE_HOME)`; the latest request turning `approved` → `update()` and offer "Switch to {display_name}"; `/app/tenancy` compares `GET /api/tenancies` paths with `session.user.tenancies` and calls `update()` when they differ; a `401` whose `detail` starts with `unauthorized_tenancy` → clear the selected tenancy, `update()`, go to `ROUTE_PAGE_TENANCY_SELECTOR`.
- Session `admin` flag (the controller assigned it to this PR; the contract lists it under C): `session.user.admin = token.admin === true`, `types/next-auth.d.ts` gains `admin: boolean` on `Session.user`, populated on sign-in and on every `update()`, no `TOKEN_VERSION` bump (stays `2`). The token carries `admin: true` only for an account whose `roles` include `"admin"`, and no `admin` key otherwise; a token without it reads as `false`, exactly as the contract says.

### Decided in this plan, from the real code

- **Errors go through `accountHandler`, not `bffHandler`.** `bffHandler` sends `httpErrorHandler`'s output, which replaces the gatekeeper `detail` with fixed English for `401`, `403` and `404` (`lib/rpc.ts`: "user not authorized…", "user not allowed…", "Resource does not exists"), so `no_account`, `forbidden`, `request_not_found` and `invitation_not_found` would never reach the browser. `accountHandler` (`lib/accountRoute.ts`) answers `res.status(status).json({ detail: response?.data?.detail ?? "unavailable" })`, and `pages/api/account/password.ts` already pairs it with `bffRouter()`. Every route of this PR uses it.
- **Every `POST` passes `requireJsonRequest`** (exported from `lib/accountRoute.ts`, `415 {detail: "invalid_request"}` when the `Content-Type` is not `application/json`). `BFFAPI` posts `{}` to the body-less accept and decline routes so Axios sends `application/json`.
- **Path ids are checked with `isUuid`** before the gatekeeper is called: a bad `requestId` answers `404 {detail: "request_not_found"}`, a bad `invitationId` `404 {detail: "invitation_not_found"}`, a bad invitee `userId` `400 {detail: "invalid_request"}`.
- **A revoked tenancy reaches the browser.** Today it cannot: `httpErrorHandler` drops the `401` detail, `pages/api/datasets/index.ts` ends a failed list with an empty body, and `lib/fetcher.js` reads no body on error. This PR keeps the `401` detail in `httpErrorHandler`, makes the list route answer `{detail}`, attaches `error.detail` in the fetcher, recovers in a `SWRConfig` `onError` inside `RequireSession`, and sends a server-rendered dataset page to the selector.
- **SWR keys, the 30-day window and B's copy live in `contants/TenancyConstants.ts`**, after the contract's block, so components import the keys without importing `lib/fetcher` (and so `TenancyStore`).
- **`TenancyIcon` is 32 px** (`h-8 w-8`, `rounded-md`, icon 18 px), the size of the Share dialog's avatar column; the contract fixes no size and no size prop.
- Verbatim copy (RFC 009 and the design's 1i/1j): "Welcome, {first name}" / "Choose the tenancy you want to work in."; "Requested {date} · waiting for an administrator" (amber, `text-embargo-800`); "Declined {date}"; "+ Request access to another tenancy"; "You're not in any tenancy" / "Your account is not part of any tenancy, so there is nothing to work in yet. Ask for access to the group or project you work with; an administrator reviews it and you're emailed with the answer."; dialog "Request access" / "Name the tenancy you need. An administrator reviews it; you're emailed with the answer." / field **Tenancy** with helper "The name of the group or project. If it exists, this is a request to join; if not, a request to create it. Only administrators can tell which." / field **Why** / **Cancel** / **Send request**; `409 request_pending` → "You already have a request waiting. Withdraw it to send another."; home card "{inviter} invited you to {tenancy}" / "{n} datasets · from “{dataset}” · {date}" / **Decline** / **Accept**; home line "Your request for {name} is waiting for an administrator · Withdraw"; Share card "{email} · not a member of {tenancy}", "Share this dataset only" / "{level} · as today", "Invite to {tenancy}" / "Member of the tenancy · sees its {n} datasets once they accept · administrators are notified"; access row "Invited to {tenancy} {date} · not accepted yet" with **Withdraw**; footer "Owners and editors can invite to the tenancy"; Public members row "Everyone on DataMap · can read"; new-dataset hint in Public "Visible to every DataMap account; only you and people you share with can edit"; profile "Everyone is in public"; avatar menu "Request access to a tenancy".
- Tailwind tokens for the design's literals: ink `primary-900`, secondary text `primary-600`, muted `primary-500`, borders `primary-200`/`primary-300`, icon chip `secondary-500` (`#E9F0EF`), avatar `secondary-900` (`#D7E4E3`), amber `embargo-800` on `embargo-100`, red `danger-700`.

---

## File Structure

| File | Responsibility |
|---|---|
| `pages/api/auth/[...nextauth].ts` (modify) | `hydrateWithUserInfo` sets/drops `token.admin`; the session callback exposes `session.user.admin` |
| `types/next-auth.d.ts` (modify) | `Session.user.admin: boolean`, `JWT.admin?: boolean` |
| `contants/TenancyConstants.ts` (create) | Contract constants, SWR keys, B copy, `tenancyErrorMessage` |
| `contants/EmbargoConstants.ts` (modify) | `messageForApiError` maps `public_members_cannot_edit` |
| `contants/TelemetryConstants.ts` (modify) | UI events `tenancy_access_requested`, `tenancy_invitation_accepted`, `tenancy_invitation_sent` |
| `types/GatekeeperAPI.ts` (modify) | RFC 009 shapes; `ShareTenancy` and `ShareState` additions |
| `components/Tenancy/TenancyIcon.tsx` (create) | The shared tenancy chip |
| `lib/tenancies.ts` (create) | Gatekeeper self routes |
| `lib/share.ts` (modify) | Lookup, invite, withdraw |
| `pages/api/tenancies/index.ts` (create) | `GET` the user's tenancies |
| `pages/api/tenancy-requests/index.ts` (create) | `GET` list, `POST` create |
| `pages/api/tenancy-requests/[requestId].ts` (create) | `DELETE` withdraw |
| `pages/api/tenancy-invitations/index.ts` (create) | `GET` pending invitations |
| `pages/api/tenancy-invitations/[invitationId]/accept.ts` (create) | `POST` accept |
| `pages/api/tenancy-invitations/[invitationId]/decline.ts` (create) | `POST` decline |
| `pages/api/datasets/[datasetId]/share/lookup.ts` (create) | `GET` exact email/ORCID lookup |
| `pages/api/datasets/[datasetId]/tenancy-invitations/index.ts` (create) | `POST` invite |
| `pages/api/datasets/[datasetId]/tenancy-invitations/[invitationId].ts` (create) | `DELETE` withdraw |
| `gateways/BFFAPI.ts` (modify) | Seven methods |
| `lib/tenancyRequests.ts` (create) | Which request outcome to show; whether an approval is missing from the session |
| `lib/tenancySelection.ts` (create) | Selection rule, stale-session check, first name, path label |
| `hooks/UseTenancies.ts` (create) | SWR hooks; `useLatestTenancyRequest` calls `update()` on approval |
| `components/Tenancy/RequestAccessDialog.tsx` (create) | Formik + Yup request form |
| `components/Tenancy/TenancyRequestStatus.tsx` (create) | `TenancyRequestRow` (selector, profile) and `TenancyRequestNotice` (home) |
| `components/Tenancy/AccessPending.tsx` (modify) | Zero-tenancy copy with **Request access** |
| `components/Tenancy/TenancySelector.tsx` (create) | The selector's body: one → home, many → list, none → `AccessPending` |
| `pages/app/tenancy/index.tsx` (modify) | Frame around `TenancySelector`; no `getServerSideProps` |
| `components/Profile/AvatarButton.tsx` (modify) | "Switch tenancy" only with more than one; "Request access to a tenancy" |
| `components/Tenancy/TenancyInvitationsPanel.tsx` (create) | Pending invitations with Accept / Decline |
| `pages/app/home/index.tsx` (modify) | Invitations panel and request line |
| `components/Tenancy/ProfileTenancies.tsx` (create) | Profile's Tenancies section body |
| `pages/app/profile/index.tsx` (modify) | Uses `ProfileTenancies` and the invitations panel |
| `lib/membersAccess.ts` (modify) | Public: never member-editable, no toggle, "Everyone on DataMap · can read" |
| `components/Share/ShareDialog.tsx` (modify) | Public members row; tenancy invite wiring; footer; withdraw |
| `components/Embargo/AccessSummary.tsx` (modify) | Public members row |
| `components/Embargo/EmbargoChoice.tsx` (modify) | `isPublic`: Public hint, no members toggle |
| `components/Embargo/EmbargoFields.tsx` (modify) | `membersEditable` hides "Change" |
| `components/Embargo/SetEmbargoDialog.tsx` (modify) | Passes `membersEditable` |
| `pages/app/datasets/new.tsx` (modify) | New datasets start with members read-only; `isPublic` |
| `components/Share/ShareInput.tsx` (modify) | Lookup and the outsider card |
| `components/Share/AccessList.tsx` (modify) | Pending tenancy invitations with Withdraw |
| `lib/tenancyRevocation.ts` (create) | `isTenancyRevoked(status, detail)` |
| `lib/rpc.ts` (modify) | `401` keeps the gatekeeper `detail` |
| `pages/api/datasets/index.ts` (modify) | A failed list answers `{detail}` |
| `lib/fetcher.js` (modify) | Errors carry `detail` |
| `components/Auth/RequireSession.tsx` (modify) | `SWRConfig` `onError` recovers from a revoked tenancy |
| `lib/requestErrorHandler.ts` (modify) | A revoked tenancy on a dataset page goes to the selector |
| Tests | `lib/__tests__/sessionAdminClaim.test.ts`, `contants/__tests__/TenancyConstants.test.ts`, `components/Tenancy/__tests__/TenancyIcon.test.tsx`, `lib/__tests__/tenancies.test.ts`, `lib/__tests__/shareTenancyInvitations.test.ts`, `lib/__tests__/tenancyRoutes.test.ts`, `lib/__tests__/tenancyInvitationRoutes.test.ts`, `gateways/__tests__/BFFAPI.tenancies.test.ts`, `lib/__tests__/tenancyRequests.test.ts`, `lib/__tests__/tenancySelection.test.ts`, `hooks/__tests__/UseTenancies.test.tsx`, `components/Tenancy/__tests__/RequestAccessDialog.test.tsx`, `components/Tenancy/__tests__/TenancyRequestStatus.test.tsx`, `components/Tenancy/__tests__/AccessPending.test.tsx` (rewritten), `components/Tenancy/__tests__/TenancySelector.test.tsx`, `components/Profile/__tests__/AvatarButton.test.tsx`, `components/Tenancy/__tests__/TenancyInvitationsPanel.test.tsx`, `components/Tenancy/__tests__/ProfileTenancies.test.tsx`, `lib/__tests__/membersAccessPublic.test.ts`, `components/Embargo/__tests__/EmbargoChoicePublic.test.tsx`, `components/Share/__tests__/ShareInputTenancyInvite.test.tsx`, `components/Share/__tests__/AccessListTenancyInvitations.test.tsx`, `components/Share/__tests__/ShareDialogTenancy.test.tsx`, `lib/__tests__/tenancyRevocation.test.ts`, `lib/__tests__/fetcher.test.ts`, `lib/__tests__/datasetListRoute.test.ts`, `components/Auth/__tests__/RequireSessionRevoked.test.tsx`; additions to `lib/__tests__/rpc.test.ts` and `lib/__tests__/requestErrorHandler.test.ts` |

---

### Task 1: Worktree

Done. `/Users/caio.maia/workspace/datamap/datamap-webapp/.claude/worktrees/rfc-009-user-side` on `feat/rfc-009-user-side` from `origin/main` `f632843`, `npm ci` run, `.env.local` copied, baseline 102 suites / 841 tests.

- [x] **Step 1: Confirm before starting**

```bash
cd /Users/caio.maia/workspace/datamap/datamap-webapp/.claude/worktrees/rfc-009-user-side
pwd
command git branch --show-current
command git log --oneline -1
```

Expected: the worktree path, `feat/rfc-009-user-side`, and the plan commit on top of `f632843`.

---

### Task 2: The session carries `admin`

**Files:**
- Modify: `pages/api/auth/[...nextauth].ts`
- Modify: `types/next-auth.d.ts`
- Test: `lib/__tests__/sessionAdminClaim.test.ts`

**Interfaces:**
- Consumes: `hydrateWithUserInfo(token, user)`, `authOptions.callbacks.jwt`, `authOptions.callbacks.session`, `TOKEN_VERSION` (all exported from `pages/api/auth/[...nextauth].ts`).
- Produces: `token.admin === true` only when `user.roles` includes `"admin"` (the key is absent otherwise); `session.user.admin: boolean`.

- [ ] **Step 1: Write the failing test**

Create `lib/__tests__/sessionAdminClaim.test.ts`:

```ts
jest.mock("../share", () => ({ claimInvitations: jest.fn() }));
jest.mock("../users", () => ({
    ...jest.requireActual("../users"),
    getUserByProviderID: jest.fn(),
    getUserByUID: jest.fn(),
    createUser: jest.fn(),
}));

import { authOptions, hydrateWithUserInfo, TOKEN_VERSION } from "../../pages/api/auth/[...nextauth]";
import { getUserByUID } from "../users";

describe("the admin claim", () => {
    test("an account with the admin role carries it", () => {
        const token = hydrateWithUserInfo({}, { id: "u1", roles: ["datasets_write", "admin"], tenancies: ["datamap/production/public"] });

        expect(token.admin).toBe(true);
    });

    test("an account without it carries none, and a claim from before is dropped", () => {
        const token = hydrateWithUserInfo({ uid: "u1", admin: true }, { id: "u1", roles: ["datasets_write"], tenancies: ["datamap/production/public"] });

        expect(token).not.toHaveProperty("admin");
    });

    test("update() re-reads the roles", async () => {
        jest.mocked(getUserByUID).mockResolvedValue({ id: "u1", roles: ["admin"], tenancies: ["datamap/production/public"] } as any);

        const token = await authOptions.callbacks.jwt({ token: { uid: "u1", v: TOKEN_VERSION }, trigger: "update" } as any);

        expect(token.admin).toBe(true);
    });

    test("the session exposes only the boolean", async () => {
        const admin: any = await authOptions.callbacks.session({ session: { user: {} }, token: { uid: "u1", admin: true } } as any);
        const member: any = await authOptions.callbacks.session({ session: { user: {} }, token: { uid: "u2" } } as any);

        expect(admin.user.admin).toBe(true);
        expect(member.user.admin).toBe(false);
        expect(admin.user).not.toHaveProperty("roles");
    });
});
```

- [ ] **Step 2: Run it and watch it fail**

Run: `npx jest --coverage=false lib/__tests__/sessionAdminClaim.test.ts`
Expected: FAIL — 4 tests fail (`token.admin` is `undefined`; the first type-check error may instead be `Property 'admin' does not exist on type 'JWT'`).

- [ ] **Step 3: Implement**

In `types/next-auth.d.ts`, replace:

```ts
            /** An ORCID sign-in waiting for a confirmed email. */
            pending: boolean
```

with:

```ts
            /** An ORCID sign-in waiting for a confirmed email. */
            pending: boolean

            /** The account holds the global admin role. */
            admin: boolean
```

and replace:

```ts
        pending?: PendingSignIn
```

with:

```ts
        pending?: PendingSignIn
        admin?: boolean
```

In `pages/api/auth/[...nextauth].ts`, replace:

```ts
    delete token.tenancies;
  }

  return token;
}

export async function hydratePasswordSignIn
```

with:

```ts
    delete token.tenancies;
  }

  if (Array.isArray(user.roles) && user.roles.includes("admin")) {
    token.admin = true;
  } else {
    delete token.admin;
  }

  return token;
}

export async function hydratePasswordSignIn
```

and replace:

```ts
          session.user.pending = Boolean(token.pending)
```

with:

```ts
          session.user.pending = Boolean(token.pending)
          session.user.admin = token.admin === true
```

- [ ] **Step 4: Run it and the existing session tests**

Run: `npx jest --coverage=false lib/__tests__/sessionAdminClaim.test.ts "pages/api/auth/__tests__" lib/__tests__/sessionTokenVersion.test.ts lib/__tests__/orcidPendingSignIn.test.ts lib/__tests__/passwordSignIn.test.ts`
Expected: PASS. The 4 new tests pass and the existing `hydrateWithUserInfo` expectations (`{ uid, tenancies }` with no `admin` key) still pass, because an account without the role gets no key.

- [ ] **Step 5: Commit**

```bash
pwd
command git branch --show-current
command git add types/next-auth.d.ts "pages/api/auth/[...nextauth].ts" lib/__tests__/sessionAdminClaim.test.ts
command git commit -m "feat: the session says whether the account is an admin" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 3: Tenancy constants, types and icon

**Files:**
- Create: `contants/TenancyConstants.ts`
- Modify: `contants/EmbargoConstants.ts`
- Modify: `types/GatekeeperAPI.ts`
- Create: `components/Tenancy/TenancyIcon.tsx`
- Test: `contants/__tests__/TenancyConstants.test.ts`, `components/Tenancy/__tests__/TenancyIcon.test.tsx`

**Interfaces:**
- Produces: everything in the contract's `TenancyConstants.ts` block; `TENANCIES_KEY`, `TENANCY_REQUESTS_KEY`, `TENANCY_INVITATIONS_KEY`, `REQUEST_OUTCOME_VISIBLE_DAYS = 30`, `PUBLIC_TENANCY_NOTE`, `PUBLIC_MEMBERS_DETAIL`, `PUBLIC_DATASET_HINT`, `SHARE_INVITE_FOOTER`, `REQUEST_PENDING_MESSAGE`, `TENANCY_GENERIC_ERROR_MESSAGE`, `TENANCY_ERROR_MESSAGES`, `tenancyErrorMessage(detail?: string): string`; the types listed in the Global Constraints; `TenancyIcon`.

- [ ] **Step 1: Write the failing tests**

Create `contants/__tests__/TenancyConstants.test.ts`:

```ts
import { describe, expect, test } from '@jest/globals';
import { APIError } from "../../types/APIError";
import { messageForApiError } from "../EmbargoConstants";
import {
    DEFAULT_TENANCY,
    LEGACY_PREFIX,
    NAMESPACE_PATTERN,
    PRODUCTION_PREFIX,
    REASON_MAX_LENGTH,
    TENANCY_GENERIC_ERROR_MESSAGE,
    TENANCY_NAME_MAX_LENGTH,
    isDefaultTenancy,
    isLegacyTenancy,
    tenancyErrorMessage,
    tenancyNamespace,
} from "../TenancyConstants";

describe("tenancy constants", () => {
    test("are the contract's values", () => {
        expect(DEFAULT_TENANCY).toBe("datamap/production/public");
        expect(PRODUCTION_PREFIX).toBe("datamap/production/");
        expect(LEGACY_PREFIX).toBe("datamap/staging/");
        expect(NAMESPACE_PATTERN.test("data-amazon")).toBe(true);
        expect(NAMESPACE_PATTERN.test("Data Amazon")).toBe(false);
        expect(TENANCY_NAME_MAX_LENGTH).toBe(128);
        expect(REASON_MAX_LENGTH).toBe(1000);
    });

    test("tell public, legacy and the namespace from a path", () => {
        expect(isDefaultTenancy("datamap/production/public")).toBe(true);
        expect(isDefaultTenancy("datamap/production/data-amazon")).toBe(false);
        expect(isLegacyTenancy("datamap/staging/data-amazon")).toBe(true);
        expect(isLegacyTenancy("datamap/production/data-amazon")).toBe(false);
        expect(tenancyNamespace("datamap/production/data-amazon")).toBe("data-amazon");
    });

    test("a known error code has its own sentence", () => {
        expect(tenancyErrorMessage("request_pending")).toBe("You already have a request waiting. Withdraw it to send another.");
        expect(tenancyErrorMessage("too_many_requests")).toBe("You have sent three requests in the last 24 hours. Try again tomorrow.");
    });

    test("anything else is the generic sentence, including names an object already has", () => {
        expect(tenancyErrorMessage(undefined)).toBe(TENANCY_GENERIC_ERROR_MESSAGE);
        expect(tenancyErrorMessage("made_up")).toBe(TENANCY_GENERIC_ERROR_MESSAGE);
        expect(tenancyErrorMessage("constructor")).toBe(TENANCY_GENERIC_ERROR_MESSAGE);
    });

    test("the members-access error of a public dataset is explained where the embargo screens show errors", () => {
        const error = new APIError("BAD_REQUEST", 400, "public_members_cannot_edit", true, undefined, "public_members_cannot_edit");

        expect(messageForApiError(error)).toBe("Members of Public can only read. Share the dataset with the people who should edit it.");
    });
});
```

Create `components/Tenancy/__tests__/TenancyIcon.test.tsx`:

```tsx
/** @jest-environment jsdom */
import { describe, expect, test } from '@jest/globals';
import { render } from '@testing-library/react';
import { TenancyIcon } from "../TenancyIcon";

describe("TenancyIcon", () => {
    test("the default tenancy shows the public icon", () => {
        const { container } = render(<TenancyIcon tenancy={{ is_default: true }} />);

        expect(container.querySelector("[data-icon]")?.getAttribute("data-icon")).toBe("public");
        expect(container.textContent).toBe("public");
    });

    test("any other tenancy, or none given, shows the tenancy icon", () => {
        const { container } = render(<><TenancyIcon tenancy={{ is_default: false }} /><TenancyIcon /></>);

        const icons = Array.from(container.querySelectorAll("[data-icon]")).map((icon) => icon.getAttribute("data-icon"));
        expect(icons).toEqual(["tenancy", "tenancy"]);
    });

    test("a pending tenancy has a dashed outline", () => {
        const { container } = render(<TenancyIcon pending />);

        const icon = container.querySelector("[data-icon]") as HTMLElement;
        expect(icon.getAttribute("data-pending")).toBe("true");
        expect(icon.className).toContain("border-dashed");
    });
});
```

- [ ] **Step 2: Run them and watch them fail**

Run: `npx jest --coverage=false contants/__tests__/TenancyConstants.test.ts components/Tenancy/__tests__/TenancyIcon.test.tsx`
Expected: FAIL — `Cannot find module '../TenancyConstants'` and `Cannot find module '../TenancyIcon'`.

- [ ] **Step 3: Implement**

Create `contants/TenancyConstants.ts`:

```ts
export const DEFAULT_TENANCY = "datamap/production/public";
export const PRODUCTION_PREFIX = "datamap/production/";
export const LEGACY_PREFIX = "datamap/staging/";
export const NAMESPACE_PATTERN = /^[a-z0-9-]+$/;
export const NAMESPACE_MIN_LENGTH = 2;
export const NAMESPACE_MAX_LENGTH = 63;
export const DISPLAY_NAME_MAX_LENGTH = 64;
export const TENANCY_NAME_MAX_LENGTH = 128;
export const REASON_MAX_LENGTH = 1000;
export const MESSAGE_MAX_LENGTH = 1000;
export const TENANCY_ICON = "tenancy";
export const PUBLIC_TENANCY_ICON = "public";
export const isDefaultTenancy = (path: string) => path === DEFAULT_TENANCY;
export const isLegacyTenancy = (path: string) => path.startsWith(LEGACY_PREFIX);
export const tenancyNamespace = (path: string) => path.split("/").pop() ?? path;

export const TENANCIES_KEY = "/api/tenancies";
export const TENANCY_REQUESTS_KEY = "/api/tenancy-requests";
export const TENANCY_INVITATIONS_KEY = "/api/tenancy-invitations";

export const REQUEST_OUTCOME_VISIBLE_DAYS = 30;

export const PUBLIC_TENANCY_NOTE = "Everyone is in public";
export const PUBLIC_MEMBERS_DETAIL = "Everyone on DataMap · can read";
export const PUBLIC_DATASET_HINT = "Visible to every DataMap account; only you and people you share with can edit";
export const SHARE_INVITE_FOOTER = "Owners and editors can invite to the tenancy";
export const REQUEST_PENDING_MESSAGE = "You already have a request waiting. Withdraw it to send another.";
export const TENANCY_GENERIC_ERROR_MESSAGE = "Something went wrong. Please try again.";

export const TENANCY_ERROR_MESSAGES: Record<string, string> = {
    invalid_request: "Something in the request was not valid. Check it and try again.",
    tenancy_name_invalid: "Name the tenancy in 1 to 128 characters.",
    reason_invalid: "Say why in 1 to 1000 characters.",
    request_pending: REQUEST_PENDING_MESSAGE,
    too_many_requests: "You have sent three requests in the last 24 hours. Try again tomorrow.",
    request_not_found: "This request is no longer waiting. Reload the page to see where it stands.",
    invitation_not_found: "This invitation is no longer open. It may have been withdrawn.",
    tenancy_disabled: "This tenancy is disabled, so nobody can join it now.",
    no_account: "No DataMap account has this email or ORCID.",
    already_member: "This person is already a member of the tenancy.",
    invitation_pending: "This person already has an invitation to the tenancy waiting.",
    public_tenancy_locked: "Everyone is already in Public.",
    legacy_tenancy_read_only: "Legacy tenancies are read-only; nobody can be invited to them.",
    forbidden: "Only the owner and editors who are members of the tenancy can invite to it.",
    public_members_cannot_edit: "Members of Public can only read. Share the dataset with the people who should edit it.",
};

export function tenancyErrorMessage(detail?: string): string {
    if (typeof detail === "string" && Object.prototype.hasOwnProperty.call(TENANCY_ERROR_MESSAGES, detail)) {
        return TENANCY_ERROR_MESSAGES[detail];
    }
    return TENANCY_GENERIC_ERROR_MESSAGE;
}
```

In `contants/EmbargoConstants.ts`, replace:

```ts
import { APIError } from "../types/APIError";
```

with:

```ts
import { APIError } from "../types/APIError";
import { tenancyErrorMessage } from "./TenancyConstants";
```

and replace:

```ts
    if (apiError?.httpCode === 403) {
        return "You are not allowed to do this on this dataset.";
    }
```

with:

```ts
    if (apiError?.detail === "public_members_cannot_edit") {
        return tenancyErrorMessage("public_members_cannot_edit");
    }
    if (apiError?.httpCode === 403) {
        return "You are not allowed to do this on this dataset.";
    }
```

In `types/GatekeeperAPI.ts`, replace:

```ts
export interface ShareTenancy {
    name: string
    path: string
    members: number
    members_can_edit: boolean
}
```

with:

```ts
export interface ShareTenancy {
    name: string
    path: string
    members: number
    members_can_edit: boolean
    is_default: boolean
    is_legacy: boolean
    datasets: number
}
```

replace:

```ts
    anonymous_links: AnonymousLink[]
    tenancy: ShareTenancy | null
}
```

with:

```ts
    anonymous_links: AnonymousLink[]
    tenancy: ShareTenancy | null
    tenancy_invitations: DatasetTenancyInvitation[]
    can_invite_to_tenancy: boolean
}
```

and replace:

```ts
export interface MembersAccessResponse {
    members_can_edit: boolean
    access: DatasetAccess
}
```

with:

```ts
export interface MembersAccessResponse {
    members_can_edit: boolean
    access: DatasetAccess
}

/** @interface */
export interface TenancySummary {
    path: string
    display_name: string
    is_default: boolean
    is_legacy: boolean
}

/** @interface */
export interface GatekeeperPage<T> {
    items: T[]
    total_count: number
    limit: number
    offset: number
}

/** @interface */
export interface UserRef {
    id: string
    name: string
}

/** @interface */
export interface UserBrief {
    id: string
    name: string
    email: string | null
}

/** @interface */
export interface TenancyRequest {
    id: string
    requested_name: string
    reason: string
    status: "pending" | "approved" | "declined" | "withdrawn"
    tenancy: TenancySummary | null
    created_tenancy: boolean
    decision_message: string | null
    created_at: string
    decided_at: string | null
}

/** @interface */
export interface TenancyInvitation {
    id: string
    tenancy: TenancySummary
    invited_by: UserRef | null
    dataset: { id: string, name: string } | null
    datasets: number
    created_at: string
}

/** @interface */
export interface ShareLookup {
    user: UserBrief
    tenancy_member: boolean
    invitation_pending: boolean
    can_invite: boolean
}

/** @interface */
export interface DatasetTenancyInvitation {
    id: string
    user: UserBrief
    invited_by: UserBrief | null
    created_at: string
    can_withdraw: boolean
}
```

Create `components/Tenancy/TenancyIcon.tsx`:

```tsx
import { MaterialSymbol } from "react-material-symbols";
import { PUBLIC_TENANCY_ICON, TENANCY_ICON } from "../../contants/TenancyConstants";
import { TenancySummary } from "../../types/GatekeeperAPI";

export function TenancyIcon({ tenancy, pending }: { tenancy?: Pick<TenancySummary, "is_default">; pending?: boolean }) {
    const icon = tenancy?.is_default ? PUBLIC_TENANCY_ICON : TENANCY_ICON;
    const frame = pending
        ? "border border-dashed border-primary-400 bg-primary-0 text-primary-500"
        : "bg-secondary-500 text-primary-700";

    return (
        <span
            aria-hidden="true"
            data-icon={icon}
            data-pending={pending ? "true" : undefined}
            className={`flex flex-none items-center justify-center h-8 w-8 rounded-md ${frame}`}
        >
            <MaterialSymbol icon={icon} size={18} weight={400} grade={-25} />
        </span>
    );
}
```

- [ ] **Step 4: Run them, the embargo constants and the share suites**

Run: `npx jest --coverage=false contants/__tests__/TenancyConstants.test.ts components/Tenancy/__tests__/TenancyIcon.test.tsx contants/__tests__/EmbargoConstants.test.ts components/Share lib/__tests__/share.test.ts`
Expected: PASS (5 + 3 new tests; the existing share suites build their states as `any`, so the new required fields do not break them).

- [ ] **Step 5: Commit**

```bash
pwd
command git branch --show-current
command git add contants/TenancyConstants.ts contants/EmbargoConstants.ts types/GatekeeperAPI.ts components/Tenancy/TenancyIcon.tsx contants/__tests__/TenancyConstants.test.ts components/Tenancy/__tests__/TenancyIcon.test.tsx
command git commit -m "feat: tenancy constants, types and icon shared by the RFC 009 screens" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 4: Gatekeeper clients

**Files:**
- Create: `lib/tenancies.ts`
- Modify: `lib/share.ts`
- Test: `lib/__tests__/tenancies.test.ts`, `lib/__tests__/shareTenancyInvitations.test.ts`

**Interfaces:**
- Consumes: `axiosInstance` and `buildHeaders` from `lib/rpc.ts`; the types of Task 3.
- Produces: the ten client functions of the contract, with the signatures in the Global Constraints.

- [ ] **Step 1: Write the failing tests**

Create `lib/__tests__/tenancies.test.ts`:

```ts
import {
    acceptTenancyInvitation,
    createTenancyRequest,
    declineTenancyInvitation,
    listMyTenancies,
    listMyTenancyInvitations,
    listMyTenancyRequests,
    withdrawTenancyRequest,
} from "../tenancies";
import axiosInstance from "../rpc";

jest.mock("../rpc");
const mockGet = jest.mocked(axiosInstance.get);
const mockPost = jest.mocked(axiosInstance.post);
const mockDelete = jest.mocked(axiosInstance.delete);

const asUser = { headers: { "X-User-Id": "u1" } };

describe("the user's own tenancy calls", () => {
    test("tenancies are read as the user, with no tenancy header", async () => {
        mockGet.mockResolvedValue({ data: [{ path: "datamap/production/public" }] });

        expect(await listMyTenancies("u1")).toEqual([{ path: "datamap/production/public" }]);
        expect(mockGet).toHaveBeenCalledWith("/users/u1/tenancies", asUser);
    });

    test("requests are read as the user", async () => {
        mockGet.mockResolvedValue({ data: [{ id: "r1" }] });

        expect(await listMyTenancyRequests("u1")).toEqual([{ id: "r1" }]);
        expect(mockGet).toHaveBeenCalledWith("/users/u1/tenancy-requests", asUser);
    });

    test("a request is sent in the gatekeeper's names", async () => {
        mockPost.mockResolvedValue({ data: { id: "r1", status: "pending" } });

        expect(await createTenancyRequest("u1", { tenancyName: "Data Amazon", reason: "SMPS data" })).toEqual({ id: "r1", status: "pending" });
        expect(mockPost).toHaveBeenCalledWith("/users/u1/tenancy-requests", { tenancy_name: "Data Amazon", reason: "SMPS data" }, asUser);
    });

    test("withdrawing deletes the request", async () => {
        mockDelete.mockResolvedValue({ status: 204 });

        await expect(withdrawTenancyRequest("u1", "r1")).resolves.toBeUndefined();
        expect(mockDelete).toHaveBeenCalledWith("/users/u1/tenancy-requests/r1", asUser);
    });

    test("pending invitations are read as the user", async () => {
        mockGet.mockResolvedValue({ data: [{ id: "ti1" }] });

        expect(await listMyTenancyInvitations("u1")).toEqual([{ id: "ti1" }]);
        expect(mockGet).toHaveBeenCalledWith("/users/u1/tenancy-invitations", asUser);
    });

    test("accepting answers the tenancy joined", async () => {
        mockPost.mockResolvedValue({ data: { tenancy: { path: "datamap/production/data-amazon" } } });

        expect(await acceptTenancyInvitation("u1", "ti1")).toEqual({ tenancy: { path: "datamap/production/data-amazon" } });
        expect(mockPost).toHaveBeenCalledWith("/users/u1/tenancy-invitations/ti1/accept", {}, asUser);
    });

    test("declining posts to the invitation", async () => {
        mockPost.mockResolvedValue({ status: 204 });

        await expect(declineTenancyInvitation("u1", "ti1")).resolves.toBeUndefined();
        expect(mockPost).toHaveBeenCalledWith("/users/u1/tenancy-invitations/ti1/decline", {}, asUser);
    });
});
```

Create `lib/__tests__/shareTenancyInvitations.test.ts`:

```ts
import { inviteToTenancy, lookupShareTarget, withdrawTenancyInvitation } from "../share";
import axiosInstance, { buildHeaders } from "../rpc";

jest.mock("../rpc");
const mockGet = jest.mocked(axiosInstance.get);
const mockPost = jest.mocked(axiosInstance.post);
const mockDelete = jest.mocked(axiosInstance.delete);

const context = { uid: "u1", tenancy: "datamap/production/data-amazon" };
const headers = { headers: { "X-User-Id": "u1", "X-Datamap-Tenancies": "datamap/production/data-amazon" } };

beforeEach(() => {
    jest.mocked(buildHeaders).mockReturnValue(headers as any);
});

describe("tenancy invitations from the share dialog", () => {
    test("the lookup sends the typed value as a parameter", async () => {
        mockGet.mockResolvedValue({ data: { user: { id: "u7" }, can_invite: true } });

        expect(await lookupShareTarget(context, "d1", "fernanda@inpe.br")).toEqual({ user: { id: "u7" }, can_invite: true });
        expect(mockGet).toHaveBeenCalledWith("/datasets/d1/share/lookup", { ...headers, params: { value: "fernanda@inpe.br" } });
    });

    test("inviting sends the invitee's id", async () => {
        mockPost.mockResolvedValue({ data: { id: "ti1", can_withdraw: true } });

        expect(await inviteToTenancy(context, "d1", "u7")).toEqual({ id: "ti1", can_withdraw: true });
        expect(mockPost).toHaveBeenCalledWith("/datasets/d1/tenancy-invitations", { user_id: "u7" }, headers);
    });

    test("withdrawing deletes the invitation", async () => {
        mockDelete.mockResolvedValue({ status: 204 });

        await expect(withdrawTenancyInvitation(context, "d1", "ti1")).resolves.toBeUndefined();
        expect(mockDelete).toHaveBeenCalledWith("/datasets/d1/tenancy-invitations/ti1", headers);
    });
});
```

- [ ] **Step 2: Run them and watch them fail**

Run: `npx jest --coverage=false lib/__tests__/tenancies.test.ts lib/__tests__/shareTenancyInvitations.test.ts`
Expected: FAIL — `Cannot find module '../tenancies'`, and `lookupShareTarget` is not exported from `../share`.

- [ ] **Step 3: Implement**

Create `lib/tenancies.ts`:

```ts
import { TenancyInvitation, TenancyRequest, TenancySummary } from "../types/GatekeeperAPI";
import axiosInstance from "./rpc";

function asUser(uid: string) {
    return { headers: { "X-User-Id": uid } };
}

export async function listMyTenancies(uid: string): Promise<TenancySummary[]> {
    const response = await axiosInstance.get(`/users/${uid}/tenancies`, asUser(uid));
    return response.data as TenancySummary[];
}

export async function listMyTenancyRequests(uid: string): Promise<TenancyRequest[]> {
    const response = await axiosInstance.get(`/users/${uid}/tenancy-requests`, asUser(uid));
    return response.data as TenancyRequest[];
}

export async function createTenancyRequest(uid: string, input: { tenancyName: string; reason: string }): Promise<TenancyRequest> {
    const response = await axiosInstance.post(
        `/users/${uid}/tenancy-requests`,
        { tenancy_name: input.tenancyName, reason: input.reason },
        asUser(uid),
    );
    return response.data as TenancyRequest;
}

export async function withdrawTenancyRequest(uid: string, requestId: string): Promise<void> {
    await axiosInstance.delete(`/users/${uid}/tenancy-requests/${requestId}`, asUser(uid));
}

export async function listMyTenancyInvitations(uid: string): Promise<TenancyInvitation[]> {
    const response = await axiosInstance.get(`/users/${uid}/tenancy-invitations`, asUser(uid));
    return response.data as TenancyInvitation[];
}

export async function acceptTenancyInvitation(uid: string, invitationId: string): Promise<{ tenancy: TenancySummary }> {
    const response = await axiosInstance.post(`/users/${uid}/tenancy-invitations/${invitationId}/accept`, {}, asUser(uid));
    return response.data as { tenancy: TenancySummary };
}

export async function declineTenancyInvitation(uid: string, invitationId: string): Promise<void> {
    await axiosInstance.post(`/users/${uid}/tenancy-invitations/${invitationId}/decline`, {}, asUser(uid));
}
```

In `lib/share.ts`, replace:

```ts
    ShareUser,
} from "../types/GatekeeperAPI";
```

with:

```ts
    ShareUser,
    DatasetTenancyInvitation,
    ShareLookup,
} from "../types/GatekeeperAPI";
```

and replace:

```ts
    const response = await axiosInstance.put(`/datasets/${datasetId}/members-access`, request, buildHeaders(context));
    return response.data as MembersAccessResponse;
}
```

with:

```ts
    const response = await axiosInstance.put(`/datasets/${datasetId}/members-access`, request, buildHeaders(context));
    return response.data as MembersAccessResponse;
}

export async function lookupShareTarget(context: AppLocalContext, datasetId: string, value: string): Promise<ShareLookup> {
    const response = await axiosInstance.get(`/datasets/${datasetId}/share/lookup`, {
        ...buildHeaders(context),
        params: { value },
    });
    return response.data as ShareLookup;
}

export async function inviteToTenancy(context: AppLocalContext, datasetId: string, userId: string): Promise<DatasetTenancyInvitation> {
    const response = await axiosInstance.post(`/datasets/${datasetId}/tenancy-invitations`, { user_id: userId }, buildHeaders(context));
    return response.data as DatasetTenancyInvitation;
}

export async function withdrawTenancyInvitation(context: AppLocalContext, datasetId: string, invitationId: string): Promise<void> {
    await axiosInstance.delete(`/datasets/${datasetId}/tenancy-invitations/${invitationId}`, buildHeaders(context));
}
```

- [ ] **Step 4: Run them and the existing share client tests**

Run: `npx jest --coverage=false lib/__tests__/tenancies.test.ts lib/__tests__/shareTenancyInvitations.test.ts lib/__tests__/share.test.ts`
Expected: PASS (7 + 3 new tests).

- [ ] **Step 5: Commit**

```bash
pwd
command git branch --show-current
command git add lib/tenancies.ts lib/share.ts lib/__tests__/tenancies.test.ts lib/__tests__/shareTenancyInvitations.test.ts
command git commit -m "feat: gatekeeper calls for tenancy requests, invitations and the share lookup" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 5: BFF routes for the user's tenancies, requests and invitations

**Files:**
- Create: `pages/api/tenancies/index.ts`
- Create: `pages/api/tenancy-requests/index.ts`
- Create: `pages/api/tenancy-requests/[requestId].ts`
- Create: `pages/api/tenancy-invitations/index.ts`
- Create: `pages/api/tenancy-invitations/[invitationId]/accept.ts`
- Create: `pages/api/tenancy-invitations/[invitationId]/decline.ts`
- Test: `lib/__tests__/tenancyRoutes.test.ts`

**Interfaces:**
- Consumes: `bffRouter()` (`lib/bffRoute.ts`), `accountHandler`, `requireJsonRequest`, `isUuid` (`lib/accountRoute.ts`), `NewContext` (`lib/appLocalContext.ts`), the seven functions of `lib/tenancies.ts`.
- Produces: the seven user routes of the contract. The uid is `NewContext(req).uid`, from the token.

- [ ] **Step 1: Write the failing test**

Create `lib/__tests__/tenancyRoutes.test.ts`:

```ts
jest.mock("next-auth/jwt", () => ({ getToken: jest.fn(async () => ({ uid: "u1", v: 2 })) }));
jest.mock("../tenancies");

import { AxiosError, AxiosHeaders } from "axios";
import { getToken } from "next-auth/jwt";
import tenanciesHandler from "../../pages/api/tenancies/index";
import requestsHandler from "../../pages/api/tenancy-requests/index";
import requestHandler from "../../pages/api/tenancy-requests/[requestId]";
import invitationsHandler from "../../pages/api/tenancy-invitations/index";
import acceptHandler from "../../pages/api/tenancy-invitations/[invitationId]/accept";
import declineHandler from "../../pages/api/tenancy-invitations/[invitationId]/decline";
import {
    acceptTenancyInvitation,
    createTenancyRequest,
    declineTenancyInvitation,
    listMyTenancies,
    listMyTenancyInvitations,
    listMyTenancyRequests,
    withdrawTenancyRequest,
} from "../tenancies";

const JSON_HEADERS = { "content-type": "application/json" };
const REQUEST_ID = "6f1c3d1e-2b7a-4f0e-9a51-1c2d3e4f5a6b";
const INVITATION_ID = "0b9e8d7c-6a5b-4c3d-8e2f-1a2b3c4d5e6f";

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

async function send(handler: any, method: string, query: Record<string, string> = {}, body: unknown = undefined, headers: Record<string, string> = {}) {
    const res = fakeRes();
    const original = process.stdout.write;
    // @ts-ignore
    process.stdout.write = () => true;
    try {
        await handler({ method, url: "/api/x", headers, cookies: {}, query, body } as any, res);
    } finally {
        process.stdout.write = original;
    }
    return res;
}

describe("the user's tenancy BFF routes", () => {
    test("GET /api/tenancies reads the tenancies of the user in the token", async () => {
        jest.mocked(listMyTenancies).mockResolvedValue([{ path: "datamap/production/public" }] as any);

        const res = await send(tenanciesHandler, "GET");

        expect(res.statusCode).toBe(200);
        expect(listMyTenancies).toHaveBeenCalledWith("u1");
        expect(res.json).toHaveBeenCalledWith([{ path: "datamap/production/public" }]);
    });

    test("GET /api/tenancy-requests lists the user's requests", async () => {
        jest.mocked(listMyTenancyRequests).mockResolvedValue([{ id: "r1" }] as any);

        const res = await send(requestsHandler, "GET");

        expect(res.statusCode).toBe(200);
        expect(listMyTenancyRequests).toHaveBeenCalledWith("u1");
    });

    test("POST /api/tenancy-requests creates one and answers 201", async () => {
        jest.mocked(createTenancyRequest).mockResolvedValue({ id: "r1", status: "pending" } as any);

        const res = await send(requestsHandler, "POST", {}, { tenancyName: "Data Amazon", reason: "SMPS data" }, JSON_HEADERS);

        expect(res.statusCode).toBe(201);
        expect(createTenancyRequest).toHaveBeenCalledWith("u1", { tenancyName: "Data Amazon", reason: "SMPS data" });
        expect(res.json).toHaveBeenCalledWith({ id: "r1", status: "pending" });
    });

    test("a POST that is not JSON is refused before the gatekeeper", async () => {
        jest.mocked(createTenancyRequest).mockClear();

        const res = await send(requestsHandler, "POST", {}, "tenancyName=x", { "content-type": "application/x-www-form-urlencoded" });

        expect(res.statusCode).toBe(415);
        expect(res.json).toHaveBeenCalledWith({ detail: "invalid_request" });
        expect(createTenancyRequest).not.toHaveBeenCalled();
    });

    test("a body without the two strings is invalid_request", async () => {
        jest.mocked(createTenancyRequest).mockClear();

        const res = await send(requestsHandler, "POST", {}, { tenancyName: 42 }, JSON_HEADERS);

        expect(res.statusCode).toBe(400);
        expect(res.json).toHaveBeenCalledWith({ detail: "invalid_request" });
        expect(createTenancyRequest).not.toHaveBeenCalled();
    });

    test("the gatekeeper's 409 reaches the browser with its code", async () => {
        jest.mocked(createTenancyRequest).mockRejectedValue(gatekeeperError(409, { detail: "request_pending" }));

        const res = await send(requestsHandler, "POST", {}, { tenancyName: "Data Amazon", reason: "SMPS data" }, JSON_HEADERS);

        expect(res.statusCode).toBe(409);
        expect(res.json).toHaveBeenCalledWith({ detail: "request_pending" });
    });

    test("DELETE /api/tenancy-requests/[requestId] withdraws and answers 204", async () => {
        jest.mocked(withdrawTenancyRequest).mockResolvedValue(undefined);

        const res = await send(requestHandler, "DELETE", { requestId: REQUEST_ID });

        expect(res.statusCode).toBe(204);
        expect(withdrawTenancyRequest).toHaveBeenCalledWith("u1", REQUEST_ID);
    });

    test("a request id that is not a UUID never reaches the gatekeeper", async () => {
        jest.mocked(withdrawTenancyRequest).mockClear();

        const res = await send(requestHandler, "DELETE", { requestId: "../../admin" });

        expect(res.statusCode).toBe(404);
        expect(res.json).toHaveBeenCalledWith({ detail: "request_not_found" });
        expect(withdrawTenancyRequest).not.toHaveBeenCalled();
    });

    test("GET /api/tenancy-invitations lists the pending ones", async () => {
        jest.mocked(listMyTenancyInvitations).mockResolvedValue([{ id: INVITATION_ID }] as any);

        const res = await send(invitationsHandler, "GET");

        expect(res.statusCode).toBe(200);
        expect(listMyTenancyInvitations).toHaveBeenCalledWith("u1");
    });

    test("accepting answers the tenancy joined", async () => {
        jest.mocked(acceptTenancyInvitation).mockResolvedValue({ tenancy: { path: "datamap/production/data-amazon" } } as any);

        const res = await send(acceptHandler, "POST", { invitationId: INVITATION_ID }, {}, JSON_HEADERS);

        expect(res.statusCode).toBe(200);
        expect(acceptTenancyInvitation).toHaveBeenCalledWith("u1", INVITATION_ID);
        expect(res.json).toHaveBeenCalledWith({ tenancy: { path: "datamap/production/data-amazon" } });
    });

    test("declining answers 204", async () => {
        jest.mocked(declineTenancyInvitation).mockResolvedValue(undefined);

        const res = await send(declineHandler, "POST", { invitationId: INVITATION_ID }, {}, JSON_HEADERS);

        expect(res.statusCode).toBe(204);
        expect(declineTenancyInvitation).toHaveBeenCalledWith("u1", INVITATION_ID);
    });

    test("an invitation that is no longer open is a 404 with its code", async () => {
        jest.mocked(acceptTenancyInvitation).mockRejectedValue(gatekeeperError(404, { detail: "invitation_not_found" }));

        const res = await send(acceptHandler, "POST", { invitationId: INVITATION_ID }, {}, JSON_HEADERS);

        expect(res.statusCode).toBe(404);
        expect(res.json).toHaveBeenCalledWith({ detail: "invitation_not_found" });
    });

    test("a signed-out caller gets 401 and the gatekeeper is not called", async () => {
        jest.mocked(listMyTenancies).mockClear();
        jest.mocked(getToken).mockResolvedValueOnce(null);

        const res = await send(tenanciesHandler, "GET");

        expect(res.statusCode).toBe(401);
        expect(listMyTenancies).not.toHaveBeenCalled();
    });

    test("GET on accept is 405", async () => {
        const res = await send(acceptHandler, "GET", { invitationId: INVITATION_ID });

        expect(res.statusCode).toBe(405);
    });
});
```

- [ ] **Step 2: Run it and watch it fail**

Run: `npx jest --coverage=false lib/__tests__/tenancyRoutes.test.ts`
Expected: FAIL — `Cannot find module '../../pages/api/tenancies/index'`.

- [ ] **Step 3: Implement**

Create `pages/api/tenancies/index.ts`:

```ts
import { accountHandler } from "../../../lib/accountRoute";
import { NewContext } from "../../../lib/appLocalContext";
import { bffRouter } from "../../../lib/bffRoute";
import { listMyTenancies } from "../../../lib/tenancies";

const router = bffRouter()
    .get(async (req, res) => {
        const { uid } = await NewContext(req);
        res.json(await listMyTenancies(uid));
    });

export default accountHandler(router);
```

Create `pages/api/tenancy-requests/index.ts`:

```ts
import { accountHandler, requireJsonRequest } from "../../../lib/accountRoute";
import { NewContext } from "../../../lib/appLocalContext";
import { bffRouter } from "../../../lib/bffRoute";
import { createTenancyRequest, listMyTenancyRequests } from "../../../lib/tenancies";

const router = bffRouter()
    .get(async (req, res) => {
        const { uid } = await NewContext(req);
        res.json(await listMyTenancyRequests(uid));
    })
    .post(requireJsonRequest, async (req, res) => {
        const tenancyName = req.body?.tenancyName;
        const reason = req.body?.reason;
        if (typeof tenancyName !== "string" || typeof reason !== "string") {
            res.status(400).json({ detail: "invalid_request" });
            return;
        }
        const { uid } = await NewContext(req);
        res.status(201).json(await createTenancyRequest(uid, { tenancyName, reason }));
    });

export default accountHandler(router);
```

Create `pages/api/tenancy-requests/[requestId].ts`:

```ts
import { accountHandler, isUuid } from "../../../lib/accountRoute";
import { NewContext } from "../../../lib/appLocalContext";
import { bffRouter } from "../../../lib/bffRoute";
import { withdrawTenancyRequest } from "../../../lib/tenancies";

const router = bffRouter()
    .delete(async (req, res) => {
        const requestId = req.query.requestId;
        if (!isUuid(requestId)) {
            res.status(404).json({ detail: "request_not_found" });
            return;
        }
        const { uid } = await NewContext(req);
        await withdrawTenancyRequest(uid, requestId);
        res.status(204).end();
    });

export default accountHandler(router);
```

Create `pages/api/tenancy-invitations/index.ts`:

```ts
import { accountHandler } from "../../../lib/accountRoute";
import { NewContext } from "../../../lib/appLocalContext";
import { bffRouter } from "../../../lib/bffRoute";
import { listMyTenancyInvitations } from "../../../lib/tenancies";

const router = bffRouter()
    .get(async (req, res) => {
        const { uid } = await NewContext(req);
        res.json(await listMyTenancyInvitations(uid));
    });

export default accountHandler(router);
```

Create `pages/api/tenancy-invitations/[invitationId]/accept.ts`:

```ts
import { accountHandler, isUuid, requireJsonRequest } from "../../../../lib/accountRoute";
import { NewContext } from "../../../../lib/appLocalContext";
import { bffRouter } from "../../../../lib/bffRoute";
import { acceptTenancyInvitation } from "../../../../lib/tenancies";

const router = bffRouter()
    .post(requireJsonRequest, async (req, res) => {
        const invitationId = req.query.invitationId;
        if (!isUuid(invitationId)) {
            res.status(404).json({ detail: "invitation_not_found" });
            return;
        }
        const { uid } = await NewContext(req);
        res.json(await acceptTenancyInvitation(uid, invitationId));
    });

export default accountHandler(router);
```

Create `pages/api/tenancy-invitations/[invitationId]/decline.ts`:

```ts
import { accountHandler, isUuid, requireJsonRequest } from "../../../../lib/accountRoute";
import { NewContext } from "../../../../lib/appLocalContext";
import { bffRouter } from "../../../../lib/bffRoute";
import { declineTenancyInvitation } from "../../../../lib/tenancies";

const router = bffRouter()
    .post(requireJsonRequest, async (req, res) => {
        const invitationId = req.query.invitationId;
        if (!isUuid(invitationId)) {
            res.status(404).json({ detail: "invitation_not_found" });
            return;
        }
        const { uid } = await NewContext(req);
        await declineTenancyInvitation(uid, invitationId);
        res.status(204).end();
    });

export default accountHandler(router);
```

- [ ] **Step 4: Run it, the logging invariant and the chain tests**

Run: `npx jest --coverage=false lib/__tests__/tenancyRoutes.test.ts lib/__tests__/serverLogging.invariant.test.ts lib/__tests__/middlewareChain.test.ts`
Expected: PASS (14 new tests). A 401 on any authenticated case means the mocked token lost `v: 2`.

- [ ] **Step 5: Commit**

```bash
pwd
command git branch --show-current
command git add pages/api/tenancies pages/api/tenancy-requests pages/api/tenancy-invitations lib/__tests__/tenancyRoutes.test.ts
command git commit -m "feat: BFF routes for the user's tenancies, requests and invitations" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 6: BFF routes for the share dialog's lookup and tenancy invitations

**Files:**
- Create: `pages/api/datasets/[datasetId]/share/lookup.ts`
- Create: `pages/api/datasets/[datasetId]/tenancy-invitations/index.ts`
- Create: `pages/api/datasets/[datasetId]/tenancy-invitations/[invitationId].ts`
- Test: `lib/__tests__/tenancyInvitationRoutes.test.ts`

**Interfaces:**
- Consumes: `bffRouter()` (the router `share/candidates.ts` uses), `accountHandler`, `requireJsonRequest`, `isUuid`, `NewContext`, `lookupShareTarget`, `inviteToTenancy`, `withdrawTenancyInvitation`.
- Produces: `GET /api/datasets/[datasetId]/share/lookup?value=`, `POST /api/datasets/[datasetId]/tenancy-invitations` (`{userId}` → `201`), `DELETE /api/datasets/[datasetId]/tenancy-invitations/[invitationId]` (`204`).

- [ ] **Step 1: Write the failing test**

Create `lib/__tests__/tenancyInvitationRoutes.test.ts`:

```ts
jest.mock("next-auth/jwt", () => ({ getToken: jest.fn(async () => ({ uid: "u1", v: 2 })) }));
jest.mock("../share");

import { AxiosError, AxiosHeaders } from "axios";
import lookupHandler from "../../pages/api/datasets/[datasetId]/share/lookup";
import inviteHandler from "../../pages/api/datasets/[datasetId]/tenancy-invitations/index";
import withdrawHandler from "../../pages/api/datasets/[datasetId]/tenancy-invitations/[invitationId]";
import { inviteToTenancy, lookupShareTarget, withdrawTenancyInvitation } from "../share";

const JSON_HEADERS = { "content-type": "application/json" };
const INVITEE = "7d1f0a2b-3c4d-4e5f-8a9b-0c1d2e3f4a5b";
const INVITATION_ID = "0b9e8d7c-6a5b-4c3d-8e2f-1a2b3c4d5e6f";

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

async function send(handler: any, method: string, query: Record<string, string> = {}, body: unknown = undefined, headers: Record<string, string> = {}) {
    const res = fakeRes();
    const original = process.stdout.write;
    // @ts-ignore
    process.stdout.write = () => true;
    try {
        await handler({ method, url: "/api/x", headers, cookies: {}, query, body } as any, res);
    } finally {
        process.stdout.write = original;
    }
    return res;
}

describe("the share dialog's tenancy routes", () => {
    test("the lookup passes the typed value and answers the gatekeeper's JSON", async () => {
        jest.mocked(lookupShareTarget).mockResolvedValue({ user: { id: INVITEE }, can_invite: true } as any);

        const res = await send(lookupHandler, "GET", { datasetId: "d1", value: "fernanda@inpe.br" });

        expect(res.statusCode).toBe(200);
        expect(lookupShareTarget).toHaveBeenCalledWith(expect.objectContaining({ uid: "u1" }), "d1", "fernanda@inpe.br");
        expect(res.json).toHaveBeenCalledWith({ user: { id: INVITEE }, can_invite: true });
    });

    test("a lookup without a value is invalid_request and never reaches the gatekeeper", async () => {
        jest.mocked(lookupShareTarget).mockClear();

        const res = await send(lookupHandler, "GET", { datasetId: "d1" });

        expect(res.statusCode).toBe(400);
        expect(res.json).toHaveBeenCalledWith({ detail: "invalid_request" });
        expect(lookupShareTarget).not.toHaveBeenCalled();
    });

    test("an unknown account keeps its 404 code", async () => {
        jest.mocked(lookupShareTarget).mockRejectedValue(gatekeeperError(404, { detail: "no_account" }));

        const res = await send(lookupHandler, "GET", { datasetId: "d1", value: "nobody@inpe.br" });

        expect(res.statusCode).toBe(404);
        expect(res.json).toHaveBeenCalledWith({ detail: "no_account" });
    });

    test("inviting sends the invitee and answers 201", async () => {
        jest.mocked(inviteToTenancy).mockResolvedValue({ id: INVITATION_ID, can_withdraw: true } as any);

        const res = await send(inviteHandler, "POST", { datasetId: "d1" }, { userId: INVITEE }, JSON_HEADERS);

        expect(res.statusCode).toBe(201);
        expect(inviteToTenancy).toHaveBeenCalledWith(expect.objectContaining({ uid: "u1" }), "d1", INVITEE);
    });

    test("an invitee that is not a UUID is invalid_request", async () => {
        jest.mocked(inviteToTenancy).mockClear();

        const res = await send(inviteHandler, "POST", { datasetId: "d1" }, { userId: "u1" }, JSON_HEADERS);

        expect(res.statusCode).toBe(400);
        expect(res.json).toHaveBeenCalledWith({ detail: "invalid_request" });
        expect(inviteToTenancy).not.toHaveBeenCalled();
    });

    test("a 409 keeps its code", async () => {
        jest.mocked(inviteToTenancy).mockRejectedValue(gatekeeperError(409, { detail: "already_member" }));

        const res = await send(inviteHandler, "POST", { datasetId: "d1" }, { userId: INVITEE }, JSON_HEADERS);

        expect(res.statusCode).toBe(409);
        expect(res.json).toHaveBeenCalledWith({ detail: "already_member" });
    });

    test("an invitation that is not JSON is refused", async () => {
        jest.mocked(inviteToTenancy).mockClear();

        const res = await send(inviteHandler, "POST", { datasetId: "d1" }, `userId=${INVITEE}`, { "content-type": "application/x-www-form-urlencoded" });

        expect(res.statusCode).toBe(415);
        expect(inviteToTenancy).not.toHaveBeenCalled();
    });

    test("withdrawing answers 204", async () => {
        jest.mocked(withdrawTenancyInvitation).mockResolvedValue(undefined);

        const res = await send(withdrawHandler, "DELETE", { datasetId: "d1", invitationId: INVITATION_ID });

        expect(res.statusCode).toBe(204);
        expect(withdrawTenancyInvitation).toHaveBeenCalledWith(expect.objectContaining({ uid: "u1" }), "d1", INVITATION_ID);
    });

    test("withdrawing someone else's invitation keeps the 403 code", async () => {
        jest.mocked(withdrawTenancyInvitation).mockRejectedValue(gatekeeperError(403, { detail: "forbidden" }));

        const res = await send(withdrawHandler, "DELETE", { datasetId: "d1", invitationId: INVITATION_ID });

        expect(res.statusCode).toBe(403);
        expect(res.json).toHaveBeenCalledWith({ detail: "forbidden" });
    });
});
```

- [ ] **Step 2: Run it and watch it fail**

Run: `npx jest --coverage=false lib/__tests__/tenancyInvitationRoutes.test.ts`
Expected: FAIL — `Cannot find module '../../pages/api/datasets/[datasetId]/share/lookup'`.

- [ ] **Step 3: Implement**

Create `pages/api/datasets/[datasetId]/share/lookup.ts`:

```ts
import { accountHandler } from "../../../../../lib/accountRoute";
import { NewContext } from "../../../../../lib/appLocalContext";
import { bffRouter } from "../../../../../lib/bffRoute";
import { lookupShareTarget } from "../../../../../lib/share";

const router = bffRouter()
    .get(async (req, res) => {
        const value = req.query.value;
        if (typeof value !== "string" || value.trim() === "") {
            res.status(400).json({ detail: "invalid_request" });
            return;
        }
        const context = await NewContext(req);
        res.json(await lookupShareTarget(context, req.query.datasetId as string, value.trim()));
    });

export default accountHandler(router);
```

Create `pages/api/datasets/[datasetId]/tenancy-invitations/index.ts`:

```ts
import { accountHandler, isUuid, requireJsonRequest } from "../../../../../lib/accountRoute";
import { NewContext } from "../../../../../lib/appLocalContext";
import { bffRouter } from "../../../../../lib/bffRoute";
import { inviteToTenancy } from "../../../../../lib/share";

const router = bffRouter()
    .post(requireJsonRequest, async (req, res) => {
        const userId = req.body?.userId;
        if (!isUuid(userId)) {
            res.status(400).json({ detail: "invalid_request" });
            return;
        }
        const context = await NewContext(req);
        res.status(201).json(await inviteToTenancy(context, req.query.datasetId as string, userId));
    });

export default accountHandler(router);
```

Create `pages/api/datasets/[datasetId]/tenancy-invitations/[invitationId].ts`:

```ts
import { accountHandler, isUuid } from "../../../../../lib/accountRoute";
import { NewContext } from "../../../../../lib/appLocalContext";
import { bffRouter } from "../../../../../lib/bffRoute";
import { withdrawTenancyInvitation } from "../../../../../lib/share";

const router = bffRouter()
    .delete(async (req, res) => {
        const invitationId = req.query.invitationId;
        if (!isUuid(invitationId)) {
            res.status(404).json({ detail: "invitation_not_found" });
            return;
        }
        const context = await NewContext(req);
        await withdrawTenancyInvitation(context, req.query.datasetId as string, invitationId);
        res.status(204).end();
    });

export default accountHandler(router);
```

- [ ] **Step 4: Run it and the existing share route tests**

Run: `npx jest --coverage=false lib/__tests__/tenancyInvitationRoutes.test.ts lib/__tests__/shareRoutes.test.ts`
Expected: PASS (9 new tests).

- [ ] **Step 5: Commit**

```bash
pwd
command git branch --show-current
command git add "pages/api/datasets/[datasetId]/share/lookup.ts" "pages/api/datasets/[datasetId]/tenancy-invitations" lib/__tests__/tenancyInvitationRoutes.test.ts
command git commit -m "feat: BFF routes for the share lookup and tenancy invitations" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 7: BFFAPI methods

**Files:**
- Modify: `gateways/BFFAPI.ts`
- Modify: `contants/TelemetryConstants.ts`
- Test: `gateways/__tests__/BFFAPI.tenancies.test.ts`

**Interfaces:**
- Consumes: the BFF routes of Tasks 5 and 6.
- Produces: the seven contract methods. They reject with the Axios error (no `httpErrorHandler`). Telemetry: `tenancy_access_requested`, `tenancy_invitation_accepted`, `tenancy_invitation_sent`.

- [ ] **Step 1: Write the failing test**

Create `gateways/__tests__/BFFAPI.tenancies.test.ts`:

```ts
jest.mock("axios", () => {
    const actual = jest.requireActual("axios");
    return {
        __esModule: true,
        ...actual,
        default: {
            ...actual.default,
            get: jest.fn(),
            post: jest.fn(),
            delete: jest.fn(),
            isAxiosError: actual.default.isAxiosError,
        },
    };
});
jest.mock("../../lib/telemetryClient", () => ({ trackUiEvent: jest.fn() }));

import axios, { AxiosError, AxiosHeaders } from "axios";
import { trackUiEvent } from "../../lib/telemetryClient";
import { BFFAPI } from "../BFFAPI";

const bff = new BFFAPI();

describe("BFFAPI tenancies", () => {
    test("a request sends the browser's names and is counted", async () => {
        jest.mocked(axios.post).mockResolvedValue({ status: 201, data: { id: "r1" } });

        expect(await bff.requestTenancyAccess({ tenancyName: "Data Amazon", reason: "SMPS data" })).toEqual({ id: "r1" });
        expect(axios.post).toHaveBeenCalledWith("/api/tenancy-requests", { tenancyName: "Data Amazon", reason: "SMPS data" });
        expect(trackUiEvent).toHaveBeenCalledWith("tenancy_access_requested");
    });

    test("withdrawing a request deletes it", async () => {
        jest.mocked(axios.delete).mockResolvedValue({ status: 204 });

        await bff.withdrawTenancyRequest("r1");

        expect(axios.delete).toHaveBeenCalledWith("/api/tenancy-requests/r1");
    });

    test("accepting posts JSON and answers the tenancy", async () => {
        jest.mocked(axios.post).mockResolvedValue({ status: 200, data: { tenancy: { path: "datamap/production/data-amazon" } } });

        expect(await bff.acceptTenancyInvitation("ti1")).toEqual({ tenancy: { path: "datamap/production/data-amazon" } });
        expect(axios.post).toHaveBeenCalledWith("/api/tenancy-invitations/ti1/accept", {});
        expect(trackUiEvent).toHaveBeenCalledWith("tenancy_invitation_accepted");
    });

    test("declining posts JSON", async () => {
        jest.mocked(axios.post).mockResolvedValue({ status: 204 });

        await bff.declineTenancyInvitation("ti1");

        expect(axios.post).toHaveBeenCalledWith("/api/tenancy-invitations/ti1/decline", {});
    });

    test("the lookup encodes the typed value", async () => {
        jest.mocked(axios.get).mockResolvedValue({ status: 200, data: { can_invite: true } });

        expect(await bff.lookupShareTarget("d1", "a+b@inpe.br")).toEqual({ can_invite: true });
        expect(axios.get).toHaveBeenCalledWith("/api/datasets/d1/share/lookup?value=a%2Bb%40inpe.br");
    });

    test("inviting sends the invitee and is counted", async () => {
        jest.mocked(axios.post).mockResolvedValue({ status: 201, data: { id: "ti1" } });

        expect(await bff.inviteToTenancy("d1", "u7")).toEqual({ id: "ti1" });
        expect(axios.post).toHaveBeenCalledWith("/api/datasets/d1/tenancy-invitations", { userId: "u7" });
        expect(trackUiEvent).toHaveBeenCalledWith("tenancy_invitation_sent");
    });

    test("withdrawing an invitation deletes it", async () => {
        jest.mocked(axios.delete).mockResolvedValue({ status: 204 });

        await bff.withdrawTenancyInvitation("d1", "ti1");

        expect(axios.delete).toHaveBeenCalledWith("/api/datasets/d1/tenancy-invitations/ti1");
    });

    test("a failure rejects with the Axios error, so the caller reads its code", async () => {
        const error = new AxiosError("conflict", "ERR", undefined, {}, {
            status: 409, data: { detail: "request_pending" }, statusText: "", headers: {}, config: { headers: new AxiosHeaders() },
        } as any);
        jest.mocked(axios.post).mockRejectedValue(error);

        await expect(bff.requestTenancyAccess({ tenancyName: "x", reason: "y" })).rejects.toBe(error);
    });
});
```

- [ ] **Step 2: Run it and watch it fail**

Run: `npx jest --coverage=false gateways/__tests__/BFFAPI.tenancies.test.ts`
Expected: FAIL — `Property 'requestTenancyAccess' does not exist on type 'BFFAPI'`.

- [ ] **Step 3: Implement**

In `contants/TelemetryConstants.ts`, replace:

```ts
  "members_access_changed",
] as const;
```

with:

```ts
  "members_access_changed",
  "tenancy_access_requested",
  "tenancy_invitation_accepted",
  "tenancy_invitation_sent",
] as const;
```

In `gateways/BFFAPI.ts`, replace:

```ts
    ShareUser,
} from "../types/GatekeeperAPI";
```

with:

```ts
    ShareUser,
    DatasetTenancyInvitation,
    ShareLookup,
    TenancyRequest,
    TenancySummary,
} from "../types/GatekeeperAPI";
```

and replace:

```ts
    async confirmEmailVerification(challengeId: string, code: string): Promise<void> {
        await axios.post(`/api/account/email-verifications/${encodeURIComponent(challengeId)}/confirm`, { code });
    }
```

with:

```ts
    async confirmEmailVerification(challengeId: string, code: string): Promise<void> {
        await axios.post(`/api/account/email-verifications/${encodeURIComponent(challengeId)}/confirm`, { code });
    }

    async requestTenancyAccess(input: { tenancyName: string; reason: string }): Promise<TenancyRequest> {
        const response = await axios.post("/api/tenancy-requests", input);
        trackUiEvent("tenancy_access_requested");
        return response.data as TenancyRequest;
    }

    async withdrawTenancyRequest(requestId: string): Promise<void> {
        await axios.delete(`/api/tenancy-requests/${encodeURIComponent(requestId)}`);
    }

    async acceptTenancyInvitation(invitationId: string): Promise<{ tenancy: TenancySummary }> {
        const response = await axios.post(`/api/tenancy-invitations/${encodeURIComponent(invitationId)}/accept`, {});
        trackUiEvent("tenancy_invitation_accepted");
        return response.data as { tenancy: TenancySummary };
    }

    async declineTenancyInvitation(invitationId: string): Promise<void> {
        await axios.post(`/api/tenancy-invitations/${encodeURIComponent(invitationId)}/decline`, {});
    }

    async lookupShareTarget(datasetId: string, value: string): Promise<ShareLookup> {
        const response = await axios.get(`/api/datasets/${datasetId}/share/lookup?value=${encodeURIComponent(value)}`);
        return response.data as ShareLookup;
    }

    async inviteToTenancy(datasetId: string, userId: string): Promise<DatasetTenancyInvitation> {
        const response = await axios.post(`/api/datasets/${datasetId}/tenancy-invitations`, { userId });
        trackUiEvent("tenancy_invitation_sent");
        return response.data as DatasetTenancyInvitation;
    }

    async withdrawTenancyInvitation(datasetId: string, invitationId: string): Promise<void> {
        await axios.delete(`/api/datasets/${datasetId}/tenancy-invitations/${encodeURIComponent(invitationId)}`);
    }
```

- [ ] **Step 4: Run it and the other gateway and telemetry tests**

Run: `npx jest --coverage=false gateways contants/__tests__/TelemetryConstants.test.ts`
Expected: PASS (8 new tests).

- [ ] **Step 5: Commit**

```bash
pwd
command git branch --show-current
command git add gateways/BFFAPI.ts contants/TelemetryConstants.ts gateways/__tests__/BFFAPI.tenancies.test.ts
command git commit -m "feat: BFFAPI methods for tenancy requests and invitations" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 8: Reads and the rules behind them

**Files:**
- Create: `lib/tenancyRequests.ts`
- Create: `lib/tenancySelection.ts`
- Create: `hooks/UseTenancies.ts`
- Test: `lib/__tests__/tenancyRequests.test.ts`, `lib/__tests__/tenancySelection.test.ts`, `hooks/__tests__/UseTenancies.test.tsx`

**Interfaces:**
- Consumes: `TENANCIES_KEY`, `TENANCY_REQUESTS_KEY`, `TENANCY_INVITATIONS_KEY`, `REQUEST_OUTCOME_VISIBLE_DAYS`; `fetcher` (`lib/fetcher.js`); `useSession().update`.
- Produces:
  - `type LatestRequestState = { kind: "pending" | "declined" | "approved", request: TenancyRequest } | null`; `latestRequestState(requests: TenancyRequest[] | undefined | null, now: Date): LatestRequestState` — the newest request: pending always; declined or approved only when decided within 30 days (an approval also needs its `tenancy`); withdrawn never. `approvedTenancyMissingFromSession(state, sessionTenancies): boolean`.
  - `type TenancySelection = { kind: "none" } | { kind: "only", path: string } | { kind: "choose" }`; `tenancySelectionFor(tenancies: TenancySummary[]): TenancySelection`; `sessionTenanciesDiffer(sessionTenancies: string[] | undefined | null, tenancies: TenancySummary[]): boolean` (order-insensitive); `firstNameOf(name?: string | null): string`; `tenancyPathLabel(path: string): string` (`datamap / production / public`).
  - `useMyTenancies()`, `useTenancyRequests()` (`revalidateOnFocus: true`), `useTenancyInvitations()` (`revalidateOnFocus: true`), `useLatestTenancyRequest(): { state: LatestRequestState, mutate }` — calls `update()` once per request id when the latest request is an approval the session does not have yet.

- [ ] **Step 1: Write the failing tests**

Create `lib/__tests__/tenancyRequests.test.ts`:

```ts
import { describe, expect, test } from '@jest/globals';
import { approvedTenancyMissingFromSession, latestRequestState } from "../tenancyRequests";

const NOW = new Date("2026-10-05T12:00:00+00:00");
const AMAZON = { path: "datamap/production/data-amazon", display_name: "Data Amazon", is_default: false, is_legacy: false };

function request(overrides: any = {}): any {
    return {
        id: "r1", requested_name: "Data Amazon", reason: "SMPS data", status: "pending", tenancy: null,
        created_tenancy: false, decision_message: null, created_at: "2026-09-28T12:00:00+00:00", decided_at: null,
        ...overrides,
    };
}

describe("the request outcome to show", () => {
    test("no requests, nothing to show", () => {
        expect(latestRequestState([], NOW)).toBeNull();
        expect(latestRequestState(undefined, NOW)).toBeNull();
    });

    test("a pending request is shown", () => {
        expect(latestRequestState([request()], NOW)?.kind).toBe("pending");
    });

    test("a decline from the last 30 days is shown", () => {
        const declined = request({ status: "declined", decided_at: "2026-09-10T12:00:00+00:00" });

        expect(latestRequestState([declined], NOW)).toEqual({ kind: "declined", request: declined });
    });

    test("an older decline is not", () => {
        expect(latestRequestState([request({ status: "declined", decided_at: "2026-08-20T12:00:00+00:00" })], NOW)).toBeNull();
    });

    test("only the newest request counts: a newer pending one hides an older decline", () => {
        const newer = request({ id: "r2" });
        const older = request({ status: "declined", decided_at: "2026-10-01T12:00:00+00:00" });

        expect(latestRequestState([newer, older], NOW)).toEqual({ kind: "pending", request: newer });
    });

    test("a withdrawn request shows nothing", () => {
        expect(latestRequestState([request({ status: "withdrawn" })], NOW)).toBeNull();
    });

    test("a recent approval is shown with its tenancy", () => {
        const approved = request({ status: "approved", tenancy: AMAZON, decided_at: "2026-10-04T12:00:00+00:00" });

        expect(latestRequestState([approved], NOW)).toEqual({ kind: "approved", request: approved });
    });

    test("an approval the session does not have yet is missing", () => {
        const state = latestRequestState([request({ status: "approved", tenancy: AMAZON, decided_at: "2026-10-04T12:00:00+00:00" })], NOW);

        expect(approvedTenancyMissingFromSession(state, ["datamap/production/public"])).toBe(true);
    });

    test("an approval already in the session is not", () => {
        const state = latestRequestState([request({ status: "approved", tenancy: AMAZON, decided_at: "2026-10-04T12:00:00+00:00" })], NOW);

        expect(approvedTenancyMissingFromSession(state, ["datamap/production/public", AMAZON.path])).toBe(false);
    });

    test("a pending request is never missing from the session", () => {
        expect(approvedTenancyMissingFromSession(latestRequestState([request()], NOW), [])).toBe(false);
    });
});
```

Create `lib/__tests__/tenancySelection.test.ts`:

```ts
import { describe, expect, test } from '@jest/globals';
import { firstNameOf, sessionTenanciesDiffer, tenancyPathLabel, tenancySelectionFor } from "../tenancySelection";

const PUBLIC = { path: "datamap/production/public", display_name: "Public", is_default: true, is_legacy: false };
const AMAZON = { path: "datamap/production/data-amazon", display_name: "Data Amazon", is_default: false, is_legacy: false };

describe("which tenancy to work in", () => {
    test("with none, there is nothing to select", () => {
        expect(tenancySelectionFor([])).toEqual({ kind: "none" });
    });

    test("with exactly one, it is selected", () => {
        expect(tenancySelectionFor([PUBLIC])).toEqual({ kind: "only", path: PUBLIC.path });
    });

    test("with more than one, the person chooses", () => {
        expect(tenancySelectionFor([PUBLIC, AMAZON])).toEqual({ kind: "choose" });
    });

    test("a session with the same tenancies in another order is not stale", () => {
        expect(sessionTenanciesDiffer([AMAZON.path, PUBLIC.path], [PUBLIC, AMAZON])).toBe(false);
    });

    test("a session missing a tenancy is stale", () => {
        expect(sessionTenanciesDiffer([PUBLIC.path], [PUBLIC, AMAZON])).toBe(true);
    });

    test("a session with a tenancy the user lost is stale", () => {
        expect(sessionTenanciesDiffer([PUBLIC.path, AMAZON.path], [PUBLIC])).toBe(true);
        expect(sessionTenanciesDiffer(undefined, [PUBLIC])).toBe(true);
    });

    test("the welcome uses the first name", () => {
        expect(firstNameOf("Fernanda Lima")).toBe("Fernanda");
        expect(firstNameOf("  Ana  ")).toBe("Ana");
    });

    test("no name gives an empty first name", () => {
        expect(firstNameOf(undefined)).toBe("");
        expect(firstNameOf(null)).toBe("");
    });

    test("a path reads with spaced separators", () => {
        expect(tenancyPathLabel("datamap/production/public")).toBe("datamap / production / public");
    });
});
```

Create `hooks/__tests__/UseTenancies.test.tsx`:

```tsx
/** @jest-environment jsdom */
import { beforeEach, describe, expect, jest, test } from '@jest/globals';
import { renderHook } from '@testing-library/react';

const update = jest.fn() as any;
let requests: any;
let sessionTenancies: string[];

jest.mock("swr", () => ({ __esModule: true, default: () => ({ data: requests, mutate: jest.fn() }) }));
jest.mock("next-auth/react", () => ({ useSession: () => ({ data: { user: { tenancies: sessionTenancies } }, update }) }));
jest.mock("../../lib/fetcher", () => ({ fetcher: jest.fn() }));

import { useLatestTenancyRequest } from "../UseTenancies";

const AMAZON = { path: "datamap/production/data-amazon", display_name: "Data Amazon", is_default: false, is_legacy: false };

function approved(): any {
    return {
        id: "r1", requested_name: "Data Amazon", reason: "SMPS data", status: "approved", tenancy: AMAZON,
        created_tenancy: false, decision_message: null, created_at: new Date().toISOString(), decided_at: new Date().toISOString(),
    };
}

beforeEach(() => {
    update.mockReset();
    sessionTenancies = ["datamap/production/public"];
});

describe("useLatestTenancyRequest", () => {
    test("an approval the session lacks refreshes the session once", () => {
        requests = [approved()];

        const { rerender } = renderHook(() => useLatestTenancyRequest());
        rerender();

        expect(update).toHaveBeenCalledTimes(1);
    });

    test("an approval the session already has does not", () => {
        requests = [approved()];
        sessionTenancies = ["datamap/production/public", AMAZON.path];

        renderHook(() => useLatestTenancyRequest());

        expect(update).not.toHaveBeenCalled();
    });

    test("a pending request is reported and refreshes nothing", () => {
        requests = [{ ...approved(), status: "pending", tenancy: null, decided_at: null }];

        const { result } = renderHook(() => useLatestTenancyRequest());

        expect(result.current.state?.kind).toBe("pending");
        expect(update).not.toHaveBeenCalled();
    });
});
```

- [ ] **Step 2: Run them and watch them fail**

Run: `npx jest --coverage=false lib/__tests__/tenancyRequests.test.ts lib/__tests__/tenancySelection.test.ts hooks/__tests__/UseTenancies.test.tsx`
Expected: FAIL — `Cannot find module '../tenancyRequests'`, `'../tenancySelection'`, `'../UseTenancies'`.

- [ ] **Step 3: Implement**

Create `lib/tenancyRequests.ts`:

```ts
import { REQUEST_OUTCOME_VISIBLE_DAYS } from "../contants/TenancyConstants";
import { TenancyRequest } from "../types/GatekeeperAPI";

const DAY_MS = 24 * 60 * 60 * 1000;

export type LatestRequestState =
    | { kind: "pending", request: TenancyRequest }
    | { kind: "declined", request: TenancyRequest }
    | { kind: "approved", request: TenancyRequest }
    | null;

function decidedRecently(request: TenancyRequest, now: Date): boolean {
    if (!request.decided_at) {
        return false;
    }
    return now.getTime() - new Date(request.decided_at).getTime() <= REQUEST_OUTCOME_VISIBLE_DAYS * DAY_MS;
}

export function latestRequestState(requests: TenancyRequest[] | undefined | null, now: Date): LatestRequestState {
    const latest = requests?.[0];
    if (!latest) {
        return null;
    }
    if (latest.status === "pending") {
        return { kind: "pending", request: latest };
    }
    if (latest.status === "declined" && decidedRecently(latest, now)) {
        return { kind: "declined", request: latest };
    }
    if (latest.status === "approved" && latest.tenancy && decidedRecently(latest, now)) {
        return { kind: "approved", request: latest };
    }
    return null;
}

export function approvedTenancyMissingFromSession(state: LatestRequestState, sessionTenancies: string[] | undefined | null): boolean {
    return state?.kind === "approved"
        && !!state.request.tenancy
        && !(sessionTenancies ?? []).includes(state.request.tenancy.path);
}
```

Create `lib/tenancySelection.ts`:

```ts
import { TenancySummary } from "../types/GatekeeperAPI";

export type TenancySelection = { kind: "none" } | { kind: "only", path: string } | { kind: "choose" };

export function tenancySelectionFor(tenancies: TenancySummary[]): TenancySelection {
    if (tenancies.length === 0) {
        return { kind: "none" };
    }
    if (tenancies.length === 1) {
        return { kind: "only", path: tenancies[0].path };
    }
    return { kind: "choose" };
}

export function sessionTenanciesDiffer(sessionTenancies: string[] | undefined | null, tenancies: TenancySummary[]): boolean {
    const held = [...(sessionTenancies ?? [])].sort();
    const actual = tenancies.map((tenancy) => tenancy.path).sort();
    return held.length !== actual.length || held.some((path, index) => path !== actual[index]);
}

export function firstNameOf(name?: string | null): string {
    return (name ?? "").trim().split(/\s+/)[0] ?? "";
}

export function tenancyPathLabel(path: string): string {
    return path.split("/").join(" / ");
}
```

Create `hooks/UseTenancies.ts`:

```ts
import { useSession } from "next-auth/react";
import { useEffect, useRef } from "react";
import useSWR from "swr";
import { TENANCIES_KEY, TENANCY_INVITATIONS_KEY, TENANCY_REQUESTS_KEY } from "../contants/TenancyConstants";
import { fetcher } from "../lib/fetcher";
import { approvedTenancyMissingFromSession, latestRequestState } from "../lib/tenancyRequests";
import { TenancyInvitation, TenancyRequest, TenancySummary } from "../types/GatekeeperAPI";

export function useMyTenancies() {
    return useSWR<TenancySummary[]>(TENANCIES_KEY, fetcher);
}

export function useTenancyRequests() {
    return useSWR<TenancyRequest[]>(TENANCY_REQUESTS_KEY, fetcher, { revalidateOnFocus: true });
}

export function useTenancyInvitations() {
    return useSWR<TenancyInvitation[]>(TENANCY_INVITATIONS_KEY, fetcher, { revalidateOnFocus: true });
}

export function useLatestTenancyRequest() {
    const { data, mutate } = useTenancyRequests();
    const { data: session, update } = useSession();
    const state = latestRequestState(data, new Date());
    const missing = approvedTenancyMissingFromSession(state, session?.user?.tenancies);
    const refreshedFor = useRef<string | null>(null);
    const requestId = state?.request.id ?? null;

    useEffect(() => {
        if (missing && requestId && refreshedFor.current !== requestId) {
            refreshedFor.current = requestId;
            update();
        }
    }, [missing, requestId, update]);

    return { state, mutate };
}
```

- [ ] **Step 4: Run them**

Run: `npx jest --coverage=false lib/__tests__/tenancyRequests.test.ts lib/__tests__/tenancySelection.test.ts hooks/__tests__/UseTenancies.test.tsx`
Expected: PASS (10 + 9 + 3 tests).

- [ ] **Step 5: Commit**

```bash
pwd
command git branch --show-current
command git add lib/tenancyRequests.ts lib/tenancySelection.ts hooks/UseTenancies.ts lib/__tests__/tenancyRequests.test.ts lib/__tests__/tenancySelection.test.ts hooks/__tests__/UseTenancies.test.tsx
command git commit -m "feat: tenancy reads and the rules for what the selector and panels show" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 9: The request form

**Files:**
- Create: `components/Tenancy/RequestAccessDialog.tsx`
- Test: `components/Tenancy/__tests__/RequestAccessDialog.test.tsx`

**Interfaces:**
- Consumes: `BFFAPI.requestTenancyAccess`, `mutate` from `swr`, `TENANCY_REQUESTS_KEY`, `TENANCY_NAME_MAX_LENGTH`, `REASON_MAX_LENGTH`, `tenancyErrorMessage`, `Modal` (`components/base/PopupModal.tsx`), `EDIT_FORM_*` classes.
- Produces: `RequestAccessDialog(props: { show: boolean; onClose(): void })` — the design's 1i dialog (520 px). On success it revalidates `/api/tenancy-requests` and calls `onClose`.

- [ ] **Step 1: Write the failing test**

Create `components/Tenancy/__tests__/RequestAccessDialog.test.tsx`:

```tsx
/** @jest-environment jsdom */
import { beforeEach, describe, expect, jest, test } from '@jest/globals';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';

const requestTenancyAccess = jest.fn() as any;

jest.mock("../../../gateways/BFFAPI", () => ({
    BFFAPI: jest.fn().mockImplementation(() => ({ requestTenancyAccess })),
}));
jest.mock("swr", () => ({ __esModule: true, default: jest.fn(), mutate: jest.fn() }));

import { mutate } from "swr";
import { RequestAccessDialog } from "../RequestAccessDialog";

async function send(name: string, reason: string) {
    fireEvent.change(screen.getByLabelText("Tenancy"), { target: { value: name } });
    fireEvent.change(screen.getByLabelText("Why"), { target: { value: reason } });
    await act(async () => {
        fireEvent.click(screen.getByRole("button", { name: "Send request" }));
    });
}

beforeEach(() => {
    requestTenancyAccess.mockReset();
});

describe("RequestAccessDialog", () => {
    test("sends what the person typed, trimmed, refreshes the requests and closes", async () => {
        requestTenancyAccess.mockResolvedValue({ id: "r1", status: "pending" });
        const onClose = jest.fn();
        render(<RequestAccessDialog show onClose={onClose} />);

        expect(screen.getByRole("dialog", { name: "Request access" })).toBeTruthy();
        expect(screen.getByText("Name the tenancy you need. An administrator reviews it; you're emailed with the answer.")).toBeTruthy();
        expect(screen.getByText("The name of the group or project. If it exists, this is a request to join; if not, a request to create it. Only administrators can tell which.")).toBeTruthy();
        await send("  Data Amazon ", " I'm a postdoc working on the GoAmazon SMPS data. ");

        await waitFor(() => expect(onClose).toHaveBeenCalledTimes(1));
        expect(requestTenancyAccess).toHaveBeenCalledWith({ tenancyName: "Data Amazon", reason: "I'm a postdoc working on the GoAmazon SMPS data." });
        expect(mutate).toHaveBeenCalledWith("/api/tenancy-requests");
    });

    test("empty fields are refused before anything is sent", async () => {
        render(<RequestAccessDialog show onClose={jest.fn()} />);

        await send("   ", "");

        expect(await screen.findByText("Name the tenancy you need.")).toBeTruthy();
        expect(screen.getByText("Say why you need access.")).toBeTruthy();
        expect(requestTenancyAccess).not.toHaveBeenCalled();
    });

    test("a request already waiting says to withdraw it first", async () => {
        requestTenancyAccess.mockRejectedValue({ response: { status: 409, data: { detail: "request_pending" } } });
        const onClose = jest.fn();
        render(<RequestAccessDialog show onClose={onClose} />);

        await send("Data Amazon", "SMPS data");

        await waitFor(() => expect(screen.getByRole("alert").textContent).toBe("You already have a request waiting. Withdraw it to send another."));
        expect(onClose).not.toHaveBeenCalled();
    });

    test("the daily limit says when to try again", async () => {
        requestTenancyAccess.mockRejectedValue({ response: { status: 429, data: { detail: "too_many_requests" } } });
        render(<RequestAccessDialog show onClose={jest.fn()} />);

        await send("Data Amazon", "SMPS data");

        await waitFor(() => expect(screen.getByRole("alert").textContent).toBe("You have sent three requests in the last 24 hours. Try again tomorrow."));
    });

    test("Cancel closes without sending", () => {
        const onClose = jest.fn();
        render(<RequestAccessDialog show onClose={onClose} />);

        fireEvent.click(screen.getByRole("button", { name: "Cancel" }));

        expect(onClose).toHaveBeenCalledTimes(1);
        expect(requestTenancyAccess).not.toHaveBeenCalled();
    });
});
```

- [ ] **Step 2: Run it and watch it fail**

Run: `npx jest --coverage=false components/Tenancy/__tests__/RequestAccessDialog.test.tsx`
Expected: FAIL — `Cannot find module '../RequestAccessDialog'`.

- [ ] **Step 3: Implement**

Create `components/Tenancy/RequestAccessDialog.tsx`:

```tsx
import { useFormik } from "formik";
import { useState } from "react";
import { mutate } from "swr";
import * as Yup from "yup";
import { EDIT_FORM_ERROR_CLASS, EDIT_FORM_INPUT_CLASS, EDIT_FORM_LABEL_CLASS } from "../../contants/EditFormConstants";
import { REASON_MAX_LENGTH, TENANCY_NAME_MAX_LENGTH, TENANCY_REQUESTS_KEY, tenancyErrorMessage } from "../../contants/TenancyConstants";
import { BFFAPI } from "../../gateways/BFFAPI";
import Modal from "../base/PopupModal";

const schema = Yup.object({
    tenancyName: Yup.string().trim().required("Name the tenancy you need.").max(TENANCY_NAME_MAX_LENGTH, `At most ${TENANCY_NAME_MAX_LENGTH} characters.`),
    reason: Yup.string().trim().required("Say why you need access.").max(REASON_MAX_LENGTH, `At most ${REASON_MAX_LENGTH} characters.`),
});

interface Props {
    show: boolean
    onClose(): void
}

export function RequestAccessDialog(props: Props) {
    const [bffGateway] = useState(() => new BFFAPI());
    const [error, setError] = useState<string | null>(null);
    const formik = useFormik({
        initialValues: { tenancyName: "", reason: "" },
        validationSchema: schema,
        onSubmit: async (values, helpers) => {
            setError(null);
            try {
                await bffGateway.requestTenancyAccess({ tenancyName: values.tenancyName.trim(), reason: values.reason.trim() });
                helpers.resetForm();
                await mutate(TENANCY_REQUESTS_KEY);
                props.onClose();
            } catch (e) {
                setError(tenancyErrorMessage(e?.response?.data?.detail));
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
            title="Request access"
            show={props.show}
            confimButtonText="Send request"
            cancelButtonText="Cancel"
            cancel={close}
            confim={() => { if (!formik.isSubmitting) formik.submitForm(); }}
            confirmDisabled={formik.isSubmitting}
            maxWidthClassName="max-w-[520px]"
        >
            <form noValidate onSubmit={formik.handleSubmit} className="flex flex-col gap-4">
                <p className="m-0 text-sm leading-5 text-primary-600">Name the tenancy you need. An administrator reviews it; you&apos;re emailed with the answer.</p>
                <div>
                    <label htmlFor="request-tenancy-name" className={EDIT_FORM_LABEL_CLASS}>Tenancy</label>
                    <input
                        id="request-tenancy-name"
                        type="text"
                        autoComplete="off"
                        maxLength={TENANCY_NAME_MAX_LENGTH}
                        className={EDIT_FORM_INPUT_CLASS}
                        {...formik.getFieldProps("tenancyName")}
                    />
                    <p className="m-0 mt-1.5 text-xs leading-[17px] text-primary-500">
                        The name of the group or project. If it exists, this is a request to join; if not, a request to create it. Only administrators can tell which.
                    </p>
                    {formik.touched.tenancyName && formik.errors.tenancyName && <p className={EDIT_FORM_ERROR_CLASS}>{formik.errors.tenancyName}</p>}
                </div>
                <div>
                    <label htmlFor="request-reason" className={EDIT_FORM_LABEL_CLASS}>Why</label>
                    <textarea
                        id="request-reason"
                        rows={4}
                        maxLength={REASON_MAX_LENGTH}
                        className="block w-full px-3 py-2 bg-primary-0 border border-primary-300 rounded-md text-sm text-primary-900 placeholder:text-primary-400"
                        {...formik.getFieldProps("reason")}
                    />
                    {formik.touched.reason && formik.errors.reason && <p className={EDIT_FORM_ERROR_CLASS}>{formik.errors.reason}</p>}
                </div>
                {error && <p role="alert" className="m-0 text-sm text-danger-700">{error}</p>}
                <button type="submit" hidden aria-hidden="true" tabIndex={-1} />
            </form>
        </Modal>
    );
}
```

- [ ] **Step 4: Run it**

Run: `npx jest --coverage=false components/Tenancy/__tests__/RequestAccessDialog.test.tsx`
Expected: PASS (5 tests).

- [ ] **Step 5: Commit**

```bash
pwd
command git branch --show-current
command git add components/Tenancy/RequestAccessDialog.tsx components/Tenancy/__tests__/RequestAccessDialog.test.tsx
command git commit -m "feat: the request access form" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 10: Where a request stands

**Files:**
- Create: `components/Tenancy/TenancyRequestStatus.tsx`
- Test: `components/Tenancy/__tests__/TenancyRequestStatus.test.tsx`

**Interfaces:**
- Consumes: `useLatestTenancyRequest` (Task 8), `BFFAPI.withdrawTenancyRequest`, `useTenancyStore`, `TenancyIcon`, `formatShortDate` (`lib/embargoDisplay.ts`), `SHARE_DANGER_ACTION_CLASS`, `trackUiEvent`, `ROUTE_PAGE_HOME`.
- Produces:
  - `TenancyRequestRow(props: { standalone?: boolean })` — an `<li>` for the selector's and the profile's lists (wrapped in its own `<ul>` card when `standalone`): pending → dashed icon, requested name, "Requested {date} · waiting for an administrator" (amber), **Withdraw**; declined → "Declined {date}" and the message in quotes; approved → "Approved {date}" and **Switch to {display_name}**, hidden once that tenancy is the selected one; nothing otherwise.
  - `TenancyRequestNotice(props: { className?: string })` — the home's one line: "Your request for {name} is waiting for an administrator · Withdraw", or "Your request for {name} was approved · Switch to {display_name}"; nothing for a decline or no request.

- [ ] **Step 1: Write the failing test**

Create `components/Tenancy/__tests__/TenancyRequestStatus.test.tsx`:

```tsx
/** @jest-environment jsdom */
import { beforeEach, describe, expect, jest, test } from '@jest/globals';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';

const withdrawTenancyRequest = jest.fn() as any;
const mutate = jest.fn() as any;
const push = jest.fn() as any;
const setTenancySelected = jest.fn() as any;
let requestState: any;
let selected = "";

jest.mock("../../../gateways/BFFAPI", () => ({
    BFFAPI: jest.fn().mockImplementation(() => ({ withdrawTenancyRequest })),
}));
jest.mock("../../../hooks/UseTenancies", () => ({
    useLatestTenancyRequest: () => ({ state: requestState, mutate }),
}));
jest.mock("../../TenancyStore", () => ({
    useTenancyStore: (selector: (state: unknown) => unknown) => selector({ tenancySelected: selected, setTenancySelected }),
}));
jest.mock("next/router", () => ({ __esModule: true, default: { push: (...args: unknown[]) => push(...args) } }));
jest.mock("../../../lib/telemetryClient", () => ({ trackUiEvent: jest.fn() }));

import { TenancyRequestNotice, TenancyRequestRow } from "../TenancyRequestStatus";

const AMAZON = { path: "datamap/production/data-amazon", display_name: "Data Amazon", is_default: false, is_legacy: false };
const pending: any = {
    id: "r1", requested_name: "Data Amazon", reason: "SMPS data", status: "pending", tenancy: null, created_tenancy: false,
    decision_message: null, created_at: "2026-09-28T12:00:00+00:00", decided_at: null,
};
const declined: any = { ...pending, status: "declined", decision_message: "Ask Luciana to invite you from a dataset's Share dialog", decided_at: "2026-10-01T12:00:00+00:00" };
const approved: any = { ...pending, status: "approved", tenancy: AMAZON, decided_at: "2026-10-02T12:00:00+00:00" };

beforeEach(() => {
    selected = "datamap/production/public";
    withdrawTenancyRequest.mockReset();
});

describe("TenancyRequestRow", () => {
    test("a pending request waits for an administrator, with a dashed icon", () => {
        requestState = { kind: "pending", request: pending };
        const { container } = render(<ul><TenancyRequestRow /></ul>);

        expect(screen.getByText("Data Amazon")).toBeTruthy();
        expect(screen.getByText("Requested Sep 28 · waiting for an administrator")).toBeTruthy();
        expect(container.querySelector('[data-pending="true"]')).toBeTruthy();
    });

    test("Withdraw withdraws it and refreshes the list", async () => {
        requestState = { kind: "pending", request: pending };
        withdrawTenancyRequest.mockResolvedValue(undefined);
        render(<ul><TenancyRequestRow /></ul>);

        fireEvent.click(screen.getByRole("button", { name: "Withdraw" }));

        await waitFor(() => expect(mutate).toHaveBeenCalled());
        expect(withdrawTenancyRequest).toHaveBeenCalledWith("r1");
    });

    test("a recent decline shows its date and the administrator's message", () => {
        requestState = { kind: "declined", request: declined };
        render(<ul><TenancyRequestRow /></ul>);

        expect(screen.getByText("Declined Oct 1")).toBeTruthy();
        expect(screen.getByText("“Ask Luciana to invite you from a dataset's Share dialog”")).toBeTruthy();
    });

    test("an approval offers to switch to the tenancy", () => {
        requestState = { kind: "approved", request: approved };
        render(<ul><TenancyRequestRow /></ul>);

        fireEvent.click(screen.getByRole("button", { name: "Switch to Data Amazon" }));

        expect(setTenancySelected).toHaveBeenCalledWith(AMAZON.path);
        expect(push).toHaveBeenCalledWith("/app/home");
    });

    test("an approval is not offered once its tenancy is the one selected", () => {
        requestState = { kind: "approved", request: approved };
        selected = AMAZON.path;
        render(<ul><TenancyRequestRow /></ul>);

        expect(screen.queryByText("Data Amazon")).toBeNull();
    });

    test("no request, no row", () => {
        requestState = null;
        const { container } = render(<ul><TenancyRequestRow /></ul>);

        expect(container.querySelector("li")).toBeNull();
    });
});

describe("TenancyRequestNotice", () => {
    test("on the home, a pending request is one line with Withdraw", () => {
        requestState = { kind: "pending", request: pending };
        render(<TenancyRequestNotice />);

        expect(screen.getByText("Your request for Data Amazon is waiting for an administrator")).toBeTruthy();
        expect(screen.getByRole("button", { name: "Withdraw" })).toBeTruthy();
    });

    test("a decline is not repeated on the home", () => {
        requestState = { kind: "declined", request: declined };
        const { container } = render(<TenancyRequestNotice />);

        expect(container.innerHTML).toBe("");
    });
});
```

- [ ] **Step 2: Run it and watch it fail**

Run: `npx jest --coverage=false components/Tenancy/__tests__/TenancyRequestStatus.test.tsx`
Expected: FAIL — `Cannot find module '../TenancyRequestStatus'`.

- [ ] **Step 3: Implement**

Create `components/Tenancy/TenancyRequestStatus.tsx`:

```tsx
import Router from "next/router";
import { useState } from "react";
import { ROUTE_PAGE_HOME } from "../../contants/InternalRoutesConstants";
import { SHARE_DANGER_ACTION_CLASS } from "../../contants/ShareConstants";
import { tenancyErrorMessage } from "../../contants/TenancyConstants";
import { BFFAPI } from "../../gateways/BFFAPI";
import { useLatestTenancyRequest } from "../../hooks/UseTenancies";
import { formatShortDate } from "../../lib/embargoDisplay";
import { trackUiEvent } from "../../lib/telemetryClient";
import { LatestRequestState } from "../../lib/tenancyRequests";
import { useTenancyStore } from "../TenancyStore";
import { TenancyIcon } from "./TenancyIcon";

function useRequestActions() {
    const { state, mutate } = useLatestTenancyRequest();
    const tenancySelected = useTenancyStore((store) => store.tenancySelected);
    const setTenancySelected = useTenancyStore((store) => store.setTenancySelected);
    const [bffGateway] = useState(() => new BFFAPI());
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState<string | null>(null);

    async function withdraw(requestId: string) {
        setBusy(true);
        setError(null);
        try {
            await bffGateway.withdrawTenancyRequest(requestId);
            await mutate();
        } catch (e) {
            setError(tenancyErrorMessage(e?.response?.data?.detail));
        } finally {
            setBusy(false);
        }
    }

    function switchTo(path: string) {
        trackUiEvent("tenancy_switched");
        setTenancySelected(path);
        Router.push(ROUTE_PAGE_HOME);
    }

    const visible: LatestRequestState = state?.kind === "approved" && state.request.tenancy?.path === tenancySelected ? null : state;

    return { state: visible, busy, error, withdraw, switchTo };
}

export function TenancyRequestRow(props: { standalone?: boolean }) {
    const { state, busy, error, withdraw, switchTo } = useRequestActions();

    if (!state) {
        return null;
    }

    const { request } = state;
    const row = (
        <li className="flex items-center gap-4 px-4 py-4">
            <TenancyIcon pending={state.kind !== "approved"} />
            <span className="flex min-w-0 flex-1 flex-col">
                <span className="truncate text-[15px] font-semibold text-primary-900">
                    {state.kind === "approved" ? request.tenancy.display_name : request.requested_name}
                </span>
                {state.kind === "pending" &&
                    <span className="text-[13px] text-embargo-800">{`Requested ${formatShortDate(request.created_at, false)} · waiting for an administrator`}</span>}
                {state.kind === "declined" && <span className="text-[13px] text-primary-600">{`Declined ${formatShortDate(request.decided_at, false)}`}</span>}
                {state.kind === "declined" && request.decision_message &&
                    <span className="text-[13px] text-primary-500">{`“${request.decision_message}”`}</span>}
                {state.kind === "approved" && <span className="text-[13px] text-primary-600">{`Approved ${formatShortDate(request.decided_at, false)}`}</span>}
                {error && <span role="alert" className="text-[13px] text-danger-700">{error}</span>}
            </span>
            {state.kind === "pending" &&
                <button type="button" className={SHARE_DANGER_ACTION_CLASS} disabled={busy} onClick={() => withdraw(request.id)}>Withdraw</button>}
            {state.kind === "approved" &&
                <button type="button" className="btn-primary btn-small m-0" onClick={() => switchTo(request.tenancy.path)}>{`Switch to ${request.tenancy.display_name}`}</button>}
        </li>
    );

    return props.standalone
        ? <ul className="m-0 p-0 list-none rounded-lg border border-primary-200 bg-primary-0">{row}</ul>
        : row;
}

export function TenancyRequestNotice(props: { className?: string }) {
    const { state, busy, error, withdraw, switchTo } = useRequestActions();

    if (!state || state.kind === "declined") {
        return null;
    }

    const { request } = state;
    return (
        <div className={`flex flex-wrap items-center gap-x-2 gap-y-1 rounded-lg border border-primary-200 bg-primary-0 px-4 py-3 text-sm text-primary-700 ${props.className ?? ""}`}>
            <TenancyIcon pending={state.kind === "pending"} />
            {state.kind === "pending" ? (
                <>
                    <span>{`Your request for ${request.requested_name} is waiting for an administrator`}</span>
                    <span aria-hidden="true">·</span>
                    <button type="button" className={SHARE_DANGER_ACTION_CLASS} disabled={busy} onClick={() => withdraw(request.id)}>Withdraw</button>
                </>
            ) : (
                <>
                    <span>{`Your request for ${request.requested_name} was approved`}</span>
                    <span aria-hidden="true">·</span>
                    <button type="button" className="text-[13px] font-semibold text-primary-900 hover:underline underline-offset-2" onClick={() => switchTo(request.tenancy.path)}>
                        {`Switch to ${request.tenancy.display_name}`}
                    </button>
                </>
            )}
            {error && <span role="alert" className="w-full text-[13px] text-danger-700">{error}</span>}
        </div>
    );
}
```

- [ ] **Step 4: Run it**

Run: `npx jest --coverage=false components/Tenancy/__tests__/TenancyRequestStatus.test.tsx`
Expected: PASS (8 tests).

- [ ] **Step 5: Commit**

```bash
pwd
command git branch --show-current
command git add components/Tenancy/TenancyRequestStatus.tsx components/Tenancy/__tests__/TenancyRequestStatus.test.tsx
command git commit -m "feat: show where a tenancy request stands, with Withdraw and Switch" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 11: "You're not in any tenancy"

**Files:**
- Modify: `components/Tenancy/AccessPending.tsx`
- Test: `components/Tenancy/__tests__/AccessPending.test.tsx` (rewritten)

**Interfaces:**
- Produces: `AccessPending(props: { onRequestAccess(): void })`. Keeps the "Shared with me" link and the check-again button (`update()`, reload when tenancies arrived).

- [ ] **Step 1: Write the failing test**

Replace the whole of `components/Tenancy/__tests__/AccessPending.test.tsx` with:

```tsx
/**
 * @jest-environment jsdom
 */
import { describe, expect, jest, test, beforeEach } from '@jest/globals';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';

const update = jest.fn() as any;
const reload = jest.fn();

jest.mock("next-auth/react", () => ({
    useSession: () => ({ data: null, status: "authenticated", update }),
}));

jest.mock("next/router", () => ({
    __esModule: true,
    default: { reload: () => reload() },
}));

import { AccessPending } from "../AccessPending";

function checkAgain() {
    fireEvent.click(screen.getByRole("button", { name: "I already have access — check again" }));
}

describe("AccessPending", () => {

    beforeEach(() => {
        update.mockReset();
        reload.mockReset();
    });

    test("tells the person they are not in any tenancy", () => {
        render(<AccessPending onRequestAccess={jest.fn()} />);

        expect(screen.getByTestId("access-pending")).toBeTruthy();
        expect(screen.getByText("You're not in any tenancy")).toBeTruthy();
        expect(screen.getByText("Your account is not part of any tenancy, so there is nothing to work in yet. Ask for access to the group or project you work with; an administrator reviews it and you're emailed with the answer.")).toBeTruthy();
    });

    test("Request access opens the request form", () => {
        const onRequestAccess = jest.fn();
        render(<AccessPending onRequestAccess={onRequestAccess} />);

        fireEvent.click(screen.getByRole("button", { name: "Request access" }));

        expect(onRequestAccess).toHaveBeenCalledTimes(1);
    });

    test("re-reads the session instead of making the person sign out and in", async () => {
        update.mockResolvedValue({ user: { tenancies: [] } });
        render(<AccessPending onRequestAccess={jest.fn()} />);

        checkAgain();

        await waitFor(() => expect(update).toHaveBeenCalledTimes(1));
    });

    test("reloads once the access has actually been granted", async () => {
        update.mockResolvedValue({ user: { tenancies: ["datamap/production/public"] } });
        render(<AccessPending onRequestAccess={jest.fn()} />);

        checkAgain();

        await waitFor(() => expect(reload).toHaveBeenCalledTimes(1));
    });

    test("does not reload while there is still no access", async () => {
        update.mockResolvedValue({ user: { tenancies: [] } });
        render(<AccessPending onRequestAccess={jest.fn()} />);

        checkAgain();

        await waitFor(() => expect(update).toHaveBeenCalled());
        expect(reload).not.toHaveBeenCalled();
    });

    test("points to the datasets shared with the user", () => {
        render(<AccessPending onRequestAccess={jest.fn()} />);

        expect(screen.getByRole("link", { name: "Shared with me" }).getAttribute("href")).toBe("/app/datasets/shared");
    });
});
```

- [ ] **Step 2: Run it and watch it fail**

Run: `npx jest --coverage=false components/Tenancy/__tests__/AccessPending.test.tsx`
Expected: FAIL — "You're not in any tenancy" not found, no "Request access" button, and `onRequestAccess` is not a prop of `AccessPending` (type error).

- [ ] **Step 3: Implement**

In `components/Tenancy/AccessPending.tsx`, replace:

```tsx
/** Shown when the user is signed in but has no namespace yet. */
export function AccessPending() {
```

with:

```tsx
export function AccessPending(props: { onRequestAccess(): void }) {
```

and replace:

```tsx
            <h5 className="m-0">Your access is not set up yet</h5>
            <p className="text-sm text-primary-700 mt-2 mb-0">
                Your account was created, but it has not been added to any namespace.
                Someone from the Data Team needs to grant you access before you can
                see or upload data.
            </p>
            <p className="text-sm text-primary-700 mt-2 mb-0">
                Once they tell you it is done, use the button below — there is no need
                to sign out and back in.
            </p>
            <p className="text-sm text-primary-700 mt-2 mb-0">
                If a researcher shared a dataset with you, it is already in{" "}
                <Link href={ROUTE_PAGE_DATASETS_SHARED} className="text-sm font-semibold underline underline-offset-2">Shared with me</Link>.
            </p>
            <button
                type="button"
                onClick={checkAgain}
                disabled={checking}
                className="btn-primary m-0 mt-4"
            >
```

with:

```tsx
            <h5 className="m-0">You&apos;re not in any tenancy</h5>
            <p className="text-sm text-primary-700 mt-2 mb-0">
                Your account is not part of any tenancy, so there is nothing to work in yet. Ask for access to the group or project you work with; an administrator reviews it and you&apos;re emailed with the answer.
            </p>
            <button type="button" onClick={props.onRequestAccess} className="btn-primary m-0 mt-4">
                Request access
            </button>
            <p className="text-sm text-primary-700 mt-4 mb-0">
                If a researcher shared a dataset with you, it is already in{" "}
                <Link href={ROUTE_PAGE_DATASETS_SHARED} className="text-sm font-semibold underline underline-offset-2">Shared with me</Link>.
            </p>
            <button
                type="button"
                onClick={checkAgain}
                disabled={checking}
                className="btn-primary-outline m-0 mt-4"
            >
```

- [ ] **Step 4: Run it**

Run: `npx jest --coverage=false components/Tenancy/__tests__/AccessPending.test.tsx`
Expected: PASS (6 tests; the suite had 5). `pages/app/tenancy/index.tsx` still renders `<AccessPending />` without the prop until Task 12; `ts-jest` does not compile that page, and Task 12 replaces it before the type check in Task 20.

- [ ] **Step 5: Commit**

```bash
pwd
command git branch --show-current
command git add components/Tenancy/AccessPending.tsx components/Tenancy/__tests__/AccessPending.test.tsx
command git commit -m "feat: an account with no tenancy is offered to request access" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 12: The tenancy selector appears only with more than one tenancy

**Files:**
- Create: `components/Tenancy/TenancySelector.tsx`
- Modify: `pages/app/tenancy/index.tsx` (rewritten)
- Test: `components/Tenancy/__tests__/TenancySelector.test.tsx`

**Interfaces:**
- Consumes: `useMyTenancies`, `tenancySelectionFor`, `sessionTenanciesDiffer`, `firstNameOf`, `tenancyPathLabel`, `useSession().update`, `useTenancyStore`, `AccessPending`, `RequestAccessDialog`, `TenancyIcon`, `TenancyRequestRow`, `trackUiEvent("tenancy_switched")`.
- Produces: `TenancySelector()` — with exactly one tenancy it selects it and `Router.replace(ROUTE_PAGE_HOME)`; with more it lists them (design 1i: "Welcome, {first name}", "Choose the tenancy you want to work in.", rows with display name and path, the request row, "+ Request access to another tenancy"); with none it shows `AccessPending` and the request row. It calls `update()` when the session's tenancies differ from `/api/tenancies`, and clears a selected tenancy the user no longer has. `RequireSession` keeps selecting the only session tenancy when nothing is selected (`components/Auth/RequireSession.tsx`, unchanged here).

- [ ] **Step 1: Write the failing test**

Create `components/Tenancy/__tests__/TenancySelector.test.tsx`:

```tsx
/** @jest-environment jsdom */
import { beforeEach, describe, expect, jest, test } from '@jest/globals';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';

const update = jest.fn() as any;
const replace = jest.fn() as any;
const push = jest.fn() as any;
const setTenancySelected = jest.fn() as any;
let session: any;
let tenancies: any;
let selected = "";

jest.mock("next-auth/react", () => ({ useSession: () => ({ data: session, status: "authenticated", update }) }));
jest.mock("next/router", () => ({
    __esModule: true,
    default: {
        replace: (...args: unknown[]) => replace(...args),
        push: (...args: unknown[]) => push(...args),
        reload: jest.fn(),
    },
}));
jest.mock("../../TenancyStore", () => ({
    useTenancyStore: (selector: (state: unknown) => unknown) => selector({ tenancySelected: selected, setTenancySelected }),
}));
jest.mock("../../../hooks/UseTenancies", () => ({
    useMyTenancies: () => ({ data: tenancies, error: undefined }),
    useLatestTenancyRequest: () => ({ state: null, mutate: jest.fn() }),
}));
jest.mock("../../../gateways/BFFAPI", () => ({ BFFAPI: jest.fn().mockImplementation(() => ({})) }));
jest.mock("swr", () => ({ __esModule: true, default: jest.fn(), mutate: jest.fn() }));
jest.mock("../../../lib/telemetryClient", () => ({ trackUiEvent: jest.fn() }));

import { TenancySelector } from "../TenancySelector";

const PUBLIC = { path: "datamap/production/public", display_name: "Public", is_default: true, is_legacy: false };
const AMAZON = { path: "datamap/production/data-amazon", display_name: "Data Amazon", is_default: false, is_legacy: false };

beforeEach(() => {
    update.mockReset();
    replace.mockReset();
    push.mockReset();
    setTenancySelected.mockReset();
    selected = "";
    session = { user: { name: "Fernanda Lima", tenancies: [PUBLIC.path, AMAZON.path] } };
});

describe("TenancySelector", () => {
    test("with exactly one tenancy it is selected and the home opens, with no list", async () => {
        tenancies = [PUBLIC];
        session.user.tenancies = [PUBLIC.path];
        render(<TenancySelector />);

        await waitFor(() => expect(replace).toHaveBeenCalledWith("/app/home"));
        expect(setTenancySelected).toHaveBeenCalledWith(PUBLIC.path);
        expect(screen.queryByText("Choose the tenancy you want to work in.")).toBeNull();
    });

    test("with more than one, each tenancy is a row with its name and path, Public with the public icon", () => {
        tenancies = [PUBLIC, AMAZON];
        render(<TenancySelector />);

        expect(screen.getByRole("heading", { name: "Welcome, Fernanda" })).toBeTruthy();
        expect(screen.getByText("Choose the tenancy you want to work in.")).toBeTruthy();
        const publicRow = screen.getByRole("button", { name: /Public/ });
        expect(publicRow.textContent).toContain("datamap / production / public");
        expect(publicRow.querySelector("[data-icon]")?.getAttribute("data-icon")).toBe("public");
        expect(screen.getByRole("button", { name: /Data Amazon/ })).toBeTruthy();
    });

    test("picking a row selects it and opens the home", () => {
        tenancies = [PUBLIC, AMAZON];
        render(<TenancySelector />);

        fireEvent.click(screen.getByRole("button", { name: /Data Amazon/ }));

        expect(setTenancySelected).toHaveBeenCalledWith(AMAZON.path);
        expect(push).toHaveBeenCalledWith("/app/home");
    });

    test("with none, the page says so and offers to request access", () => {
        tenancies = [];
        session.user.tenancies = [];
        render(<TenancySelector />);

        expect(screen.getByText("You're not in any tenancy")).toBeTruthy();
        expect(screen.getByRole("button", { name: "Request access" })).toBeTruthy();
    });

    test("a session whose tenancies differ from the gatekeeper's is refreshed", () => {
        tenancies = [PUBLIC, AMAZON];
        session.user.tenancies = [PUBLIC.path];
        render(<TenancySelector />);

        expect(update).toHaveBeenCalledTimes(1);
    });

    test("a session that agrees is not refreshed", () => {
        tenancies = [PUBLIC, AMAZON];
        render(<TenancySelector />);

        expect(update).not.toHaveBeenCalled();
    });

    test("a selected tenancy the user no longer has is cleared", () => {
        tenancies = [PUBLIC, AMAZON];
        selected = "datamap/production/cerrado-flux";
        render(<TenancySelector />);

        expect(setTenancySelected).toHaveBeenCalledWith("");
    });

    test("the footer opens the request form", () => {
        tenancies = [PUBLIC, AMAZON];
        render(<TenancySelector />);

        fireEvent.click(screen.getByRole("button", { name: "+ Request access to another tenancy" }));

        expect(screen.getByRole("dialog", { name: "Request access" })).toBeTruthy();
    });
});
```

- [ ] **Step 2: Run it and watch it fail**

Run: `npx jest --coverage=false components/Tenancy/__tests__/TenancySelector.test.tsx`
Expected: FAIL — `Cannot find module '../TenancySelector'`.

- [ ] **Step 3: Implement**

Create `components/Tenancy/TenancySelector.tsx`:

```tsx
import { useSession } from "next-auth/react";
import Router from "next/router";
import { useEffect, useState } from "react";
import { MaterialSymbol } from "react-material-symbols";
import { ROUTE_PAGE_HOME } from "../../contants/InternalRoutesConstants";
import { useMyTenancies } from "../../hooks/UseTenancies";
import { trackUiEvent } from "../../lib/telemetryClient";
import { firstNameOf, sessionTenanciesDiffer, tenancyPathLabel, tenancySelectionFor } from "../../lib/tenancySelection";
import { useTenancyStore } from "../TenancyStore";
import { AccessPending } from "./AccessPending";
import { RequestAccessDialog } from "./RequestAccessDialog";
import { TenancyIcon } from "./TenancyIcon";
import { TenancyRequestRow } from "./TenancyRequestStatus";

export function TenancySelector() {
    const { data: session, update } = useSession();
    const tenancySelected = useTenancyStore((state) => state.tenancySelected);
    const setTenancySelected = useTenancyStore((state) => state.setTenancySelected);
    const { data: tenancies, error } = useMyTenancies();
    const [requesting, setRequesting] = useState(false);
    const selection = tenancies ? tenancySelectionFor(tenancies) : null;

    useEffect(() => {
        if (!tenancies) {
            return;
        }
        if (sessionTenanciesDiffer(session?.user?.tenancies, tenancies)) {
            update();
        }
        const next = tenancySelectionFor(tenancies);
        if (next.kind === "only") {
            setTenancySelected(next.path);
            Router.replace(ROUTE_PAGE_HOME);
        } else if (tenancySelected && !tenancies.some((tenancy) => tenancy.path === tenancySelected)) {
            setTenancySelected("");
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [tenancies]);

    function choose(path: string) {
        trackUiEvent("tenancy_switched");
        setTenancySelected(path);
        Router.push(ROUTE_PAGE_HOME);
    }

    const welcome = <h2 className="m-0">Welcome, {firstNameOf(session?.user?.name)}</h2>;

    if (error) {
        return (
            <>
                {welcome}
                <p role="alert" className="mt-2 mb-0 text-sm text-danger-700">Your tenancies could not be loaded. Reload the page to try again.</p>
            </>
        );
    }

    if (!selection || selection.kind === "only") {
        return <p className="m-0 text-sm text-primary-500">Loading your tenancies…</p>;
    }

    return (
        <>
            {welcome}
            {selection.kind === "none" ? (
                <div className="mt-8 flex flex-col gap-4">
                    <AccessPending onRequestAccess={() => setRequesting(true)} />
                    <TenancyRequestRow standalone />
                </div>
            ) : (
                <>
                    <p className="mt-2 mb-0 text-[15px] leading-[23px] text-primary-600">Choose the tenancy you want to work in.</p>
                    <ul className="mt-8 mb-0 p-0 list-none rounded-lg border border-primary-200 bg-primary-0 divide-y divide-primary-100 overflow-hidden">
                        {tenancies.map((tenancy) => (
                            <li key={tenancy.path}>
                                <button
                                    type="button"
                                    className="group flex w-full items-center gap-4 px-4 py-4 text-left hover:bg-primary-100"
                                    onClick={() => choose(tenancy.path)}
                                >
                                    <TenancyIcon tenancy={tenancy} />
                                    <span className="flex min-w-0 flex-1 flex-col">
                                        <span className="truncate text-[15px] font-semibold text-primary-900">{tenancy.display_name}</span>
                                        <span className="truncate font-mono text-xs text-primary-500">{tenancyPathLabel(tenancy.path)}</span>
                                    </span>
                                    <MaterialSymbol icon="chevron_right" size={20} weight={400} grade={-25} className="flex-none text-primary-400 group-hover:text-primary-900" />
                                </button>
                            </li>
                        ))}
                        <TenancyRequestRow />
                    </ul>
                    <button
                        type="button"
                        className="mt-4 p-0 border-0 bg-transparent text-sm font-semibold text-primary-900 hover:underline underline-offset-2"
                        onClick={() => setRequesting(true)}
                    >
                        + Request access to another tenancy
                    </button>
                </>
            )}
            <RequestAccessDialog show={requesting} onClose={() => setRequesting(false)} />
        </>
    );
}
```

Replace the whole of `pages/app/tenancy/index.tsx` with:

```tsx
import Link from "next/link";
import { Logo } from "../../../components/Brand/Logo";
import AvatarButton from "../../../components/Profile/AvatarButton";
import { TenancySelector } from "../../../components/Tenancy/TenancySelector";

export default function TenancySelectorPage() {
    return (
        <div className="absolute min-h-screen w-full top-0 z-50 left-0 bg-primary-50 flex flex-col overflow-y-auto">
            <header className="flex flex-none items-center justify-between h-16 px-4 md:px-8 border-b border-primary-200">
                <Link href="/" className="flex items-center">
                    <Logo />
                </Link>
                <AvatarButton />
            </header>
            <div className="flex justify-center w-full px-4 pt-16 pb-24">
                <div className="w-full max-w-[520px]">
                    <TenancySelector />
                </div>
            </div>
        </div>
    );
}

TenancySelectorPage.auth = {
    role: "admin",
    loading: <div>Tenancy selection loading...</div>,
};
```

- [ ] **Step 4: Run it, the page-walking tests and the session gate**

Run: `npx jest --coverage=false components/Tenancy contants/__tests__/TelemetryConstants.test.ts lib/__tests__/serverLogging.invariant.test.ts components/Auth`
Expected: PASS (8 new tests). `/app/tenancy` is still in `PAGES`.

- [ ] **Step 5: Commit**

```bash
pwd
command git branch --show-current
command git add components/Tenancy/TenancySelector.tsx pages/app/tenancy/index.tsx components/Tenancy/__tests__/TenancySelector.test.tsx
command git commit -m "feat: the tenancy selector appears only with more than one tenancy" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 13: The avatar menu

**Files:**
- Modify: `components/Profile/AvatarButton.tsx`
- Test: `components/Profile/__tests__/AvatarButton.test.tsx`

**Interfaces:**
- Consumes: `session.user.tenancies`, `RequestAccessDialog`.
- Produces: "Switch tenancy" only when the session has more than one tenancy; a "Request access to a tenancy" item that opens `RequestAccessDialog`.

- [ ] **Step 1: Write the failing test**

Create `components/Profile/__tests__/AvatarButton.test.tsx`:

```tsx
/** @jest-environment jsdom */
import { beforeEach, describe, expect, jest, test } from '@jest/globals';
import { fireEvent, render, screen } from '@testing-library/react';

const push = jest.fn() as any;
let session: any;

jest.mock("next-auth/react", () => ({
    useSession: () => ({ data: session, status: "authenticated" }),
    signOut: jest.fn(),
}));
jest.mock("next/router", () => ({ __esModule: true, default: { push: (...args: unknown[]) => push(...args) } }));
jest.mock("../../TenancyStore", () => ({
    useTenancyStore: (selector: (state: unknown) => unknown) => selector({ tenancySelected: "datamap/production/public" }),
}));
jest.mock("../../../gateways/BFFAPI", () => ({ BFFAPI: jest.fn().mockImplementation(() => ({})) }));
jest.mock("swr", () => ({ __esModule: true, default: jest.fn(), mutate: jest.fn() }));

import AvatarButton from "../AvatarButton";

function openMenu() {
    fireEvent.click(screen.getByRole("button", { name: "Account menu" }));
}

beforeEach(() => {
    push.mockReset();
    session = { user: { name: "Fernanda Lima", email: "fernanda@inpe.br", image: null, tenancies: ["datamap/production/public"] } };
});

describe("AvatarButton", () => {
    test("with one tenancy there is nothing to switch to, and access can be requested", () => {
        render(<AvatarButton />);
        openMenu();

        expect(screen.queryByRole("menuitem", { name: /Switch tenancy/ })).toBeNull();
        expect(screen.getByRole("menuitem", { name: /Request access to a tenancy/ })).toBeTruthy();
    });

    test("with more than one, Switch tenancy opens the selector", () => {
        session.user.tenancies = ["datamap/production/public", "datamap/production/data-amazon"];
        render(<AvatarButton />);
        openMenu();

        fireEvent.click(screen.getByRole("menuitem", { name: /Switch tenancy/ }));

        expect(push).toHaveBeenCalledWith("/app/tenancy");
    });

    test("Request access to a tenancy opens the form", () => {
        render(<AvatarButton />);
        openMenu();

        fireEvent.click(screen.getByRole("menuitem", { name: /Request access to a tenancy/ }));

        expect(screen.getByRole("dialog", { name: "Request access" })).toBeTruthy();
    });
});
```

- [ ] **Step 2: Run it and watch it fail**

Run: `npx jest --coverage=false components/Profile/__tests__/AvatarButton.test.tsx`
Expected: FAIL — "Switch tenancy" is shown with one tenancy and there is no "Request access to a tenancy" item.

- [ ] **Step 3: Implement**

In `components/Profile/AvatarButton.tsx`, replace:

```tsx
import useComponentVisible from "../../hooks/UseComponentVisible";
import { useTenancyStore } from "../TenancyStore";
```

with:

```tsx
import useComponentVisible from "../../hooks/UseComponentVisible";
import { RequestAccessDialog } from "../Tenancy/RequestAccessDialog";
import { useTenancyStore } from "../TenancyStore";
```

replace:

```tsx
  const { ref, isComponentVisible, setIsComponentVisible } = useComponentVisible(false);

  useEffect(() => {
```

with:

```tsx
  const { ref, isComponentVisible, setIsComponentVisible } = useComponentVisible(false);
  const [requesting, setRequesting] = useState(false);
  const canSwitch = (session?.user?.tenancies?.length ?? 0) > 1;

  function requestAccess() {
    setIsComponentVisible(false);
    setRequesting(true);
  }

  useEffect(() => {
```

replace:

```tsx
            <MenuItem icon="tenancy" text="Switch tenancy" onClick={() => go(ROUTE_PAGE_TENANCY_SELECTOR)} />
```

with:

```tsx
            {canSwitch && <MenuItem icon="tenancy" text="Switch tenancy" onClick={() => go(ROUTE_PAGE_TENANCY_SELECTOR)} />}
            <MenuItem icon="add" text="Request access to a tenancy" onClick={requestAccess} />
```

and replace:

```tsx
      )}
    </div>
  );
}

function Avatar(props
```

with:

```tsx
      )}
      <RequestAccessDialog show={requesting} onClose={() => setRequesting(false)} />
    </div>
  );
}

function Avatar(props
```

- [ ] **Step 4: Run it**

Run: `npx jest --coverage=false components/Profile`
Expected: PASS (3 tests).

- [ ] **Step 5: Commit**

```bash
pwd
command git branch --show-current
command git add components/Profile/AvatarButton.tsx components/Profile/__tests__/AvatarButton.test.tsx
command git commit -m "feat: the avatar menu offers to request access, and to switch only when there is a choice" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 14: Pending invitations on the home

**Files:**
- Create: `components/Tenancy/TenancyInvitationsPanel.tsx`
- Modify: `pages/app/home/index.tsx`
- Test: `components/Tenancy/__tests__/TenancyInvitationsPanel.test.tsx`

**Interfaces:**
- Consumes: `useTenancyInvitations`, `BFFAPI.acceptTenancyInvitation`, `BFFAPI.declineTenancyInvitation`, `useSession().update`, `useTenancyStore`, `TenancyIcon`, `TenancyRequestNotice`, `formatShortDate`, `tenancyErrorMessage`.
- Produces: `TenancyInvitationsPanel(props: { className?: string })` — one card per pending invitation (design 1j: `tenancy` icon, "{inviter} invited you to {tenancy}", "{n} datasets · from “{dataset}” · {date}", **Decline** / **Accept**; "As Reader" dropped). Accept: `acceptTenancyInvitation` → `update()` → `setTenancySelected(tenancy.path)` → revalidate → `Router.push(ROUTE_PAGE_HOME)`. Renders nothing without invitations.

- [ ] **Step 1: Write the failing test**

Create `components/Tenancy/__tests__/TenancyInvitationsPanel.test.tsx`:

```tsx
/** @jest-environment jsdom */
import { beforeEach, describe, expect, jest, test } from '@jest/globals';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';

const acceptTenancyInvitation = jest.fn() as any;
const declineTenancyInvitation = jest.fn() as any;
const update = jest.fn() as any;
const mutate = jest.fn() as any;
const push = jest.fn() as any;
const setTenancySelected = jest.fn() as any;
let invitations: any;
let calls: string[];

jest.mock("../../../gateways/BFFAPI", () => ({
    BFFAPI: jest.fn().mockImplementation(() => ({ acceptTenancyInvitation, declineTenancyInvitation })),
}));
jest.mock("../../../hooks/UseTenancies", () => ({
    useTenancyInvitations: () => ({ data: invitations, mutate }),
}));
jest.mock("next-auth/react", () => ({ useSession: () => ({ data: { user: {} }, update }) }));
jest.mock("../../TenancyStore", () => ({
    useTenancyStore: (selector: (state: unknown) => unknown) => selector({ setTenancySelected }),
}));
jest.mock("next/router", () => ({ __esModule: true, default: { push: (...args: unknown[]) => push(...args) } }));

import { TenancyInvitationsPanel } from "../TenancyInvitationsPanel";

const AMAZON = { path: "datamap/production/data-amazon", display_name: "Data Amazon", is_default: false, is_legacy: false };
const invitation = {
    id: "ti1",
    tenancy: AMAZON,
    invited_by: { id: "o", name: "Luciana Rizzo" },
    dataset: { id: "d1", name: "GoAmazon 2014/5 — Aerosol size distribution" },
    datasets: 108,
    created_at: "2026-10-04T09:50:00+00:00",
};

beforeEach(() => {
    calls = [];
    invitations = [invitation];
    acceptTenancyInvitation.mockReset().mockImplementation(async () => { calls.push("accept"); return { tenancy: AMAZON }; });
    declineTenancyInvitation.mockReset();
    update.mockReset().mockImplementation(async () => { calls.push("update"); });
    setTenancySelected.mockReset().mockImplementation(() => { calls.push("select"); });
    push.mockReset().mockImplementation(() => { calls.push("push"); });
    mutate.mockReset();
});

describe("TenancyInvitationsPanel", () => {
    test("one card per invitation, with who, where, how many datasets and from which", () => {
        render(<TenancyInvitationsPanel />);

        expect(screen.getByText("Luciana Rizzo invited you to Data Amazon")).toBeTruthy();
        expect(screen.getByText("108 datasets · from “GoAmazon 2014/5 — Aerosol size distribution” · Oct 4")).toBeTruthy();
    });

    test("Accept joins, refreshes the session, selects the tenancy and opens the home, in that order", async () => {
        render(<TenancyInvitationsPanel />);

        fireEvent.click(screen.getByRole("button", { name: "Accept" }));

        await waitFor(() => expect(push).toHaveBeenCalledWith("/app/home"));
        expect(acceptTenancyInvitation).toHaveBeenCalledWith("ti1");
        expect(setTenancySelected).toHaveBeenCalledWith(AMAZON.path);
        expect(calls).toEqual(["accept", "update", "select", "push"]);
        expect(mutate).toHaveBeenCalled();
    });

    test("Decline declines and refreshes the list", async () => {
        declineTenancyInvitation.mockResolvedValue(undefined);
        render(<TenancyInvitationsPanel />);

        fireEvent.click(screen.getByRole("button", { name: "Decline" }));

        await waitFor(() => expect(mutate).toHaveBeenCalled());
        expect(declineTenancyInvitation).toHaveBeenCalledWith("ti1");
        expect(update).not.toHaveBeenCalled();
    });

    test("an invitation that is gone says so", async () => {
        acceptTenancyInvitation.mockReset().mockRejectedValue({ response: { status: 404, data: { detail: "invitation_not_found" } } });
        render(<TenancyInvitationsPanel />);

        fireEvent.click(screen.getByRole("button", { name: "Accept" }));

        await waitFor(() => expect(screen.getByRole("alert").textContent).toBe("This invitation is no longer open. It may have been withdrawn."));
        expect(push).not.toHaveBeenCalled();
    });

    test("without invitations nothing is shown", () => {
        invitations = [];
        const { container } = render(<TenancyInvitationsPanel />);

        expect(container.innerHTML).toBe("");
    });

    test("an invitation without an inviter or a dataset still reads well", () => {
        invitations = [{ ...invitation, invited_by: null, dataset: null, datasets: 1 }];
        render(<TenancyInvitationsPanel />);

        expect(screen.getByText("You were invited to Data Amazon")).toBeTruthy();
        expect(screen.getByText("1 dataset · Oct 4")).toBeTruthy();
    });
});
```

- [ ] **Step 2: Run it and watch it fail**

Run: `npx jest --coverage=false components/Tenancy/__tests__/TenancyInvitationsPanel.test.tsx`
Expected: FAIL — `Cannot find module '../TenancyInvitationsPanel'`.

- [ ] **Step 3: Implement**

Create `components/Tenancy/TenancyInvitationsPanel.tsx`:

```tsx
import { useSession } from "next-auth/react";
import Router from "next/router";
import { useState } from "react";
import { ROUTE_PAGE_HOME } from "../../contants/InternalRoutesConstants";
import { tenancyErrorMessage } from "../../contants/TenancyConstants";
import { BFFAPI } from "../../gateways/BFFAPI";
import { useTenancyInvitations } from "../../hooks/UseTenancies";
import { formatShortDate } from "../../lib/embargoDisplay";
import { TenancyInvitation } from "../../types/GatekeeperAPI";
import { useTenancyStore } from "../TenancyStore";
import { TenancyIcon } from "./TenancyIcon";

function invitationTitle(invitation: TenancyInvitation): string {
    return invitation.invited_by
        ? `${invitation.invited_by.name} invited you to ${invitation.tenancy.display_name}`
        : `You were invited to ${invitation.tenancy.display_name}`;
}

function invitationDetail(invitation: TenancyInvitation): string {
    return [
        `${invitation.datasets} ${invitation.datasets === 1 ? "dataset" : "datasets"}`,
        invitation.dataset ? `from “${invitation.dataset.name}”` : "",
        formatShortDate(invitation.created_at, false),
    ].filter(Boolean).join(" · ");
}

export function TenancyInvitationsPanel(props: { className?: string }) {
    const { data: invitations, mutate } = useTenancyInvitations();
    const { update } = useSession();
    const setTenancySelected = useTenancyStore((state) => state.setTenancySelected);
    const [bffGateway] = useState(() => new BFFAPI());
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState<string | null>(null);

    if (!invitations || invitations.length === 0) {
        return null;
    }

    async function accept(invitation: TenancyInvitation) {
        setBusy(true);
        setError(null);
        try {
            const { tenancy } = await bffGateway.acceptTenancyInvitation(invitation.id);
            await update();
            setTenancySelected(tenancy.path);
            await mutate();
            Router.push(ROUTE_PAGE_HOME);
        } catch (e) {
            setError(tenancyErrorMessage(e?.response?.data?.detail));
        } finally {
            setBusy(false);
        }
    }

    async function decline(invitation: TenancyInvitation) {
        setBusy(true);
        setError(null);
        try {
            await bffGateway.declineTenancyInvitation(invitation.id);
            await mutate();
        } catch (e) {
            setError(tenancyErrorMessage(e?.response?.data?.detail));
        } finally {
            setBusy(false);
        }
    }

    return (
        <section aria-label="Invitations to tenancies" className={`flex flex-col gap-3 ${props.className ?? ""}`}>
            {invitations.map((invitation) => (
                <div key={invitation.id} className="flex flex-wrap items-center gap-4 rounded-lg border border-primary-200 bg-primary-0 px-4 py-3.5">
                    <TenancyIcon tenancy={invitation.tenancy} />
                    <span className="flex min-w-0 flex-1 flex-col">
                        <span className="text-sm font-semibold text-primary-900">{invitationTitle(invitation)}</span>
                        <span className="text-[13px] text-primary-500">{invitationDetail(invitation)}</span>
                    </span>
                    <span className="flex flex-none gap-2">
                        <button type="button" className="btn-primary-outline btn-small m-0" disabled={busy} onClick={() => decline(invitation)}>Decline</button>
                        <button type="button" className="btn-primary btn-small m-0" disabled={busy} onClick={() => accept(invitation)}>Accept</button>
                    </span>
                </div>
            ))}
            {error && <p role="alert" className="m-0 text-sm text-danger-700">{error}</p>}
        </section>
    );
}
```

In `pages/app/home/index.tsx`, replace:

```tsx
import LoggedLayout from '../../../components/LoggedLayout';
```

with:

```tsx
import LoggedLayout from '../../../components/LoggedLayout';
import { TenancyInvitationsPanel } from '../../../components/Tenancy/TenancyInvitationsPanel';
import { TenancyRequestNotice } from '../../../components/Tenancy/TenancyRequestStatus';
```

and replace:

```tsx
                <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
```

with:

```tsx
                <TenancyInvitationsPanel className="mt-8" />
                <TenancyRequestNotice className="mt-4" />

                <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
```

- [ ] **Step 4: Run it**

Run: `npx jest --coverage=false components/Tenancy/__tests__/TenancyInvitationsPanel.test.tsx`
Expected: PASS (6 tests).

- [ ] **Step 5: Commit**

```bash
pwd
command git branch --show-current
command git add components/Tenancy/TenancyInvitationsPanel.tsx pages/app/home/index.tsx components/Tenancy/__tests__/TenancyInvitationsPanel.test.tsx
command git commit -m "feat: accept or decline tenancy invitations from the home" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 15: The profile's Tenancies section

**Files:**
- Create: `components/Tenancy/ProfileTenancies.tsx`
- Modify: `pages/app/profile/index.tsx`
- Test: `components/Tenancy/__tests__/ProfileTenancies.test.tsx`

**Interfaces:**
- Consumes: `useMyTenancies`, `useTenancyStore`, `TenancyIcon`, `TenancyRequestRow`, `RequestAccessDialog`, `PUBLIC_TENANCY_NOTE`, `ROUTE_PAGE_TENANCY_SELECTOR`, `TenancyInvitationsPanel`.
- Produces: `ProfileTenancies()` — rows with display name and path, "Everyone is in public" under Public, "Current" on the selected one, the request row, **Request access**, and **Switch tenancy** only with more than one. The profile also shows the invitations panel above its sections.

- [ ] **Step 1: Write the failing test**

Create `components/Tenancy/__tests__/ProfileTenancies.test.tsx`:

```tsx
/** @jest-environment jsdom */
import { beforeEach, describe, expect, jest, test } from '@jest/globals';
import { fireEvent, render, screen } from '@testing-library/react';

const push = jest.fn() as any;
let tenancies: any;

jest.mock("../../../hooks/UseTenancies", () => ({
    useMyTenancies: () => ({ data: tenancies, error: undefined }),
    useLatestTenancyRequest: () => ({ state: null, mutate: jest.fn() }),
}));
jest.mock("../../TenancyStore", () => ({
    useTenancyStore: (selector: (state: unknown) => unknown) => selector({ tenancySelected: "datamap/production/data-amazon", setTenancySelected: jest.fn() }),
}));
jest.mock("next/router", () => ({ __esModule: true, default: { push: (...args: unknown[]) => push(...args) } }));
jest.mock("../../../gateways/BFFAPI", () => ({ BFFAPI: jest.fn().mockImplementation(() => ({})) }));
jest.mock("swr", () => ({ __esModule: true, default: jest.fn(), mutate: jest.fn() }));
jest.mock("../../../lib/telemetryClient", () => ({ trackUiEvent: jest.fn() }));

import { ProfileTenancies } from "../ProfileTenancies";

const PUBLIC = { path: "datamap/production/public", display_name: "Public", is_default: true, is_legacy: false };
const AMAZON = { path: "datamap/production/data-amazon", display_name: "Data Amazon", is_default: false, is_legacy: false };

beforeEach(() => {
    push.mockReset();
});

describe("ProfileTenancies", () => {
    test("lists display names and paths, marks Public and the current tenancy", () => {
        tenancies = [PUBLIC, AMAZON];
        render(<ProfileTenancies />);

        expect(screen.getByText("Public")).toBeTruthy();
        expect(screen.getByText("Everyone is in public")).toBeTruthy();
        expect(screen.getByText("Data Amazon")).toBeTruthy();
        expect(screen.getByText("datamap/production/data-amazon")).toBeTruthy();
        expect(screen.getByText("Current").closest("li")?.textContent).toContain("Data Amazon");
    });

    test("with more than one tenancy, Switch tenancy opens the selector", () => {
        tenancies = [PUBLIC, AMAZON];
        render(<ProfileTenancies />);

        fireEvent.click(screen.getByRole("button", { name: /Switch tenancy/ }));

        expect(push).toHaveBeenCalledWith("/app/tenancy");
    });

    test("with one, there is no Switch tenancy", () => {
        tenancies = [PUBLIC];
        render(<ProfileTenancies />);

        expect(screen.queryByRole("button", { name: /Switch tenancy/ })).toBeNull();
    });

    test("Request access opens the form", () => {
        tenancies = [PUBLIC];
        render(<ProfileTenancies />);

        fireEvent.click(screen.getByRole("button", { name: /Request access/ }));

        expect(screen.getByRole("dialog", { name: "Request access" })).toBeTruthy();
    });
});
```

- [ ] **Step 2: Run it and watch it fail**

Run: `npx jest --coverage=false components/Tenancy/__tests__/ProfileTenancies.test.tsx`
Expected: FAIL — `Cannot find module '../ProfileTenancies'`.

- [ ] **Step 3: Implement**

Create `components/Tenancy/ProfileTenancies.tsx`:

```tsx
import Router from "next/router";
import { useState } from "react";
import { MaterialSymbol } from "react-material-symbols";
import { ROUTE_PAGE_TENANCY_SELECTOR } from "../../contants/InternalRoutesConstants";
import { PUBLIC_TENANCY_NOTE } from "../../contants/TenancyConstants";
import { useMyTenancies } from "../../hooks/UseTenancies";
import { useTenancyStore } from "../TenancyStore";
import { RequestAccessDialog } from "./RequestAccessDialog";
import { TenancyIcon } from "./TenancyIcon";
import { TenancyRequestRow } from "./TenancyRequestStatus";

export function ProfileTenancies() {
    const { data: tenancies, error } = useMyTenancies();
    const tenancySelected = useTenancyStore((state) => state.tenancySelected);
    const [requesting, setRequesting] = useState(false);
    const canSwitch = (tenancies?.length ?? 0) > 1;

    return (
        <>
            {error && <p role="alert" className="m-0 px-4 py-3 text-sm text-danger-700">Your tenancies could not be loaded.</p>}
            {!tenancies && !error && <p className="m-0 px-4 py-3 text-sm text-primary-500">Loading…</p>}
            {tenancies &&
                <ul className="m-0 p-0 list-none divide-y divide-primary-100">
                    {tenancies.length === 0 && <li className="px-4 py-3 text-sm italic text-primary-500">You are not in any tenancy yet.</li>}
                    {tenancies.map((tenancy) => (
                        <li key={tenancy.path} className="flex items-center justify-between gap-4 px-4 py-3">
                            <span className="flex items-center gap-3 min-w-0">
                                <TenancyIcon tenancy={tenancy} />
                                <span className="flex min-w-0 flex-col">
                                    <span className="truncate text-sm font-semibold text-primary-900">{tenancy.display_name}</span>
                                    <span className="truncate font-mono text-xs text-primary-500">{tenancy.path}</span>
                                    {tenancy.is_default && <span className="text-xs text-primary-500">{PUBLIC_TENANCY_NOTE}</span>}
                                </span>
                            </span>
                            {tenancy.path === tenancySelected &&
                                <span className="flex-none px-2.5 py-[3px] rounded-full bg-secondary-500 text-xs font-semibold text-primary-900">Current</span>}
                        </li>
                    ))}
                    <TenancyRequestRow />
                </ul>
            }
            <div className="flex justify-end gap-2 border-t border-primary-100 px-4 py-3">
                <button type="button" className="btn-primary-outline btn-small m-0 flex items-center gap-2" onClick={() => setRequesting(true)}>
                    <MaterialSymbol icon="add" size={18} weight={400} grade={-25} />
                    Request access
                </button>
                {canSwitch &&
                    <button type="button" className="btn-primary-outline btn-small m-0 flex items-center gap-2" onClick={() => Router.push(ROUTE_PAGE_TENANCY_SELECTOR)}>
                        <MaterialSymbol icon="swap_horiz" size={18} weight={400} grade={-25} />
                        Switch tenancy
                    </button>}
            </div>
            <RequestAccessDialog show={requesting} onClose={() => setRequesting(false)} />
        </>
    );
}
```

In `pages/app/profile/index.tsx`, replace:

```tsx
import LoggedLayout from "../../../components/LoggedLayout";
```

with:

```tsx
import LoggedLayout from "../../../components/LoggedLayout";
import { ProfileTenancies } from "../../../components/Tenancy/ProfileTenancies";
import { TenancyInvitationsPanel } from "../../../components/Tenancy/TenancyInvitationsPanel";
```

replace:

```tsx
import { MaterialSymbol } from "react-material-symbols";
import { useTenancyStore } from "../../../components/TenancyStore";
import { ORCID_LINK_OUTCOME_PARAM } from "../../../contants/AccountConstants";
import { ROUTE_PAGE_ERROR, ROUTE_PAGE_TENANCY_SELECTOR } from "../../../contants/InternalRoutesConstants";
```

with:

```tsx
import { MaterialSymbol } from "react-material-symbols";
import { ORCID_LINK_OUTCOME_PARAM } from "../../../contants/AccountConstants";
import { ROUTE_PAGE_ERROR } from "../../../contants/InternalRoutesConstants";
```

replace:

```tsx
  const { data: session, status } = useSession();
  const tenancySelected = useTenancyStore((state) => state.tenancySelected)
  const { query } = useRouter();
```

with:

```tsx
  const { data: session, status } = useSession();
  const { query } = useRouter();
```

replace:

```tsx
    const user = props?.data;
    const tenancies: string[] = user?.tenancies ?? [];
```

with:

```tsx
    const user = props?.data;
```

replace:

```tsx
          <div className="mt-10 grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_300px] gap-10 items-start">
```

with:

```tsx
          <TenancyInvitationsPanel className="mt-8" />

          <div className="mt-10 grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_300px] gap-10 items-start">
```

and replace:

```tsx
              <ProfileSection title="Tenancies" description="The namespaces you can work in. Datasets and notebooks belong to the selected one.">
                {tenancies.length > 0 ? (
                  <ul className="divide-y divide-primary-100">
                    {tenancies.map((tenancy) => {
                      const current = tenancy === tenancySelected;
                      return (
                        <li key={tenancy} className="flex items-center justify-between gap-4 px-4 h-12">
                          <span className="flex items-center gap-3 min-w-0">
                            <MaterialSymbol icon="tenancy" size={20} weight={400} grade={-25} className="flex-none text-primary-500" />
                            <span className="truncate font-mono text-[13px] text-primary-900">{tenancy}</span>
                          </span>
                          {current && <span className="flex-none px-2.5 py-[3px] rounded-full bg-secondary-500 text-xs font-semibold text-primary-900">Current</span>}
                        </li>
                      );
                    })}
                  </ul>
                ) : (
                  <p className="m-0 px-4 py-3 text-sm italic text-primary-500">No tenancy set for this user yet.</p>
                )}
                <div className="flex justify-end border-t border-primary-100 px-4 py-3">
                  <button className="btn-primary-outline btn-small m-0 flex items-center gap-2" onClick={() => Router.push(ROUTE_PAGE_TENANCY_SELECTOR)}>
                    <MaterialSymbol icon="swap_horiz" size={18} weight={400} grade={-25} />
                    Switch tenancy
                  </button>
                </div>
              </ProfileSection>
```

with:

```tsx
              <ProfileSection title="Tenancies" description="The tenancies you can work in. Datasets and notebooks belong to the selected one.">
                <ProfileTenancies />
              </ProfileSection>
```

`Router` stays imported: the page still calls `Router.replace(ROUTE_PAGE_ERROR(props.error))`. `MaterialSymbol` stays imported: the sign-out button uses it.

- [ ] **Step 4: Run it**

Run: `npx jest --coverage=false components/Tenancy/__tests__/ProfileTenancies.test.tsx lib/__tests__/serverLogging.invariant.test.ts`
Expected: PASS (4 new tests).

- [ ] **Step 5: Commit**

```bash
pwd
command git branch --show-current
command git add components/Tenancy/ProfileTenancies.tsx pages/app/profile/index.tsx components/Tenancy/__tests__/ProfileTenancies.test.tsx
command git commit -m "feat: the profile lists tenancies by name, the request and the invitations" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 16: Nobody is offered "members can edit" in Public; new datasets start read-only for members

**Files:**
- Modify: `lib/membersAccess.ts` (rewritten)
- Modify: `components/Share/ShareDialog.tsx`
- Modify: `components/Embargo/AccessSummary.tsx`
- Modify: `components/Embargo/EmbargoChoice.tsx`
- Modify: `components/Embargo/EmbargoFields.tsx`
- Modify: `components/Embargo/SetEmbargoDialog.tsx`
- Modify: `pages/app/datasets/new.tsx`
- Test: `lib/__tests__/membersAccessPublic.test.ts`, `components/Embargo/__tests__/EmbargoChoicePublic.test.tsx`

**Interfaces:**
- Consumes: `isDefaultTenancy`, `PUBLIC_MEMBERS_DETAIL`, `PUBLIC_DATASET_HINT`; `ShareTenancy.is_default` (Task 3).
- Produces: `membersCanEditOf` is `false` for a dataset in Public whatever the column or the share state says; `canChangeMembersAccess` is `false` in Public; `membersAccessDetail` takes `everyone?: boolean` and answers "Everyone on DataMap · can read" outside an embargo; `EmbargoChoice` takes `isPublic?: boolean` (Public hint, no members toggle); `EmbargoFields` takes `membersEditable?: boolean` (default `true`); the new-dataset form starts with `membersCanEdit: false` and assumes the server default is `false`.

- [ ] **Step 1: Write the failing tests**

Create `lib/__tests__/membersAccessPublic.test.ts`:

```ts
import { describe, expect, test } from '@jest/globals';
import { DEFAULT_TENANCY } from "../../contants/TenancyConstants";
import { canChangeMembersAccess, membersAccessDetail, membersCanEditOf } from "../membersAccess";

describe("members of Public", () => {
    test("never edit a public dataset, whatever the column or the share state says", () => {
        expect(membersCanEditOf({ tenancy: DEFAULT_TENANCY, members_can_edit: true } as any)).toBe(false);
        expect(membersCanEditOf({ tenancy: DEFAULT_TENANCY } as any, { tenancy: { members_can_edit: true } } as any)).toBe(false);
    });

    test("the share state saying the tenancy is the default one is enough", () => {
        expect(membersCanEditOf({} as any, { tenancy: { is_default: true, members_can_edit: true } } as any)).toBe(false);
    });

    test("the owner of a public dataset has nothing to change; elsewhere the owner still does", () => {
        expect(canChangeMembersAccess({ tenancy: DEFAULT_TENANCY, access: { level: "owner" } } as any)).toBe(false);
        expect(canChangeMembersAccess({ tenancy: "datamap/production/data-amazon", access: { level: "owner" } } as any)).toBe(true);
    });

    test("the row reads Everyone on DataMap, and an embargo still says what comes after", () => {
        expect(membersAccessDetail({ membersCanEdit: false, embargoActive: false, members: 47, everyone: true })).toBe("Everyone on DataMap · can read");
        expect(membersAccessDetail({ membersCanEdit: false, embargoActive: true, everyone: true })).toBe("No access during the embargo · afterwards: read only");
    });
});
```

Create `components/Embargo/__tests__/EmbargoChoicePublic.test.tsx`:

```tsx
/** @jest-environment jsdom */
import { describe, expect, test } from '@jest/globals';
import { act, render, screen } from '@testing-library/react';
import { Form, Formik } from "formik";
import { EmbargoChoice } from "../EmbargoChoice";

function renderChoice(isPublic: boolean) {
    render(
        <Formik initialValues={{ embargoMode: "none", embargoUntil: "", embargoNote: "", membersCanEdit: false }} onSubmit={() => undefined}>
            <Form><EmbargoChoice tenancyName={isPublic ? "Public" : "Data Amazon"} isPublic={isPublic} /></Form>
        </Formik>
    );
}

async function underEmbargo() {
    await act(async () => {
        screen.getByRole("radio", { name: /Under embargo/ }).click();
    });
}

describe("EmbargoChoice in Public", () => {
    test("open means every account reads it and only the people shared with edit", () => {
        renderChoice(true);

        expect(screen.getByText("Visible to every DataMap account; only you and people you share with can edit")).toBeTruthy();
        expect(screen.queryByText("Every member of Public can read and download the files.")).toBeNull();
    });

    test("under embargo there is no members toggle, and afterwards members read only", async () => {
        renderChoice(true);

        await underEmbargo();

        expect(screen.getByText("When the embargo ends, members of Public can read but not edit.")).toBeTruthy();
        expect(screen.queryByRole("button", { name: "Change what members of Public can do" })).toBeNull();
    });

    test("in another tenancy a new dataset starts read-only for members, and the toggle stays", async () => {
        renderChoice(false);

        await underEmbargo();

        expect(screen.getByText("When the embargo ends, members of Data Amazon can read but not edit.")).toBeTruthy();
        expect(screen.getByRole("button", { name: "Change what members of Data Amazon can do" })).toBeTruthy();
    });
});
```

- [ ] **Step 2: Run them and watch them fail**

Run: `npx jest --coverage=false lib/__tests__/membersAccessPublic.test.ts components/Embargo/__tests__/EmbargoChoicePublic.test.tsx`
Expected: FAIL — `membersCanEditOf` answers `true` for Public, `everyone` is not a known option (type error), `isPublic` is not a prop of `EmbargoChoice` (type error).

- [ ] **Step 3: Implement**

Replace the whole of `lib/membersAccess.ts` with:

```ts
import { PUBLIC_MEMBERS_DETAIL, isDefaultTenancy } from "../contants/TenancyConstants";
import { GetDatasetDetailsResponse } from "../types/BffAPI";
import { ShareState } from "../types/GatekeeperAPI";

function inPublic(dataset: GetDatasetDetailsResponse, state?: ShareState | null): boolean {
    return isDefaultTenancy(dataset?.tenancy ?? "") || state?.tenancy?.is_default === true;
}

export function membersCanEditOf(dataset: GetDatasetDetailsResponse, state?: ShareState | null): boolean {
    if (inPublic(dataset, state)) {
        return false;
    }
    if (state?.tenancy) {
        return state.tenancy.members_can_edit !== false;
    }
    return dataset?.members_can_edit !== false;
}

export function canChangeMembersAccess(dataset: GetDatasetDetailsResponse): boolean {
    return dataset?.access?.level === "owner" && !isDefaultTenancy(dataset?.tenancy ?? "");
}

export function membersAccessDetail(options: { membersCanEdit: boolean, embargoActive: boolean, members?: number | null, everyone?: boolean }): string {
    if (options.embargoActive) {
        return `No access during the embargo · afterwards: ${options.membersCanEdit ? "read and edit" : "read only"}`;
    }
    if (options.everyone) {
        return PUBLIC_MEMBERS_DETAIL;
    }
    const what = options.membersCanEdit ? "can read and edit" : "can read · editing limited to the people above";
    if (options.members === undefined || options.members === null) {
        return what;
    }
    return `${options.members} ${options.members === 1 ? "person" : "people"} · ${what}`;
}

export function membersAfterEmbargoLine(tenancyName: string, membersCanEdit: boolean): string {
    return membersCanEdit
        ? `When the embargo ends, members of ${tenancyName} can read and edit again.`
        : `When the embargo ends, members of ${tenancyName} can read but not edit.`;
}

export function membersOutcomeSentence(tenancyName: string, membersCanEdit: boolean): string {
    return membersCanEdit
        ? `Members of ${tenancyName} can read and edit this dataset again; the people you shared it with keep their access.`
        : `Members of ${tenancyName} can read this dataset; editing stays with the people you shared it with.`;
}
```

In `components/Share/ShareDialog.tsx`, replace:

```tsx
import { fetcher } from "../../lib/fetcher";
```

with:

```tsx
import { fetcher } from "../../lib/fetcher";
import { isDefaultTenancy } from "../../contants/TenancyConstants";
```

and replace:

```tsx
            detail: membersAccessDetail({ membersCanEdit, embargoActive, members: state?.tenancy?.members ?? null }),
```

with:

```tsx
            detail: membersAccessDetail({ membersCanEdit, embargoActive, members: state?.tenancy?.members ?? null, everyone: isDefaultTenancy(props.dataset.tenancy ?? "") }),
```

In `components/Embargo/AccessSummary.tsx`, replace:

```tsx
import { fetcher } from "../../lib/fetcher";
```

with:

```tsx
import { fetcher } from "../../lib/fetcher";
import { isDefaultTenancy } from "../../contants/TenancyConstants";
```

and replace:

```tsx
                            {membersAccessDetail({ membersCanEdit, embargoActive, members: state.tenancy?.members ?? null })}
```

with:

```tsx
                            {membersAccessDetail({ membersCanEdit, embargoActive, members: state.tenancy?.members ?? null, everyone: isDefaultTenancy(props.dataset.tenancy ?? "") })}
```

In `components/Embargo/EmbargoChoice.tsx`, replace:

```tsx
import { EmbargoFields } from "./EmbargoFields";
```

with:

```tsx
import { PUBLIC_DATASET_HINT } from "../../contants/TenancyConstants";
import { EmbargoFields } from "./EmbargoFields";
```

replace:

```tsx
export function EmbargoChoice(props: { tenancyName: string, disabled?: boolean, statusLine?: string | null }) {
```

with:

```tsx
export function EmbargoChoice(props: { tenancyName: string, disabled?: boolean, statusLine?: string | null, isPublic?: boolean }) {
```

replace:

```tsx
        { embargo: false, label: "Open to the workspace", hint: `Every member of ${props.tenancyName} can read and download the files.` },
```

with:

```tsx
        { embargo: false, label: "Open to the workspace", hint: props.isPublic ? PUBLIC_DATASET_HINT : `Every member of ${props.tenancyName} can read and download the files.` },
```

and replace:

```tsx
                                    <EmbargoFields tenancyName={props.tenancyName} disabled={props.disabled} />
```

with:

```tsx
                                    <EmbargoFields tenancyName={props.tenancyName} disabled={props.disabled} membersEditable={!props.isPublic} />
```

In `components/Embargo/EmbargoFields.tsx`, replace:

```tsx
export function EmbargoFields(props: { tenancyName: string, disabled?: boolean }) {
```

with:

```tsx
export function EmbargoFields(props: { tenancyName: string, disabled?: boolean, membersEditable?: boolean }) {
```

and replace:

```tsx
                {membersAfterEmbargoLine(props.tenancyName, membersCanEdit)}{" "}
                <button
                    type="button"
                    aria-label={`Change what members of ${props.tenancyName} can do`}
                    disabled={props.disabled}
                    onClick={() => setChangingMembers(true)}
                    className="font-semibold text-primary-900 underline underline-offset-2 disabled:opacity-50 disabled:no-underline disabled:cursor-not-allowed"
                >
                    Change
                </button>
```

with:

```tsx
                {membersAfterEmbargoLine(props.tenancyName, membersCanEdit)}
                {props.membersEditable !== false && <>
                    {" "}
                    <button
                        type="button"
                        aria-label={`Change what members of ${props.tenancyName} can do`}
                        disabled={props.disabled}
                        onClick={() => setChangingMembers(true)}
                        className="font-semibold text-primary-900 underline underline-offset-2 disabled:opacity-50 disabled:no-underline disabled:cursor-not-allowed"
                    >
                        Change
                    </button>
                </>}
```

In `components/Embargo/SetEmbargoDialog.tsx`, replace:

```tsx
import { messageForApiError } from "../../contants/EmbargoConstants";
```

with:

```tsx
import { messageForApiError } from "../../contants/EmbargoConstants";
import { isDefaultTenancy } from "../../contants/TenancyConstants";
```

and replace:

```tsx
                    <EmbargoFields tenancyName={tenancyDisplayName(props.dataset.tenancy)} />
```

with:

```tsx
                    <EmbargoFields tenancyName={tenancyDisplayName(props.dataset.tenancy)} membersEditable={!isDefaultTenancy(props.dataset.tenancy ?? "")} />
```

In `pages/app/datasets/new.tsx`, replace:

```tsx
import { ROUTE_PAGE_DATASETS_DETAILS } from "../../../contants/InternalRoutesConstants";
```

with:

```tsx
import { ROUTE_PAGE_DATASETS_DETAILS } from "../../../contants/InternalRoutesConstants";
import { isDefaultTenancy } from "../../../contants/TenancyConstants";
```

replace:

```tsx
  const membersCanEditSent = useRef(true);
```

with:

```tsx
  const membersCanEditSent = useRef(false);
```

replace:

```tsx
    membersCanEdit: true
  };
```

with:

```tsx
    membersCanEdit: false
  };
```

and replace:

```tsx
                  <EmbargoChoice
                    tenancyName={tenancyDisplayName(tenancySelected)}
```

with:

```tsx
                  <EmbargoChoice
                    tenancyName={tenancyDisplayName(tenancySelected)}
                    isPublic={isDefaultTenancy(tenancySelected ?? "")}
```

- [ ] **Step 4: Run them and every suite that touches members access**

Run: `npx jest --coverage=false lib/__tests__/membersAccessPublic.test.ts lib/__tests__/membersAccess.test.ts components/Embargo components/Share lib/__tests__/membersAccessRoute.test.ts`
Expected: PASS (4 + 3 new tests). The existing `EmbargoChoice`, `SetEmbargoDialog`, `AccessSummary` and `ShareDialog` tests keep passing: their datasets are in `data-amazon` and set `membersCanEdit` explicitly or start from the column.

- [ ] **Step 5: Commit**

```bash
pwd
command git branch --show-current
command git add lib/membersAccess.ts components/Share/ShareDialog.tsx components/Embargo/AccessSummary.tsx components/Embargo/EmbargoChoice.tsx components/Embargo/EmbargoFields.tsx components/Embargo/SetEmbargoDialog.tsx pages/app/datasets/new.tsx lib/__tests__/membersAccessPublic.test.ts components/Embargo/__tests__/EmbargoChoicePublic.test.tsx
command git commit -m "feat: members of Public only read, and new datasets start read-only for members" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 17: The share input offers to invite an outsider into the tenancy

**Files:**
- Modify: `components/Share/ShareInput.tsx` (rewritten)
- Test: `components/Share/__tests__/ShareInputTenancyInvite.test.tsx`

**Interfaces:**
- Consumes: `BFFAPI.lookupShareTarget`, `classifyShareInput`, `useDebouncedValue(…, 300)`, `SHARE_LEVEL_LABELS`, `PersonInitial`.
- Produces: `export interface TenancyInvite { tenancyName: string; datasets: number; onInvite(userId: string): Promise<boolean> }`; `ShareInput` gains `invite?: TenancyInvite | null`. With `invite`, a typed email or ORCID is looked up once it settles; when the answer has `can_invite`, the design's 1j card replaces the "Invite {email}" panel: avatar, name, "{email} · not a member of {tenancy}", radios **Share this dataset only** (default, "{level} · as today") and **Invite to {tenancy}** ("Member of the tenancy · sees its {n} datasets once they accept · administrators are notified"), and a button **Share** / **Send invitation**. "Share" grants exactly as today (`{email | orcid, level}`); "Send invitation" calls `invite.onInvite(user.id)`. Without `invite`, or when the lookup fails or `can_invite` is false, the input behaves as before.

- [ ] **Step 1: Write the failing test**

Create `components/Share/__tests__/ShareInputTenancyInvite.test.tsx`:

```tsx
/** @jest-environment jsdom */
import { beforeEach, describe, expect, jest, test } from '@jest/globals';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';

const searchShareCandidates = jest.fn() as any;
const lookupShareTarget = jest.fn() as any;

jest.mock("../../../gateways/BFFAPI", () => ({
    BFFAPI: jest.fn().mockImplementation(() => ({ searchShareCandidates, lookupShareTarget })),
}));

import { ShareInput } from "../ShareInput";

const outsider = {
    user: { id: "u7", name: "Fernanda Lima", email: "fernanda.lima@inpe.br" },
    tenancy_member: false,
    invitation_pending: false,
    can_invite: true,
};

function invite(onInvite: any = jest.fn()) {
    return { tenancyName: "Data Amazon", datasets: 108, onInvite };
}

function type(text: string) {
    fireEvent.change(screen.getByLabelText("Add people by name, email or ORCID"), { target: { value: text } });
}

async function settle() {
    await act(async () => { jest.advanceTimersByTime(300); });
    await act(async () => { await Promise.resolve(); });
}

beforeEach(() => {
    jest.useFakeTimers();
    searchShareCandidates.mockReset().mockResolvedValue([]);
    lookupShareTarget.mockReset().mockResolvedValue(outsider);
});

describe("ShareInput inviting into the tenancy", () => {
    test("without an invite, a typed email is never looked up", async () => {
        render(<ShareInput datasetId="d1" tenancyName="Data Amazon" onGrant={jest.fn() as any} />);

        type("fernanda.lima@inpe.br");
        await settle();

        expect(lookupShareTarget).not.toHaveBeenCalled();
        expect(screen.getByRole("button", { name: /Invite fernanda.lima@inpe.br/ })).toBeTruthy();
    });

    test("an account outside the tenancy gets the card, sharing only this dataset by default", async () => {
        render(<ShareInput datasetId="d1" tenancyName="Data Amazon" onGrant={jest.fn() as any} invite={invite()} />);

        type("fernanda.lima@inpe.br");
        await settle();

        await waitFor(() => expect(lookupShareTarget).toHaveBeenCalledWith("d1", "fernanda.lima@inpe.br"));
        expect(await screen.findByText("fernanda.lima@inpe.br · not a member of Data Amazon")).toBeTruthy();
        expect((screen.getByRole("radio", { name: /Share this dataset only/ }) as HTMLInputElement).checked).toBe(true);
        expect(screen.getByText("Can read · as today")).toBeTruthy();
        expect(screen.getByText("Member of the tenancy · sees its 108 datasets once they accept · administrators are notified")).toBeTruthy();
        expect(screen.queryByRole("button", { name: /Invite fernanda.lima@inpe.br/ })).toBeNull();
    });

    test("Share grants this dataset as before", async () => {
        const onGrant = (jest.fn() as any).mockResolvedValue(true);
        render(<ShareInput datasetId="d1" tenancyName="Data Amazon" onGrant={onGrant} invite={invite()} />);

        type("fernanda.lima@inpe.br");
        await settle();
        fireEvent.click(await screen.findByRole("button", { name: "Share" }));

        await waitFor(() => expect(onGrant).toHaveBeenCalledWith({ email: "fernanda.lima@inpe.br", level: "read" }));
    });

    test("choosing the tenancy sends an invitation for that account and clears the input", async () => {
        const onInvite = (jest.fn() as any).mockResolvedValue(true);
        const onGrant = jest.fn() as any;
        render(<ShareInput datasetId="d1" tenancyName="Data Amazon" onGrant={onGrant} invite={invite(onInvite)} />);

        type("fernanda.lima@inpe.br");
        await settle();
        fireEvent.click(await screen.findByRole("radio", { name: /Invite to Data Amazon/ }));
        fireEvent.click(screen.getByRole("button", { name: "Send invitation" }));

        await waitFor(() => expect(onInvite).toHaveBeenCalledWith("u7"));
        expect(onGrant).not.toHaveBeenCalled();
        await waitFor(() => expect((screen.getByLabelText("Add people by name, email or ORCID") as HTMLInputElement).value).toBe(""));
    });

    test("an account that cannot be invited keeps the usual invitation", async () => {
        lookupShareTarget.mockResolvedValue({ ...outsider, tenancy_member: true, can_invite: false });
        render(<ShareInput datasetId="d1" tenancyName="Data Amazon" onGrant={jest.fn() as any} invite={invite()} />);

        type("fernanda.lima@inpe.br");
        await settle();

        await waitFor(() => expect(lookupShareTarget).toHaveBeenCalled());
        expect(screen.queryByRole("radio", { name: /Invite to Data Amazon/ })).toBeNull();
        expect(screen.getByRole("button", { name: /Invite fernanda.lima@inpe.br/ })).toBeTruthy();
    });

    test("no account behind the email keeps the usual invitation", async () => {
        lookupShareTarget.mockRejectedValue({ response: { status: 404, data: { detail: "no_account" } } });
        render(<ShareInput datasetId="d1" tenancyName="Data Amazon" onGrant={jest.fn() as any} invite={invite()} />);

        type("nobody@inpe.br");
        await settle();

        await waitFor(() => expect(lookupShareTarget).toHaveBeenCalled());
        expect(screen.queryByRole("radio", { name: /Invite to Data Amazon/ })).toBeNull();
        expect(screen.getByRole("button", { name: /Invite nobody@inpe.br/ })).toBeTruthy();
    });
});
```

- [ ] **Step 2: Run it and watch it fail**

Run: `npx jest --coverage=false components/Share/__tests__/ShareInputTenancyInvite.test.tsx`
Expected: FAIL — `invite` is not a prop of `ShareInput` (type error); once it compiles, no lookup and no card.

- [ ] **Step 3: Implement**

Replace the whole of `components/Share/ShareInput.tsx` with:

```tsx
import { useEffect, useState } from "react";
import { MaterialSymbol } from "react-material-symbols";
import { SHARE_LEVEL_LABELS, SHARE_PERSON_DETAIL_CLASS, SHARE_PERSON_NAME_CLASS } from "../../contants/ShareConstants";
import { BFFAPI } from "../../gateways/BFFAPI";
import { useDebouncedValue } from "../../hooks/UseDebouncedValue";
import { classifyShareInput } from "../../lib/shareTarget";
import { GrantRequest, PermissionLevel, ShareLookup, ShareUser } from "../../types/GatekeeperAPI";
import { PersonInitial } from "./PersonInitial";

export interface TenancyInvite {
    tenancyName: string
    datasets: number
    onInvite(userId: string): Promise<boolean>
}

interface Props {
    datasetId: string
    tenancyName: string
    busy?: boolean
    onGrant(request: GrantRequest): Promise<boolean>
    invite?: TenancyInvite | null
}

type Reach = "dataset" | "tenancy";

function Highlighted(props: { name: string, typed: string }) {
    const start = props.name.toLowerCase().indexOf(props.typed.toLowerCase());
    if (start < 0 || !props.typed) {
        return <>{props.name}</>;
    }
    const end = start + props.typed.length;
    return <>{props.name.slice(0, start)}<strong className="font-bold">{props.name.slice(start, end)}</strong>{props.name.slice(end)}</>;
}

export function ShareInput(props: Props) {
    const [bffGateway] = useState(() => new BFFAPI());
    const [text, setText] = useState("");
    const [level, setLevel] = useState<PermissionLevel>("read");
    const [suggestions, setSuggestions] = useState<ShareUser[]>([]);
    const [lookup, setLookup] = useState<{ value: string, result: ShareLookup } | null>(null);
    const [reach, setReach] = useState<Reach>("dataset");
    const debounced = useDebouncedValue(text, 300);
    const target = classifyShareInput(text);
    const canInvite = Boolean(props.invite);

    useEffect(() => {
        const settled = classifyShareInput(debounced);
        if (settled.kind !== "text" || settled.value.length < 2) {
            setSuggestions([]);
            return;
        }
        let cancelled = false;
        bffGateway.searchShareCandidates(props.datasetId, settled.value)
            .then((users) => { if (!cancelled) setSuggestions(users); })
            .catch(() => { if (!cancelled) setSuggestions([]); });
        return () => { cancelled = true; };
    }, [debounced, props.datasetId, bffGateway]);

    useEffect(() => {
        const settled = classifyShareInput(debounced);
        if (!canInvite || (settled.kind !== "email" && settled.kind !== "orcid")) {
            setLookup(null);
            return;
        }
        let cancelled = false;
        bffGateway.lookupShareTarget(props.datasetId, settled.value)
            .then((result) => {
                if (!cancelled) {
                    setLookup({ value: settled.value, result });
                    setReach("dataset");
                }
            })
            .catch(() => { if (!cancelled) setLookup(null); });
        return () => { cancelled = true; };
    }, [debounced, props.datasetId, canInvite, bffGateway]);

    async function grant(request: GrantRequest) {
        if (props.busy) {
            return;
        }
        if (await props.onGrant(request)) {
            setText("");
            setSuggestions([]);
            setLookup(null);
        }
    }

    const outsider = props.invite && lookup && (target.kind === "email" || target.kind === "orcid") && lookup.value === target.value && lookup.result.can_invite
        ? lookup.result
        : null;

    async function shareWithOutsider() {
        if (!outsider || props.busy) {
            return;
        }
        if (reach === "tenancy") {
            if (await props.invite.onInvite(outsider.user.id)) {
                setText("");
                setLookup(null);
            }
            return;
        }
        await grant(target.kind === "email" ? { email: target.value, level } : { orcid: target.value, level });
    }

    const panel = "mt-1.5 w-full max-w-[460px] rounded-lg border border-primary-200 bg-primary-0 shadow-lg shadow-primary-900/10 overflow-hidden";
    const option = "grid grid-cols-[32px_minmax(0,1fr)] gap-3 items-center w-full px-3.5 py-2.5 text-left hover:bg-primary-100";
    const reaches: { value: Reach, label: string, hint: string }[] = props.invite
        ? [
            { value: "dataset", label: "Share this dataset only", hint: `${SHARE_LEVEL_LABELS[level]} · as today` },
            {
                value: "tenancy",
                label: `Invite to ${props.invite.tenancyName}`,
                hint: `Member of the tenancy · sees its ${props.invite.datasets} datasets once they accept · administrators are notified`,
            },
        ]
        : [];

    return (
        <div className="relative">
            <div className="flex gap-2">
                <div className={`flex flex-1 items-center gap-2.5 h-11 px-3.5 rounded-md border bg-primary-0 ${text ? "border-primary-900" : "border-primary-300"}`}>
                    <MaterialSymbol icon="person_add" size={20} grade={-25} weight={400} className="text-primary-400" />
                    <input
                        aria-label="Add people by name, email or ORCID"
                        type="text"
                        autoComplete="off"
                        className="w-full h-full p-0 border-0 bg-transparent text-sm text-primary-900 placeholder:text-primary-400 focus:outline-none focus:ring-0"
                        placeholder="Add people by name, email or ORCID"
                        value={text}
                        onChange={(e) => setText(e.target.value)}
                    />
                </div>
                <select
                    aria-label="Access level"
                    className="h-11 w-auto flex-none rounded-md border border-primary-300 bg-primary-0 pl-3 pr-8 text-sm font-medium text-primary-900"
                    value={level}
                    onChange={(e) => setLevel(e.target.value as PermissionLevel)}
                >
                    <option value="read">Can read</option>
                    <option value="write">Can write</option>
                </select>
            </div>

            {target.kind === "invalid_orcid" &&
                <div role="alert" className="mt-1.5 grid grid-cols-[32px_minmax(0,1fr)] gap-3 items-center max-w-[460px] rounded-lg border border-danger-200 bg-danger-50 px-3.5 py-2.5">
                    <MaterialSymbol icon="error" size={18} grade={-25} weight={400} className="justify-self-center text-danger-700" />
                    <span className="flex flex-col">
                        <span className="text-sm font-medium text-danger-700">{target.value} isn&apos;t a valid ORCID</span>
                        <span className="text-xs text-danger-800">The last digit doesn&apos;t check out. Compare it with the person&apos;s ORCID page.</span>
                    </span>
                </div>
            }

            {outsider &&
                <div className="mt-1.5 w-full max-w-[480px] rounded-lg border border-primary-200 bg-primary-0 shadow-lg shadow-primary-900/10 overflow-hidden">
                    <div className="grid grid-cols-[32px_minmax(0,1fr)] gap-3 items-center px-3.5 pt-3 pb-2">
                        <PersonInitial name={outsider.user.name} />
                        <span className="flex flex-col min-w-0">
                            <span className={SHARE_PERSON_NAME_CLASS}>{outsider.user.name}</span>
                            <span className={SHARE_PERSON_DETAIL_CLASS}>{`${outsider.user.email ?? target.value} · not a member of ${props.invite.tenancyName}`}</span>
                        </span>
                    </div>
                    <fieldset className="flex flex-col gap-2 m-0 px-3.5 pb-3 border-0">
                        <legend className="sr-only">{`Share with ${outsider.user.name}`}</legend>
                        {reaches.map((choice) => {
                            const selected = reach === choice.value;
                            return (
                                <label key={choice.value} className={`flex flex-col gap-1 m-0 rounded-md bg-primary-0 px-3.5 py-3 cursor-pointer ${selected ? "border-[1.5px] border-primary-900" : "border border-primary-200"}`}>
                                    <span className="flex items-center gap-2 text-[13px] font-semibold text-primary-900">
                                        <input type="radio" name="share-reach" checked={selected} onChange={() => setReach(choice.value)} className="h-3.5 w-3.5 p-0 accent-primary-900" />
                                        {choice.label}
                                    </span>
                                    <span className="pl-[22px] text-xs leading-[17px] text-primary-600">{choice.hint}</span>
                                </label>
                            );
                        })}
                    </fieldset>
                    <div className="flex justify-end px-3.5 pb-3">
                        <button
                            type="button"
                            disabled={props.busy}
                            onClick={shareWithOutsider}
                            className="h-8 px-3 rounded-md bg-primary-900 text-primary-50 text-[13px] font-semibold hover:bg-primary-800 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {reach === "tenancy" ? "Send invitation" : "Share"}
                        </button>
                    </div>
                </div>
            }

            {(target.kind === "email" || target.kind === "orcid") && !outsider &&
                <div className={panel}>
                    <button
                        type="button"
                        className={option}
                        disabled={props.busy}
                        onClick={() => grant(target.kind === "email" ? { email: target.value, level } : { orcid: target.value, level })}
                    >
                        <PersonInitial pendingIcon={target.kind === "email" ? "mail" : "badge"} />
                        <span className="flex flex-col min-w-0">
                            <span className={SHARE_PERSON_NAME_CLASS}>Invite {target.kind === "email" ? target.value : `ORCID ${target.value}`}</span>
                            <span className={SHARE_PERSON_DETAIL_CLASS}>
                                {target.kind === "email"
                                    ? "If they have no account yet, they'll get an email with a link"
                                    : "If no account has this ORCID, you'll get a link to send them"}
                            </span>
                        </span>
                    </button>
                </div>
            }

            {target.kind === "text" && suggestions.length > 0 &&
                <div className={panel}>
                    <ul className="m-0 p-0 list-none">
                        {suggestions.map((user) => (
                            <li key={user.id}>
                                <button type="button" aria-label={`${user.name} ${user.email}`} className={option} disabled={props.busy} onClick={() => grant({ user_id: user.id, level })}>
                                    <PersonInitial name={user.name} />
                                    <span className="flex flex-col min-w-0">
                                        <span className={SHARE_PERSON_NAME_CLASS}><Highlighted name={user.name} typed={text.trim()} /></span>
                                        <span className={SHARE_PERSON_DETAIL_CLASS}>{user.email}</span>
                                    </span>
                                </button>
                            </li>
                        ))}
                    </ul>
                    <p className="m-0 px-3.5 py-2 border-t border-primary-100 text-xs text-primary-500">
                        Someone outside {props.tenancyName}? Type their full email or ORCID.
                    </p>
                </div>
            }
        </div>
    );
}
```

- [ ] **Step 4: Run it and the existing share input and dialog tests**

Run: `npx jest --coverage=false components/Share`
Expected: PASS (6 new tests; `ShareInput.test.tsx` and `ShareDialog.test.tsx` unchanged and green, since without `invite` nothing is looked up).

- [ ] **Step 5: Commit**

```bash
pwd
command git branch --show-current
command git add components/Share/ShareInput.tsx components/Share/__tests__/ShareInputTenancyInvite.test.tsx
command git commit -m "feat: the share input offers to invite an account outside the tenancy" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 18: The Share dialog shows, sends and withdraws tenancy invitations

**Files:**
- Modify: `components/Share/AccessList.tsx`
- Modify: `components/Share/ShareDialog.tsx`
- Test: `components/Share/__tests__/AccessListTenancyInvitations.test.tsx`, `components/Share/__tests__/ShareDialogTenancy.test.tsx`

**Interfaces:**
- Consumes: `ShareState.tenancy_invitations`, `ShareState.can_invite_to_tenancy`, `ShareTenancy.{name, datasets, is_default, is_legacy}`, `BFFAPI.inviteToTenancy`, `BFFAPI.withdrawTenancyInvitation`, `tenancyErrorMessage`, `SHARE_INVITE_FOOTER`, `TenancyIcon`, `TenancyInvite` (Task 17).
- Produces: `AccessList` gains `onWithdrawTenancyInvitation?(invitationId: string): void` and one row per pending tenancy invitation (dashed `tenancy` icon, invitee name, "Invited to {tenancy} {date} · not accepted yet", red **Withdraw** when `can_withdraw`). `ShareDialog` names the tenancy from `state.tenancy.name`, passes `invite` to `ShareInput` only when `can_invite_to_tenancy` and the tenancy is neither the default nor legacy, maps invite/withdraw errors through `tenancyErrorMessage`, and reads "Owners and editors can invite to the tenancy" in the footer when inviting is possible.

- [ ] **Step 1: Write the failing tests**

Create `components/Share/__tests__/AccessListTenancyInvitations.test.tsx`:

```tsx
/** @jest-environment jsdom */
import { describe, expect, jest, test } from '@jest/globals';
import { fireEvent, render, screen } from '@testing-library/react';
import { AccessList } from "../AccessList";

const state: any = {
    owner: { id: "o", name: "Luciana Rizzo", email: "luciana.rizzo@usp.br" },
    permissions: [],
    invitations: [],
    anonymous_links: [],
    tenancy: { name: "Data Amazon", path: "datamap/production/data-amazon", members: 14, members_can_edit: false, is_default: false, is_legacy: false, datasets: 108 },
    tenancy_invitations: [
        { id: "ti1", user: { id: "u5", name: "Rafael Souza", email: "rafael.souza@usp.br" }, invited_by: { id: "o", name: "Luciana Rizzo", email: null }, created_at: "2026-10-02T10:00:00+00:00", can_withdraw: true },
        { id: "ti2", user: { id: "u6", name: "Marta Silva", email: null }, invited_by: { id: "u2", name: "Alan Calheiros", email: null }, created_at: "2026-10-03T10:00:00+00:00", can_withdraw: false },
    ],
    can_invite_to_tenancy: true,
};

describe("AccessList with tenancy invitations", () => {
    test("each pending invitation says where and since when, with a dashed icon", () => {
        const { container } = render(<AccessList state={state} onChangeLevel={jest.fn()} onRemove={jest.fn()} onRevokeInvitation={jest.fn()} />);

        expect(screen.getByText("Rafael Souza")).toBeTruthy();
        expect(screen.getByText("Invited to Data Amazon Oct 2 · not accepted yet")).toBeTruthy();
        expect(screen.getByText("Invited to Data Amazon Oct 3 · not accepted yet")).toBeTruthy();
        expect(container.querySelectorAll('[data-pending="true"]')).toHaveLength(2);
    });

    test("only the inviter can withdraw", () => {
        const onWithdraw = jest.fn();
        render(<AccessList state={state} onChangeLevel={jest.fn()} onRemove={jest.fn()} onRevokeInvitation={jest.fn()} onWithdrawTenancyInvitation={onWithdraw} />);

        const buttons = screen.getAllByRole("button", { name: /Withdraw the invitation/ });
        expect(buttons).toHaveLength(1);
        fireEvent.click(buttons[0]);

        expect(onWithdraw).toHaveBeenCalledWith("ti1");
    });
});
```

Create `components/Share/__tests__/ShareDialogTenancy.test.tsx`:

```tsx
/** @jest-environment jsdom */
import { beforeEach, describe, expect, jest, test } from '@jest/globals';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';

const inviteToTenancy = jest.fn() as any;
const withdrawTenancyInvitation = jest.fn() as any;
const mutate = jest.fn() as any;
let shareState: any;

jest.mock("../../../gateways/BFFAPI", () => ({
    BFFAPI: jest.fn().mockImplementation(() => ({ inviteToTenancy, withdrawTenancyInvitation })),
}));
jest.mock("swr", () => ({
    __esModule: true,
    default: () => ({ data: shareState, error: undefined, mutate }),
}));
jest.mock("next-auth/react", () => ({ useSession: () => ({ data: null }) }));
jest.mock("next/router", () => ({ useRouter: () => ({ replace: jest.fn(async () => true), asPath: "/app/datasets/d2" }) }));
jest.mock("../../../lib/fetcher", () => ({ fetcher: jest.fn() }));
jest.mock("../ShareInput", () => {
    const React = require("react");
    return {
        ShareInput: (props: any) => props.invite
            ? React.createElement("button", { type: "button", onClick: () => props.invite.onInvite("u9") }, "invite-stub")
            : React.createElement("span", null, "no-invite"),
    };
});

import { ShareDialog } from "../ShareDialog";

const AMAZON_TENANCY = { name: "Data Amazon", path: "datamap/production/data-amazon", members: 14, members_can_edit: false, is_default: false, is_legacy: false, datasets: 108 };
const PUBLIC_TENANCY = { name: "Public", path: "datamap/production/public", members: 47, members_can_edit: false, is_default: true, is_legacy: false, datasets: 300 };
const amazonDataset: any = { id: "d2", name: "Manaus Radar Reflectivity 2023", tenancy: "datamap/production/data-amazon", embargo: null, access: { level: "owner" } };
const publicDataset: any = { id: "d3", name: "Open aerosol optical depth", tenancy: "datamap/production/public", embargo: null, access: { level: "owner" } };

function stateWith(overrides: any = {}) {
    return {
        owner: { id: "o", name: "Luciana Rizzo", email: "luciana.rizzo@usp.br" },
        permissions: [],
        invitations: [],
        anonymous_links: [],
        tenancy: AMAZON_TENANCY,
        tenancy_invitations: [],
        can_invite_to_tenancy: true,
        ...overrides,
    };
}

beforeEach(() => {
    inviteToTenancy.mockReset();
    withdrawTenancyInvitation.mockReset();
    mutate.mockReset();
});

describe("ShareDialog and the tenancy", () => {
    test("in Public, members are everyone on DataMap and there is nothing to change", () => {
        shareState = stateWith({ tenancy: PUBLIC_TENANCY, can_invite_to_tenancy: false });
        render(<ShareDialog dataset={publicDataset} show onClose={jest.fn()} />);

        expect(screen.getByText("Members of Public")).toBeTruthy();
        expect(screen.getByText("Everyone on DataMap · can read")).toBeTruthy();
        expect(screen.queryByRole("button", { name: "Change what members of Public can do" })).toBeNull();
    });

    test("in Public nobody is invited to the tenancy, and the footer is the usual one", () => {
        shareState = stateWith({ tenancy: PUBLIC_TENANCY, can_invite_to_tenancy: false });
        render(<ShareDialog dataset={publicDataset} show onClose={jest.fn()} />);

        expect(screen.getByText("no-invite")).toBeTruthy();
        expect(screen.getByText("Anonymous links are available under embargo")).toBeTruthy();
    });

    test("when inviting is possible the footer says who can", () => {
        shareState = stateWith();
        render(<ShareDialog dataset={amazonDataset} show onClose={jest.fn()} />);

        expect(screen.getByText("Owners and editors can invite to the tenancy")).toBeTruthy();
    });

    test("an invitation is sent for the account looked up, then the list is refreshed", async () => {
        shareState = stateWith();
        inviteToTenancy.mockResolvedValue({ id: "ti9", can_withdraw: true });
        render(<ShareDialog dataset={amazonDataset} show onClose={jest.fn()} />);

        fireEvent.click(screen.getByRole("button", { name: "invite-stub" }));

        await waitFor(() => expect(mutate).toHaveBeenCalled());
        expect(inviteToTenancy).toHaveBeenCalledWith("d2", "u9");
    });

    test("a refused invitation says why", async () => {
        shareState = stateWith();
        inviteToTenancy.mockRejectedValue({ response: { status: 409, data: { detail: "already_member" } } });
        render(<ShareDialog dataset={amazonDataset} show onClose={jest.fn()} />);

        fireEvent.click(screen.getByRole("button", { name: "invite-stub" }));

        await waitFor(() => expect(screen.getByRole("alert").textContent).toBe("This person is already a member of the tenancy."));
    });

    test("the inviter withdraws a pending invitation", async () => {
        shareState = stateWith({
            tenancy_invitations: [{ id: "ti1", user: { id: "u5", name: "Rafael Souza", email: "rafael.souza@usp.br" }, invited_by: null, created_at: "2026-10-02T10:00:00+00:00", can_withdraw: true }],
        });
        withdrawTenancyInvitation.mockResolvedValue(undefined);
        render(<ShareDialog dataset={amazonDataset} show onClose={jest.fn()} />);

        fireEvent.click(screen.getByRole("button", { name: "Withdraw the invitation of Rafael Souza to Data Amazon" }));

        await waitFor(() => expect(withdrawTenancyInvitation).toHaveBeenCalledWith("d2", "ti1"));
        expect(mutate).toHaveBeenCalled();
    });
});
```

- [ ] **Step 2: Run them and watch them fail**

Run: `npx jest --coverage=false components/Share/__tests__/AccessListTenancyInvitations.test.tsx components/Share/__tests__/ShareDialogTenancy.test.tsx`
Expected: FAIL — no tenancy invitation rows, `onWithdrawTenancyInvitation` is not a prop (type error), no invite reaches the stub ("no-invite" shown), no footer.

- [ ] **Step 3: Implement**

In `components/Share/AccessList.tsx`, replace:

```tsx
import { formatShortDate } from "../../lib/embargoDisplay";
```

with:

```tsx
import { formatShortDate } from "../../lib/embargoDisplay";
import { TenancyIcon } from "../Tenancy/TenancyIcon";
```

replace:

```tsx
    onRevokeInvitation(invitationId: string): void
    members?: MembersRow | null
```

with:

```tsx
    onRevokeInvitation(invitationId: string): void
    onWithdrawTenancyInvitation?(invitationId: string): void
    members?: MembersRow | null
```

replace:

```tsx
    const owner = props.state.owner;
```

with:

```tsx
    const owner = props.state.owner;
    const tenancyName = props.state.tenancy?.name ?? "the tenancy";
    const tenancyInvitations = props.state.tenancy_invitations ?? [];
```

and replace:

```tsx
                {props.members &&
                    <li className={SHARE_ROW_CLASS}>
```

with:

```tsx
                {tenancyInvitations.map((invitation) => (
                    <li key={invitation.id} className={SHARE_ROW_CLASS}>
                        <TenancyIcon pending />
                        <span className="flex flex-col min-w-0">
                            <span className={SHARE_PERSON_NAME_CLASS}>{invitation.user.name}</span>
                            <span className={SHARE_PERSON_DETAIL_CLASS}>{`Invited to ${tenancyName} ${formatShortDate(invitation.created_at, false)} · not accepted yet`}</span>
                        </span>
                        {invitation.can_withdraw
                            ? <button
                                type="button"
                                aria-label={`Withdraw the invitation of ${invitation.user.name} to ${tenancyName}`}
                                className={SHARE_DANGER_ACTION_CLASS}
                                disabled={props.busy}
                                onClick={() => props.onWithdrawTenancyInvitation?.(invitation.id)}
                            >
                                Withdraw
                            </button>
                            : <span></span>}
                    </li>
                ))}

                {props.members &&
                    <li className={SHARE_ROW_CLASS}>
```

In `components/Share/ShareDialog.tsx` (after Task 16), replace:

```tsx
import { isDefaultTenancy } from "../../contants/TenancyConstants";
```

with:

```tsx
import { SHARE_INVITE_FOOTER, isDefaultTenancy, tenancyErrorMessage } from "../../contants/TenancyConstants";
```

replace:

```tsx
    const tenancyName = tenancyDisplayName(props.dataset.tenancy);
```

with:

```tsx
    const tenancyName = state?.tenancy?.name ?? tenancyDisplayName(props.dataset.tenancy);
```

replace:

```tsx
    async function run<T>(action: () => Promise<T>): Promise<T | undefined> {
```

with:

```tsx
    async function run<T>(action: () => Promise<T>, toMessage: (e: unknown) => string = messageForApiError): Promise<T | undefined> {
```

replace:

```tsx
            setError(messageForApiError(e));
```

with:

```tsx
            setError(toMessage(e));
```

replace:

```tsx
        return result !== undefined;
    }

    function close() {
```

with:

```tsx
        return result !== undefined;
    }

    function tenancyMessage(e: unknown): string {
        return tenancyErrorMessage((e as { response?: { data?: { detail?: string } } })?.response?.data?.detail);
    }

    async function onInvite(userId: string): Promise<boolean> {
        const result = await run(() => bffGateway.inviteToTenancy(datasetId, userId), tenancyMessage);
        return result !== undefined;
    }

    const invite = state?.can_invite_to_tenancy && state.tenancy && !state.tenancy.is_default && !state.tenancy.is_legacy
        ? { tenancyName: state.tenancy.name, datasets: state.tenancy.datasets, onInvite }
        : null;

    function close() {
```

replace:

```tsx
                        <ShareInput datasetId={datasetId} tenancyName={tenancyName} onGrant={onGrant} busy={busy} />
```

with:

```tsx
                        <ShareInput datasetId={datasetId} tenancyName={tenancyName} onGrant={onGrant} busy={busy} invite={invite} />
```

replace:

```tsx
                                onRevokeInvitation={(id) => run(() => bffGateway.revokeInvitation(datasetId, id))}
```

with:

```tsx
                                onRevokeInvitation={(id) => run(() => bffGateway.revokeInvitation(datasetId, id))}
                                onWithdrawTenancyInvitation={(id) => run(() => bffGateway.withdrawTenancyInvitation(datasetId, id), tenancyMessage)}
```

and replace:

```tsx
                            {embargoActive ? "Access continues after the embargo ends" : "Anonymous links are available under embargo"}
```

with:

```tsx
                            {state?.can_invite_to_tenancy ? SHARE_INVITE_FOOTER : embargoActive ? "Access continues after the embargo ends" : "Anonymous links are available under embargo"}
```

- [ ] **Step 4: Run them and every share suite**

Run: `npx jest --coverage=false components/Share components/Embargo`
Expected: PASS (2 + 6 new tests). The existing `ShareDialog.test.tsx` states have no `can_invite_to_tenancy`, so their footers and inputs are unchanged.

- [ ] **Step 5: Commit**

```bash
pwd
command git branch --show-current
command git add components/Share/AccessList.tsx components/Share/ShareDialog.tsx components/Share/__tests__/AccessListTenancyInvitations.test.tsx components/Share/__tests__/ShareDialogTenancy.test.tsx
command git commit -m "feat: owners and editors invite to the tenancy from the Share dialog" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 19: A member removed from a tenancy is sent to choose another

**Files:**
- Create: `lib/tenancyRevocation.ts`
- Modify: `lib/rpc.ts`
- Modify: `pages/api/datasets/index.ts`
- Modify: `lib/fetcher.js`
- Modify: `components/Auth/RequireSession.tsx` (rewritten)
- Modify: `lib/requestErrorHandler.ts`
- Test: `lib/__tests__/tenancyRevocation.test.ts`, `lib/__tests__/fetcher.test.ts`, `lib/__tests__/datasetListRoute.test.ts`, `components/Auth/__tests__/RequireSessionRevoked.test.tsx`; additions to `lib/__tests__/rpc.test.ts` and `lib/__tests__/requestErrorHandler.test.ts`

**Interfaces:**
- Produces: `TENANCY_REVOKED_PREFIX = "unauthorized_tenancy"`; `isTenancyRevoked(status: unknown, detail: unknown): boolean` (`401` and a string `detail` starting with the prefix). `httpErrorHandler` keeps `detail` on a `401`; the dataset list route answers `{detail}` on failure; `fetcher` errors carry `detail`; `RequireSession` wraps pages in `<SWRConfig value={{ onError }}>` that, for a revoked tenancy, clears the selection, calls `update()` and `Router.replace(ROUTE_PAGE_TENANCY_SELECTOR)` (once at a time); `handleDatasetRequestErrors` redirects a revoked tenancy to `/app/tenancy` instead of the login page.

- [ ] **Step 1: Write the failing tests**

Create `lib/__tests__/tenancyRevocation.test.ts`:

```ts
import { describe, expect, test } from '@jest/globals';
import { isTenancyRevoked } from "../tenancyRevocation";

describe("a revoked tenancy", () => {
    test("is a 401 whose code starts with unauthorized_tenancy, whatever follows", () => {
        expect(isTenancyRevoked(401, "unauthorized_tenancy")).toBe(true);
        expect(isTenancyRevoked(401, "unauthorized_tenancy: user is not a member of datamap/production/data-amazon")).toBe(true);
    });

    test("is not any other 401", () => {
        expect(isTenancyRevoked(401, "user not authorized to perform the operation")).toBe(false);
        expect(isTenancyRevoked(401, undefined)).toBe(false);
    });

    test("is never another status", () => {
        expect(isTenancyRevoked(403, "unauthorized_tenancy")).toBe(false);
        expect(isTenancyRevoked(undefined, "unauthorized_tenancy")).toBe(false);
    });
});
```

Create `lib/__tests__/fetcher.test.ts`:

```ts
jest.mock("../../components/TenancyStore", () => ({
    useTenancyStore: { getState: () => ({ tenancySelected: "datamap/production/data-amazon" }) },
}));

import { fetcher } from "../fetcher";

describe("the SWR fetcher", () => {
    test("an error carries the status and the gatekeeper's code", async () => {
        global.fetch = jest.fn(async () => ({
            ok: false, status: 401, statusText: "Unauthorized",
            json: async () => ({ detail: "unauthorized_tenancy: removed" }),
        })) as any;

        await expect(fetcher("/api/datasets")).rejects.toMatchObject({ status: 401, detail: "unauthorized_tenancy: removed" });
    });

    test("an error without a JSON body has no code", async () => {
        global.fetch = jest.fn(async () => ({
            ok: false, status: 502, statusText: "Bad Gateway",
            json: async () => { throw new SyntaxError("Unexpected end of JSON input"); },
        })) as any;

        await expect(fetcher("/api/datasets")).rejects.toMatchObject({ status: 502, detail: undefined });
    });
});
```

Create `lib/__tests__/datasetListRoute.test.ts`:

```ts
jest.mock("next-auth/jwt", () => ({ getToken: jest.fn(async () => ({ uid: "u1", v: 2 })) }));
jest.mock("../dataset");

import { AxiosError, AxiosHeaders } from "axios";
import datasetsHandler from "../../pages/api/datasets/index";
import { getAllDataset } from "../dataset";

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

test("a tenancy the user was removed from reaches the browser with its code", async () => {
    jest.mocked(getAllDataset).mockRejectedValue(new AxiosError("gatekeeper", "ERR", undefined, {}, {
        status: 401, data: { detail: "unauthorized_tenancy: user is not a member" }, statusText: "", headers: {}, config: { headers: new AxiosHeaders() },
    } as any));
    const res = fakeRes();
    const original = process.stdout.write;
    // @ts-ignore
    process.stdout.write = () => true;
    try {
        await datasetsHandler({
            method: "GET", url: "/api/datasets?minimal=true", query: {}, cookies: {},
            headers: { "x-datamap-tenancy": "datamap/production/data-amazon" },
        } as any, res);
    } finally {
        process.stdout.write = original;
    }

    expect(res.statusCode).toBe(401);
    expect(res.json).toHaveBeenCalledWith({ detail: "unauthorized_tenancy: user is not a member" });
});
```

Create `components/Auth/__tests__/RequireSessionRevoked.test.tsx`:

```tsx
/** @jest-environment jsdom */
import { beforeEach, describe, expect, jest, test } from '@jest/globals';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { useSWRConfig } from "swr";

const update = jest.fn() as any;
const replace = jest.fn() as any;
const setTenancySelected = jest.fn() as any;

jest.mock("next-auth/react", () => ({
    useSession: () => ({
        data: { user: { tenancies: ["datamap/production/public", "datamap/production/data-amazon"] }, expires: "2099-01-01" },
        status: "authenticated",
        update,
    }),
}));
jest.mock("next/router", () => ({
    __esModule: true,
    default: { replace: (...args: unknown[]) => replace(...args) },
    useRouter: () => ({ asPath: "/app/datasets" }),
}));
jest.mock("../../TenancyStore", () => ({
    useTenancyStore: (selector: (state: unknown) => unknown) => selector({ setTenancySelected, isTenancySelected: () => true }),
}));

import { RequireSession } from "../RequireSession";

function Probe(props: { error: unknown }) {
    const { onError } = useSWRConfig();
    return <button type="button" onClick={() => onError(props.error as any, "/api/datasets", {} as any)}>fail</button>;
}

function renderWith(error: unknown) {
    render(<RequireSession loading={<div>loading</div>}><Probe error={error} /></RequireSession>);
}

beforeEach(() => {
    update.mockReset();
    replace.mockReset();
    setTenancySelected.mockReset();
});

describe("RequireSession and a revoked tenancy", () => {
    test("a 401 for a tenancy the user was removed from clears it, refreshes the session and opens the selector", async () => {
        renderWith({ status: 401, detail: "unauthorized_tenancy: user is not a member" });

        fireEvent.click(screen.getByRole("button", { name: "fail" }));

        await waitFor(() => expect(replace).toHaveBeenCalledWith("/app/tenancy"));
        expect(setTenancySelected).toHaveBeenCalledWith("");
        expect(update).toHaveBeenCalledTimes(1);
    });

    test("any other error is left to the page", async () => {
        renderWith({ status: 401, detail: "user not authorized to perform the operation" });

        await act(async () => {
            fireEvent.click(screen.getByRole("button", { name: "fail" }));
        });

        expect(setTenancySelected).not.toHaveBeenCalled();
        expect(update).not.toHaveBeenCalled();
        expect(replace).not.toHaveBeenCalled();
    });
});
```

In `lib/__tests__/rpc.test.ts`, replace:

```ts
    test('a 409 keeps the gatekeeper detail', () => {
```

with:

```ts
    test('a 401 keeps the gatekeeper detail', () => {
        const e = httpErrorHandler(axiosErrorWith(401, { detail: "unauthorized_tenancy: removed" }));
        expect(e.httpCode).toBe(401);
        expect(e.detail).toBe("unauthorized_tenancy: removed");
    })

    test('a 409 keeps the gatekeeper detail', () => {
```

In `lib/__tests__/requestErrorHandler.test.ts`, replace:

```ts
    test("a 401 still redirects to login", () => {
        const result: any = handleDatasetRequestErrors({ status: 401 }, req, "d1");
        expect(result.redirect.destination).toContain("/account/login");
    });
```

with:

```ts
    test("a 401 still redirects to login", () => {
        const result: any = handleDatasetRequestErrors({ status: 401 }, req, "d1");
        expect(result.redirect.destination).toContain("/account/login");
    });

    test("a tenancy the user was removed from sends them to choose another", () => {
        const result: any = handleDatasetRequestErrors({ response: { status: 401, data: { detail: "unauthorized_tenancy: removed" } } }, req, "d1");
        expect(result).toEqual({ redirect: { destination: "/app/tenancy", permanent: false } });
    });
```

- [ ] **Step 2: Run them and watch them fail**

Run: `npx jest --coverage=false lib/__tests__/tenancyRevocation.test.ts lib/__tests__/fetcher.test.ts lib/__tests__/datasetListRoute.test.ts components/Auth/__tests__/RequireSessionRevoked.test.tsx lib/__tests__/rpc.test.ts lib/__tests__/requestErrorHandler.test.ts`
Expected: FAIL — `Cannot find module '../tenancyRevocation'`; the fetcher error has no `detail`; the list route ends with no body; nothing handles the SWR error; the `401` loses its detail; the revoked dataset page still goes to the login page.

- [ ] **Step 3: Implement**

Create `lib/tenancyRevocation.ts`:

```ts
export const TENANCY_REVOKED_PREFIX = "unauthorized_tenancy";

export function isTenancyRevoked(status: unknown, detail: unknown): boolean {
    return status === 401 && typeof detail === "string" && detail.startsWith(TENANCY_REVOKED_PREFIX);
}
```

In `lib/rpc.ts`, replace:

```ts
        handledError = new APIError(
          "UNAUTHORIZED",
          HttpStatusCode.Unauthorized,
          "user not authorized to perform the operation",
          true
        )
```

with:

```ts
        handledError = new APIError(
          "UNAUTHORIZED",
          HttpStatusCode.Unauthorized,
          "user not authorized to perform the operation",
          true,
          undefined,
          response?.data?.detail
        )
```

In `pages/api/datasets/index.ts`, replace:

```ts
      logError("listing datasets failed", error);
      res.status(error?.response?.status).end();
```

with:

```ts
      logError("listing datasets failed", error);
      res.status(error?.response?.status ?? 502).json({ detail: error?.response?.data?.detail });
```

In `lib/fetcher.js`, replace:

```js
        error.info = res?.statusText
        error.status = res.status
        throw error
    }

    return res.json()
}
```

with:

```js
        error.info = res?.statusText
        error.status = res.status
        error.detail = await detailOf(res)
        throw error
    }

    return res.json()
}

async function detailOf(res) {
    try {
        const body = await res.json()
        return typeof body?.detail === "string" ? body.detail : undefined
    } catch {
        return undefined
    }
}
```

Replace the whole of `components/Auth/RequireSession.tsx` with:

```tsx
import { useSession } from "next-auth/react";
import Router, { useRouter } from "next/router";
import { ReactNode, useRef } from "react";
import { SWRConfig } from "swr";
import { ROUTE_PAGE_TENANCY_SELECTOR } from "../../contants/InternalRoutesConstants";
import { loginUrlFor } from "../../lib/authRoutes";
import { isTenancyRevoked } from "../../lib/tenancyRevocation";
import { useTenancyStore } from "../TenancyStore";

interface Props {
    loading: ReactNode
    children: ReactNode
}

/** Renders a page only for a signed-in visitor; a session refresh keeps the page mounted. */
export function RequireSession({ loading, children }: Props) {
    const router = useRouter();
    const setTenancySelected = useTenancyStore((state) => state.setTenancySelected);
    const isTenancySelected = useTenancyStore((state) => state.isTenancySelected);
    const leaving = useRef(false);

    const { data: session, status, update } = useSession({
        required: true,
        onUnauthenticated() {
            Router.replace(loginUrlFor(router.asPath));
        },
    });

    async function leaveRevokedTenancy() {
        if (leaving.current) {
            return;
        }
        leaving.current = true;
        try {
            setTenancySelected("");
            await update();
            await Router.replace(ROUTE_PAGE_TENANCY_SELECTOR);
        } finally {
            leaving.current = false;
        }
    }

    if (status === "loading" && !session) {
        return <>{loading}</>;
    }

    if (!isTenancySelected() && session?.user?.tenancies?.length == 1) {
        setTenancySelected(session.user.tenancies[0]);
    }

    return (
        <SWRConfig value={{ onError: (error) => { if (isTenancyRevoked(error?.status, error?.detail)) leaveRevokedTenancy(); } }}>
            {children}
        </SWRConfig>
    );
}
```

In `lib/requestErrorHandler.ts`, replace:

```ts
import { ROUTE_PAGE_DATASETS_DETAILS, ROUTE_PAGE_DATASETS_VERSION_DETAILS, ROUTE_PAGE_LOGIN } from "../contants/InternalRoutesConstants";
```

with:

```ts
import { ROUTE_PAGE_DATASETS_DETAILS, ROUTE_PAGE_DATASETS_VERSION_DETAILS, ROUTE_PAGE_LOGIN, ROUTE_PAGE_TENANCY_SELECTOR } from "../contants/InternalRoutesConstants";
import { isTenancyRevoked } from "./tenancyRevocation";
```

and replace:

```ts
    // Only redirect to login for 401 (unauthenticated) errors
    if (status === 401) {
```

with:

```ts
    if (isTenancyRevoked(status, error?.response?.data?.detail ?? error?.data?.detail)) {
        return { redirect: { destination: ROUTE_PAGE_TENANCY_SELECTOR, permanent: false } };
    }

    // Only redirect to login for 401 (unauthenticated) errors
    if (status === 401) {
```

- [ ] **Step 4: Run them and the suites that share these modules**

Run: `npx jest --coverage=false lib/__tests__/tenancyRevocation.test.ts lib/__tests__/fetcher.test.ts lib/__tests__/datasetListRoute.test.ts components/Auth lib/__tests__/rpc.test.ts lib/__tests__/requestErrorHandler.test.ts lib/__tests__/shareRoutes.test.ts lib/__tests__/embargoRoutes.test.ts lib/__tests__/membersAccessRoute.test.ts`
Expected: PASS (3 + 2 + 1 + 2 new tests, +1 in `rpc`, +1 in `requestErrorHandler`). The existing `RequireSession` tests still pass: the page stays mounted inside `SWRConfig`.

- [ ] **Step 5: Commit**

```bash
pwd
command git branch --show-current
command git add lib/tenancyRevocation.ts lib/rpc.ts pages/api/datasets/index.ts lib/fetcher.js components/Auth/RequireSession.tsx lib/requestErrorHandler.ts lib/__tests__/tenancyRevocation.test.ts lib/__tests__/fetcher.test.ts lib/__tests__/datasetListRoute.test.ts components/Auth/__tests__/RequireSessionRevoked.test.tsx lib/__tests__/rpc.test.ts lib/__tests__/requestErrorHandler.test.ts
command git commit -m "feat: a member removed from a tenancy is sent to choose another" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 20: Verify

**Files:** none changed (a fix goes in its own commit, with its own failing test first).

- [ ] **Step 1: Unit tests**

From the worktree: `npx jest --coverage=false`
Expected: `Test Suites: 128 passed, 128 total` and `Tests: 982 passed, 982 total`. That is the baseline 102 / 841 plus 26 new suites with 138 tests (`sessionAdminClaim` 4, `TenancyConstants` 5, `TenancyIcon` 3, `tenancies` 7, `shareTenancyInvitations` 3, `tenancyRoutes` 14, `tenancyInvitationRoutes` 9, `BFFAPI.tenancies` 8, `tenancyRequests` 10, `tenancySelection` 9, `UseTenancies` 3, `RequestAccessDialog` 5, `TenancyRequestStatus` 8, `TenancySelector` 8, `AvatarButton` 3, `TenancyInvitationsPanel` 6, `ProfileTenancies` 4, `membersAccessPublic` 4, `EmbargoChoicePublic` 3, `ShareInputTenancyInvite` 6, `AccessListTenancyInvitations` 2, `ShareDialogTenancy` 6, `tenancyRevocation` 3, `fetcher` 2, `datasetListRoute` 1, `RequireSessionRevoked` 2) and 3 tests added to existing suites (`AccessPending` 5 → 6, `rpc` +1, `requestErrorHandler` +1). A route test answering `401` means a mocked token lost `v: 2`.

Then: `npx tsc --noEmit -p .`
Expected: no output.

- [ ] **Step 2: Build**

Run: `npm run build`
Expected: exit code 0; the route list shows `/api/tenancies`, `/api/tenancy-requests`, `/api/tenancy-requests/[requestId]`, `/api/tenancy-invitations`, `/api/tenancy-invitations/[invitationId]/accept`, `/api/tenancy-invitations/[invitationId]/decline`, `/api/datasets/[datasetId]/share/lookup`, `/api/datasets/[datasetId]/tenancy-invitations` and `/api/datasets/[datasetId]/tenancy-invitations/[invitationId]`.

- [ ] **Step 3: Start the gatekeeper with PR A, and Mailpit**

PR A must be in the gatekeeper checkout you start: `main` once PR A is merged, otherwise PR A's branch in its worktree (`/Users/caio.maia/workspace/datamap/gatekeeper/.claude/worktrees/rfc-009-tenancies` or wherever the controller built it). Check with `command git -C <checkout> log --oneline -3`.

```bash
cd <gatekeeper checkout with PR A>
export ENV_FILE_PATH=integration-test.env
dc() { docker compose -p rfc-009 -f docker-compose-integration-test.yaml "$@"; }
docker run --rm --privileged --pid=host alpine nsenter -t 1 -m -u -n -i date -u -s "@$(date -u +%s)"
docker ps --format "{{.Names}}\t{{.Ports}}" | grep 5433
dc up -d --build
for i in $(seq 1 60); do code=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:9094/api/v1/health-check/); echo "$i $code"; [ "$code" = "200" ] && break; sleep 3; done
docker exec datamap_postgres_test_integration psql -U gk_admin -d gatekeeper_db -f /tmp/seed_clients.sql
```

Expected: nothing else on 5433 before `up`; the loop ends on `200` within three minutes (if not, `dc logs gatekeeper` before anything else: a migration failure keeps the container unhealthy); the seed inserts the clients, the `data-amazon` tenancies and the Casbin policies. Mailpit at `http://localhost:8025`.

For the commands below:

```bash
KEY=5060b1a2-9aaf-48db-871a-0839007fd478
SECRET=integration-test-not-a-real-secret
GK=http://localhost:9094/api/v1
psqlgk() { docker exec datamap_postgres_test_integration psql -U gk_admin -d gatekeeper_db -c "$1"; }
dispatch() { curl -s -X POST -H "X-Api-Key: $KEY" -H "X-Api-Secret: $SECRET" $GK/internal/notifications/dispatch; echo; }
```

In the worktree's `.env.local` (git-ignored, never committed) set `DATAMAP_BASE_URL=http://localhost:9094/api/v1`, `DATAMAP_API_KEY=$KEY`, `DATAMAP_API_SECRET=$SECRET`, then `npm run dev` from the worktree.

Create four accounts from the sign-up tab of `/account/login` (codes arrive in Mailpit): Ana Souza `ana@example.org`, Bruno Lima `bruno@example.org`, Carla Dias `carla@example.org`, Eva Rocha `eva@example.org`. Then:

```bash
psqlgk "SELECT id, email FROM users WHERE email LIKE '%@example.org' ORDER BY created_at;"
```

Export `ANA`, `BRUNO`, `CARLA`, `EVA` with those ids, and make Carla an admin (Casbin reloads every 5 s):

```bash
psqlgk "INSERT INTO casbin_rule (ptype, v0, v1) VALUES ('g', '$CARLA', 'admin');"
sleep 6
asadmin() { curl -s -H "X-Api-Key: $KEY" -H "X-Api-Secret: $SECRET" -H "X-User-Id: $CARLA" -H "Content-Type: application/json" "$@"; echo; }
asadmin -X POST $GK/admin/tenancies/datamap/production/data-amazon/members -d "{\"user_id\": \"$ANA\"}"
curl -s -X POST $GK/datasets -H "X-Api-Key: $KEY" -H "X-Api-Secret: $SECRET" -H "X-User-Id: $ANA" -H "X-Datamap-Tenancies: datamap/production/data-amazon" -H "Content-Type: application/json" \
  -d '{"name":"GoAmazon 2014/5 — Aerosol size distribution","data":{"description":"e2e","authors":[{"name":"Ana Souza"}],"institution":"USP"},"tenancy":"datamap/production/data-amazon"}'
curl -s -X POST $GK/datasets -H "X-Api-Key: $KEY" -H "X-Api-Secret: $SECRET" -H "X-User-Id: $ANA" -H "X-Datamap-Tenancies: datamap/production/public" -H "Content-Type: application/json" \
  -d '{"name":"Open aerosol optical depth","data":{"description":"e2e","authors":[{"name":"Ana Souza"}],"institution":"USP"},"tenancy":"datamap/production/public"}'
```

Expected: `201` for the member and both datasets; keep the two dataset ids (`D_AMAZON`, `D_PUBLIC`).

- [ ] **Step 4: Manual end-to-end checklist**

Use a separate browser profile (or a private window) per account.

1. **One tenancy, no selector.** Sign in as Bruno → straight to `/app/home`, no selector page; the sidebar footer reads `datamap / production / public`. The avatar menu has no "Switch tenancy" and has "Request access to a tenancy". `/app/profile` lists **Public** with `datamap/production/public` and "Everyone is in public", marked **Current**, and **Request access** with no **Switch tenancy**.
2. **The admin flag.** In Carla's browser, DevTools console: `await (await fetch('/api/auth/session')).json()` → `user.admin` is `true`; in Bruno's, `false`; neither carries `roles`.
3. **Request access.** As Bruno, avatar menu → "Request access to a tenancy" → the 520 px dialog with the copy of the Global Constraints. **Send request** with both fields empty → "Name the tenancy you need." and "Say why you need access.". Type "Data Amazon" and a reason → the dialog closes; the home shows "Your request for Data Amazon is waiting for an administrator · Withdraw"; `/app/profile` shows the dashed row "Requested {today} · waiting for an administrator" in amber with **Withdraw**. Run `dispatch` → Mailpit has "Tenancy request from Bruno Lima" to `datamap-admins@fake.mail.com`.
4. **One pending request.** Request again from the profile → "You already have a request waiting. Withdraw it to send another.". **Withdraw** → the row and the home line disappear. Send and withdraw until the fourth attempt of the day → "You have sent three requests in the last 24 hours. Try again tomorrow." Reset for the next case: `psqlgk "DELETE FROM tenancy_requests WHERE user_id = '$BRUNO';"`, then send one "Data Amazon" request.
5. **Approval reaches the session.** Approve it as Carla:

   ```bash
   REQ=$(asadmin "$GK/admin/tenancy-requests?status=open" | python3 -c 'import json,sys; print(json.load(sys.stdin)["items"][0]["id"])')
   asadmin -X POST $GK/admin/tenancy-requests/$REQ/approve -d '{"tenancy": "datamap/production/data-amazon"}'
   ```

   Focus Bruno's home tab → "Your request for Data Amazon was approved · Switch to Data Amazon", and (no sign-out) the avatar menu now has "Switch tenancy". **Switch to Data Amazon** → home, footer `datamap / production / data-amazon`, the line gone. `dispatch` → "You now have access to Data Amazon" in Mailpit.
6. **More than one tenancy.** As Bruno, avatar → "Switch tenancy" → `/app/tenancy`: "Welcome, Bruno", "Choose the tenancy you want to work in.", **Public** (public icon, `datamap / production / public`) and **Data Amazon** (tenancy icon), "+ Request access to another tenancy". Pick Public → home in Public.
7. **Decline with a message.** As Bruno request "Cerrado Flux"; as Carla:

   ```bash
   REQ=$(asadmin "$GK/admin/tenancy-requests?status=open" | python3 -c 'import json,sys; print(json.load(sys.stdin)["items"][0]["id"])')
   asadmin -X POST $GK/admin/tenancy-requests/$REQ/decline -d '{"message": "Ask a member of the tenancy to invite you from a dataset'"'"'s Share dialog"}'
   ```

   Bruno's `/app/tenancy` and `/app/profile` show "Cerrado Flux", "Declined {today}" and the message in quotes; the home shows no line for it. `dispatch` → "Your request for Cerrado Flux" in Mailpit.
8. **The share dialog invites an outsider.** As Ana (select Data Amazon), open `/app/datasets/$D_AMAZON` → Share. The footer reads "Owners and editors can invite to the tenancy". Type `eva@example.org` → after a moment the card: "EV" avatar, "Eva Rocha", "eva@example.org · not a member of Data Amazon", **Share this dataset only** selected ("Can read · as today"), **Invite to Data Amazon** ("Member of the tenancy · sees its {n} datasets once they accept · administrators are notified"). Choose the invitation → **Send invitation** → *Who has access* shows Eva with the dashed tenancy icon, "Invited to Data Amazon {today} · not accepted yet" and red **Withdraw**. `dispatch` → "Ana Souza invited you to Data Amazon" to Eva and "Ana Souza invited Eva Rocha to Data Amazon" to the admins. **Withdraw** → the row disappears; invite again.
9. **What the lookup does not offer.** In the same dialog type `bruno@example.org` (already a member) → the usual "Invite bruno@example.org" panel, no card; type `nobody@example.org` → the usual panel (the lookup answered `no_account`). In DevTools → Network, each settled email made one `GET /api/datasets/.../share/lookup`.
10. **Accept and decline from the home.** As Eva, the home shows "Ana Souza invited you to Data Amazon" / "{n} datasets · from “GoAmazon 2014/5 — Aerosol size distribution” · {today}" with **Decline** and **Accept**. **Decline** → the card goes. Have Ana invite her again, then **Accept** → the home reloads in Data Amazon (footer `datamap / production / data-amazon`) with no sign-out, and `/app/tenancy` lists both tenancies. `/app/profile` shows the same card before accepting (repeat the invite once to see it there).
11. **Public datasets.** As Ana, switch to Public and open `/app/datasets/$D_PUBLIC` → Share: the *Members of Public* row reads "Everyone on DataMap · can read" with no **Change**; typing `eva@example.org` shows the usual panel and Network shows no `/share/lookup`. The dataset's Settings → Access shows the same row with no **Change**.
12. **New dataset form.** As Ana in Public, `/app/datasets/new`: "Open to the workspace" reads "Visible to every DataMap account; only you and people you share with can edit"; choose **Under embargo** → "When the embargo ends, members of Public can read but not edit." with no **Change**. Switch to Data Amazon and reopen the form → "Every member of Data Amazon can read and download the files."; under embargo → "When the embargo ends, members of Data Amazon can read but not edit." with **Change**. Do not submit (the upload needs the MinIO bucket).
13. **Zero tenancies.** `psqlgk "DELETE FROM users_tenancies WHERE user_id = '$BRUNO';"` (the gatekeeper's public lock covers its API, not SQL). Sign Bruno out and in → `/app/tenancy` shows "You're not in any tenancy", the RFC copy, **Request access** (opens the dialog), the "Shared with me" link and "I already have access — check again". Restore: `psqlgk "INSERT INTO users_tenancies (user_id, tenancy) VALUES ('$BRUNO', 'datamap/production/public'), ('$BRUNO', 'datamap/production/data-amazon');"`, then "check again" → reload, then the selector lists both.
14. **Removed member.** As Eva, select Data Amazon and keep `/app/datasets` open. As Carla: `asadmin -X DELETE $GK/admin/tenancies/datamap/production/data-amazon/members/$EVA`. In Eva's tab, change a filter (or focus the tab) → she lands on `/app/tenancy`, which, with only Public left, opens the home in Public. Then open `/app/datasets/$D_AMAZON` directly with the Data Amazon cookie re-selected from DevTools (`document.cookie` holds `datamap.tenancy-selector-storage`; or repeat before the first redirect) → `/app/tenancy`, not the login page.
15. **Old sessions.** A session signed in before this branch (keep a tab from the main checkout's dev server) keeps working after switching servers: no forced sign-out (`TOKEN_VERSION` is still `2`), `user.admin` reads `false` until the next `update()`.

- [ ] **Step 5: Stop the stack**

```bash
cd <gatekeeper checkout with PR A>
export ENV_FILE_PATH=integration-test.env
dc() { docker compose -p rfc-009 -f docker-compose-integration-test.yaml "$@"; }
dc down
```

---

## Self-review

| RFC 009 / contract requirement | Task |
|---|---|
| `session.user.admin` from `roles` containing `"admin"`, on sign-in and every `update()`, no `TOKEN_VERSION` bump, only the boolean in the session | 2, 20.2, 20.15 |
| `contants/TenancyConstants.ts` with the contract's exact block, plus `tenancyErrorMessage` and B's copy | 3 |
| `TenancySummary`, `GatekeeperPage<T>` (shared) and B's types; `ShareTenancy` / `ShareState` additions | 3 |
| `TenancyIcon` — `public` for the default tenancy, `tenancy` otherwise, dashed when pending | 3 |
| `lib/tenancies.ts` (seven calls, `X-User-Id` only) and the three `lib/share.ts` calls (`buildHeaders`) | 4 |
| BFF user routes on `bffRouter()` (`authOnlyChain`), user from the token, gatekeeper status and `{detail}` forwarded | 5 |
| BFF dataset routes on the `share/candidates.ts` router; invitee from the browser only as `userId` | 6 |
| JSON gate on every `POST`; ids validated before the gatekeeper | 5, 6 |
| BFFAPI methods with the contract's signatures, rejecting with the Axios error; `lookupShareTarget` imperative | 7, 17 |
| SWR keys and options (`/api/tenancies`, `/api/tenancy-requests` and `/api/tenancy-invitations` revalidated on focus) | 8 |
| Selector: one tenancy → selected, home, no page; more → design 1i list; none → `AccessPending` | 8, 12, 20.1, 20.6, 20.13 |
| `/app/tenancy` calls `update()` when `/api/tenancies` and the session differ | 8, 12, 20.5 |
| `AccessPending` rewrite with **Request access**, "Shared with me" and "check again" kept | 11, 12, 20.13 |
| Request dialog (1i, 520 px, Formik + Yup, 1–128 / 1–1000, `409 request_pending` copy, `429`) | 9, 20.3, 20.4 |
| Pending request row with dashed icon, amber "Requested {date} · waiting for an administrator", **Withdraw** | 10, 12, 15, 20.3 |
| Declined in the last 30 days with no newer request: "Declined {date}" and the message | 8, 10, 20.7 |
| Approved request → `update()` and "Switch to {tenancy}" | 8, 10, 14, 20.5 |
| Avatar menu: "Switch tenancy" only with more than one, "Request access to a tenancy" | 13, 20.1 |
| Profile Tenancies: display names, "Everyone is in public", request state, request and switch buttons | 15, 20.1 |
| Home panel (1j): one card per invitation, Decline / Accept, "As Reader" dropped; the request line below | 14, 20.10 |
| Accept → `update()`, select the tenancy, `/app/home` | 14, 20.10 |
| Invitations on the profile too | 15, 20.10 |
| Share dialog: lookup only when `can_invite_to_tenancy` and the tenancy is production, not public, not legacy; debounced; the 1j card with the two options | 17, 18, 20.8, 20.9, 20.11 |
| Pending tenancy invitations in *Who has access* with dashed icon, "Invited to {tenancy} {date} · not accepted yet", **Withdraw** for the inviter | 18, 20.8 |
| Footer "Owners and editors can invite to the tenancy" | 18, 20.8 |
| Members-access toggle hidden for public; *Members of Public* reads "Everyone on DataMap · can read" | 16, 20.11 |
| New-dataset form: Public notice; new datasets start with `members_can_edit = false` | 16, 20.12 |
| `public_members_cannot_edit` explained if it ever reaches the embargo screens | 3 |
| A `401` whose `detail` starts with `unauthorized_tenancy` → clear the selection, `update()`, selector | 19, 20.14 |
| Webapp Jest from the RFC: the selector's three cases, the request form, the home panel calling `update()` and selecting the tenancy, the share card's two options; `hydrateWithUserInfo` setting `admin` | 2, 9, 12, 14, 17 |
| Manual checks against the gatekeeper with PR A and Mailpit | 20 |

Not in the contract, added because the flows break without them: `accountHandler` instead of `bffHandler` (Task 5; `bffHandler` replaces the `401`/`403`/`404` codes with fixed English, so `no_account`, `forbidden`, `request_not_found` and `invitation_not_found` would never reach the browser); the `401` detail in `httpErrorHandler`, the list route's `{detail}` and the fetcher's `error.detail` (Task 19; without them `unauthorized_tenancy` is lost on the way); clearing a selected tenancy the user no longer has (Task 12; otherwise the stale cookie keeps querying it); the redirect of a server-rendered dataset page to the selector (Task 19; it went to the login page).

Left to PR C, which assumes this PR's files: the admin pages, `adminChain`, `adminBffRouter`, `lib/admin.ts`, `AdminConstants.ts`, the `ROUTE_PAGE_ADMIN*` constants and the `RequireSession` admin gate.
