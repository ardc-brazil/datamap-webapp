# RFC 009 PR B — tenancies on the user side (webapp) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** A signed-in person always has somewhere to work and a way to ask for more. The tenancy selector appears only with more than one tenancy. An account with none sees "You're not in any tenancy" with **Request access**. Requests and their answers live on the selector, the profile and the home. Pending tenancy invitations are accepted or declined from the home and the profile. Members of a tenancy open to members invite an existing account into it from the workspace **Members** page. Nobody is offered "members can edit" on a dataset in Public, and no dataset changes tenancy.

**Architecture:** Gatekeeper calls go through two server-side client modules, both sending only `X-User-Id`: `lib/tenancies.ts` (the user's own tenancies, requests and invitations) and `lib/workspace.ts` (the selected tenancy's members, invitations and lookup, with the tenancy path in the gatekeeper URL). Twelve BFF routes proxy them on `bffRouter()` (`authOnlyChain`, so an account with zero tenancies reaches them). Every route answers errors through `accountHandler`, which forwards the gatekeeper status and `{detail}` verbatim. Query and path parameters are checked by the shared helpers of `lib/routeParams.ts` before the gatekeeper is called, and every `POST` passes `requireJsonRequest`. The browser reaches the routes through seven new `BFFAPI` methods (mutations, rejecting with the Axios error) and SWR hooks in `hooks/UseTenancies.ts` and `hooks/UseWorkspace.ts` (reads). The UI is a set of components:
- under `components/Tenancy/`: `TenancyIcon` (shared with PR C), `RequestAccessDialog`, `TenancyRequestRow`/`TenancyRequestNotice`, `AccessPending`, `TenancySelector`, `TenancyInvitationsPanel`, `ProfileTenancies`, mounted by the tenancy, home and profile pages and by the avatar menu;
- under `components/Workspace/`: `InviteMemberDialog`, `WorkspaceInvitations` and `WorkspaceMembers`, mounted by the new page `/app/members`, which the sidebar links to only for a tenancy open to members.

Pure rules live in small `lib/` modules with their own tests: which request to show, which selection applies, whether the session is stale, which tenancy has a Members page, whether a 401 means the tenancy was revoked. The Share dialog stays RFC 003 dataset sharing; it only gains the Public rules in `lib/membersAccess.ts`. The session gains the `admin` flag PR C reads.

**Tech Stack:** Next.js 14 (pages router), NextAuth 4.24.9 (JWT strategy), next-connect 1.0.0-next.4, Axios, SWR 2.2 (`useSWR`, `useSWRInfinite`, global `mutate`), Zustand 5, Formik 2.4 + Yup 1, TailwindCSS 3, Jest 29 + ts-jest, @testing-library/react 14 with `jest-environment-jsdom`.

## Global Constraints

- Worktree: already created. `/Users/caio.maia/workspace/datamap/datamap-webapp/.claude/worktrees/rfc-009-user-side`, branch `feat/rfc-009-user-side` from `origin/main` at `f632843`. `npm ci` is done and `.env.local` is copied in. Baseline: **102 suites, 841 tests**. Every command runs from that directory, never from the main checkout. Every git call is spelled `command git`. Before every commit: `pwd` (must print the worktree path) and `command git branch --show-current` (must print `feat/rfc-009-user-side`).
- Jest: `npx jest --coverage=false <paths>`. `ts-jest` type-checks every test and the code it imports (`tsconfig.json` has `strict: false`), so a type error fails the suite.
- Tests never live under `pages/`. Route and NextAuth tests go in `lib/__tests__/`, component tests in `components/**/__tests__/`, hook tests in `hooks/__tests__/`. A component test starts with the `/** @jest-environment jsdom */` docblock and imports its component from its own file under `components/`, never a page. Any test whose subject imports `components/TenancyStore` (directly, or through `lib/fetcher` or `hooks/UseWorkspace`) mocks that module or the importer, because `typescript-cookie` does not resolve under Jest.
- This PR adds one page, `/app/members` (`pages/app/members/index.tsx`). It goes into `contants/TelemetryConstants.ts` `PAGES` in the task that creates it (Task 22), or "include every page the app has" fails. It also adds three UI events.
- English copy. No comment that narrates code. Constants and copy that are reused live in `contants/TenancyConstants.ts`.
- Forms use Formik and Yup. Reads use SWR; writes go through `BFFAPI`.
- Every commit message ends with a blank line and `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.

### From the contract (`gatekeeper/docs/superpowers/plans/2026-10-05-rfc-009-contract.md`) and what PR A ships, fixed

PR A is `ardc-brazil/gatekeeper#145`. Its shipped route table is in `gatekeeper/.superpowers/sdd/workspace-invitations-report.md` (rounds 1 and 2); its other deviations are in `final-rereview.md` and `final-review-fix-report.md`. Where those and the contract disagree, this plan follows what PR A ships.

- `DEFAULT_TENANCY = "datamap/production/public"`, `PRODUCTION_PREFIX = "datamap/production/"`, `LEGACY_PREFIX = "datamap/staging/"`, `NAMESPACE_PATTERN = /^[a-z0-9-]+$/`, `NAMESPACE_MIN_LENGTH = 2`, `NAMESPACE_MAX_LENGTH = 63`, `DISPLAY_NAME_MAX_LENGTH = 64`, `TENANCY_NAME_MAX_LENGTH = 128`, `REASON_MAX_LENGTH = 1000`, `MESSAGE_MAX_LENGTH = 1000`, `TENANCY_ICON = "tenancy"`, `PUBLIC_TENANCY_ICON = "public"`, `isDefaultTenancy`, `isLegacyTenancy`, `tenancyNamespace` — `contants/TenancyConstants.ts`, created by this PR with exactly the contract's content, plus `tenancyErrorMessage(detail?: string): string`, `TENANCY_PATH_PATTERN` (shared with PR C) and B's copy and keys.
- `TenancyIcon({ tenancy, pending }: { tenancy?: Pick<TenancySummary, "is_default">; pending?: boolean })` in `components/Tenancy/TenancyIcon.tsx`: `public` for the default tenancy, `tenancy` otherwise, dashed outline when `pending`.
- `types/GatekeeperAPI.ts`, after `MembersAccessResponse`, in this order: `TenancySummary { path, display_name, is_default, is_legacy }` and `GatekeeperPage<T> { items, total_count, limit, offset }` (shared), then B's `UserRef { id, name }`, `UserBrief { id, name, email: string | null }`, `TenancyRequest`, `TenancyInvitation { id, tenancy, invited_by, datasets, created_at }` (no `dataset`: PR A removed it), `WorkspaceMember { id, name, orcid: string | null }`, `WorkspaceInvitation { id, user: UserRef, invited_by: UserRef | null, created_at, can_withdraw }`, and, last, `InviteeLookup { user: UserBrief, tenancy_member, invitation_pending, can_invite, datasets }`. `ShareTenancy` gains `is_default`, `is_legacy`, `datasets`. `ShareState` gains nothing: the share state has no tenancy invitation.
- Gatekeeper user routes (self; send only `X-User-Id`): `GET /users/{id}/tenancies` → `200 TenancySummary[]` (enabled tenancies only); `GET /users/{id}/tenancy-requests` → `200 TenancyRequest[]` (latest 5, newest first); `POST /users/{id}/tenancy-requests {tenancy_name, reason}` → `201 TenancyRequest`, `400 tenancy_name_invalid | reason_invalid`, `409 request_pending`, `429 too_many_requests`; `DELETE /users/{id}/tenancy-requests/{request_id}` → `204`, `404 request_not_found`; `GET /users/{id}/tenancy-invitations` → `200 TenancyInvitation[]` (pending only); `POST .../tenancy-invitations/{id}/accept` → `200 {tenancy: TenancySummary}`, `404 invitation_not_found`, `409 tenancy_disabled`; `POST .../decline` → `204`, `404 invitation_not_found`.
- Gatekeeper workspace routes (self + member; send only `X-User-Id`; `{path}` is the tenancy path, unencoded, e.g. `/users/u1/tenancies/datamap/production/atto/members`). Checks run in this order, after request validation (`400 invalid_request`): the caller is a member of `{path}`, else `404 tenancy_not_found` — **admins included**; then the tenancy is open to members, else `409 public_tenancy_locked` (public), `409 legacy_tenancy_read_only` (staging) or `409 tenancy_disabled`; then the route's own errors. Every route answers `401` when `{id}` is not `X-User-Id`.
  - `GET .../members?limit&offset` (limit 1–100, default 50) → `200 GatekeeperPage<WorkspaceMember>`, ordered by name, never an email.
  - `GET .../invitations` → `200 WorkspaceInvitation[]`, pending, newest first.
  - `POST .../invitations {user_id}` → `201 WorkspaceInvitation`; `404 no_account`, `409 already_member`, `409 invitation_pending`.
  - `DELETE .../invitations/{invitation_id}` → `204` (withdrawn); `403 forbidden` (not the inviter), `404 invitation_not_found` (unknown, not pending, or of another tenancy).
  - `GET .../lookup?value=` (exact email or ORCID iD) → `200 InviteeLookup`; `user.email` is `null` when looked up by ORCID iD; `can_invite = !tenancy_member && !invitation_pending`; `datasets` is the tenancy's dataset count; `400 invalid_request`, `404 no_account`.
- Removed from the gatekeeper, so never called: `GET /datasets/{id}/share/lookup`, `POST /datasets/{id}/tenancy-invitations`, `DELETE /datasets/{id}/tenancy-invitations/{id}`. `GET /datasets/{id}/share` keeps RFC 003's shape plus `tenancy.{is_default, is_legacy, datasets}`; under an active embargo `tenancy` is `null`, as on `main`. `PUT /datasets/{id}/members-access` with `true` on Public → `400 public_members_cannot_edit`.
- A dataset never changes tenancy. `PUT /datasets/{id}` with a `tenancy` other than the dataset's own answers `400 tenancy_cannot_change` and saves nothing; for this PR that holds for everyone, admins included. Every edit form keeps sending `props.dataset.tenancy`, and the webapp shows no "move" control.
- A pending invitation can turn `withdrawn` without the inviter doing anything: when an admin adds the invitee as a member, or approves the invitee's request into the same tenancy. It then disappears from the invitee's list and the tenancy's, and any action on it answers `404 invitation_not_found`.
- `POST /users` ignores `roles`. This PR does not touch `lib/users.ts`, so `createUser` keeps sending `"roles": []`, which the gatekeeper ignores.
- `lib/tenancies.ts`: `listMyTenancies(uid)`, `listMyTenancyRequests(uid)`, `createTenancyRequest(uid, { tenancyName, reason })`, `withdrawTenancyRequest(uid, requestId)`, `listMyTenancyInvitations(uid)`, `acceptTenancyInvitation(uid, invitationId)`, `declineTenancyInvitation(uid, invitationId)`. `lib/workspace.ts`: `listWorkspaceMembers(uid, tenancy, { limit, offset })`, `listWorkspaceInvitations(uid, tenancy)`, `inviteToWorkspace(uid, tenancy, userId)`, `withdrawWorkspaceInvitation(uid, tenancy, invitationId)`, `lookupInvitee(uid, tenancy, value)`. Each throws the Axios error on a non-2xx. `lib/share.ts` gains nothing.
- BFF routes: `GET /api/tenancies`; `GET`/`POST /api/tenancy-requests` (browser body `{tenancyName, reason}`); `DELETE /api/tenancy-requests/[requestId]`; `GET /api/tenancy-invitations`; `POST /api/tenancy-invitations/[invitationId]/accept`; `POST /api/tenancy-invitations/[invitationId]/decline`; `GET /api/workspace/members?tenancy&limit&offset`; `GET /api/workspace/invitations?tenancy`; `POST /api/workspace/invitations?tenancy` (browser body `{userId}`, the invitee from `InviteeLookup.user.id`); `DELETE /api/workspace/invitations/[invitationId]?tenancy`; `GET /api/workspace/lookup?tenancy&value`. Files: `pages/api/workspace/members.ts`, `lookup.ts`, `invitations/index.ts`, `invitations/[invitationId].ts`. The tenancy path travels as the `tenancy` query parameter (encoded by the browser). Responses pass the gatekeeper JSON through unchanged (snake_case). The user always comes from the NextAuth token.
- BFFAPI: `requestTenancyAccess(input: { tenancyName: string; reason: string }): Promise<TenancyRequest>`, `withdrawTenancyRequest(requestId: string): Promise<void>`, `acceptTenancyInvitation(invitationId: string): Promise<{ tenancy: TenancySummary }>`, `declineTenancyInvitation(invitationId: string): Promise<void>`, `lookupInvitee(tenancy: string, value: string): Promise<InviteeLookup>`, `inviteToWorkspace(tenancy: string, userId: string): Promise<WorkspaceInvitation>`, `withdrawWorkspaceInvitation(tenancy: string, invitationId: string): Promise<void>`. They reject with the Axios error; callers show `tenancyErrorMessage(e?.response?.data?.detail)`. `lookupInvitee` is imperative and debounced 300 ms in the invite input, not SWR.
- SWR keys: `/api/tenancies` (default options), `/api/tenancy-requests` and `/api/tenancy-invitations` (`revalidateOnFocus: true`), `/api/datasets/${id}/share` (existing, unchanged), `/api/workspace/members?tenancy=${encodeURIComponent(path)}&limit=50&offset=${n}` (`useSWRInfinite`, "Show {n} more"), `/api/workspace/invitations?tenancy=${encodeURIComponent(path)}` (default; revalidated after an invitation is sent or withdrawn).
- Session refresh: accepting an invitation → `update()`, `setTenancySelected(tenancy.path)`, `router.push(ROUTE_PAGE_HOME)`; the latest request turning `approved` → `update()` and offer "Switch to {display_name}"; `/app/tenancy` compares `GET /api/tenancies` paths with `session.user.tenancies` and calls `update()` when they differ; a `401` whose `detail` starts with `unauthorized_tenancy` → clear the selected tenancy, `update()`, go to `ROUTE_PAGE_TENANCY_SELECTOR`.
- Session `admin` flag (the controller assigned it to this PR; the contract lists it under C): `session.user.admin = token.admin === true`, `types/next-auth.d.ts` gains `admin: boolean` on `Session.user`, populated on sign-in and on every `update()`, no `TOKEN_VERSION` bump (stays `2`). The token carries `admin: true` only for an account whose `roles` include `"admin"`, and no `admin` key otherwise; a token without it reads as `false`, exactly as the contract says.

### Decided in this plan, from the real code

- **Errors go through `accountHandler`, not `bffHandler`.** `bffHandler` sends `httpErrorHandler`'s output, which replaces the gatekeeper `detail` with fixed English for `401`, `403` and `404` (`lib/rpc.ts`: "user not authorized…", "user not allowed…", "Resource does not exists"). With it, `no_account`, `forbidden`, `tenancy_not_found`, `request_not_found` and `invitation_not_found` would never reach the browser. `accountHandler` (`lib/accountRoute.ts`) answers `res.status(status).json({ detail: response?.data?.detail ?? "unavailable" })`, and `pages/api/account/password.ts` already pairs it with `bffRouter()`. Every route of this PR uses it.
- **Every `POST` passes `requireJsonRequest`** (exported from `lib/accountRoute.ts`, `415 {detail: "invalid_request"}` when the `Content-Type` is not `application/json`). `BFFAPI` posts `{}` to the body-less accept and decline routes so Axios sends `application/json`.
- **Parameters are checked by `lib/routeParams.ts`** before the gatekeeper is called, and each helper answers the error itself and returns `undefined`. `invalidRequest(res)` answers `400 {detail: "invalid_request"}`. `uuidOr404(req, res, name, detail)` answers, for example, `404 {detail: "request_not_found"}` for a bad `requestId`. `tenancyOr400` accepts only a `tenancy` matching `TENANCY_PATH_PATTERN = /^[A-Za-z0-9_-]+(\/[A-Za-z0-9_-]+)+$/`, because the path goes into the gatekeeper URL unencoded and `..` must never reach it. `pageOr400(req, res, defaultLimit)` parses whole-number `limit`/`offset`. `userIdOr400` takes a UUID `userId` from the body. PR C's `lib/adminRoute.ts` re-exports these instead of writing its own.
- **`asUser(uid)` is exported once, from `lib/tenancies.ts`**; `lib/workspace.ts` (and PR C's `lib/admin.ts`) import it.
- **The Members page is `/app/members`** (`ROUTE_PAGE_MEMBERS`), a sibling of Home, Datasets and Notebooks. The sidebar shows a **Members** entry (icon `group`) after Notebooks, only when the selected tenancy is one of the user's enabled tenancies (`GET /api/tenancies`), not Public and not legacy. The page itself says so for any other selection, and maps the gatekeeper's `404`/`409` codes to their sentences.
- **A revoked tenancy reaches the browser.** Today it cannot: `httpErrorHandler` drops the `401` detail, `pages/api/datasets/index.ts` ends a failed list with an empty body, and `lib/fetcher.js` reads no body on error. This PR keeps the `401` detail in `httpErrorHandler`, makes the list route answer `{detail}`, attaches `error.detail` in the fetcher, recovers in a `SWRConfig` `onError` inside `RequireSession`, and sends a server-rendered dataset page to the selector. The workspace reads use the same `error.detail` to say why the Members page cannot load.
- **A gone invitation leaves the list.** When accept, decline or withdraw answers `404 invitation_not_found` (an admin closed it, or it was answered elsewhere), the list it came from is revalidated, so the row disappears, and the sentence says it may have been withdrawn.
- **SWR keys, the 30-day window, B's copy and the workspace key builders (`workspaceMembersKey`, `workspaceInvitationsKey`) live in `contants/TenancyConstants.ts`**, so components import the keys without importing `lib/fetcher` (and so `TenancyStore`).
- **`TenancyIcon` is 32 px** (`h-8 w-8`, `rounded-md`, icon 18 px), the size of the Share dialog's avatar column; the contract fixes no size and no size prop.
- Verbatim copy (RFC 009 and the design's 1i/1j):
  - selector: "Welcome, {first name}" / "Choose the tenancy you want to work in."; "Requested {date} · waiting for an administrator" (amber, `text-embargo-800`); "Declined {date}"; "+ Request access to another tenancy";
  - zero tenancies: "You're not in any tenancy" / "Your account is not part of any tenancy, so there is nothing to work in yet. Ask for access to the group or project you work with; an administrator reviews it and you're emailed with the answer.";
  - request dialog: "Request access" / "Name the tenancy you need. An administrator reviews it; you're emailed with the answer." / field **Tenancy** with helper "The name of the group or project. If it exists, this is a request to join; if not, a request to create it. Only administrators can tell which." / field **Why** / **Cancel** / **Send request**; `409 request_pending` → "You already have a request waiting. Withdraw it to send another.";
  - home: card "{inviter} invited you to {tenancy}" / "{n} datasets · {date}" / **Decline** / **Accept**; line "Your request for {name} is waiting for an administrator · Withdraw";
  - Members page: **+ Invite**; invite card "Member of the tenancy · sees its {n} datasets once they accept · administrators are notified"; pending row "{invitee} · invited by {inviter} {date} · not accepted yet" with **Withdraw**;
  - Public: members row "Everyone on DataMap · can read"; new-dataset hint "Visible to every DataMap account; only you and people you share with can edit"; profile "Everyone is in public";
  - avatar menu: "Request access to a tenancy".
- Tailwind tokens for the design's literals: ink `primary-900`, secondary text `primary-600`, muted `primary-500`, borders `primary-200`/`primary-300`, icon chip `secondary-500` (`#E9F0EF`), avatar `secondary-900` (`#D7E4E3`), amber `embargo-800` on `embargo-100`, red `danger-700`.

---

## File Structure

| File | Responsibility |
|---|---|
| `pages/api/auth/[...nextauth].ts` (modify) | `hydrateWithUserInfo` sets/drops `token.admin`; the session callback exposes `session.user.admin` |
| `types/next-auth.d.ts` (modify) | `Session.user.admin: boolean`, `JWT.admin?: boolean` |
| `contants/TenancyConstants.ts` (create) | Contract constants, `TENANCY_PATH_PATTERN`, SWR keys and key builders, B copy, `tenancyErrorMessage` |
| `contants/EmbargoConstants.ts` (modify) | `messageForApiError` maps `public_members_cannot_edit` and `tenancy_cannot_change` |
| `contants/TelemetryConstants.ts` (modify) | UI events `tenancy_access_requested`, `tenancy_invitation_accepted`, `tenancy_invitation_sent`; page `/app/members` |
| `contants/InternalRoutesConstants.ts` (modify) | `ROUTE_PAGE_MEMBERS` |
| `types/GatekeeperAPI.ts` (modify) | RFC 009 shapes; `ShareTenancy` additions |
| `components/Tenancy/TenancyIcon.tsx` (create) | The shared tenancy chip |
| `lib/tenancies.ts` (create) | Gatekeeper self routes; `asUser` |
| `lib/workspace.ts` (create) | Gatekeeper workspace routes |
| `lib/routeParams.ts` (create) | `invalidRequest`, `uuidOr404`, `tenancyOr400`, `pageOr400`, `userIdOr400` |
| `pages/api/tenancies/index.ts` (create) | `GET` the user's tenancies |
| `pages/api/tenancy-requests/index.ts` (create) | `GET` list, `POST` create |
| `pages/api/tenancy-requests/[requestId].ts` (create) | `DELETE` withdraw |
| `pages/api/tenancy-invitations/index.ts` (create) | `GET` pending invitations |
| `pages/api/tenancy-invitations/[invitationId]/accept.ts` (create) | `POST` accept |
| `pages/api/tenancy-invitations/[invitationId]/decline.ts` (create) | `POST` decline |
| `pages/api/workspace/members.ts` (create) | `GET` a page of members |
| `pages/api/workspace/lookup.ts` (create) | `GET` exact email/ORCID lookup |
| `pages/api/workspace/invitations/index.ts` (create) | `GET` pending, `POST` invite |
| `pages/api/workspace/invitations/[invitationId].ts` (create) | `DELETE` withdraw |
| `gateways/BFFAPI.ts` (modify) | Seven methods |
| `lib/tenancyRequests.ts` (create) | Which request outcome to show; whether an approval is missing from the session |
| `lib/tenancySelection.ts` (create) | Selection rule, stale-session check, first name, path label, which tenancy has a Members page |
| `hooks/UseTenancies.ts` (create) | SWR hooks; `useLatestTenancyRequest` calls `update()` on approval |
| `hooks/UseWorkspace.ts` (create) | `useMembersPageTenancy`, `useWorkspaceMembers` (infinite), `useWorkspaceInvitations` |
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
| `components/Share/ShareDialog.tsx` (modify) | Public members row |
| `components/Embargo/AccessSummary.tsx` (modify) | Public members row |
| `components/Embargo/EmbargoChoice.tsx` (modify) | `isPublic`: Public hint, no members toggle |
| `components/Embargo/EmbargoFields.tsx` (modify) | `membersEditable` hides "Change" |
| `components/Embargo/SetEmbargoDialog.tsx` (modify) | Passes `membersEditable` |
| `pages/app/datasets/new.tsx` (modify) | New datasets start with members read-only; `isPublic` |
| `lib/tenancyRevocation.ts` (create) | `isTenancyRevoked(status, detail)` |
| `lib/rpc.ts` (modify) | `401` keeps the gatekeeper `detail` |
| `pages/api/datasets/index.ts` (modify) | A failed list answers `{detail}` |
| `lib/fetcher.js` (modify) | Errors carry `detail` |
| `components/Auth/RequireSession.tsx` (modify) | `SWRConfig` `onError` recovers from a revoked tenancy |
| `lib/requestErrorHandler.ts` (modify) | A revoked tenancy on a dataset page goes to the selector |
| `pages/api/datasets/[datasetId].ts` (modify) | A failed `PUT` answers `{detail}`, so `tenancy_cannot_change` reaches the browser |
| `components/Workspace/InviteMemberDialog.tsx` (create) | Formik + Yup invite input, debounced lookup, the account card, **Send invitation** |
| `components/Workspace/WorkspaceInvitations.tsx` (create) | Pending invitations with **Withdraw** for the inviter |
| `components/Workspace/WorkspaceMembers.tsx` (create) | The Members page body: members 50 at a time, invitations, **+ Invite** |
| `pages/app/members/index.tsx` (create) | The Members page |
| `components/LoggedLayout.tsx` (modify) | The sidebar **Members** entry |
| Tests | `lib/__tests__/sessionAdminClaim.test.ts`, `contants/__tests__/TenancyConstants.test.ts`, `components/Tenancy/__tests__/TenancyIcon.test.tsx`, `lib/__tests__/tenancies.test.ts`, `lib/__tests__/workspace.test.ts`, `lib/__tests__/tenancyRoutes.test.ts`, `lib/__tests__/workspaceRoutes.test.ts`, `gateways/__tests__/BFFAPI.tenancies.test.ts`, `lib/__tests__/tenancyRequests.test.ts`, `lib/__tests__/tenancySelection.test.ts`, `hooks/__tests__/UseTenancies.test.tsx`, `components/Tenancy/__tests__/RequestAccessDialog.test.tsx`, `components/Tenancy/__tests__/TenancyRequestStatus.test.tsx`, `components/Tenancy/__tests__/AccessPending.test.tsx` (rewritten), `components/Tenancy/__tests__/TenancySelector.test.tsx`, `components/Profile/__tests__/AvatarButton.test.tsx`, `components/Tenancy/__tests__/TenancyInvitationsPanel.test.tsx`, `components/Tenancy/__tests__/ProfileTenancies.test.tsx`, `lib/__tests__/membersAccessPublic.test.ts`, `components/Embargo/__tests__/EmbargoChoicePublic.test.tsx`, `components/Share/__tests__/ShareDialogPublic.test.tsx`, `lib/__tests__/tenancyRevocation.test.ts`, `lib/__tests__/fetcher.test.ts`, `lib/__tests__/datasetListRoute.test.ts`, `components/Auth/__tests__/RequireSessionRevoked.test.tsx`, `lib/__tests__/datasetUpdateRoute.test.ts`, `hooks/__tests__/UseWorkspace.test.ts`, `components/Workspace/__tests__/InviteMemberDialog.test.tsx`, `components/Workspace/__tests__/WorkspaceInvitations.test.tsx`, `components/Workspace/__tests__/WorkspaceMembers.test.tsx`, `components/Workspace/__tests__/LoggedLayoutMembers.test.tsx`; additions to `lib/__tests__/rpc.test.ts`, `lib/__tests__/requestErrorHandler.test.ts`, `components/DatasetDetails/__tests__/DatasetColaboratorsForm.test.tsx` and `contants/__tests__/TelemetryConstants.test.ts` |

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
- Produces: everything in the contract's `TenancyConstants.ts` block; `TENANCY_PATH_PATTERN`, `TENANCIES_KEY`, `TENANCY_REQUESTS_KEY`, `TENANCY_INVITATIONS_KEY`, `WORKSPACE_PAGE_SIZE = 50`, `REQUEST_OUTCOME_VISIBLE_DAYS = 30`, `PUBLIC_TENANCY_NOTE`, `PUBLIC_MEMBERS_DETAIL`, `PUBLIC_DATASET_HINT`, `REQUEST_PENDING_MESSAGE`, `TENANCY_GENERIC_ERROR_MESSAGE`, `TENANCY_ERROR_MESSAGES`, `tenancyErrorMessage(detail?: string): string`; the types listed in the Global Constraints; `TenancyIcon`.

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
    TENANCY_PATH_PATTERN,
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

    test("a tenancy path is plain segments, nothing that could leave the gatekeeper route it is put in", () => {
        expect(TENANCY_PATH_PATTERN.test("datamap/production/atto")).toBe(true);
        expect(TENANCY_PATH_PATTERN.test("datamap/staging/data-amazon")).toBe(true);
        for (const value of ["atto", "datamap/../users", "datamap//atto", "datamap/production/atto?x=1", "/datamap/production/atto", "datamap/production/atto/", "../../admin/tenancies"]) {
            expect(TENANCY_PATH_PATTERN.test(value)).toBe(false);
        }
    });

    test("a known error code has its own sentence", () => {
        expect(tenancyErrorMessage("request_pending")).toBe("You already have a request waiting. Withdraw it to send another.");
        expect(tenancyErrorMessage("too_many_requests")).toBe("You have sent three requests in the last 24 hours. Try again tomorrow.");
        expect(tenancyErrorMessage("tenancy_not_found")).toBe("You are not a member of this tenancy.");
        expect(tenancyErrorMessage("forbidden")).toBe("Only the member who sent an invitation can withdraw it.");
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

    test("a dataset sent with another tenancy is told that datasets stay where they were created", () => {
        const error = new APIError("BAD_REQUEST", 400, "tenancy_cannot_change", true, undefined, "tenancy_cannot_change");

        expect(messageForApiError(error)).toBe("A dataset stays in the tenancy it was created in.");
        expect(tenancyErrorMessage("tenancy_cannot_change")).toBe("A dataset stays in the tenancy it was created in.");
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

/** Slash-separated segments only: no `..`, no empty segment, nothing a URL would read as more than a path. */
export const TENANCY_PATH_PATTERN = /^[A-Za-z0-9_-]+(\/[A-Za-z0-9_-]+)+$/;

export const TENANCIES_KEY = "/api/tenancies";
export const TENANCY_REQUESTS_KEY = "/api/tenancy-requests";
export const TENANCY_INVITATIONS_KEY = "/api/tenancy-invitations";

export const WORKSPACE_PAGE_SIZE = 50;
export const REQUEST_OUTCOME_VISIBLE_DAYS = 30;

export const PUBLIC_TENANCY_NOTE = "Everyone is in public";
export const PUBLIC_MEMBERS_DETAIL = "Everyone on DataMap · can read";
export const PUBLIC_DATASET_HINT = "Visible to every DataMap account; only you and people you share with can edit";
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
    tenancy_not_found: "You are not a member of this tenancy.",
    tenancy_disabled: "This tenancy is disabled, so nobody can join it now.",
    no_account: "No DataMap account has this email or ORCID iD.",
    already_member: "This person is already a member of the tenancy.",
    invitation_pending: "This person already has an invitation to the tenancy waiting.",
    public_tenancy_locked: "Everyone on DataMap is in Public, so it has no Members page.",
    legacy_tenancy_read_only: "Legacy tenancies are read-only, so they have no Members page.",
    forbidden: "Only the member who sent an invitation can withdraw it.",
    public_members_cannot_edit: "Members of Public can only read. Share the dataset with the people who should edit it.",
    tenancy_cannot_change: "A dataset stays in the tenancy it was created in.",
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
    const detail = typeof apiError?.detail === "string" ? apiError.detail : undefined;
    if (detail === "public_members_cannot_edit" || detail === "tenancy_cannot_change") {
        return tenancyErrorMessage(detail);
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
    datasets: number
    created_at: string
}

/** @interface */
export interface WorkspaceMember {
    id: string
    name: string
    orcid: string | null
}

/** @interface */
export interface WorkspaceInvitation {
    id: string
    user: UserRef
    invited_by: UserRef | null
    created_at: string
    can_withdraw: boolean
}

/** @interface */
export interface InviteeLookup {
    user: UserBrief
    tenancy_member: boolean
    invitation_pending: boolean
    can_invite: boolean
    datasets: number
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
Expected: PASS (7 + 3 new tests; the existing share suites build their states as `any`, so the new required `ShareTenancy` fields do not break them).

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
- Create: `lib/workspace.ts`
- Test: `lib/__tests__/tenancies.test.ts`, `lib/__tests__/workspace.test.ts`

**Interfaces:**
- Consumes: `axiosInstance` from `lib/rpc.ts`; the types of Task 3.
- Produces: the twelve client functions of the contract, with the signatures in the Global Constraints, and `asUser(uid: string): { headers: { "X-User-Id": string } }` exported from `lib/tenancies.ts`.

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

Create `lib/__tests__/workspace.test.ts`:

```ts
import { inviteToWorkspace, listWorkspaceInvitations, listWorkspaceMembers, lookupInvitee, withdrawWorkspaceInvitation } from "../workspace";
import axiosInstance from "../rpc";

jest.mock("../rpc");
const mockGet = jest.mocked(axiosInstance.get);
const mockPost = jest.mocked(axiosInstance.post);
const mockDelete = jest.mocked(axiosInstance.delete);

const asUser = { headers: { "X-User-Id": "u1" } };
const AMAZON = "datamap/production/data-amazon";

describe("the workspace calls", () => {
    test("members put the path in the URL as it is, and the page in parameters", async () => {
        mockGet.mockResolvedValue({ data: { items: [], total_count: 0, limit: 50, offset: 50 } });

        await listWorkspaceMembers("u1", AMAZON, { limit: 50, offset: 50 });

        expect(mockGet).toHaveBeenCalledWith("/users/u1/tenancies/datamap/production/data-amazon/members", { ...asUser, params: { limit: 50, offset: 50 } });
    });

    test("pending invitations of the tenancy", async () => {
        mockGet.mockResolvedValue({ data: [{ id: "ti1" }] });

        expect(await listWorkspaceInvitations("u1", AMAZON)).toEqual([{ id: "ti1" }]);
        expect(mockGet).toHaveBeenCalledWith("/users/u1/tenancies/datamap/production/data-amazon/invitations", asUser);
    });

    test("inviting sends the invitee in the gatekeeper's names", async () => {
        mockPost.mockResolvedValue({ data: { id: "ti1", can_withdraw: true } });

        expect(await inviteToWorkspace("u1", AMAZON, "u7")).toEqual({ id: "ti1", can_withdraw: true });
        expect(mockPost).toHaveBeenCalledWith("/users/u1/tenancies/datamap/production/data-amazon/invitations", { user_id: "u7" }, asUser);
    });

    test("withdrawing deletes the invitation", async () => {
        mockDelete.mockResolvedValue({ status: 204 });

        await expect(withdrawWorkspaceInvitation("u1", AMAZON, "ti1")).resolves.toBeUndefined();
        expect(mockDelete).toHaveBeenCalledWith("/users/u1/tenancies/datamap/production/data-amazon/invitations/ti1", asUser);
    });

    test("the lookup sends the typed value as a parameter", async () => {
        mockGet.mockResolvedValue({ data: { user: { id: "u7" }, can_invite: true, datasets: 108 } });

        expect(await lookupInvitee("u1", AMAZON, "fernanda@inpe.br")).toEqual({ user: { id: "u7" }, can_invite: true, datasets: 108 });
        expect(mockGet).toHaveBeenCalledWith("/users/u1/tenancies/datamap/production/data-amazon/lookup", { ...asUser, params: { value: "fernanda@inpe.br" } });
    });
});
```

- [ ] **Step 2: Run them and watch them fail**

Run: `npx jest --coverage=false lib/__tests__/tenancies.test.ts lib/__tests__/workspace.test.ts`
Expected: FAIL — `Cannot find module '../tenancies'` and `Cannot find module '../workspace'`.

- [ ] **Step 3: Implement**

Create `lib/tenancies.ts`:

```ts
import { TenancyInvitation, TenancyRequest, TenancySummary } from "../types/GatekeeperAPI";
import axiosInstance from "./rpc";

/** Self routes span tenancies, so they carry only the acting user, never a tenancy header. */
export function asUser(uid: string) {
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

Create `lib/workspace.ts`:

```ts
import { GatekeeperPage, InviteeLookup, WorkspaceInvitation, WorkspaceMember } from "../types/GatekeeperAPI";
import axiosInstance from "./rpc";
import { asUser } from "./tenancies";

function workspaceRoute(uid: string, tenancy: string, rest: string): string {
    return `/users/${uid}/tenancies/${tenancy}/${rest}`;
}

export async function listWorkspaceMembers(uid: string, tenancy: string, page: { limit: number; offset: number }): Promise<GatekeeperPage<WorkspaceMember>> {
    const response = await axiosInstance.get(workspaceRoute(uid, tenancy, "members"), { ...asUser(uid), params: { limit: page.limit, offset: page.offset } });
    return response.data as GatekeeperPage<WorkspaceMember>;
}

export async function listWorkspaceInvitations(uid: string, tenancy: string): Promise<WorkspaceInvitation[]> {
    const response = await axiosInstance.get(workspaceRoute(uid, tenancy, "invitations"), asUser(uid));
    return response.data as WorkspaceInvitation[];
}

export async function inviteToWorkspace(uid: string, tenancy: string, userId: string): Promise<WorkspaceInvitation> {
    const response = await axiosInstance.post(workspaceRoute(uid, tenancy, "invitations"), { user_id: userId }, asUser(uid));
    return response.data as WorkspaceInvitation;
}

export async function withdrawWorkspaceInvitation(uid: string, tenancy: string, invitationId: string): Promise<void> {
    await axiosInstance.delete(workspaceRoute(uid, tenancy, `invitations/${invitationId}`), asUser(uid));
}

export async function lookupInvitee(uid: string, tenancy: string, value: string): Promise<InviteeLookup> {
    const response = await axiosInstance.get(workspaceRoute(uid, tenancy, "lookup"), { ...asUser(uid), params: { value } });
    return response.data as InviteeLookup;
}
```

- [ ] **Step 4: Run them**

Run: `npx jest --coverage=false lib/__tests__/tenancies.test.ts lib/__tests__/workspace.test.ts`
Expected: PASS (7 + 5 new tests).

- [ ] **Step 5: Commit**

```bash
pwd
command git branch --show-current
command git add lib/tenancies.ts lib/workspace.ts lib/__tests__/tenancies.test.ts lib/__tests__/workspace.test.ts
command git commit -m "feat: gatekeeper calls for tenancy requests, invitations and the workspace members" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 5: BFF routes for the user's tenancies, requests and invitations

**Files:**
- Create: `lib/routeParams.ts`
- Create: `pages/api/tenancies/index.ts`
- Create: `pages/api/tenancy-requests/index.ts`
- Create: `pages/api/tenancy-requests/[requestId].ts`
- Create: `pages/api/tenancy-invitations/index.ts`
- Create: `pages/api/tenancy-invitations/[invitationId]/accept.ts`
- Create: `pages/api/tenancy-invitations/[invitationId]/decline.ts`
- Test: `lib/__tests__/tenancyRoutes.test.ts`

**Interfaces:**
- Consumes: `bffRouter()` (`lib/bffRoute.ts`), `accountHandler`, `requireJsonRequest`, `isUuid` (`lib/accountRoute.ts`), `NewContext` (`lib/appLocalContext.ts`), the seven functions of `lib/tenancies.ts`.
- Produces: the seven user routes of the contract. The uid is `NewContext(req).uid`, from the token. `lib/routeParams.ts` with `invalidRequest(res): undefined` (`400 {detail: "invalid_request"}`) and `uuidOr404(req, res, name, detail): string | undefined`; Task 6 adds the tenancy, page and invitee helpers to it.

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

Create `lib/routeParams.ts`:

```ts
import type { NextApiRequest, NextApiResponse } from "next";
import { isUuid } from "./accountRoute";

export function invalidRequest(res: NextApiResponse): undefined {
    res.status(400).json({ detail: "invalid_request" });
    return undefined;
}

export function uuidOr404(req: NextApiRequest, res: NextApiResponse, name: string, detail: string): string | undefined {
    const value = req.query[name];
    if (isUuid(value)) {
        return value;
    }
    res.status(404).json({ detail });
    return undefined;
}
```

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
import { invalidRequest } from "../../../lib/routeParams";
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
            invalidRequest(res);
            return;
        }
        const { uid } = await NewContext(req);
        res.status(201).json(await createTenancyRequest(uid, { tenancyName, reason }));
    });

export default accountHandler(router);
```

Create `pages/api/tenancy-requests/[requestId].ts`:

```ts
import { accountHandler } from "../../../lib/accountRoute";
import { NewContext } from "../../../lib/appLocalContext";
import { bffRouter } from "../../../lib/bffRoute";
import { uuidOr404 } from "../../../lib/routeParams";
import { withdrawTenancyRequest } from "../../../lib/tenancies";

const router = bffRouter()
    .delete(async (req, res) => {
        const requestId = uuidOr404(req, res, "requestId", "request_not_found");
        if (!requestId) {
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
import { accountHandler, requireJsonRequest } from "../../../../lib/accountRoute";
import { NewContext } from "../../../../lib/appLocalContext";
import { bffRouter } from "../../../../lib/bffRoute";
import { uuidOr404 } from "../../../../lib/routeParams";
import { acceptTenancyInvitation } from "../../../../lib/tenancies";

const router = bffRouter()
    .post(requireJsonRequest, async (req, res) => {
        const invitationId = uuidOr404(req, res, "invitationId", "invitation_not_found");
        if (!invitationId) {
            return;
        }
        const { uid } = await NewContext(req);
        res.json(await acceptTenancyInvitation(uid, invitationId));
    });

export default accountHandler(router);
```

Create `pages/api/tenancy-invitations/[invitationId]/decline.ts`:

```ts
import { accountHandler, requireJsonRequest } from "../../../../lib/accountRoute";
import { NewContext } from "../../../../lib/appLocalContext";
import { bffRouter } from "../../../../lib/bffRoute";
import { uuidOr404 } from "../../../../lib/routeParams";
import { declineTenancyInvitation } from "../../../../lib/tenancies";

const router = bffRouter()
    .post(requireJsonRequest, async (req, res) => {
        const invitationId = uuidOr404(req, res, "invitationId", "invitation_not_found");
        if (!invitationId) {
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
command git add lib/routeParams.ts pages/api/tenancies pages/api/tenancy-requests pages/api/tenancy-invitations lib/__tests__/tenancyRoutes.test.ts
command git commit -m "feat: BFF routes for the user's tenancies, requests and invitations" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 6: BFF routes for the workspace Members page

**Files:**
- Modify: `lib/routeParams.ts`
- Create: `pages/api/workspace/members.ts`
- Create: `pages/api/workspace/lookup.ts`
- Create: `pages/api/workspace/invitations/index.ts`
- Create: `pages/api/workspace/invitations/[invitationId].ts`
- Test: `lib/__tests__/workspaceRoutes.test.ts`

**Interfaces:**
- Consumes: `bffRouter()`, `accountHandler`, `requireJsonRequest`, `isUuid`, `NewContext`, `invalidRequest` and `uuidOr404` (Task 5), `TENANCY_PATH_PATTERN` and `WORKSPACE_PAGE_SIZE` (Task 3), the five functions of `lib/workspace.ts`.
- Produces: `tenancyOr400(req, res): string | undefined`, `pageOr400(req, res, defaultLimit: number): { limit: number; offset: number } | undefined`, `userIdOr400(req, res): string | undefined` in `lib/routeParams.ts`; `GET /api/workspace/members?tenancy&limit&offset`, `GET /api/workspace/lookup?tenancy&value`, `GET`/`POST /api/workspace/invitations?tenancy` (`{userId}` → `201`), `DELETE /api/workspace/invitations/[invitationId]?tenancy` (`204`). The gatekeeper decides membership; the BFF only checks the shape of what the browser sent.

- [ ] **Step 1: Write the failing test**

Create `lib/__tests__/workspaceRoutes.test.ts`:

```ts
jest.mock("next-auth/jwt", () => ({ getToken: jest.fn(async () => ({ uid: "u1", v: 2 })) }));
jest.mock("../workspace");

import { AxiosError, AxiosHeaders } from "axios";
import withdrawHandler from "../../pages/api/workspace/invitations/[invitationId]";
import invitationsHandler from "../../pages/api/workspace/invitations/index";
import lookupHandler from "../../pages/api/workspace/lookup";
import membersHandler from "../../pages/api/workspace/members";
import { inviteToWorkspace, listWorkspaceInvitations, listWorkspaceMembers, lookupInvitee, withdrawWorkspaceInvitation } from "../workspace";

const JSON_HEADERS = { "content-type": "application/json" };
const AMAZON = "datamap/production/data-amazon";
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
        await handler({ method, url: "/api/workspace/x", headers, cookies: {}, query, body } as any, res);
    } finally {
        process.stdout.write = original;
    }
    return res;
}

beforeEach(() => {
    jest.mocked(listWorkspaceMembers).mockReset();
    jest.mocked(listWorkspaceInvitations).mockReset();
    jest.mocked(inviteToWorkspace).mockReset();
    jest.mocked(withdrawWorkspaceInvitation).mockReset();
    jest.mocked(lookupInvitee).mockReset();
});

describe("the workspace BFF routes", () => {
    test("members are read for the user in the token, 50 at a time from the start", async () => {
        jest.mocked(listWorkspaceMembers).mockResolvedValue({ items: [], total_count: 0, limit: 50, offset: 0 });

        const res = await send(membersHandler, "GET", { tenancy: AMAZON });

        expect(res.statusCode).toBe(200);
        expect(listWorkspaceMembers).toHaveBeenCalledWith("u1", AMAZON, { limit: 50, offset: 0 });
        expect(res.json).toHaveBeenCalledWith({ items: [], total_count: 0, limit: 50, offset: 0 });
    });

    test("the next page is asked for by its offset", async () => {
        jest.mocked(listWorkspaceMembers).mockResolvedValue({ items: [], total_count: 120, limit: 50, offset: 50 });

        await send(membersHandler, "GET", { tenancy: AMAZON, limit: "50", offset: "50" });

        expect(listWorkspaceMembers).toHaveBeenCalledWith("u1", AMAZON, { limit: 50, offset: 50 });
    });

    test("a tenancy that is not a plain path never reaches the gatekeeper", async () => {
        for (const query of [{}, { tenancy: "../../admin/tenancies/datamap/production/atto" }, { tenancy: "datamap/production/../../users" }, { tenancy: "atto" }]) {
            const res = await send(membersHandler, "GET", query);
            expect(res.statusCode).toBe(400);
            expect(res.json).toHaveBeenCalledWith({ detail: "invalid_request" });
        }
        expect(listWorkspaceMembers).not.toHaveBeenCalled();
    });

    test("paging that is not a whole number is refused", async () => {
        for (const query of [{ tenancy: AMAZON, offset: "-1" }, { tenancy: AMAZON, limit: "ten" }]) {
            const res = await send(membersHandler, "GET", query);
            expect(res.statusCode).toBe(400);
        }
        expect(listWorkspaceMembers).not.toHaveBeenCalled();
    });

    test("someone who is not a member keeps the gatekeeper's 404 code", async () => {
        jest.mocked(listWorkspaceMembers).mockRejectedValue(gatekeeperError(404, { detail: "tenancy_not_found" }));

        const res = await send(membersHandler, "GET", { tenancy: AMAZON });

        expect(res.statusCode).toBe(404);
        expect(res.json).toHaveBeenCalledWith({ detail: "tenancy_not_found" });
    });

    test("Public keeps the gatekeeper's 409 code", async () => {
        jest.mocked(listWorkspaceInvitations).mockRejectedValue(gatekeeperError(409, { detail: "public_tenancy_locked" }));

        const res = await send(invitationsHandler, "GET", { tenancy: "datamap/production/public" });

        expect(res.statusCode).toBe(409);
        expect(res.json).toHaveBeenCalledWith({ detail: "public_tenancy_locked" });
    });

    test("pending invitations of the tenancy", async () => {
        jest.mocked(listWorkspaceInvitations).mockResolvedValue([{ id: INVITATION_ID } as any]);

        const res = await send(invitationsHandler, "GET", { tenancy: AMAZON });

        expect(res.statusCode).toBe(200);
        expect(listWorkspaceInvitations).toHaveBeenCalledWith("u1", AMAZON);
    });

    test("inviting sends the invitee and answers 201", async () => {
        jest.mocked(inviteToWorkspace).mockResolvedValue({ id: INVITATION_ID, can_withdraw: true } as any);

        const res = await send(invitationsHandler, "POST", { tenancy: AMAZON }, { userId: INVITEE }, JSON_HEADERS);

        expect(res.statusCode).toBe(201);
        expect(inviteToWorkspace).toHaveBeenCalledWith("u1", AMAZON, INVITEE);
        expect(res.json).toHaveBeenCalledWith({ id: INVITATION_ID, can_withdraw: true });
    });

    test("an invitee that is not a UUID is invalid_request", async () => {
        const res = await send(invitationsHandler, "POST", { tenancy: AMAZON }, { userId: "u7" }, JSON_HEADERS);

        expect(res.statusCode).toBe(400);
        expect(res.json).toHaveBeenCalledWith({ detail: "invalid_request" });
        expect(inviteToWorkspace).not.toHaveBeenCalled();
    });

    test("an invitation that is not JSON is refused", async () => {
        const res = await send(invitationsHandler, "POST", { tenancy: AMAZON }, `userId=${INVITEE}`, { "content-type": "application/x-www-form-urlencoded" });

        expect(res.statusCode).toBe(415);
        expect(inviteToWorkspace).not.toHaveBeenCalled();
    });

    test("an invitation the gatekeeper refuses keeps its code", async () => {
        jest.mocked(inviteToWorkspace).mockRejectedValue(gatekeeperError(409, { detail: "invitation_pending" }));

        const res = await send(invitationsHandler, "POST", { tenancy: AMAZON }, { userId: INVITEE }, JSON_HEADERS);

        expect(res.statusCode).toBe(409);
        expect(res.json).toHaveBeenCalledWith({ detail: "invitation_pending" });
    });

    test("withdrawing answers 204", async () => {
        jest.mocked(withdrawWorkspaceInvitation).mockResolvedValue(undefined);

        const res = await send(withdrawHandler, "DELETE", { tenancy: AMAZON, invitationId: INVITATION_ID });

        expect(res.statusCode).toBe(204);
        expect(withdrawWorkspaceInvitation).toHaveBeenCalledWith("u1", AMAZON, INVITATION_ID);
    });

    test("withdrawing someone else's invitation keeps the 403 code", async () => {
        jest.mocked(withdrawWorkspaceInvitation).mockRejectedValue(gatekeeperError(403, { detail: "forbidden" }));

        const res = await send(withdrawHandler, "DELETE", { tenancy: AMAZON, invitationId: INVITATION_ID });

        expect(res.statusCode).toBe(403);
        expect(res.json).toHaveBeenCalledWith({ detail: "forbidden" });
    });

    test("an invitation id that is not a UUID is not found, and the gatekeeper is not called", async () => {
        const res = await send(withdrawHandler, "DELETE", { tenancy: AMAZON, invitationId: "../members" });

        expect(res.statusCode).toBe(404);
        expect(res.json).toHaveBeenCalledWith({ detail: "invitation_not_found" });
        expect(withdrawWorkspaceInvitation).not.toHaveBeenCalled();
    });

    test("the lookup passes the typed value, trimmed", async () => {
        jest.mocked(lookupInvitee).mockResolvedValue({ user: { id: INVITEE }, can_invite: true, datasets: 108 } as any);

        const res = await send(lookupHandler, "GET", { tenancy: AMAZON, value: " fernanda@inpe.br " });

        expect(res.statusCode).toBe(200);
        expect(lookupInvitee).toHaveBeenCalledWith("u1", AMAZON, "fernanda@inpe.br");
        expect(res.json).toHaveBeenCalledWith({ user: { id: INVITEE }, can_invite: true, datasets: 108 });
    });

    test("a lookup without a value is invalid_request; an unknown account keeps its 404 code", async () => {
        const empty = await send(lookupHandler, "GET", { tenancy: AMAZON, value: "  " });
        jest.mocked(lookupInvitee).mockRejectedValue(gatekeeperError(404, { detail: "no_account" }));
        const unknown = await send(lookupHandler, "GET", { tenancy: AMAZON, value: "nobody@inpe.br" });

        expect(empty.statusCode).toBe(400);
        expect(empty.json).toHaveBeenCalledWith({ detail: "invalid_request" });
        expect(unknown.statusCode).toBe(404);
        expect(unknown.json).toHaveBeenCalledWith({ detail: "no_account" });
        expect(lookupInvitee).toHaveBeenCalledTimes(1);
    });
});
```

- [ ] **Step 2: Run it and watch it fail**

Run: `npx jest --coverage=false lib/__tests__/workspaceRoutes.test.ts`
Expected: FAIL — `Cannot find module '../../pages/api/workspace/invitations/[invitationId]'`.

- [ ] **Step 3: Implement**

In `lib/routeParams.ts`, replace:

```ts
import type { NextApiRequest, NextApiResponse } from "next";
import { isUuid } from "./accountRoute";
```

with:

```ts
import type { NextApiRequest, NextApiResponse } from "next";
import { TENANCY_PATH_PATTERN } from "../contants/TenancyConstants";
import { isUuid } from "./accountRoute";

const WHOLE_NUMBER = /^\d+$/;

function wholeNumber(value: string | string[] | undefined, fallback: number): number | null {
    if (value === undefined) {
        return fallback;
    }
    return typeof value === "string" && WHOLE_NUMBER.test(value) ? Number(value) : null;
}
```

and append to `lib/routeParams.ts`:

```ts

export function tenancyOr400(req: NextApiRequest, res: NextApiResponse): string | undefined {
    const value = req.query.tenancy;
    return typeof value === "string" && TENANCY_PATH_PATTERN.test(value) ? value : invalidRequest(res);
}

export function pageOr400(req: NextApiRequest, res: NextApiResponse, defaultLimit: number): { limit: number; offset: number } | undefined {
    const limit = wholeNumber(req.query.limit, defaultLimit);
    const offset = wholeNumber(req.query.offset, 0);
    return limit === null || offset === null ? invalidRequest(res) : { limit, offset };
}

export function userIdOr400(req: NextApiRequest, res: NextApiResponse): string | undefined {
    const userId = req.body?.userId;
    return isUuid(userId) ? userId : invalidRequest(res);
}
```

Create `pages/api/workspace/members.ts`:

```ts
import { WORKSPACE_PAGE_SIZE } from "../../../contants/TenancyConstants";
import { accountHandler } from "../../../lib/accountRoute";
import { NewContext } from "../../../lib/appLocalContext";
import { bffRouter } from "../../../lib/bffRoute";
import { pageOr400, tenancyOr400 } from "../../../lib/routeParams";
import { listWorkspaceMembers } from "../../../lib/workspace";

const router = bffRouter()
    .get(async (req, res) => {
        const tenancy = tenancyOr400(req, res);
        if (!tenancy) {
            return;
        }
        const page = pageOr400(req, res, WORKSPACE_PAGE_SIZE);
        if (!page) {
            return;
        }
        const { uid } = await NewContext(req);
        res.json(await listWorkspaceMembers(uid, tenancy, page));
    });

export default accountHandler(router);
```

Create `pages/api/workspace/lookup.ts`:

```ts
import { accountHandler } from "../../../lib/accountRoute";
import { NewContext } from "../../../lib/appLocalContext";
import { bffRouter } from "../../../lib/bffRoute";
import { invalidRequest, tenancyOr400 } from "../../../lib/routeParams";
import { lookupInvitee } from "../../../lib/workspace";

const router = bffRouter()
    .get(async (req, res) => {
        const tenancy = tenancyOr400(req, res);
        if (!tenancy) {
            return;
        }
        const value = typeof req.query.value === "string" ? req.query.value.trim() : "";
        if (!value) {
            invalidRequest(res);
            return;
        }
        const { uid } = await NewContext(req);
        res.json(await lookupInvitee(uid, tenancy, value));
    });

export default accountHandler(router);
```

Create `pages/api/workspace/invitations/index.ts`:

```ts
import { accountHandler, requireJsonRequest } from "../../../../lib/accountRoute";
import { NewContext } from "../../../../lib/appLocalContext";
import { bffRouter } from "../../../../lib/bffRoute";
import { tenancyOr400, userIdOr400 } from "../../../../lib/routeParams";
import { inviteToWorkspace, listWorkspaceInvitations } from "../../../../lib/workspace";

const router = bffRouter()
    .get(async (req, res) => {
        const tenancy = tenancyOr400(req, res);
        if (!tenancy) {
            return;
        }
        const { uid } = await NewContext(req);
        res.json(await listWorkspaceInvitations(uid, tenancy));
    })
    .post(requireJsonRequest, async (req, res) => {
        const tenancy = tenancyOr400(req, res);
        if (!tenancy) {
            return;
        }
        const userId = userIdOr400(req, res);
        if (!userId) {
            return;
        }
        const { uid } = await NewContext(req);
        res.status(201).json(await inviteToWorkspace(uid, tenancy, userId));
    });

export default accountHandler(router);
```

Create `pages/api/workspace/invitations/[invitationId].ts`:

```ts
import { accountHandler } from "../../../../lib/accountRoute";
import { NewContext } from "../../../../lib/appLocalContext";
import { bffRouter } from "../../../../lib/bffRoute";
import { tenancyOr400, uuidOr404 } from "../../../../lib/routeParams";
import { withdrawWorkspaceInvitation } from "../../../../lib/workspace";

const router = bffRouter()
    .delete(async (req, res) => {
        const tenancy = tenancyOr400(req, res);
        if (!tenancy) {
            return;
        }
        const invitationId = uuidOr404(req, res, "invitationId", "invitation_not_found");
        if (!invitationId) {
            return;
        }
        const { uid } = await NewContext(req);
        await withdrawWorkspaceInvitation(uid, tenancy, invitationId);
        res.status(204).end();
    });

export default accountHandler(router);
```

- [ ] **Step 4: Run it and the user routes again**

Run: `npx jest --coverage=false lib/__tests__/workspaceRoutes.test.ts lib/__tests__/tenancyRoutes.test.ts lib/__tests__/serverLogging.invariant.test.ts`
Expected: PASS (16 new tests; `tenancyRoutes` unchanged at 14).

- [ ] **Step 5: Commit**

```bash
pwd
command git branch --show-current
command git add lib/routeParams.ts pages/api/workspace lib/__tests__/workspaceRoutes.test.ts
command git commit -m "feat: BFF routes for the workspace members, lookup and invitations" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
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
const AMAZON = "datamap/production/data-amazon";

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
        jest.mocked(axios.post).mockResolvedValue({ status: 200, data: { tenancy: { path: AMAZON } } });

        expect(await bff.acceptTenancyInvitation("ti1")).toEqual({ tenancy: { path: AMAZON } });
        expect(axios.post).toHaveBeenCalledWith("/api/tenancy-invitations/ti1/accept", {});
        expect(trackUiEvent).toHaveBeenCalledWith("tenancy_invitation_accepted");
    });

    test("declining posts JSON", async () => {
        jest.mocked(axios.post).mockResolvedValue({ status: 204 });

        await bff.declineTenancyInvitation("ti1");

        expect(axios.post).toHaveBeenCalledWith("/api/tenancy-invitations/ti1/decline", {});
    });

    test("the lookup encodes the tenancy and the typed value", async () => {
        jest.mocked(axios.get).mockResolvedValue({ status: 200, data: { can_invite: true } });

        expect(await bff.lookupInvitee(AMAZON, "a+b@inpe.br")).toEqual({ can_invite: true });
        expect(axios.get).toHaveBeenCalledWith("/api/workspace/lookup?tenancy=datamap%2Fproduction%2Fdata-amazon&value=a%2Bb%40inpe.br");
    });

    test("inviting sends the invitee and is counted", async () => {
        jest.mocked(axios.post).mockResolvedValue({ status: 201, data: { id: "ti1" } });

        expect(await bff.inviteToWorkspace(AMAZON, "u7")).toEqual({ id: "ti1" });
        expect(axios.post).toHaveBeenCalledWith("/api/workspace/invitations?tenancy=datamap%2Fproduction%2Fdata-amazon", { userId: "u7" });
        expect(trackUiEvent).toHaveBeenCalledWith("tenancy_invitation_sent");
    });

    test("withdrawing an invitation deletes it", async () => {
        jest.mocked(axios.delete).mockResolvedValue({ status: 204 });

        await bff.withdrawWorkspaceInvitation(AMAZON, "ti1");

        expect(axios.delete).toHaveBeenCalledWith("/api/workspace/invitations/ti1?tenancy=datamap%2Fproduction%2Fdata-amazon");
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
    InviteeLookup,
    TenancyRequest,
    TenancySummary,
    WorkspaceInvitation,
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

    async lookupInvitee(tenancy: string, value: string): Promise<InviteeLookup> {
        const response = await axios.get(`/api/workspace/lookup?tenancy=${encodeURIComponent(tenancy)}&value=${encodeURIComponent(value)}`);
        return response.data as InviteeLookup;
    }

    async inviteToWorkspace(tenancy: string, userId: string): Promise<WorkspaceInvitation> {
        const response = await axios.post(`/api/workspace/invitations?tenancy=${encodeURIComponent(tenancy)}`, { userId });
        trackUiEvent("tenancy_invitation_sent");
        return response.data as WorkspaceInvitation;
    }

    async withdrawWorkspaceInvitation(tenancy: string, invitationId: string): Promise<void> {
        await axios.delete(`/api/workspace/invitations/${encodeURIComponent(invitationId)}?tenancy=${encodeURIComponent(tenancy)}`);
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
command git commit -m "feat: BFFAPI methods for tenancy requests, invitations and the workspace" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
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
Expected: PASS (6 tests; the suite had 5). `pages/app/tenancy/index.tsx` still renders `<AccessPending />` without the prop until Task 12; `ts-jest` does not compile that page, and Task 12 replaces it before the type check in Task 24.

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
- Produces: `TenancyInvitationsPanel(props: { className?: string })` — one card per pending invitation (design 1j: `tenancy` icon, "{inviter} invited you to {tenancy}", "{n} datasets · {date}", **Decline** / **Accept**; "As Reader" and the design's "from “{dataset}”" dropped, since an invitation belongs to the tenancy and PR A sends no dataset). Accept: `acceptTenancyInvitation` → `update()` → `setTenancySelected(tenancy.path)` → revalidate → `Router.push(ROUTE_PAGE_HOME)`. A `404 invitation_not_found` (withdrawn by the inviter or closed by an admin meanwhile) shows its sentence and revalidates, so the card leaves. Renders nothing without invitations.

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
    test("one card per invitation, with who, where and how many datasets", () => {
        render(<TenancyInvitationsPanel />);

        expect(screen.getByText("Luciana Rizzo invited you to Data Amazon")).toBeTruthy();
        expect(screen.getByText("108 datasets · Oct 4")).toBeTruthy();
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

    test("an invitation closed meanwhile says so and leaves the list", async () => {
        acceptTenancyInvitation.mockReset().mockRejectedValue({ response: { status: 404, data: { detail: "invitation_not_found" } } });
        render(<TenancyInvitationsPanel />);

        fireEvent.click(screen.getByRole("button", { name: "Accept" }));

        await waitFor(() => expect(screen.getByRole("alert").textContent).toBe("This invitation is no longer open. It may have been withdrawn."));
        expect(mutate).toHaveBeenCalled();
        expect(update).not.toHaveBeenCalled();
        expect(push).not.toHaveBeenCalled();
    });

    test("without invitations nothing is shown", () => {
        invitations = [];
        const { container } = render(<TenancyInvitationsPanel />);

        expect(container.innerHTML).toBe("");
    });

    test("an invitation without an inviter still reads well", () => {
        invitations = [{ ...invitation, invited_by: null, datasets: 1 }];
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
    return `${invitation.datasets} ${invitation.datasets === 1 ? "dataset" : "datasets"} · ${formatShortDate(invitation.created_at, false)}`;
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

    async function failed(e: any) {
        const detail = e?.response?.data?.detail;
        setError(tenancyErrorMessage(detail));
        if (detail === "invitation_not_found") {
            await mutate();
        }
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
            await failed(e);
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
            await failed(e);
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
- Test: `lib/__tests__/membersAccessPublic.test.ts`, `components/Embargo/__tests__/EmbargoChoicePublic.test.tsx`, `components/Share/__tests__/ShareDialogPublic.test.tsx`

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

Create `components/Share/__tests__/ShareDialogPublic.test.tsx`:

```tsx
/** @jest-environment jsdom */
import { describe, expect, jest, test } from '@jest/globals';
import { render, screen } from '@testing-library/react';

const shareState: any = {
    owner: { id: "o", name: "Ana Souza", email: "ana@example.org" },
    permissions: [],
    invitations: [],
    anonymous_links: [],
    tenancy: { name: "Public", path: "datamap/production/public", members: 47, members_can_edit: false, is_default: true, is_legacy: false, datasets: 300 },
};

jest.mock("../../../gateways/BFFAPI", () => ({ BFFAPI: jest.fn().mockImplementation(() => ({})) }));
jest.mock("swr", () => ({
    __esModule: true,
    default: () => ({ data: shareState, error: undefined, mutate: jest.fn() }),
}));
jest.mock("next-auth/react", () => ({ useSession: () => ({ data: null }) }));
jest.mock("next/router", () => ({ useRouter: () => ({ replace: jest.fn(async () => true), asPath: "/app/datasets/d3" }) }));
jest.mock("../../../lib/fetcher", () => ({ fetcher: jest.fn() }));
jest.mock("../ShareInput", () => ({ ShareInput: () => null }));

import { ShareDialog } from "../ShareDialog";

const publicDataset: any = { id: "d3", name: "Open aerosol optical depth", tenancy: "datamap/production/public", embargo: null, access: { level: "owner" } };

describe("ShareDialog in Public", () => {
    test("members are everyone on DataMap and there is nothing to change", () => {
        render(<ShareDialog dataset={publicDataset} show onClose={jest.fn()} />);

        expect(screen.getByText("Members of Public")).toBeTruthy();
        expect(screen.getByText("Everyone on DataMap · can read")).toBeTruthy();
        expect(screen.queryByRole("button", { name: "Change what members of Public can do" })).toBeNull();
    });
});
```

- [ ] **Step 2: Run them and watch them fail**

Run: `npx jest --coverage=false lib/__tests__/membersAccessPublic.test.ts components/Embargo/__tests__/EmbargoChoicePublic.test.tsx components/Share/__tests__/ShareDialogPublic.test.tsx`
Expected: FAIL — `membersCanEditOf` answers `true` for Public, `everyone` is not a known option (type error), `isPublic` is not a prop of `EmbargoChoice` (type error), and the dialog's members row reads "47 people · …" instead of "Everyone on DataMap · can read".

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
Expected: PASS (4 + 3 + 1 new tests). The existing `EmbargoChoice`, `SetEmbargoDialog`, `AccessSummary` and `ShareDialog` tests keep passing: their datasets are in `data-amazon` and set `membersCanEdit` explicitly or start from the column.

- [ ] **Step 5: Commit**

```bash
pwd
command git branch --show-current
command git add lib/membersAccess.ts components/Share/ShareDialog.tsx components/Embargo/AccessSummary.tsx components/Embargo/EmbargoChoice.tsx components/Embargo/EmbargoFields.tsx components/Embargo/SetEmbargoDialog.tsx pages/app/datasets/new.tsx lib/__tests__/membersAccessPublic.test.ts components/Embargo/__tests__/EmbargoChoicePublic.test.tsx components/Share/__tests__/ShareDialogPublic.test.tsx
command git commit -m "feat: members of Public only read, and new datasets start read-only for members" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 17: A member removed from a tenancy is sent to choose another

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

### Task 18: A dataset stays in its tenancy

**Files:**
- Modify: `pages/api/datasets/[datasetId].ts`
- Test: `lib/__tests__/datasetUpdateRoute.test.ts`; addition to `components/DatasetDetails/__tests__/DatasetColaboratorsForm.test.tsx`

**Interfaces:**
- Consumes: `updateDataset(context, request)` (`lib/dataset.ts`), `tenancyErrorMessage` / `messageForApiError` (Task 3, which already map `tenancy_cannot_change`).
- Produces: a failed `PUT /api/datasets/[datasetId]` answers the gatekeeper status and `{detail}` instead of an empty body, so `400 tenancy_cannot_change` reaches the browser with its code. No UI changes: there is no "move" control in the webapp today (every `DatasetDetails/*` form and `DatasetDescription` send `props.dataset.tenancy`, and the new-dataset flow sends the tenancy it just created the dataset in), and none is added. A test pins that an edit sends the dataset's own tenancy.

- [ ] **Step 1: Write the failing tests**

Create `lib/__tests__/datasetUpdateRoute.test.ts`:

```ts
jest.mock("next-auth/jwt", () => ({ getToken: jest.fn(async () => ({ uid: "u1", v: 2 })) }));
jest.mock("../dataset");

import { AxiosError, AxiosHeaders } from "axios";
import datasetHandler from "../../pages/api/datasets/[datasetId]";
import { updateDataset } from "../dataset";

const AMAZON = "datamap/production/data-amazon";
const body = { id: "d1", name: "Ozone", data: {}, tenancy: AMAZON, is_enabled: true };

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

async function put() {
    const res = fakeRes();
    const original = process.stdout.write;
    // @ts-ignore
    process.stdout.write = () => true;
    try {
        await datasetHandler({
            method: "PUT", url: "/api/datasets/d1", query: { datasetId: "d1" }, cookies: {}, body,
            headers: { "x-datamap-tenancy": AMAZON },
        } as any, res);
    } finally {
        process.stdout.write = original;
    }
    return res;
}

describe("PUT /api/datasets/[datasetId]", () => {
    test("an edit is passed on with the tenancy the form sent", async () => {
        jest.mocked(updateDataset).mockResolvedValue({});

        const res = await put();

        expect(res.statusCode).toBe(200);
        expect(jest.mocked(updateDataset).mock.calls[0][1]).toEqual(body);
    });

    test("a dataset sent with another tenancy reaches the browser with its code", async () => {
        jest.mocked(updateDataset).mockRejectedValue(new AxiosError("gatekeeper", "ERR", undefined, {}, {
            status: 400, data: { detail: "tenancy_cannot_change" }, statusText: "", headers: {}, config: { headers: new AxiosHeaders() },
        } as any));

        const res = await put();

        expect(res.statusCode).toBe(400);
        expect(res.json).toHaveBeenCalledWith({ detail: "tenancy_cannot_change" });
    });
});
```

In `components/DatasetDetails/__tests__/DatasetColaboratorsForm.test.tsx`, replace:

```tsx
        await waitFor(() => expect(updateDataset).toHaveBeenCalledTimes(1));
        expect(updateDataset.mock.calls[0][0].data.colaborators).toEqual([
            { name: "Ana", permission: "owner" },
            { name: "Bruno" },
        ]);
    });
});
```

with:

```tsx
        await waitFor(() => expect(updateDataset).toHaveBeenCalledTimes(1));
        expect(updateDataset.mock.calls[0][0].data.colaborators).toEqual([
            { name: "Ana", permission: "owner" },
            { name: "Bruno" },
        ]);
    });

    test("an edit keeps the dataset in the tenancy it was created in", async () => {
        updateDataset.mockClear();
        render(<DatasetColaboratorsForm dataset={dataset([{ name: "Ana" }])} user={{} as any} alwaysEdition />);

        fireEvent.submit(screen.getAllByLabelText("Name")[0].closest("form") as HTMLFormElement);

        await waitFor(() => expect(updateDataset).toHaveBeenCalledTimes(1));
        expect(updateDataset.mock.calls[0][0].tenancy).toBe("t");
    });
});
```

- [ ] **Step 2: Run them and watch the route test fail**

Run: `npx jest --coverage=false lib/__tests__/datasetUpdateRoute.test.ts components/DatasetDetails/__tests__/DatasetColaboratorsForm.test.tsx`
Expected: FAIL — "a dataset sent with another tenancy…" gets `res.json` never called (the route ends with an empty body). The form test passes already: it pins today's behaviour so a later change cannot start moving datasets.

- [ ] **Step 3: Implement**

In `pages/api/datasets/[datasetId].ts`, replace:

```ts
      const result = await updateDataset(context, req.body);
      res.json(result);
    } catch (error) {
      res.status(error?.response?.status).end()
    }
```

with:

```ts
      const result = await updateDataset(context, req.body);
      res.json(result);
    } catch (error) {
      res.status(error?.response?.status ?? 502).json({ detail: error?.response?.data?.detail });
    }
```

- [ ] **Step 4: Run them and the dataset suites**

Run: `npx jest --coverage=false lib/__tests__/datasetUpdateRoute.test.ts components/DatasetDetails lib/__tests__/datasetListRoute.test.ts`
Expected: PASS (2 new tests, 1 test added to `DatasetColaboratorsForm`).

- [ ] **Step 5: Commit**

```bash
pwd
command git branch --show-current
command git add "pages/api/datasets/[datasetId].ts" lib/__tests__/datasetUpdateRoute.test.ts components/DatasetDetails/__tests__/DatasetColaboratorsForm.test.tsx
command git commit -m "feat: a dataset keeps its tenancy, and the refusal reaches the browser with its code" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 19: Workspace reads: which tenancy has a Members page, its members and its invitations

**Files:**
- Modify: `contants/TenancyConstants.ts`
- Modify: `lib/tenancySelection.ts`
- Create: `hooks/UseWorkspace.ts`
- Test: `hooks/__tests__/UseWorkspace.test.ts`; additions to `lib/__tests__/tenancySelection.test.ts` and `contants/__tests__/TenancyConstants.test.ts`

**Interfaces:**
- Consumes: `WORKSPACE_PAGE_SIZE` (Task 3), `useMyTenancies` (Task 8), `useTenancyStore`, `fetcher`, `useSWR`, `useSWRInfinite` (`swr/infinite`).
- Produces:
  - `WORKSPACE_LOOKUP_DEBOUNCE_MS = 300`, `workspaceMembersKey(tenancy: string, offset: number): string`, `workspaceInvitationsKey(tenancy: string): string` in `contants/TenancyConstants.ts`;
  - `membersPageTenancy(tenancies: TenancySummary[] | undefined | null, selected: string | undefined | null): TenancySummary | null` in `lib/tenancySelection.ts` — the selected tenancy when it is one of the user's (enabled) tenancies and neither Public nor legacy;
  - `useMembersPageTenancy(): { tenancy: TenancySummary | null; loading: boolean }`, `useWorkspaceMembers(tenancy: string | null)` (`useSWRInfinite` over `GatekeeperPage<WorkspaceMember>`, stops after the last page), `useWorkspaceInvitations(tenancy: string | null)` (`useSWR<WorkspaceInvitation[]>`) in `hooks/UseWorkspace.ts`.

- [ ] **Step 1: Write the failing tests**

In `contants/__tests__/TenancyConstants.test.ts`, replace:

```ts
    TENANCY_PATH_PATTERN,
    isDefaultTenancy,
```

with:

```ts
    TENANCY_PATH_PATTERN,
    isDefaultTenancy,
    workspaceInvitationsKey,
    workspaceMembersKey,
```

and replace:

```ts
        expect(tenancyErrorMessage("tenancy_cannot_change")).toBe("A dataset stays in the tenancy it was created in.");
    });
});
```

with:

```ts
        expect(tenancyErrorMessage("tenancy_cannot_change")).toBe("A dataset stays in the tenancy it was created in.");
    });

    test("the workspace keys carry the tenancy encoded in the query, members 50 at a time", () => {
        expect(workspaceMembersKey("datamap/production/data-amazon", 50)).toBe("/api/workspace/members?tenancy=datamap%2Fproduction%2Fdata-amazon&limit=50&offset=50");
        expect(workspaceInvitationsKey("datamap/production/data-amazon")).toBe("/api/workspace/invitations?tenancy=datamap%2Fproduction%2Fdata-amazon");
    });
});
```

In `lib/__tests__/tenancySelection.test.ts`, replace:

```ts
import { firstNameOf, sessionTenanciesDiffer, tenancyPathLabel, tenancySelectionFor } from "../tenancySelection";
```

with:

```ts
import { firstNameOf, membersPageTenancy, sessionTenanciesDiffer, tenancyPathLabel, tenancySelectionFor } from "../tenancySelection";
```

and replace:

```ts
    test("a path reads with spaced separators", () => {
        expect(tenancyPathLabel("datamap/production/public")).toBe("datamap / production / public");
    });
});
```

with:

```ts
    test("a path reads with spaced separators", () => {
        expect(tenancyPathLabel("datamap/production/public")).toBe("datamap / production / public");
    });
});

describe("which tenancy has a Members page", () => {
    const LEGACY = { path: "datamap/staging/data-amazon", display_name: "Data Amazon", is_default: false, is_legacy: true };

    test("the selected production tenancy the user belongs to", () => {
        expect(membersPageTenancy([PUBLIC, AMAZON], AMAZON.path)).toEqual(AMAZON);
    });

    test("not Public, where everyone is, and not a legacy tenancy, which is read-only", () => {
        expect(membersPageTenancy([PUBLIC, AMAZON, LEGACY], PUBLIC.path)).toBeNull();
        expect(membersPageTenancy([PUBLIC, AMAZON, LEGACY], LEGACY.path)).toBeNull();
    });

    test("not a tenancy the user no longer has or that is disabled, nor before the list has loaded", () => {
        expect(membersPageTenancy([PUBLIC], AMAZON.path)).toBeNull();
        expect(membersPageTenancy(undefined, AMAZON.path)).toBeNull();
        expect(membersPageTenancy([PUBLIC, AMAZON], "")).toBeNull();
    });
});
```

Create `hooks/__tests__/UseWorkspace.test.ts`:

```ts
const mockUseSWR = jest.fn((..._args: unknown[]) => ({ data: undefined }));
const mockUseSWRInfinite = jest.fn((..._args: unknown[]) => ({ data: undefined }));
let mockTenancies: unknown;

jest.mock("swr", () => ({ __esModule: true, default: (...args: unknown[]) => mockUseSWR(...args) }));
jest.mock("swr/infinite", () => ({ __esModule: true, default: (...args: unknown[]) => mockUseSWRInfinite(...args) }));
jest.mock("../../lib/fetcher", () => ({ fetcher: jest.fn() }));
jest.mock("../../components/TenancyStore", () => ({
    useTenancyStore: (selector: (state: unknown) => unknown) => selector({ tenancySelected: "datamap/production/data-amazon" }),
}));
jest.mock("../UseTenancies", () => ({ useMyTenancies: () => ({ data: mockTenancies, error: undefined }) }));

import { fetcher } from "../../lib/fetcher";
import { useMembersPageTenancy, useWorkspaceInvitations, useWorkspaceMembers } from "../UseWorkspace";

type GetKey = (index: number, previous: unknown) => string | null;

const PUBLIC = { path: "datamap/production/public", display_name: "Public", is_default: true, is_legacy: false };
const AMAZON = { path: "datamap/production/data-amazon", display_name: "Data Amazon", is_default: false, is_legacy: false };

function lastCall(mock: jest.Mock): unknown[] {
    return mock.mock.calls[mock.mock.calls.length - 1];
}

function page(offset: number, count: number, total: number) {
    return { items: new Array(count).fill({}), total_count: total, limit: 50, offset };
}

describe("the workspace hooks", () => {
    test("the Members page is for the selected tenancy, once the user's tenancies are known", () => {
        mockTenancies = undefined;
        expect(useMembersPageTenancy()).toEqual({ tenancy: null, loading: true });

        mockTenancies = [PUBLIC, AMAZON];
        expect(useMembersPageTenancy()).toEqual({ tenancy: AMAZON, loading: false });
    });

    test("members load 50 at a time and stop after the last page", () => {
        useWorkspaceMembers(AMAZON.path);

        const [getKey, fetch] = lastCall(mockUseSWRInfinite) as [GetKey, unknown];
        expect(fetch).toBe(fetcher);
        expect(getKey(0, null)).toBe("/api/workspace/members?tenancy=datamap%2Fproduction%2Fdata-amazon&limit=50&offset=0");
        expect(getKey(1, page(0, 50, 120))).toBe("/api/workspace/members?tenancy=datamap%2Fproduction%2Fdata-amazon&limit=50&offset=50");
        expect(getKey(3, page(100, 20, 120))).toBeNull();
    });

    test("without a tenancy nothing is fetched", () => {
        useWorkspaceMembers(null);
        useWorkspaceInvitations(null);

        expect((lastCall(mockUseSWRInfinite)[0] as GetKey)(0, null)).toBeNull();
        expect(mockUseSWR).toHaveBeenLastCalledWith(null, fetcher);
    });

    test("the pending invitations of the tenancy", () => {
        useWorkspaceInvitations(AMAZON.path);

        expect(mockUseSWR).toHaveBeenLastCalledWith("/api/workspace/invitations?tenancy=datamap%2Fproduction%2Fdata-amazon", fetcher);
    });
});
```

- [ ] **Step 2: Run them and watch them fail**

Run: `npx jest --coverage=false hooks/__tests__/UseWorkspace.test.ts lib/__tests__/tenancySelection.test.ts contants/__tests__/TenancyConstants.test.ts`
Expected: FAIL — `Cannot find module '../UseWorkspace'`; `membersPageTenancy`, `workspaceMembersKey` and `workspaceInvitationsKey` are not exported (type errors).

- [ ] **Step 3: Implement**

In `contants/TenancyConstants.ts`, replace:

```ts
export const WORKSPACE_PAGE_SIZE = 50;
```

with:

```ts
export const WORKSPACE_PAGE_SIZE = 50;
export const WORKSPACE_LOOKUP_DEBOUNCE_MS = 300;

export const workspaceMembersKey = (tenancy: string, offset: number) =>
    `/api/workspace/members?tenancy=${encodeURIComponent(tenancy)}&limit=${WORKSPACE_PAGE_SIZE}&offset=${offset}`;
export const workspaceInvitationsKey = (tenancy: string) =>
    `/api/workspace/invitations?tenancy=${encodeURIComponent(tenancy)}`;
```

In `lib/tenancySelection.ts`, replace:

```ts
export function tenancyPathLabel(path: string): string {
    return path.split("/").join(" / ");
}
```

with:

```ts
export function tenancyPathLabel(path: string): string {
    return path.split("/").join(" / ");
}

export function membersPageTenancy(tenancies: TenancySummary[] | undefined | null, selected: string | undefined | null): TenancySummary | null {
    const tenancy = (tenancies ?? []).find((candidate) => candidate.path === selected);
    return tenancy && !tenancy.is_default && !tenancy.is_legacy ? tenancy : null;
}
```

Create `hooks/UseWorkspace.ts`:

```ts
import useSWR from "swr";
import useSWRInfinite from "swr/infinite";
import { useTenancyStore } from "../components/TenancyStore";
import { WORKSPACE_PAGE_SIZE, workspaceInvitationsKey, workspaceMembersKey } from "../contants/TenancyConstants";
import { fetcher } from "../lib/fetcher";
import { membersPageTenancy } from "../lib/tenancySelection";
import { GatekeeperPage, TenancySummary, WorkspaceInvitation, WorkspaceMember } from "../types/GatekeeperAPI";
import { useMyTenancies } from "./UseTenancies";

export function useMembersPageTenancy(): { tenancy: TenancySummary | null; loading: boolean } {
    const { data, error } = useMyTenancies();
    const selected = useTenancyStore((state) => state.tenancySelected);
    return { tenancy: membersPageTenancy(data, selected), loading: !data && !error };
}

export function useWorkspaceMembers(tenancy: string | null) {
    return useSWRInfinite<GatekeeperPage<WorkspaceMember>>(
        (index: number, previous: GatekeeperPage<WorkspaceMember> | null) => {
            if (!tenancy) {
                return null;
            }
            if (previous && previous.offset + previous.items.length >= previous.total_count) {
                return null;
            }
            return workspaceMembersKey(tenancy, index * WORKSPACE_PAGE_SIZE);
        },
        fetcher,
    );
}

export function useWorkspaceInvitations(tenancy: string | null) {
    return useSWR<WorkspaceInvitation[]>(tenancy ? workspaceInvitationsKey(tenancy) : null, fetcher);
}
```

- [ ] **Step 4: Run them**

Run: `npx jest --coverage=false hooks/__tests__/UseWorkspace.test.ts lib/__tests__/tenancySelection.test.ts contants/__tests__/TenancyConstants.test.ts`
Expected: PASS (4 new hook tests; `tenancySelection` 9 → 12; `TenancyConstants` 7 → 8).

- [ ] **Step 5: Commit**

```bash
pwd
command git branch --show-current
command git add contants/TenancyConstants.ts lib/tenancySelection.ts hooks/UseWorkspace.ts hooks/__tests__/UseWorkspace.test.ts lib/__tests__/tenancySelection.test.ts contants/__tests__/TenancyConstants.test.ts
command git commit -m "feat: workspace reads, and which tenancy has a Members page" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 20: The invite dialog

**Files:**
- Create: `components/Workspace/InviteMemberDialog.tsx`
- Test: `components/Workspace/__tests__/InviteMemberDialog.test.tsx`

**Interfaces:**
- Consumes: `BFFAPI.lookupInvitee`, `BFFAPI.inviteToWorkspace`, `classifyShareInput` (`lib/shareTarget.ts`), `useDebouncedValue`, `WORKSPACE_LOOKUP_DEBOUNCE_MS`, `tenancyErrorMessage`, `Modal` (`components/base/PopupModal.tsx`), `PersonInitial`, `EDIT_FORM_*` and `SHARE_PERSON_*` classes.
- Produces: `InviteMemberDialog(props: { tenancy: TenancySummary; show: boolean; onClose(): void; onInvited(): void })` — RFC 009 §Members page, 520 px: title "Invite to {tenancy}", one Formik + Yup field **Email or ORCID iD**. An exact email or ORCID iD is looked up once it settles (300 ms). The card shows the account found: initials, name, the email when it was typed, else "ORCID iD {iD}" (the lookup by iD returns `email: null`), and one of:
  - "Member of the tenancy · sees its {n} datasets once they accept · administrators are notified" (`can_invite`);
  - "Already a member of {tenancy}.";
  - "Already invited to {tenancy} · not accepted yet.".

  `no_account` reads "No DataMap account has this email or ORCID iD.". **Send invitation** is enabled only for `can_invite`; it calls `inviteToWorkspace(tenancy.path, user.id)`, then `onInvited()` and `onClose()`. A refusal is shown through `tenancyErrorMessage` and the dialog stays open.

- [ ] **Step 1: Write the failing test**

Create `components/Workspace/__tests__/InviteMemberDialog.test.tsx`:

```tsx
/** @jest-environment jsdom */
import { afterEach, beforeEach, describe, expect, jest, test } from '@jest/globals';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';

const lookupInvitee = jest.fn() as any;
const inviteToWorkspace = jest.fn() as any;

jest.mock("../../../gateways/BFFAPI", () => ({
    BFFAPI: jest.fn().mockImplementation(() => ({ lookupInvitee, inviteToWorkspace })),
}));

import { InviteMemberDialog } from "../InviteMemberDialog";

const AMAZON = { path: "datamap/production/data-amazon", display_name: "Data Amazon", is_default: false, is_legacy: false };
const outsider = {
    user: { id: "u7", name: "Fernanda Lima", email: "fernanda.lima@inpe.br" },
    tenancy_member: false,
    invitation_pending: false,
    can_invite: true,
    datasets: 108,
};

function renderDialog() {
    const onClose = jest.fn();
    const onInvited = jest.fn();
    render(<InviteMemberDialog tenancy={AMAZON} show onClose={onClose} onInvited={onInvited} />);
    return { onClose, onInvited };
}

function type(text: string) {
    fireEvent.change(screen.getByLabelText("Email or ORCID iD"), { target: { value: text } });
}

async function settle() {
    await act(async () => { jest.advanceTimersByTime(300); });
    await act(async () => { await Promise.resolve(); });
}

function sendButton() {
    return screen.getByRole("button", { name: "Send invitation" }) as HTMLButtonElement;
}

beforeEach(() => {
    jest.useFakeTimers();
    lookupInvitee.mockReset().mockResolvedValue(outsider);
    inviteToWorkspace.mockReset();
});

afterEach(() => {
    jest.useRealTimers();
});

describe("InviteMemberDialog", () => {
    test("an exact email is looked up once typing settles, and the account found can be invited", async () => {
        renderDialog();

        expect(screen.getByRole("dialog", { name: "Invite to Data Amazon" })).toBeTruthy();
        type("fernanda.lima@inpe.br");
        expect(lookupInvitee).not.toHaveBeenCalled();
        await settle();

        expect(lookupInvitee).toHaveBeenCalledWith("datamap/production/data-amazon", "fernanda.lima@inpe.br");
        expect(screen.getByText("Fernanda Lima")).toBeTruthy();
        expect(screen.getByText("fernanda.lima@inpe.br")).toBeTruthy();
        expect(screen.getByText("Member of the tenancy · sees its 108 datasets once they accept · administrators are notified")).toBeTruthy();
        expect(sendButton().disabled).toBe(false);
    });

    test("an account found by ORCID iD shows the iD typed, since its email stays hidden", async () => {
        lookupInvitee.mockResolvedValue({ ...outsider, user: { ...outsider.user, email: null } });
        renderDialog();

        type("https://orcid.org/0000-0002-1825-0097");
        await settle();

        expect(lookupInvitee).toHaveBeenCalledWith("datamap/production/data-amazon", "0000-0002-1825-0097");
        expect(screen.getByText("ORCID iD 0000-0002-1825-0097")).toBeTruthy();
        expect(screen.queryByText(/@/)).toBeNull();
    });

    test("a member cannot be invited again, and the card says so", async () => {
        lookupInvitee.mockResolvedValue({ ...outsider, tenancy_member: true, can_invite: false });
        renderDialog();

        type("fernanda.lima@inpe.br");
        await settle();

        expect(screen.getByText("Already a member of Data Amazon.")).toBeTruthy();
        expect(sendButton().disabled).toBe(true);
    });

    test("someone already invited cannot be invited twice", async () => {
        lookupInvitee.mockResolvedValue({ ...outsider, invitation_pending: true, can_invite: false });
        renderDialog();

        type("fernanda.lima@inpe.br");
        await settle();

        expect(screen.getByText("Already invited to Data Amazon · not accepted yet.")).toBeTruthy();
        expect(sendButton().disabled).toBe(true);
    });

    test("no account behind the value says so", async () => {
        lookupInvitee.mockRejectedValue({ response: { status: 404, data: { detail: "no_account" } } });
        renderDialog();

        type("nobody@inpe.br");
        await settle();

        expect(screen.getByText("No DataMap account has this email or ORCID iD.")).toBeTruthy();
        expect(sendButton().disabled).toBe(true);
    });

    test("a name is not looked up, and the form asks for the full email or ORCID iD", async () => {
        renderDialog();

        type("Fernanda");
        await settle();
        await act(async () => {
            fireEvent.submit(screen.getByLabelText("Email or ORCID iD").closest("form") as HTMLFormElement);
        });

        expect(lookupInvitee).not.toHaveBeenCalled();
        expect(screen.getByText("Type the full email or ORCID iD.")).toBeTruthy();
    });

    test("Send invitation invites the account found, tells the page and closes", async () => {
        inviteToWorkspace.mockResolvedValue({ id: "ti1", can_withdraw: true });
        const { onClose, onInvited } = renderDialog();

        type("fernanda.lima@inpe.br");
        await settle();
        fireEvent.click(sendButton());

        await waitFor(() => expect(onClose).toHaveBeenCalledTimes(1));
        expect(inviteToWorkspace).toHaveBeenCalledWith("datamap/production/data-amazon", "u7");
        expect(onInvited).toHaveBeenCalledTimes(1);
    });

    test("a refusal says why and keeps the dialog open", async () => {
        inviteToWorkspace.mockRejectedValue({ response: { status: 409, data: { detail: "invitation_pending" } } });
        const { onClose } = renderDialog();

        type("fernanda.lima@inpe.br");
        await settle();
        fireEvent.click(sendButton());

        await waitFor(() => expect(screen.getByRole("alert").textContent).toBe("This person already has an invitation to the tenancy waiting."));
        expect(onClose).not.toHaveBeenCalled();
    });
});
```

- [ ] **Step 2: Run it and watch it fail**

Run: `npx jest --coverage=false components/Workspace/__tests__/InviteMemberDialog.test.tsx`
Expected: FAIL — `Cannot find module '../InviteMemberDialog'`.

- [ ] **Step 3: Implement**

Create `components/Workspace/InviteMemberDialog.tsx`:

```tsx
import { useFormik } from "formik";
import { useEffect, useState } from "react";
import * as Yup from "yup";
import { EDIT_FORM_ERROR_CLASS, EDIT_FORM_INPUT_CLASS, EDIT_FORM_LABEL_CLASS } from "../../contants/EditFormConstants";
import { SHARE_PERSON_DETAIL_CLASS, SHARE_PERSON_NAME_CLASS } from "../../contants/ShareConstants";
import { WORKSPACE_LOOKUP_DEBOUNCE_MS, tenancyErrorMessage } from "../../contants/TenancyConstants";
import { BFFAPI } from "../../gateways/BFFAPI";
import { useDebouncedValue } from "../../hooks/UseDebouncedValue";
import { classifyShareInput } from "../../lib/shareTarget";
import { InviteeLookup, TenancySummary } from "../../types/GatekeeperAPI";
import Modal from "../base/PopupModal";
import { PersonInitial } from "../Share/PersonInitial";

type Lookup = { value: string, found: InviteeLookup | null, error: string | null };

function exactValue(raw: string): string | null {
    const target = classifyShareInput(raw);
    return target.kind === "email" || target.kind === "orcid" ? target.value : null;
}

const schema = Yup.object({
    value: Yup.string()
        .trim()
        .required("Type an email or ORCID iD.")
        .test("exact", "Type the full email or ORCID iD.", (value) => exactValue(value ?? "") !== null),
});

function inviteeStatus(found: InviteeLookup, tenancyName: string): string {
    if (found.tenancy_member) {
        return `Already a member of ${tenancyName}.`;
    }
    if (found.invitation_pending) {
        return `Already invited to ${tenancyName} · not accepted yet.`;
    }
    return `Member of the tenancy · sees its ${found.datasets} ${found.datasets === 1 ? "dataset" : "datasets"} once they accept · administrators are notified`;
}

interface Props {
    tenancy: TenancySummary
    show: boolean
    onClose(): void
    onInvited(): void
}

export function InviteMemberDialog(props: Props) {
    const [bffGateway] = useState(() => new BFFAPI());
    const [lookup, setLookup] = useState<Lookup | null>(null);
    const [error, setError] = useState<string | null>(null);
    const formik = useFormik({
        initialValues: { value: "" },
        validationSchema: schema,
        onSubmit: async () => {
            if (!invitee) {
                return;
            }
            setError(null);
            try {
                await bffGateway.inviteToWorkspace(props.tenancy.path, invitee.user.id);
                props.onInvited();
                close();
            } catch (e) {
                setError(tenancyErrorMessage(e?.response?.data?.detail));
            }
        },
    });
    const settled = useDebouncedValue(formik.values.value, WORKSPACE_LOOKUP_DEBOUNCE_MS);

    useEffect(() => {
        const value = exactValue(settled);
        if (!value) {
            setLookup(null);
            return;
        }
        let cancelled = false;
        bffGateway.lookupInvitee(props.tenancy.path, value)
            .then((found) => { if (!cancelled) setLookup({ value, found, error: null }); })
            .catch((e) => { if (!cancelled) setLookup({ value, found: null, error: tenancyErrorMessage(e?.response?.data?.detail) }); });
        return () => { cancelled = true; };
    }, [settled, props.tenancy.path, bffGateway]);

    const typed = classifyShareInput(formik.values.value);
    const current = lookup && lookup.value === exactValue(formik.values.value) ? lookup : null;
    const found = current?.found ?? null;
    const invitee = found?.can_invite ? found : null;

    function close() {
        formik.resetForm();
        setLookup(null);
        setError(null);
        props.onClose();
    }

    return (
        <Modal
            title={`Invite to ${props.tenancy.display_name}`}
            show={props.show}
            confimButtonText="Send invitation"
            cancelButtonText="Cancel"
            cancel={close}
            confim={() => { if (!formik.isSubmitting) formik.submitForm(); }}
            confirmDisabled={!invitee || formik.isSubmitting}
            maxWidthClassName="max-w-[520px]"
        >
            <form noValidate onSubmit={formik.handleSubmit} className="flex flex-col gap-4">
                <p className="m-0 text-sm leading-5 text-primary-600">
                    Type the exact email or ORCID iD of someone with a DataMap account. They accept the invitation in the app.
                </p>
                <div>
                    <label htmlFor="invite-value" className={EDIT_FORM_LABEL_CLASS}>Email or ORCID iD</label>
                    <input id="invite-value" type="text" autoComplete="off" className={EDIT_FORM_INPUT_CLASS} {...formik.getFieldProps("value")} />
                    {typed.kind === "invalid_orcid"
                        ? <p className={EDIT_FORM_ERROR_CLASS}>This ORCID iD is not valid. Check the last digit.</p>
                        : formik.touched.value && formik.errors.value && <p className={EDIT_FORM_ERROR_CLASS}>{formik.errors.value}</p>}
                </div>
                {found &&
                    <div className="grid grid-cols-[32px_minmax(0,1fr)] gap-3 items-center rounded-lg border border-primary-200 bg-primary-0 px-3.5 py-3">
                        <PersonInitial name={found.user.name} />
                        <span className="flex flex-col min-w-0">
                            <span className={SHARE_PERSON_NAME_CLASS}>{found.user.name}</span>
                            <span className={SHARE_PERSON_DETAIL_CLASS}>{found.user.email ?? `ORCID iD ${current.value}`}</span>
                            <span className="mt-1 text-xs leading-[17px] text-primary-600">{inviteeStatus(found, props.tenancy.display_name)}</span>
                        </span>
                    </div>
                }
                {current?.error && <p className="m-0 text-sm text-primary-600">{current.error}</p>}
                {error && <p role="alert" className="m-0 text-sm text-danger-700">{error}</p>}
                <button type="submit" hidden aria-hidden="true" tabIndex={-1} />
            </form>
        </Modal>
    );
}
```

- [ ] **Step 4: Run it**

Run: `npx jest --coverage=false components/Workspace/__tests__/InviteMemberDialog.test.tsx`
Expected: PASS (8 tests).

- [ ] **Step 5: Commit**

```bash
pwd
command git branch --show-current
command git add components/Workspace/InviteMemberDialog.tsx components/Workspace/__tests__/InviteMemberDialog.test.tsx
command git commit -m "feat: invite an existing account into the tenancy by exact email or ORCID iD" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 21: Pending invitations of the tenancy

**Files:**
- Create: `components/Workspace/WorkspaceInvitations.tsx`
- Test: `components/Workspace/__tests__/WorkspaceInvitations.test.tsx`

**Interfaces:**
- Consumes: `useWorkspaceInvitations` (Task 19), `BFFAPI.withdrawWorkspaceInvitation`, `tenancyErrorMessage`, `formatShortDate`, `PersonInitial`, `SHARE_*` classes.
- Produces: `WorkspaceInvitations({ tenancy }: { tenancy: TenancySummary })` — "Pending invitations", one dashed row per invitation: the invitee's name, "invited by {inviter} {date} · not accepted yet", red **Withdraw** only when `can_withdraw`. Withdrawing revalidates the list. `404 invitation_not_found` (accepted, declined, or closed by an admin meanwhile) shows its sentence and revalidates, so the row leaves. Renders nothing without pending invitations.

- [ ] **Step 1: Write the failing test**

Create `components/Workspace/__tests__/WorkspaceInvitations.test.tsx`:

```tsx
/** @jest-environment jsdom */
import { beforeEach, describe, expect, jest, test } from '@jest/globals';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';

const withdrawWorkspaceInvitation = jest.fn() as any;
const mutate = jest.fn() as any;
let invitations: any;

jest.mock("../../../gateways/BFFAPI", () => ({
    BFFAPI: jest.fn().mockImplementation(() => ({ withdrawWorkspaceInvitation })),
}));
jest.mock("../../../hooks/UseWorkspace", () => ({
    useWorkspaceInvitations: () => ({ data: invitations, mutate }),
}));

import { WorkspaceInvitations } from "../WorkspaceInvitations";

const AMAZON = { path: "datamap/production/data-amazon", display_name: "Data Amazon", is_default: false, is_legacy: false };

beforeEach(() => {
    withdrawWorkspaceInvitation.mockReset();
    mutate.mockReset().mockResolvedValue(undefined);
    invitations = [
        { id: "ti1", user: { id: "u5", name: "Rafael Souza" }, invited_by: { id: "u1", name: "Luciana Rizzo" }, created_at: "2026-10-02T10:00:00+00:00", can_withdraw: true },
        { id: "ti2", user: { id: "u6", name: "Marta Silva" }, invited_by: { id: "u2", name: "Alan Calheiros" }, created_at: "2026-10-03T10:00:00+00:00", can_withdraw: false },
    ];
});

describe("WorkspaceInvitations", () => {
    test("each pending invitation says who invited and when, with a dashed icon", () => {
        const { container } = render(<WorkspaceInvitations tenancy={AMAZON} />);

        expect(screen.getByText("Pending invitations")).toBeTruthy();
        expect(screen.getByText("Rafael Souza")).toBeTruthy();
        expect(screen.getByText("invited by Luciana Rizzo Oct 2 · not accepted yet")).toBeTruthy();
        expect(screen.getByText("invited by Alan Calheiros Oct 3 · not accepted yet")).toBeTruthy();
        expect(container.querySelectorAll("span.border-dashed")).toHaveLength(2);
    });

    test("only the inviter can withdraw", () => {
        render(<WorkspaceInvitations tenancy={AMAZON} />);

        expect(screen.getAllByRole("button", { name: /Withdraw the invitation/ })).toHaveLength(1);
        expect(screen.getByRole("button", { name: "Withdraw the invitation of Rafael Souza" })).toBeTruthy();
    });

    test("Withdraw takes the invitation back and refreshes the list", async () => {
        withdrawWorkspaceInvitation.mockResolvedValue(undefined);
        render(<WorkspaceInvitations tenancy={AMAZON} />);

        fireEvent.click(screen.getByRole("button", { name: "Withdraw the invitation of Rafael Souza" }));

        await waitFor(() => expect(mutate).toHaveBeenCalled());
        expect(withdrawWorkspaceInvitation).toHaveBeenCalledWith("datamap/production/data-amazon", "ti1");
    });

    test("an invitation closed meanwhile says so and leaves the list", async () => {
        withdrawWorkspaceInvitation.mockRejectedValue({ response: { status: 404, data: { detail: "invitation_not_found" } } });
        render(<WorkspaceInvitations tenancy={AMAZON} />);

        fireEvent.click(screen.getByRole("button", { name: "Withdraw the invitation of Rafael Souza" }));

        await waitFor(() => expect(screen.getByRole("alert").textContent).toBe("This invitation is no longer open. It may have been withdrawn."));
        expect(mutate).toHaveBeenCalled();
    });

    test("nothing pending, nothing shown", () => {
        invitations = [];
        const { container } = render(<WorkspaceInvitations tenancy={AMAZON} />);

        expect(container.innerHTML).toBe("");
    });
});
```

- [ ] **Step 2: Run it and watch it fail**

Run: `npx jest --coverage=false components/Workspace/__tests__/WorkspaceInvitations.test.tsx`
Expected: FAIL — `Cannot find module '../WorkspaceInvitations'`.

- [ ] **Step 3: Implement**

Create `components/Workspace/WorkspaceInvitations.tsx`:

```tsx
import { useState } from "react";
import {
    SHARE_DANGER_ACTION_CLASS,
    SHARE_PERSON_DETAIL_CLASS,
    SHARE_PERSON_NAME_CLASS,
    SHARE_ROW_CLASS,
    SHARE_SECTION_LABEL_CLASS,
} from "../../contants/ShareConstants";
import { tenancyErrorMessage } from "../../contants/TenancyConstants";
import { BFFAPI } from "../../gateways/BFFAPI";
import { useWorkspaceInvitations } from "../../hooks/UseWorkspace";
import { formatShortDate } from "../../lib/embargoDisplay";
import { TenancySummary, WorkspaceInvitation } from "../../types/GatekeeperAPI";
import { PersonInitial } from "../Share/PersonInitial";

function invitedLine(invitation: WorkspaceInvitation): string {
    const by = invitation.invited_by ? `invited by ${invitation.invited_by.name}` : "invited";
    return `${by} ${formatShortDate(invitation.created_at, false)} · not accepted yet`;
}

export function WorkspaceInvitations({ tenancy }: { tenancy: TenancySummary }) {
    const { data: invitations, mutate } = useWorkspaceInvitations(tenancy.path);
    const [bffGateway] = useState(() => new BFFAPI());
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState<string | null>(null);

    if (!invitations || invitations.length === 0) {
        return null;
    }

    async function withdraw(invitation: WorkspaceInvitation) {
        setBusy(true);
        setError(null);
        try {
            await bffGateway.withdrawWorkspaceInvitation(tenancy.path, invitation.id);
            await mutate();
        } catch (e) {
            const detail = e?.response?.data?.detail;
            setError(tenancyErrorMessage(detail));
            if (detail === "invitation_not_found") {
                await mutate();
            }
        } finally {
            setBusy(false);
        }
    }

    return (
        <section aria-label="Pending invitations" className="mt-10">
            <h3 className={SHARE_SECTION_LABEL_CLASS}>Pending invitations</h3>
            <ul className="m-0 mt-3 p-0 px-4 list-none rounded-lg border border-dashed border-primary-300 bg-primary-0">
                {invitations.map((invitation) => (
                    <li key={invitation.id} className={SHARE_ROW_CLASS}>
                        <PersonInitial pendingIcon="mail" />
                        <span className="flex flex-col min-w-0">
                            <span className={SHARE_PERSON_NAME_CLASS}>{invitation.user.name}</span>
                            <span className={SHARE_PERSON_DETAIL_CLASS}>{invitedLine(invitation)}</span>
                        </span>
                        {invitation.can_withdraw
                            ? <button
                                type="button"
                                aria-label={`Withdraw the invitation of ${invitation.user.name}`}
                                className={SHARE_DANGER_ACTION_CLASS}
                                disabled={busy}
                                onClick={() => withdraw(invitation)}
                            >
                                Withdraw
                            </button>
                            : <span></span>}
                    </li>
                ))}
            </ul>
            {error && <p role="alert" className="m-0 mt-2 text-sm text-danger-700">{error}</p>}
        </section>
    );
}
```

- [ ] **Step 4: Run it**

Run: `npx jest --coverage=false components/Workspace/__tests__/WorkspaceInvitations.test.tsx`
Expected: PASS (5 tests).

- [ ] **Step 5: Commit**

```bash
pwd
command git branch --show-current
command git add components/Workspace/WorkspaceInvitations.tsx components/Workspace/__tests__/WorkspaceInvitations.test.tsx
command git commit -m "feat: pending tenancy invitations, withdrawn by whoever sent them" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 22: The Members page

**Files:**
- Create: `components/Workspace/WorkspaceMembers.tsx`
- Create: `pages/app/members/index.tsx`
- Modify: `contants/InternalRoutesConstants.ts`
- Modify: `contants/TelemetryConstants.ts`
- Test: `components/Workspace/__tests__/WorkspaceMembers.test.tsx`; addition to `contants/__tests__/TelemetryConstants.test.ts`

**Interfaces:**
- Consumes: `useMembersPageTenancy`, `useWorkspaceMembers` (Task 19), `InviteMemberDialog` (Task 20), `WorkspaceInvitations` (Task 21), `workspaceInvitationsKey`, `WORKSPACE_PAGE_SIZE`, `tenancyErrorMessage`, global `mutate` from `swr`, `PersonInitial`, `LoggedLayout`.
- Produces:
  - `ROUTE_PAGE_MEMBERS = ROUTE_APP_CONTEXT + "/members"`;
  - `NO_MEMBERS_PAGE` (exported copy);
  - `WorkspaceMembers()`, which shows:
    - a header "Members" / "{display name} · {path}" with **+ Invite**;
    - "Members · {n}" with the members by name and their ORCID iD when they have one, never an email, 50 at a time with "Show {n} more";
    - the pending invitations, and the invite dialog, whose success revalidates the invitations key;
    - for a selection with no Members page (Public, legacy, not a membership), `NO_MEMBERS_PAGE` and no **+ Invite**;
    - a load error through `tenancyErrorMessage(error.detail)`;
  - the page `/app/members`, listed in `PAGES`.

- [ ] **Step 1: Write the failing tests**

Create `components/Workspace/__tests__/WorkspaceMembers.test.tsx`:

```tsx
/** @jest-environment jsdom */
import { beforeEach, describe, expect, jest, test } from '@jest/globals';
import { fireEvent, render, screen } from '@testing-library/react';

const setSize = jest.fn() as any;
const mutate = jest.fn() as any;
const membersCalls: unknown[] = [];
let pageTenancy: any;
let members: any;

jest.mock("swr", () => ({ __esModule: true, default: jest.fn(), mutate: (...args: unknown[]) => mutate(...args) }));
jest.mock("../../../hooks/UseWorkspace", () => ({
    useMembersPageTenancy: () => pageTenancy,
    useWorkspaceMembers: (tenancy: unknown) => {
        membersCalls.push(tenancy);
        return { ...members, size: 1, setSize, isValidating: false };
    },
}));
jest.mock("../WorkspaceInvitations", () => {
    const React = require("react");
    return { WorkspaceInvitations: (props: any) => React.createElement("p", null, `invitations of ${props.tenancy.display_name}`) };
});
jest.mock("../InviteMemberDialog", () => {
    const React = require("react");
    return {
        InviteMemberDialog: (props: any) => props.show
            ? React.createElement("div", null,
                `inviting to ${props.tenancy.display_name}`,
                React.createElement("button", { type: "button", onClick: props.onInvited }, "stub invited"))
            : null,
    };
});

import { NO_MEMBERS_PAGE, WorkspaceMembers } from "../WorkspaceMembers";

const AMAZON = { path: "datamap/production/data-amazon", display_name: "Data Amazon", is_default: false, is_legacy: false };

function membersPage(items: unknown[], total = items.length) {
    return [{ items, total_count: total, limit: 50, offset: 0 }];
}

beforeEach(() => {
    setSize.mockReset();
    mutate.mockReset();
    membersCalls.length = 0;
    pageTenancy = { tenancy: AMAZON, loading: false };
    members = {
        data: membersPage([
            { id: "m1", name: "Luciana Rizzo", orcid: "0000-0002-1825-0097" },
            { id: "m2", name: "Marcia Yamasoe", orcid: null },
        ]),
    };
});

describe("WorkspaceMembers", () => {
    test("lists the members by name with their ORCID iD, and never an email", () => {
        const { container } = render(<WorkspaceMembers />);

        expect(screen.getByRole("heading", { name: "Members" })).toBeTruthy();
        expect(screen.getByText("datamap/production/data-amazon")).toBeTruthy();
        expect(screen.getByText("Members · 2")).toBeTruthy();
        expect(screen.getByText("Luciana Rizzo")).toBeTruthy();
        expect(screen.getByText("0000-0002-1825-0097")).toBeTruthy();
        expect(screen.getByText("Marcia Yamasoe")).toBeTruthy();
        expect(screen.getByText("invitations of Data Amazon")).toBeTruthy();
        expect(container.textContent).not.toContain("@");
        expect(membersCalls).toEqual(["datamap/production/data-amazon"]);
    });

    test("more than 50 members load 50 more at a time", () => {
        members = { data: membersPage(Array.from({ length: 50 }, (_, i) => ({ id: `m${i}`, name: `Member ${i}`, orcid: null })), 120) };
        render(<WorkspaceMembers />);

        fireEvent.click(screen.getByRole("button", { name: "Show 50 more" }));

        expect(setSize).toHaveBeenCalledWith(2);
    });

    test("Public, a legacy tenancy or a tenancy the user is not in has no Members page and nothing to invite to", () => {
        pageTenancy = { tenancy: null, loading: false };
        render(<WorkspaceMembers />);

        expect(screen.getByText(NO_MEMBERS_PAGE)).toBeTruthy();
        expect(screen.queryByRole("button", { name: "+ Invite" })).toBeNull();
        expect(membersCalls).toEqual([]);
    });

    test("+ Invite opens the dialog for the tenancy, and an invitation refreshes the pending list", () => {
        render(<WorkspaceMembers />);

        fireEvent.click(screen.getByRole("button", { name: "+ Invite" }));
        fireEvent.click(screen.getByRole("button", { name: "stub invited" }));

        expect(screen.getByText("inviting to Data Amazon")).toBeTruthy();
        expect(mutate).toHaveBeenCalledWith("/api/workspace/invitations?tenancy=datamap%2Fproduction%2Fdata-amazon");
    });

    test("a list that cannot load says why", () => {
        members = { error: { status: 404, detail: "tenancy_not_found" } };
        render(<WorkspaceMembers />);

        expect(screen.getByRole("alert").textContent).toBe("You are not a member of this tenancy.");
    });

    test("waits for the user's tenancies before deciding", () => {
        pageTenancy = { tenancy: null, loading: true };
        render(<WorkspaceMembers />);

        expect(screen.getByRole("status").textContent).toBe("Loading…");
        expect(screen.queryByText(NO_MEMBERS_PAGE)).toBeNull();
    });
});
```

In `contants/__tests__/TelemetryConstants.test.ts`, replace:

```ts
describe("members' access", () => {
```

with:

```ts
describe("the workspace Members page", () => {
  it("is a page the browser may report", () => {
    expect(pageLabel("/app/members")).toBe("/app/members");
  });
});

describe("members' access", () => {
```

- [ ] **Step 2: Run them and watch them fail**

Run: `npx jest --coverage=false components/Workspace/__tests__/WorkspaceMembers.test.tsx contants/__tests__/TelemetryConstants.test.ts`
Expected: FAIL — `Cannot find module '../WorkspaceMembers'`; "the workspace Members page" receives `"other"`.

- [ ] **Step 3: Implement**

Create `components/Workspace/WorkspaceMembers.tsx`:

```tsx
import { useState } from "react";
import { mutate } from "swr";
import { SHARE_PERSON_DETAIL_CLASS, SHARE_PERSON_NAME_CLASS, SHARE_ROW_CLASS, SHARE_SECTION_LABEL_CLASS } from "../../contants/ShareConstants";
import { WORKSPACE_PAGE_SIZE, tenancyErrorMessage, workspaceInvitationsKey } from "../../contants/TenancyConstants";
import { useMembersPageTenancy, useWorkspaceMembers } from "../../hooks/UseWorkspace";
import { GatekeeperPage, TenancySummary, WorkspaceMember } from "../../types/GatekeeperAPI";
import { PersonInitial } from "../Share/PersonInitial";
import { InviteMemberDialog } from "./InviteMemberDialog";
import { WorkspaceInvitations } from "./WorkspaceInvitations";

export const NO_MEMBERS_PAGE = "This tenancy has no Members page. Everyone on DataMap is in Public, and legacy tenancies are read-only.";

export function WorkspaceMembers() {
    const { tenancy, loading } = useMembersPageTenancy();

    if (loading) {
        return <p role="status" className="m-0 text-sm text-primary-500">Loading…</p>;
    }
    if (!tenancy) {
        return (
            <div className="w-full max-w-5xl mx-auto">
                <h2 className="m-0">Members</h2>
                <p className="mt-2 mb-0 text-[15px] leading-[23px] text-primary-600">{NO_MEMBERS_PAGE}</p>
            </div>
        );
    }
    return <MembersOf tenancy={tenancy} />;
}

function MembersOf({ tenancy }: { tenancy: TenancySummary }) {
    const { data, error, size, setSize, isValidating } = useWorkspaceMembers(tenancy.path);
    const [inviting, setInviting] = useState(false);

    const pages: GatekeeperPage<WorkspaceMember>[] = data ?? [];
    const members = pages.flatMap((page) => page.items);
    const total = pages[0]?.total_count ?? 0;
    const remaining = Math.min(WORKSPACE_PAGE_SIZE, total - members.length);

    return (
        <div className="w-full max-w-5xl mx-auto">
            <div className="flex flex-wrap justify-between items-end gap-6">
                <div>
                    <h2 className="m-0">Members</h2>
                    <p className="mt-2 mb-0 text-[15px] leading-[23px] text-primary-600">
                        {tenancy.display_name} · <span className="font-mono text-[13px]">{tenancy.path}</span>
                    </p>
                </div>
                <button type="button" className="btn-primary m-0 flex-none" onClick={() => setInviting(true)}>+ Invite</button>
            </div>

            <section aria-label={`Members of ${tenancy.display_name}`} className="mt-8">
                <h3 className={SHARE_SECTION_LABEL_CLASS}>{`Members · ${data ? total : "…"}`}</h3>
                {error ? (
                    <p role="alert" className="m-0 mt-3 text-sm text-danger-700">{tenancyErrorMessage(error.detail)}</p>
                ) : !data ? (
                    <p role="status" className="m-0 mt-3 text-sm text-primary-500">Loading members…</p>
                ) : (
                    <>
                        <ul className="m-0 mt-3 p-0 px-4 list-none rounded-lg border border-primary-200 bg-primary-0 divide-y divide-primary-100">
                            {members.map((member) => (
                                <li key={member.id} className={SHARE_ROW_CLASS}>
                                    <PersonInitial name={member.name} />
                                    <span className="flex flex-col min-w-0">
                                        <span className={SHARE_PERSON_NAME_CLASS}>{member.name}</span>
                                        {member.orcid && <span className={`${SHARE_PERSON_DETAIL_CLASS} font-mono`}>{member.orcid}</span>}
                                    </span>
                                    <span></span>
                                </li>
                            ))}
                        </ul>
                        {remaining > 0 &&
                            <button
                                type="button"
                                disabled={isValidating}
                                onClick={() => setSize(size + 1)}
                                className="mt-3 text-[13px] font-semibold text-primary-900 hover:text-primary-600 disabled:opacity-50"
                            >
                                {`Show ${remaining} more`}
                            </button>}
                    </>
                )}
            </section>

            <WorkspaceInvitations tenancy={tenancy} />
            <InviteMemberDialog
                tenancy={tenancy}
                show={inviting}
                onClose={() => setInviting(false)}
                onInvited={() => mutate(workspaceInvitationsKey(tenancy.path))}
            />
        </div>
    );
}
```

Create `pages/app/members/index.tsx`:

```tsx
import LoggedLayout from "../../../components/LoggedLayout";
import { WorkspaceMembers } from "../../../components/Workspace/WorkspaceMembers";

export default function MembersPage() {
  return (
    <LoggedLayout>
      <WorkspaceMembers />
    </LoggedLayout>
  );
}

MembersPage.auth = {
  role: "admin",
  loading: <div>loading...</div>,
};
```

In `contants/InternalRoutesConstants.ts`, replace:

```ts
export const ROUTE_PAGE_TENANCY_SELECTOR = ROUTE_APP_CONTEXT + "/tenancy";
```

with:

```ts
export const ROUTE_PAGE_TENANCY_SELECTOR = ROUTE_APP_CONTEXT + "/tenancy";

/**
 * Route to the selected tenancy's Members page.
 * @constant
 */
export const ROUTE_PAGE_MEMBERS = ROUTE_APP_CONTEXT + "/members";
```

In `contants/TelemetryConstants.ts`, replace:

```ts
  "/app/home",
  "/app/notebooks",
```

with:

```ts
  "/app/home",
  "/app/members",
  "/app/notebooks",
```

- [ ] **Step 4: Run them and the telemetry page walk**

Run: `npx jest --coverage=false components/Workspace contants/__tests__/TelemetryConstants.test.ts`
Expected: PASS (6 new page tests, the Task 20–21 suites unchanged, `TelemetryConstants` with one more test and "include every page the app has" green with `/app/members`).

- [ ] **Step 5: Commit**

```bash
pwd
command git branch --show-current
command git add components/Workspace/WorkspaceMembers.tsx pages/app/members contants/InternalRoutesConstants.ts contants/TelemetryConstants.ts components/Workspace/__tests__/WorkspaceMembers.test.tsx contants/__tests__/TelemetryConstants.test.ts
command git commit -m "feat: the workspace Members page" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 23: The sidebar leads to the Members page

**Files:**
- Modify: `components/LoggedLayout.tsx`
- Test: `components/Workspace/__tests__/LoggedLayoutMembers.test.tsx`

**Interfaces:**
- Consumes: `useMembersPageTenancy` (Task 19), `ROUTE_PAGE_MEMBERS` (Task 22), `LoggedLayout`'s own `MenuItem`.
- Produces: a **Members** entry (icon `group`) after Notebooks, only when `useMembersPageTenancy().tenancy` is set — that is, for the selected tenancy when it is one of the user's enabled tenancies and neither Public nor legacy. Active on `/app/members` like the other entries.

- [ ] **Step 1: Write the failing test**

Create `components/Workspace/__tests__/LoggedLayoutMembers.test.tsx`:

```tsx
/** @jest-environment jsdom */
import { beforeEach, describe, expect, jest, test } from '@jest/globals';
import { render, screen } from '@testing-library/react';

let mockMembersTenancy: unknown = null;
let mockPathname = "/app/home";

jest.mock("next/head", () => ({ __esModule: true, default: () => null }));
jest.mock("next/router", () => ({
    __esModule: true,
    default: { replace: jest.fn() },
    useRouter: () => ({ pathname: mockPathname }),
}));
jest.mock("../../TenancyStore", () => ({
    useTenancyStore: (selector: (state: unknown) => unknown) => selector({
        isTenancySelected: () => true,
        tenancySelected: "datamap/production/data-amazon",
    }),
}));
jest.mock("../../Profile/AvatarButton", () => ({ __esModule: true, default: () => null }));
jest.mock("../../../hooks/UseWorkspace", () => ({
    useMembersPageTenancy: () => ({ tenancy: mockMembersTenancy, loading: false }),
}));

import LoggedLayout from "../../LoggedLayout";

const AMAZON = { path: "datamap/production/data-amazon", display_name: "Data Amazon", is_default: false, is_legacy: false };

beforeEach(() => {
    mockMembersTenancy = AMAZON;
    mockPathname = "/app/home";
});

describe("the sidebar Members entry", () => {
    test("a member of a tenancy open to members gets it", () => {
        render(<LoggedLayout><p>page</p></LoggedLayout>);

        expect(screen.getByRole("link", { name: /Members/ }).getAttribute("href")).toBe("/app/members");
    });

    test("Public, a legacy tenancy or one the user is not in has none", () => {
        mockMembersTenancy = null;
        render(<LoggedLayout><p>page</p></LoggedLayout>);

        expect(screen.queryByRole("link", { name: /Members/ })).toBeNull();
    });

    test("is marked on the Members page", () => {
        mockPathname = "/app/members";
        render(<LoggedLayout><p>page</p></LoggedLayout>);

        expect(screen.getByRole("link", { name: /Members/ }).className).toContain("bg-secondary-500");
    });
});
```

- [ ] **Step 2: Run it and watch it fail**

Run: `npx jest --coverage=false components/Workspace/__tests__/LoggedLayoutMembers.test.tsx`
Expected: FAIL — no link named "Members".

- [ ] **Step 3: Implement**

In `components/LoggedLayout.tsx`, replace:

```tsx
import { ROUTE_PAGE_DATASETS, ROUTE_PAGE_DATASETS_NEW, ROUTE_PAGE_HOME, ROUTE_PAGE_NOTEBOOKS, ROUTE_PAGE_PROFILE, ROUTE_PAGE_TENANCY_SELECTOR } from "../contants/InternalRoutesConstants";
import useComponentVisible from "../hooks/UseComponentVisible";
```

with:

```tsx
import { ROUTE_PAGE_DATASETS, ROUTE_PAGE_DATASETS_NEW, ROUTE_PAGE_HOME, ROUTE_PAGE_MEMBERS, ROUTE_PAGE_NOTEBOOKS, ROUTE_PAGE_PROFILE, ROUTE_PAGE_TENANCY_SELECTOR } from "../contants/InternalRoutesConstants";
import useComponentVisible from "../hooks/UseComponentVisible";
import { useMembersPageTenancy } from "../hooks/UseWorkspace";
```

replace:

```tsx
  const tenancySelected = useTenancyStore((state) => state.tenancySelected)
```

with:

```tsx
  const tenancySelected = useTenancyStore((state) => state.tenancySelected)
  const { tenancy: membersTenancy } = useMembersPageTenancy();
```

and replace:

```tsx
            <MenuItem href={ROUTE_PAGE_NOTEBOOKS} text="Notebooks" icon="code" collapsed={menuClosed} />
          </ul>
```

with:

```tsx
            <MenuItem href={ROUTE_PAGE_NOTEBOOKS} text="Notebooks" icon="code" collapsed={menuClosed} />
            {membersTenancy && <MenuItem href={ROUTE_PAGE_MEMBERS} text="Members" icon="group" collapsed={menuClosed} />}
          </ul>
```

- [ ] **Step 4: Run it and every suite that renders a page frame**

Run: `npx jest --coverage=false components/Workspace components/Tenancy components/Profile`
Expected: PASS (3 new tests). No other suite renders `LoggedLayout`.

- [ ] **Step 5: Commit**

```bash
pwd
command git branch --show-current
command git add components/LoggedLayout.tsx components/Workspace/__tests__/LoggedLayoutMembers.test.tsx
command git commit -m "feat: the sidebar leads to the Members page of a tenancy open to members" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 24: Verify

**Files:** none changed (a fix goes in its own commit, with its own failing test first).

- [ ] **Step 1: Unit tests**

From the worktree: `npx jest --coverage=false`
Expected: `Test Suites: 132 passed, 132 total` and `Tests: 1014 passed, 1014 total`. That is the baseline 102 / 841 plus:
- 30 new suites with 168 tests: `sessionAdminClaim` 4, `TenancyConstants` 8, `TenancyIcon` 3, `tenancies` 7, `workspace` 5, `tenancyRoutes` 14, `workspaceRoutes` 16, `BFFAPI.tenancies` 8, `tenancyRequests` 10, `tenancySelection` 12, `UseTenancies` 3, `RequestAccessDialog` 5, `TenancyRequestStatus` 8, `TenancySelector` 8, `AvatarButton` 3, `TenancyInvitationsPanel` 6, `ProfileTenancies` 4, `membersAccessPublic` 4, `EmbargoChoicePublic` 3, `ShareDialogPublic` 1, `tenancyRevocation` 3, `fetcher` 2, `datasetListRoute` 1, `RequireSessionRevoked` 2, `datasetUpdateRoute` 2, `UseWorkspace` 4, `InviteMemberDialog` 8, `WorkspaceInvitations` 5, `WorkspaceMembers` 6, `LoggedLayoutMembers` 3;
- 5 tests added to existing suites: `AccessPending` 5 → 6, `rpc` +1, `requestErrorHandler` +1, `DatasetColaboratorsForm` +1, `TelemetryConstants` +1.

A route test answering `401` means a mocked token lost `v: 2`.

Then: `npx tsc --noEmit -p .`
Expected: no output.

- [ ] **Step 2: Build**

Run: `npm run build`
Expected: exit code 0. The route list shows the page `/app/members` and the API routes `/api/tenancies`, `/api/tenancy-requests`, `/api/tenancy-requests/[requestId]`, `/api/tenancy-invitations`, `/api/tenancy-invitations/[invitationId]/accept`, `/api/tenancy-invitations/[invitationId]/decline`, `/api/workspace/members`, `/api/workspace/lookup`, `/api/workspace/invitations` and `/api/workspace/invitations/[invitationId]`. No `/api/datasets/[datasetId]/share/lookup` and no `/api/datasets/[datasetId]/tenancy-invitations`.

- [ ] **Step 3: Start the gatekeeper with PR A, and Mailpit**

PR A must be in the gatekeeper checkout you start: `main` once `ardc-brazil/gatekeeper#145` is merged, otherwise its branch `feat/rfc-009-gatekeeper` (worktree `/Users/caio.maia/workspace/datamap/gatekeeper/.claude/worktrees/rfc-009-gatekeeper`). Check with `command git -C <checkout> log --oneline -3`: the workspace routes arrive with `6cf153a` and are members-only from `1fb512a`.

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

1. **One tenancy, no selector.** Sign in as Bruno → straight to `/app/home`, no selector page; the sidebar footer reads `datamap / production / public` and the sidebar has no **Members** entry. The avatar menu has no "Switch tenancy" and has "Request access to a tenancy". `/app/profile` lists **Public** with `datamap/production/public` and "Everyone is in public", marked **Current**, and **Request access** with no **Switch tenancy**.
2. **The admin flag.** In Carla's browser, DevTools console: `await (await fetch('/api/auth/session')).json()` → `user.admin` is `true`; in Bruno's, `false`; neither carries `roles`.
3. **Request access.** As Bruno, avatar menu → "Request access to a tenancy" → the 520 px dialog with the copy of the Global Constraints. **Send request** with both fields empty → "Name the tenancy you need." and "Say why you need access.". Type "Data Amazon" and a reason → the dialog closes; the home shows "Your request for Data Amazon is waiting for an administrator · Withdraw"; `/app/profile` shows the dashed row "Requested {today} · waiting for an administrator" in amber with **Withdraw**. Run `dispatch` → Mailpit has "Tenancy request from Bruno Lima" to `datamap-admins@fake.mail.com`.
4. **One pending request.** Request again from the profile → "You already have a request waiting. Withdraw it to send another.". **Withdraw** → the row and the home line disappear. Send and withdraw until the fourth attempt of the day → "You have sent three requests in the last 24 hours. Try again tomorrow." Reset for the next case: `psqlgk "DELETE FROM tenancy_requests WHERE user_id = '$BRUNO';"`, then send one "Data Amazon" request.
5. **Approval reaches the session.** Approve it as Carla:

   ```bash
   REQ=$(asadmin "$GK/admin/tenancy-requests?status=open" | python3 -c 'import json,sys; print(json.load(sys.stdin)["items"][0]["id"])')
   asadmin -X POST $GK/admin/tenancy-requests/$REQ/approve -d '{"tenancy": "datamap/production/data-amazon"}'
   ```

   Focus Bruno's home tab → "Your request for Data Amazon was approved · Switch to Data Amazon", and (no sign-out) the avatar menu now has "Switch tenancy". **Switch to Data Amazon** → home, footer `datamap / production / data-amazon`, the line gone, and the sidebar now has **Members**. `dispatch` → "You now have access to Data Amazon" in Mailpit.
6. **More than one tenancy.** As Bruno, avatar → "Switch tenancy" → `/app/tenancy`: "Welcome, Bruno", "Choose the tenancy you want to work in.", **Public** (public icon, `datamap / production / public`) and **Data Amazon** (tenancy icon), "+ Request access to another tenancy". Pick Public → home in Public, no **Members** entry.
7. **Decline with a message.** As Bruno request "Cerrado Flux"; as Carla:

   ```bash
   REQ=$(asadmin "$GK/admin/tenancy-requests?status=open" | python3 -c 'import json,sys; print(json.load(sys.stdin)["items"][0]["id"])')
   asadmin -X POST $GK/admin/tenancy-requests/$REQ/decline -d '{"message": "Ask a member of the tenancy to invite you from its Members page"}'
   ```

   Bruno's `/app/tenancy` and `/app/profile` show "Cerrado Flux", "Declined {today}" and the message in quotes; the home shows no line for it. `dispatch` → "Your request for Cerrado Flux" in Mailpit.
8. **The Members page.** As Ana (select Data Amazon), sidebar → **Members** → `/app/members`: "Members", "Data Amazon · datamap/production/data-amazon", "Members · {n}" with Ana Souza and Bruno Lima among them, by name (with an ORCID iD only for an account that has one), and no email anywhere on the page. **+ Invite** → "Invite to Data Amazon". Type `eva@example.org` → after a moment the card: "EV" avatar, "Eva Rocha", "eva@example.org", "Member of the tenancy · sees its {n} datasets once they accept · administrators are notified" (`{n}` counts `D_AMAZON` and any seeded Data Amazon dataset). **Send invitation** → the dialog closes and *Pending invitations* shows Eva with the dashed icon, "invited by Ana Souza {today} · not accepted yet" and red **Withdraw**. `dispatch` → "Ana Souza invited you to Data Amazon" to Eva and "Ana Souza invited Eva Rocha to Data Amazon" to the admins. **Withdraw** → the row disappears; invite Eva again.
9. **What the lookup does not offer.** In the same dialog: `bruno@example.org` → "Already a member of Data Amazon." and **Send invitation** disabled; `eva@example.org` → "Already invited to Data Amazon · not accepted yet." and disabled; `nobody@example.org` → "No DataMap account has this email or ORCID iD."; "Bruno" → no lookup, and Enter → "Type the full email or ORCID iD.". In DevTools → Network, each settled email made exactly one `GET /api/workspace/lookup`. As Bruno on the Members page, Eva's pending row has no **Withdraw**.
10. **Members only.** As Carla (admin, not a member of Data Amazon): `curl -s -H "X-Api-Key: $KEY" -H "X-Api-Secret: $SECRET" -H "X-User-Id: $CARLA" $GK/users/$CARLA/tenancies/datamap/production/data-amazon/members` → `{"detail": "tenancy_not_found"}`. As Ana, switch to Public → no **Members** entry; open `/app/members` directly → "This tenancy has no Members page. Everyone on DataMap is in Public, and legacy tenancies are read-only." and no **+ Invite**.
11. **Accept and decline from the home.** As Eva, the home shows "Ana Souza invited you to Data Amazon" / "{n} datasets · {today}" (no dataset name) with **Decline** and **Accept**. **Decline** → the card goes. Have Ana invite her again, then **Accept** → the home reloads in Data Amazon (footer `datamap / production / data-amazon`) with no sign-out, and `/app/tenancy` lists both tenancies. `/app/profile` shows the same card before accepting (repeat the invite once to see it there).
12. **An invitation an admin closes.** As Carla remove Eva (`asadmin -X DELETE $GK/admin/tenancies/datamap/production/data-amazon/members/$EVA`), then have Ana invite her again and keep Ana's Members page open. As Carla add her directly: `asadmin -X POST $GK/admin/tenancies/datamap/production/data-amazon/members -d "{\"user_id\": \"$EVA\"}"`. Focus Eva's home → the invitation card is gone. In Ana's still-open page, **Withdraw** on Eva's row → "This invitation is no longer open. It may have been withdrawn." and the row leaves; reload → Eva is listed among the members.
13. **Public datasets.** As Ana, switch to Public and open `/app/datasets/$D_PUBLIC` → Share: the *Members of Public* row reads "Everyone on DataMap · can read" with no **Change**, and the dialog offers nothing about the tenancy. The dataset's Settings → Access shows the same row with no **Change**.
14. **New dataset form.** As Ana in Public, `/app/datasets/new`: "Open to the workspace" reads "Visible to every DataMap account; only you and people you share with can edit"; choose **Under embargo** → "When the embargo ends, members of Public can read but not edit." with no **Change**. Switch to Data Amazon and reopen the form → "Every member of Data Amazon can read and download the files."; under embargo → "When the embargo ends, members of Data Amazon can read but not edit." with **Change**. Do not submit (the upload needs the MinIO bucket).
15. **A dataset stays in its tenancy.** As Ana open `/app/datasets/$D_AMAZON` → Settings, change the name, **Save changes** → DevTools → Network: the `PUT /api/datasets/$D_AMAZON` body carries `"tenancy": "datamap/production/data-amazon"` and answers `200`. Then send another tenancy through the BFF from the console: `await fetch('/api/datasets/' + '<D_AMAZON>', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: '<D_AMAZON>', name: 'x', data: {}, tenancy: 'datamap/production/public', is_enabled: true }) }).then(r => r.json())` → `{detail: "tenancy_cannot_change"}` with status `400`, and the dataset is still in Data Amazon.
16. **Zero tenancies.** `psqlgk "DELETE FROM users_tenancies WHERE user_id = '$BRUNO';"` (the gatekeeper's public lock covers its API, not SQL). Sign Bruno out and in → `/app/tenancy` shows "You're not in any tenancy", the RFC copy, **Request access** (opens the dialog), the "Shared with me" link and "I already have access — check again". Restore: `psqlgk "INSERT INTO users_tenancies (user_id, tenancy) VALUES ('$BRUNO', 'datamap/production/public'), ('$BRUNO', 'datamap/production/data-amazon');"`, then "check again" → reload, then the selector lists both.
17. **Removed member.** As Eva, select Data Amazon and keep `/app/datasets` open. As Carla: `asadmin -X DELETE $GK/admin/tenancies/datamap/production/data-amazon/members/$EVA`. In Eva's tab, change a filter (or focus the tab) → she lands on `/app/tenancy`, which, with only Public left, opens the home in Public. Then open `/app/datasets/$D_AMAZON` directly with the Data Amazon cookie re-selected from DevTools (`document.cookie` holds `datamap.tenancy-selector-storage`; or repeat before the first redirect) → `/app/tenancy`, not the login page.
18. **Old sessions.** A session signed in before this branch (keep a tab from the main checkout's dev server) keeps working after switching servers: no forced sign-out (`TOKEN_VERSION` is still `2`), `user.admin` reads `false` until the next `update()`.

- [ ] **Step 5: Stop the stack**

```bash
cd <gatekeeper checkout with PR A>
export ENV_FILE_PATH=integration-test.env
dc() { docker compose -p rfc-009 -f docker-compose-integration-test.yaml "$@"; }
dc down
```

---

## Self-review

| RFC 009 / contract / PR A requirement | Task |
|---|---|
| `session.user.admin` from `roles` containing `"admin"`, on sign-in and every `update()`, no `TOKEN_VERSION` bump, only the boolean in the session | 2, 24.2, 24.18 |
| `contants/TenancyConstants.ts` with the contract's exact block, plus `tenancyErrorMessage`, `TENANCY_PATH_PATTERN` and B's copy and keys | 3, 19 |
| `TenancySummary`, `GatekeeperPage<T>` (shared) and B's types, `TenancyInvitation` without `dataset`, `WorkspaceMember`, `WorkspaceInvitation`, `InviteeLookup`; `ShareTenancy` additions; no tenancy invitation in `ShareState` | 3 |
| `TenancyIcon` — `public` for the default tenancy, `tenancy` otherwise, dashed when pending | 3 |
| `lib/tenancies.ts` (seven calls) and `lib/workspace.ts` (five calls), `X-User-Id` only, the tenancy path unencoded in the gatekeeper URL; `lib/share.ts` unchanged | 4 |
| BFF user routes on `bffRouter()` (`authOnlyChain`), user from the token, gatekeeper status and `{detail}` forwarded | 5 |
| BFF workspace routes (`/api/workspace/members`, `lookup`, `invitations`, `invitations/[invitationId]`), tenancy as a checked query parameter, invitee from the browser only as `userId` | 6 |
| JSON gate on every `POST`; ids and paths validated before the gatekeeper | 5, 6 |
| BFFAPI methods with the contract's signatures, rejecting with the Axios error; `lookupInvitee` imperative and debounced | 7, 20 |
| SWR keys and options (`/api/tenancies`; requests and invitations revalidated on focus; workspace members through `useSWRInfinite`; workspace invitations revalidated after invite and withdraw) | 8, 19, 21, 22 |
| Selector: one tenancy → selected, home, no page; more → design 1i list; none → `AccessPending` | 8, 12, 24.1, 24.6, 24.16 |
| `/app/tenancy` calls `update()` when `/api/tenancies` and the session differ | 8, 12, 24.5 |
| `AccessPending` rewrite with **Request access**, "Shared with me" and "check again" kept | 11, 12, 24.16 |
| Request dialog (1i, 520 px, Formik + Yup, 1–128 / 1–1000, `409 request_pending` copy, `429`) | 9, 24.3, 24.4 |
| Pending request row with dashed icon, amber "Requested {date} · waiting for an administrator", **Withdraw** | 10, 12, 15, 24.3 |
| Declined in the last 30 days with no newer request: "Declined {date}" and the message | 8, 10, 24.7 |
| Approved request → `update()` and "Switch to {tenancy}" | 8, 10, 14, 24.5 |
| Avatar menu: "Switch tenancy" only with more than one, "Request access to a tenancy" | 13, 24.1 |
| Profile Tenancies: display names, "Everyone is in public", request state, request and switch buttons | 15, 24.1 |
| Home panel (1j): one card per invitation, "{n} datasets · {date}", Decline / Accept, "As Reader" and the dataset dropped; the request line below | 14, 24.11 |
| Accept → `update()`, select the tenancy, `/app/home` | 14, 24.11 |
| Invitations on the profile too | 15, 24.11 |
| An invitation withdrawn by an admin disappears from the invitee's list and the tenancy's; acting on it reads "no longer open" and revalidates | 14, 21, 24.12 |
| Members page: members by name and ORCID iD, never email, 50 at a time; pending invitations dashed with **Withdraw** for the inviter; **+ Invite** with exact email/ORCID lookup, the card's name, typed email (or iD), `{n}` from the lookup's `datasets`; members and already-invited people cannot be invited again | 19, 20, 21, 22, 24.8, 24.9 |
| Members page for members only: no entry and no page for Public, staging, a disabled tenancy or a tenancy the user is not in; the gatekeeper's `404`/`409` codes mapped | 19, 22, 23, 24.10 |
| Members page reached from the sidebar, hidden for Public and staging | 23, 24.1, 24.5, 24.6 |
| `/app/members` in `PAGES` | 22 |
| Share dialog is RFC 003 only: no lookup, no tenancy invitation | — (nothing added to `ShareInput`, `AccessList` or `lib/share.ts`); 24.13 |
| Members-access toggle hidden for public; *Members of Public* reads "Everyone on DataMap · can read" | 16, 24.13 |
| New-dataset form: Public notice; new datasets start with `members_can_edit = false` | 16, 24.14 |
| `public_members_cannot_edit` explained if it ever reaches the embargo screens | 3 |
| A dataset never changes tenancy: no move control, edit forms send the current tenancy, `400 tenancy_cannot_change` reaches the browser and has its sentence | 3, 18, 24.15 |
| A `401` whose `detail` starts with `unauthorized_tenancy` → clear the selection, `update()`, selector | 17, 24.17 |
| `POST /users` ignores `roles` | not touched: `lib/users.ts` is outside this PR, and the `"roles": []` it sends is ignored |
| Webapp Jest from the RFC: the selector's three cases, the request form, the home panel calling `update()` and selecting the tenancy; `hydrateWithUserInfo` setting `admin`. The RFC's "share suggestion card's two options" no longer exists; its replacement is the invite card | 2, 9, 12, 14, 20 |
| Manual checks against the gatekeeper with PR A and Mailpit | 24 |

Not in the contract, added because the flows break or leak without them:
- `accountHandler` instead of `bffHandler` (Tasks 5, 6). `bffHandler` replaces the `401`/`403`/`404` codes with fixed English, so `no_account`, `forbidden`, `tenancy_not_found`, `request_not_found` and `invitation_not_found` would never reach the browser.
- `TENANCY_PATH_PATTERN` on every `tenancy` parameter (Task 6). The path goes into the gatekeeper URL unencoded, so `..` must not reach it.
- The `401` detail in `httpErrorHandler`, the list route's `{detail}` and the fetcher's `error.detail` (Task 17). Without them `unauthorized_tenancy` is lost on the way, and the Members page could not say why it failed.
- The dataset `PUT` route's `{detail}` (Task 18). Without it `tenancy_cannot_change` is lost on the way.
- Clearing a selected tenancy the user no longer has (Task 12). Otherwise the stale cookie keeps querying it.
- The redirect of a server-rendered dataset page to the selector (Task 17). It used to go to the login page.

Names this plan adds next to the contract's (the contract should follow): `ROUTE_PAGE_MEMBERS = "/app/members"` (the contract says B adds no route); `TENANCY_PATH_PATTERN` moves from PR C's `AdminConstants.ts` into the shared `TenancyConstants.ts`; `lib/routeParams.ts` (`invalidRequest`, `uuidOr404`, `tenancyOr400`, `pageOr400`, `userIdOr400`), which PR C's `lib/adminRoute.ts` re-exports; `asUser` exported from `lib/tenancies.ts` and used by `lib/workspace.ts` and PR C's `lib/admin.ts`; `WORKSPACE_PAGE_SIZE`, `WORKSPACE_LOOKUP_DEBOUNCE_MS`, `workspaceMembersKey`, `workspaceInvitationsKey`; `hooks/UseWorkspace.ts`; `components/Workspace/`. The contract's own names for the workspace (`lib/workspace.ts`, `/api/workspace/*`, `listWorkspaceMembers`, `listWorkspaceInvitations`, `inviteToWorkspace`, `withdrawWorkspaceInvitation`, `lookupInvitee`, the two SWR keys) fit the webapp's layout and are kept as they are.

Left to PR C, which assumes this plan's files: the admin pages, `adminChain`, `adminBffRouter`, `lib/admin.ts`, `AdminConstants.ts`, the `ROUTE_PAGE_ADMIN*` constants and the `RequireSession` admin gate.
