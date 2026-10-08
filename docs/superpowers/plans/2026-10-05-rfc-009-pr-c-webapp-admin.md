# RFC 009 PR C — Webapp admin area Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** A DataMap admin (global Casbin `admin` role) gets an **Admin** area in the webapp: a sidebar entry with the open-requests badge, a shell with the tabs Requests · Users · Tenancies · Activity, a working Requests tab (queue, review, decline, recently closed) and a working Tenancies tab (list, members, add, remove, withdraw an invitation, new tenancy). Users and Activity are present with an empty state. Everyone else gets the not-found page for every admin URL and `404` from every admin BFF route.

**Architecture:** PR B already gives the session `session.user.admin` (and the token `admin: true` for an admin); this plan only reads it. Admin pages declare `auth = { admin: true }`; `RequireSession` renders the 404 page when the session is not an admin. Pages are thin: `AdminLayout` (the app's `LoggedLayout` with `tenancyOptional`, the footer "All tenancies" and the `AdminTabs` header) around one view component per tab. Reads go through SWR hooks in `hooks/UseAdmin.ts` keyed by `lib/adminKeys.ts`; mutations go through `BFFAPI`. BFF routes under `pages/api/admin/` use `adminBffRouter()` (`adminChain` = request logging, `auth`, `adminOnly`; plus a JSON Content-Type gate on every change) and `accountHandler`, which forwards the gatekeeper's status and `{detail}`. Server-side calls live in `lib/admin.ts` and send only `X-User-Id`. The gatekeeper's Casbin check stays the authority.

**Tech Stack:** Next.js 14.2 (pages router), NextAuth 4.24 (JWT), next-connect 1.0.0-next, Axios 1.7, SWR 2.2 (`useSWR`, `useSWRInfinite`, global `mutate`), Formik 2.4 + Yup 1, TailwindCSS 3, react-material-symbols 4.4, Jest 29 + ts-jest, @testing-library/react 14 with `jest-environment-jsdom`.

## Global Constraints

- Worktree: `/Users/caio.maia/workspace/datamap/datamap-webapp/.claude/worktrees/rfc-009-admin`, branch `feat/rfc-009-admin`, created in Task 1 from `origin/main` **after PR B is merged**. Every command runs from that directory; never from the main checkout. Before every commit: `pwd` and `command git branch --show-current`. Every git call is spelled `command git`.
- Jest: `npx jest --coverage=false <paths>`. ts-jest type-checks (`strict: false`): a type error fails the suite. Component tests start with `/** @jest-environment jsdom */`. Tests never live under `pages/` (Next compiles `pages/` as routes); route tests go in `lib/__tests__/`, hook tests in `hooks/__tests__/`, component tests in `components/**/__tests__/`. Shared test data lives in `fake-data/adminFixtures.ts` (a file inside `__tests__/` would be collected as a suite).
- A component test imports the component from its own file under `components/`, never a page. A test that has to render `LoggedLayout` mocks `components/TenancyStore` (it pulls `typescript-cookie`).
- Gatekeeper admin routes (PR A), all `admin` auth, base `DATAMAP_BASE_URL` (already ends in `/api/v1`): `GET /admin/tenancy-requests/counts` → `{open, join, new, closed}`; `GET /admin/tenancy-requests?status=open|closed&kind=join|new&q&limit&offset` → `Page<AdminTenancyRequest>`; `GET /admin/tenancy-requests/{id}` → `AdminTenancyRequestDetail`; `POST /admin/tenancy-requests/{id}/approve` with exactly one of `{tenancy}` / `{new_tenancy: {display_name, namespace}}`; `POST /admin/tenancy-requests/{id}/decline` `{message: str | null}`; `GET /admin/tenancies` → `AdminTenancy[]`; `POST /admin/tenancies` `{display_name, namespace}` → `201 AdminTenancy`; `GET /admin/tenancies/{path}/members?limit&offset` → `TenancyMembers`; `GET /admin/tenancies/{path}/members/{user_id}` → `RemovalImpact`; `POST /admin/tenancies/{path}/members` `{user_id}` → `201 TenancyMember`; `DELETE /admin/tenancies/{path}/members/{user_id}` → `204`; `DELETE /admin/tenancy-invitations/{id}` → `204`; `GET /admin/users?q=` (≥ 2 chars) → `AdminUserHit[]`.
- The tenancy path goes into the gatekeeper URL **unencoded** (`/admin/tenancies/datamap/production/atto/members`). In the BFF it travels as the `tenancy` query parameter (`encodeURIComponent` in the browser); the BFF accepts it only if it matches `TENANCY_PATH_PATTERN = /^[A-Za-z0-9_-]+(\/[A-Za-z0-9_-]+)+$/`, so `..` never reaches the gatekeeper. The pattern and the parameter helpers (`tenancyOr400`, `pageOr400`, `uuidOr404`, `userIdOr400`, `invalidRequest`) are PR B's, in `contants/TenancyConstants.ts` and `lib/routeParams.ts`, because PR B's workspace routes put the same path in a gatekeeper URL; this plan imports them.
- Admin calls send only `{ headers: { "X-User-Id": uid } }`; `uid` always comes from the NextAuth token, never from the browser. The browser sends a user id only for the member an admin adds or removes.
- `Page<T>` is `GatekeeperPage<T> { items: T[], total_count: number, limit: number, offset: number }`. JSON from the gatekeeper is snake_case and passes through the BFF unchanged; browser bodies are camelCase.
- BFF routes: `GET /api/admin/tenancy-requests/counts`, `GET /api/admin/tenancy-requests`, `GET /api/admin/tenancy-requests/[requestId]`, `POST .../[requestId]/approve` (`{tenancy}` or `{newTenancy: {displayName, namespace}}`), `POST .../[requestId]/decline` (`{message?}`), `GET|POST /api/admin/tenancies`, `GET|POST /api/admin/tenancies/members?tenancy=`, `GET|DELETE /api/admin/tenancies/members/[userId]?tenancy=`, `DELETE /api/admin/tenancy-invitations/[invitationId]`, `GET /api/admin/users?q=`.
- `adminOnly` answers `404 {"detail": "not_found"}` when `token.admin !== true`; an anonymous request gets `401` from `auth` first. Every `POST`/`PUT`/`PATCH`/`DELETE` through `adminBffRouter()` needs `Content-Type: application/json` (else `415 {"detail": "invalid_request"}`), so `BFFAPI` sends `{ data: {} }` on its `DELETE`s.
- SWR keys: counts `/api/admin/tenancy-requests/counts` with `{ revalidateOnFocus: true, refreshInterval: 60_000 }`; queue `adminRequestsKey(query)` = `/api/admin/tenancy-requests?status=…&kind=…&q=…&limit=50&offset=…` (kind only for open, q only when not blank); recently closed `/api/admin/tenancy-requests?status=closed&limit=5&offset=0`; detail `/api/admin/tenancy-requests/${id}`; tenancies `/api/admin/tenancies`; members `/api/admin/tenancies/members?tenancy=${encodeURIComponent(path)}&limit=50&offset=${n}` through `useSWRInfinite`; removal impact `/api/admin/tenancies/members/${userId}?tenancy=${encodeURIComponent(path)}`; users `/api/admin/users?q=${encodeURIComponent(q)}`, `null` below 2 characters. After a mutation: `mutate` on every key starting with `/api/admin/tenancy-requests` (counts included) and/or `/api/admin/tenancies`, and the members list's own `mutate`.
- Session (built by PR B's Task 2, not here): `token.admin` is `true` only for an account whose `roles` include `"admin"`, and absent otherwise; `session.user.admin = token.admin === true`; `types/next-auth.d.ts` has `Session.user.admin: boolean` and `JWT.admin?: boolean`. No `TOKEN_VERSION` bump. This plan does not touch `pages/api/auth/[...nextauth].ts` or `types/next-auth.d.ts`.
- Errors: every admin BFF route answers through `accountHandler` (`lib/accountRoute.ts`), never `bffHandler`: `bffHandler` goes through `httpErrorHandler`, which rewrites the `detail` of a `401`/`403`/`404` to fixed English, so `request_not_found`, `tenancy_not_found`, `member_not_found`, `no_account` and `not_found` would never reach the browser. PR B does the same for its routes.
- PR B's Task 17 already makes `httpErrorHandler` keep a `401` detail, makes `lib/fetcher.js` attach `error.detail`, and wraps pages in `RequireSession`'s `SWRConfig` that handles `unauthorized_tenancy`. This plan relies on `error.detail` and redoes none of it.
- URL parameters: `/app/admin/requests?request={id}` opens that request's review dialog; `/app/admin/tenancies?tenancy={path}` selects that tenancy. Both are set and cleared with `router.replace(..., { shallow: true })`.
- Validation (both sides): `namespace` `^[a-z0-9-]+$`, 2–63 characters, not `public`; `display_name` 1–64 trimmed; decline `message` 0–1000 trimmed. `slugifyNamespace(name)`: diacritics stripped first (`name.normalize("NFD").replace(/[\u0300-\u036f]/g, "")`, so "João Ciência" gives `joao-ciencia`), then lower-case, runs of anything outside `[a-z0-9]` become one `-`, trimmed of `-`, cut to 63.
- Routes: `ROUTE_PAGE_ADMIN = "/app/admin"`, `ROUTE_PAGE_ADMIN_REQUESTS`, `ROUTE_PAGE_ADMIN_USERS`, `ROUTE_PAGE_ADMIN_TENANCIES`, `ROUTE_PAGE_ADMIN_ACTIVITY` = `ROUTE_PAGE_ADMIN + "/requests" | "/users" | "/tenancies" | "/activity"`. `/app/admin` redirects to `/app/admin/requests`. Every new page is in `contants/TelemetryConstants.ts` `PAGES`.
- Not built (RFC 009 decisions 7–9): Reader/Contributor/Admin labels or dropdowns, the role radio cards in the review dialog, the Environment field and the environment pills (every new tenancy is `datamap/production/{namespace}`), the user detail page, system-role toggles, account disabling, API clients, the Activity log. Users and Activity show only their empty state.
- Copy is English and verbatim from RFC 009 §Admin area where it gives it: "Requests" / "{open} open · {join} for existing tenancies, {new} for new ones"; pills "Open", "Join existing", "New tenancy", "Closed"; search "Name, email or ORCID"; columns "Account | Request | Requested | Email"; "{n} days waiting"; "verified" / "unverified"; "Review"; "Decline…"; "Recently closed"; "Activity →"; "Approved", "Approved · new tenancy", "Declined", "by {admin} · {when}"; "Join {tenancy}"; "New tenancy: {display name}"; "{requester} · {email} · requested {relative}"; "Join existing" / "New tenancy"; "datamap/production/{namespace} · requester becomes a member"; "Email not verified. A new tenancy can't be created for an unverified account."; "{first name} is emailed either way."; "Approve" / "Create and approve"; "Decline request?"; "{requester} · join {tenancy}" / "{requester} · new tenancy {name}"; "Message to {first name}" (optional); placeholder "Ask a member of the tenancy to invite you from its Members page"; "— Stays in public · can request again"; "Decline"; "Tenancies" / "{n} tenancies · root `datamap` · everyone is in `public`"; "+ New tenancy"; "Legacy · staging"; "Members · {n}"; "+ Add"; "invited by {name}"; "Withdraw"; "Show {n} more"; "Everyone · {n} accounts"; "Add to {tenancy}"; "{first name} is emailed."; "Remove from {tenancy}?" / "{name} · member since {date}"; "— Loses access to the {n} datasets of the tenancy", "— Keeps {n} datasets shared explicitly", "— Still owns {n} datasets of the tenancy", "— Stays in public"; "Remove"; "New tenancy" with "Display name", "Namespace", "Create"; "Users" / "Coming soon. Until then, add and remove people from Tenancies."; "Activity" / "Coming soon: every admin action, who and when."; sidebar "Admin" and footer "All tenancies".
- Every commit message ends with `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`. Do not push until the whole plan is done and the owner asks.

### What PR A ships, beyond the contract this plan was first written from

PR A is `ardc-brazil/gatekeeper#145`; its deviations are listed in `gatekeeper/.superpowers/sdd/final-rereview.md`, `final-review-fix-report.md` and `workspace-invitations-report.md`. The ones that reach this plan:

- **Approve can answer `404 no_account`** when the requester's account is missing or disabled. It is checked before anything else, and the request stays pending, so Decline still works. The review dialog says so, disables **Approve** and keeps **Decline…** (Task 14).
- **Invitations belong to the tenancy, not to a dataset.** Members invite from the workspace Members page (PR B), never from a dataset's Share dialog. `AdminTenancyInvitation` is `{ id, user: UserBrief, invited_by: UserRef | null, created_at }`, with no `dataset`. The admin design spec's 1j drew the invitation inside the Share dialog with "from “{dataset}”"; the Tenancies panel shows the invitee's name, email and "Invited by {inviter} {date} · not accepted yet" instead (Task 17).
- **An invitation can close without the inviter.** When an admin adds the invitee (**+ Add**) or approves the invitee's request into the same tenancy, PR A withdraws the pending invitation in the same transaction (`closed_by` = the admin). Both actions already revalidate the member list, so the row leaves. A **Withdraw** on a row that is no longer pending answers `404 invitation_not_found`; the panel shows the sentence and revalidates (Task 17).
- **`POST /users` ignores `roles`.** Admin roles are granted with `PUT /users/{id}/roles` or, in this plan's manual check, a `casbin_rule` row. Nothing in this plan calls `POST /users`.
- **No dataset changes tenancy**, admins included (`400 tenancy_cannot_change`). The admin area has no dataset screen, so nothing here changes.
- **The decline placeholder** follows the RFC's new text: "Ask a member of the tenancy to invite you from its Members page".

### Design → Tailwind tokens

The design (`Admin.dc.html`) uses literal hex. `tailwind.config.js` replaces Tailwind's palette with `primary`, `secondary`, `error`, `success`, `embargo`, `danger`. Mapping used throughout:

| Design | Use | Token |
|---|---|---|
| `#0b0b0c` | ink, primary buttons, active tab underline, badges | `primary-900` |
| `#fafaf9` | button text on ink, table header, selected row | `primary-50` |
| `#fff` | cards, dialogs, inputs | `primary-0` |
| `#4b5563` | secondary text | `primary-600` |
| `#6b7280` | muted text, inactive tab, column labels | `primary-500` |
| `#9ca3af` | placeholder, disabled text, sidebar footer | `primary-400` |
| `#d1d5db` | input and outline-button borders | `primary-300` |
| `#e5e7eb` | card borders, dividers, disabled button | `primary-200` |
| `#f3f4f6` | row separators, notice strip | `primary-100` |
| `#374151` | icon on chips | `primary-700` |
| `#e9f0ef` | active sidebar item, "Join" pill | `secondary-500` |
| `#d7e4e3` | initials avatar | `secondary-900` (via `PersonInitial`) |
| `#92400e` / `#fef3c7` | "New" pill, waiting > 3 days, "unverified", banner | `embargo-800` / `embargo-100` |
| `#b91c1c` | "Decline…", "Withdraw", destructive buttons, "Declined" | `danger-700` (hover `danger-800`) |
| `#14532d` | "verified", "Approved" (not in the theme) | **`success-500` (`#228b5a`)**, the theme's only green |
| `#dcfce7`, `#e5e7eb` env pills | production/staging pills | not built |
| dialog shadow `0 20px 50px rgba(11,11,12,.18)` | dialogs | `shadow-2xl shadow-primary-900/20` |
| radius 8 / 12 / 6 px | cards / dialogs / buttons | `rounded-lg` (`--radius` = 0.5rem) / `rounded-xl` / `rounded-md` |
| JetBrains Mono | paths, namespaces | `font-mono` (the theme's monospace stack; no new font) |
| 11 / 12 / 13 / 15 px | labels / meta / small body / lead | `text-[11px]` / `text-xs` / `text-[13px]` / `text-[15px]`, as the codebase already does |

The existing `PopupModal` paints destructive buttons `error-600` (`#FF3A3A`); the admin dialogs follow the design (`danger-700`) through their own `AdminDialog`, which also has the design's footer link slot ("Decline…") that `PopupModal` lacks.

### Assumptions about PR B (merged before Task 1)

Taken from PR B's plan (`docs/superpowers/plans/2026-10-05-rfc-009-pr-b-webapp-user.md`, as revised in the commit "docs: RFC 009 webapp plans follow what the gatekeeper ships") and checked in Task 1, Step 3. If a check fails, stop and ask the owner; do not recreate B's code here.

Checked against PR B as shipped (#113, `c0a16fa`): every assumption below holds. What B shipped beyond its plan, and the reuse it asks of this plan, is in the amendments (`.superpowers/sdd/amendments.md`), which win over the tasks below.

- **Session flag (B's Task 2).** `hydrateWithUserInfo` sets `token.admin = true` for an account whose `roles` include `"admin"` and deletes it otherwise, on sign-in and on every `update()`; the session callback sets `session.user.admin = token.admin === true`; `types/next-auth.d.ts` declares `Session.user.admin: boolean` and `JWT.admin?: boolean`. The contract assigned this to C; the owner moved it to B. This plan consumes it.
- **Constants (B's Task 3).** `contants/TenancyConstants.ts` with the contract's exact block (this plan imports `PRODUCTION_PREFIX`, `NAMESPACE_PATTERN`, `NAMESPACE_MIN_LENGTH`, `NAMESPACE_MAX_LENGTH`, `DISPLAY_NAME_MAX_LENGTH`, `MESSAGE_MAX_LENGTH`) plus `TENANCY_PATH_PATTERN = /^[A-Za-z0-9_-]+(\/[A-Za-z0-9_-]+)+$/` and B's keys, copy and `tenancyErrorMessage`.
- **Route parameters (B's Tasks 5–6).** `lib/routeParams.ts` exports `invalidRequest(res): undefined` (`400 {detail: "invalid_request"}`), `uuidOr404(req, res, name, detail)`, `tenancyOr400(req, res)` (checks `TENANCY_PATH_PATTERN`), `pageOr400(req, res, defaultLimit)` and `userIdOr400(req, res)` (a UUID `userId` in the body); each answers the error itself and returns `undefined`.
- **Self-route headers (B's Task 4).** `lib/tenancies.ts` exports `asUser(uid)` → `{ headers: { "X-User-Id": uid } }`.
- **Types (B's Task 3).** `types/GatekeeperAPI.ts` gains, after `MembersAccessResponse`, `TenancySummary`, `GatekeeperPage<T>`, `UserRef { id, name }`, `UserBrief { id, name, email: string | null }`, `TenancyRequest`, `TenancyInvitation`, `WorkspaceMember`, `WorkspaceInvitation` and, last, `InviteeLookup`. C's shapes go after that last one.
- **Icon (B's Task 3).** `components/Tenancy/TenancyIcon.tsx` exports `TenancyIcon({ tenancy, pending }: { tenancy?: Pick<TenancySummary, "is_default">; pending?: boolean })`: a 32 px `rounded-md` chip, `aria-hidden`, `data-icon` = `public` or `tenancy`, no size prop. The tenancy list uses it as is.
- **BFFAPI (B's Task 7).** Seven methods after `confirmEmailVerification`, the last one `withdrawWorkspaceInvitation(tenancy, invitationId)`; the `../types/GatekeeperAPI` import list grows. C's methods go after B's last one, with their own import line.
- **Errors (B's Tasks 5–6).** B's routes use `accountHandler`, `requireJsonRequest` on `POST`, and the `lib/routeParams.ts` helpers before the gatekeeper — the same choices as this plan.
- **Revoked tenancy (B's Task 17).** `httpErrorHandler` keeps a `401` detail; `lib/fetcher.js` attaches `error.detail` (a string `detail` from the JSON body); `RequireSession` is rewritten with the same `Props`, signature, `loginUrlFor` import and loading branch, and now returns its children inside `<SWRConfig value={{ onError }}>`.
- **Telemetry (B's Tasks 7 and 22).** B adds three `UI_EVENTS` and the page `"/app/members"` (between `"/app/home"` and `"/app/notebooks"`); `TelemetryConstants.test.ts` gains a `describe("the workspace Members page", ...)` placed before `describe("members' access", ...)`, which stays last.
- **Sidebar (B's Task 23).** `components/LoggedLayout.tsx` imports `useMembersPageTenancy` from `hooks/UseWorkspace` and renders a **Members** `MenuItem` after Notebooks; the Profile `<ul>` and the tenancy footer are unchanged. A test that renders `LoggedLayout` mocks `hooks/UseWorkspace`.
- **Routes (B's Task 22).** `contants/InternalRoutesConstants.ts` gains `ROUTE_PAGE_MEMBERS` after `ROUTE_PAGE_TENANCY_SELECTOR`; `ROUTE_PAGE_PROFILE` is unchanged.

### Code this plan anchors on

Read on `origin/main` at `f632843` and in PR B's plan. Every edit quotes these lines verbatim.

- `components/Auth/RequireSession.tsx` (after B's rewrite): `import { loginUrlFor } from "../../lib/authRoutes";`, `interface Props { loading: ReactNode; children: ReactNode }`, `export function RequireSession({ loading, children }: Props) {`, the loading branch `if (status === "loading" && !session) { return <>{loading}</>; }`.
- `pages/_app.tsx`: `CustomAppProps.Component.auth` is `{ role: string; loading: any }`; it renders `<RequireSession loading={Component.auth.loading}>`. Pages declare e.g. `HomePage.auth = { role: "admin", loading: <div>loading...</div> };`.
- `pages/404.tsx`: default export `Custom404` ("404 - Page Not Found", redirect home after 3 s).
- `components/LoggedLayout.tsx`: `Props` ends with `tenancyOptional?: boolean;`; sidebar `MenuItem`s for Home/Datasets/Notebooks and B's conditional Members, `<hr>`, Profile in `<ul className="p-2">`, then the tenancy footer `{!menuClosed && tenancySelected && (...)}`; the sticky 64 px header holds only `<AvatarButton />`.
- `lib/middlewareChain.ts`: `auth` (needs `token.uid` and `token.v === TOKEN_VERSION`), `authOnlyChain`, `publicChain`, `pendingOnlyChain`.
- `lib/bffRoute.ts`: `bffRouter()` and `bffHandler()`; imports `import { authOnlyChain } from "./middlewareChain";`. `accountHandler` (`lib/accountRoute.ts`) forwards `{ detail: response.data.detail ?? "unavailable" }` with the gatekeeper's status (`500 {detail: "unavailable"}` without a response).
- `lib/accountRoute.ts`: `isUuid(value)`, exported `requireJsonRequest(req, res, next)` (refuses a missing or non-JSON `Content-Type` with `415 {detail: "invalid_request"}`), `accountHandler(router)`.
- `lib/appLocalContext.ts`: `NewContext(req)` → `{ uid, tenancy, requestId }`; `uid` only for a token with the current version.
- `lib/rpc.ts`: default export `axiosInstance`. `lib/share.ts` shows the call style (`axiosInstance.get(path, { headers, params })`).
- `lib/fetcher.js`: SWR fetcher; a non-2xx throws an `Error` with `status` and (B's Task 17) `detail`.
- `lib/embargoDisplay.ts`: `formatShortDate(iso, withYear = true)` ("Sep 28, 2026" / "Oct 1", UTC) and `initialsOf(name)`.
- `components/Share/PersonInitial.tsx`: `PersonInitial({ name?, owner?, pendingIcon? })`, a 32 px `secondary-900` initials circle, or a dashed one with `pendingIcon`.
- `hooks/UseDebouncedValue.ts` (`useDebouncedValue(value, delayMs)`), `hooks/UseComponentVisible.ts` (default export; `{ ref, isComponentVisible, setIsComponentVisible }`).
- `gateways/BFFAPI.ts`: class `BFFAPI`; imports `import { UserDetailsResponse } from "../lib/users";`; after B, its last method is B's `withdrawWorkspaceInvitation`. Account and tenancy methods let the Axios error reject; this plan's methods do the same.
- `contants/InternalRoutesConstants.ts`: `ROUTE_APP_CONTEXT = '/app'`, `ROUTE_PAGE_PROFILE = ROUTE_APP_CONTEXT + '/profile'`.
- `contants/TelemetryConstants.ts`: `PAGES` (sorted), with `"/anonymous/[token]",` followed by `"/app/datasets",`. `contants/__tests__/TelemetryConstants.test.ts` walks `pages/` and ends with `describe("members' access", ...)`.
- `types/GatekeeperAPI.ts` (after B) ends with B's `InviteeLookup` (`user: UserBrief`, `tenancy_member`, `invitation_pending`, `can_invite`, `datasets`).

---

## File Structure

| File | Responsibility |
|---|---|
| `components/Auth/RequireSession.tsx` (modify) | `admin` prop: the 404 page for a non-admin session |
| `pages/_app.tsx` (modify) | passes `Component.auth.admin` to `RequireSession` |
| `lib/middlewareChain.ts` (modify) | `adminChain` and `adminOnly` |
| `lib/bffRoute.ts` (modify) | `adminBffRouter()`: `adminChain` + JSON gate on changes |
| `types/GatekeeperAPI.ts` (modify) | C's gatekeeper shapes and `TenancyDecision` |
| `lib/admin.ts` | server-side gatekeeper calls (contract signatures) |
| `lib/adminRoute.ts` | admin BFF parameter and body parsing (`400`/`404` before the gatekeeper); re-exports PR B's `lib/routeParams.ts` helpers |
| `pages/api/admin/tenancy-requests/counts.ts`, `index.ts`, `[requestId]/index.ts`, `[requestId]/approve.ts`, `[requestId]/decline.ts` | request BFF routes |
| `pages/api/admin/tenancies/index.ts`, `members/index.ts`, `members/[userId].ts` | tenancy BFF routes |
| `pages/api/admin/tenancy-invitations/[invitationId].ts`, `pages/api/admin/users.ts` | withdraw, user search |
| `gateways/BFFAPI.ts` (modify) | six admin mutations |
| `contants/AdminConstants.ts` | sizes, intervals, tabs, copy, `adminErrorMessage`, `adminErrorFrom`, `slugifyNamespace` |
| `contants/InternalRoutesConstants.ts` (modify) | admin routes |
| `contants/TelemetryConstants.ts` (modify) | five admin pages |
| `lib/adminDisplay.ts` | waiting time, relative dates, first name, outcome labels, plural |
| `lib/adminKeys.ts` | SWR keys and key matchers |
| `hooks/UseAdmin.ts` | SWR hooks and revalidation helpers |
| `fake-data/adminFixtures.ts` | test data shaped like the gatekeeper's answers |
| `components/Admin/AdminDialog.tsx` | the design's dialog anatomy (title, subtitle, body, footer link, Cancel, primary) |
| `components/Admin/AdminPageHeader.tsx`, `AdminEmptyState.tsx`, `AdminLoadError.tsx`, `CountBadge.tsx` | shell parts reused by every tab |
| `components/Admin/AdminNavItem.tsx` | sidebar "Admin" entry with badge, admins only |
| `components/LoggedLayout.tsx` (modify) | `AdminNavItem`, `headerContent` slot, `scopeLabel` footer |
| `components/Admin/AdminTabs.tsx`, `AdminLayout.tsx` | tab header and the admin page frame |
| `components/Admin/Requests/DeclineRequestDialog.tsx` | 1e decline prompt |
| `components/Admin/Requests/ReviewRequestDialog.tsx` | 1c review (join / new / unverified / decided) |
| `components/Admin/Requests/RequestsTable.tsx`, `RecentlyClosed.tsx`, `RequestsView.tsx` | 1a queue |
| `components/Admin/Tenancies/NewTenancyDialog.tsx`, `AddMemberDialog.tsx`, `RemoveMemberDialog.tsx` | 1d/1e tenancy dialogs |
| `components/Admin/Tenancies/TenancyList.tsx`, `TenancyMembersPanel.tsx`, `TenanciesView.tsx` | 1d list and member panel |
| `pages/app/admin/index.tsx`, `requests.tsx`, `tenancies.tsx`, `users.tsx`, `activity.tsx` | admin pages |

Tests (all new unless noted): `components/Auth/__tests__/RequireSessionAdmin.test.tsx`, `lib/__tests__/adminChain.test.ts`, `lib/__tests__/admin.test.ts`, `contants/__tests__/AdminConstants.test.ts`, `lib/__tests__/adminDisplay.test.ts`, `lib/__tests__/adminRequestRoutes.test.ts`, `lib/__tests__/adminTenancyRoutes.test.ts`, `gateways/__tests__/BFFAPI.admin.test.ts`, `lib/__tests__/adminKeys.test.ts`, `hooks/__tests__/UseAdmin.test.ts`, `components/Admin/__tests__/AdminDialog.test.tsx`, `AdminParts.test.tsx`, `AdminNavItem.test.tsx`, `LoggedLayoutAdmin.test.tsx`, `AdminTabs.test.tsx`, `components/Admin/Requests/__tests__/DeclineRequestDialog.test.tsx`, `ReviewRequestDialog.test.tsx`, `RequestsTable.test.tsx`, `RecentlyClosed.test.tsx`, `RequestsView.test.tsx`, `components/Admin/Tenancies/__tests__/NewTenancyDialog.test.tsx`, `AddMemberDialog.test.tsx`, `RemoveMemberDialog.test.tsx`, `TenancyList.test.tsx`, `TenancyMembersPanel.test.tsx`, `TenanciesView.test.tsx`; `contants/__tests__/TelemetryConstants.test.ts` (modify).

---

### Task 1: Worktree, dependencies and baseline

**Files:** none changed.

**Interfaces:** Consumes PR B merged on `origin/main`. Produces the worktree every later task runs in, and the baseline counts `BASE_SUITES` / `BASE_TESTS` that Task 18 adds to.

- [ ] **Step 1: Check PR B is on `origin/main`**

```bash
command git -C /Users/caio.maia/workspace/datamap/datamap-webapp fetch origin
command git -C /Users/caio.maia/workspace/datamap/datamap-webapp log --oneline -8 origin/main
```

Expected: a merge commit for RFC 009 PR B (webapp user side) above `f632843 fix: Tailwind generates the classes kept in constants, lib and hooks (#112)`. If it is not there, stop: this plan assumes B's shared files.

- [ ] **Step 2: Create the worktree, install, copy the env file**

```bash
command git -C /Users/caio.maia/workspace/datamap/datamap-webapp worktree add .claude/worktrees/rfc-009-admin -b feat/rfc-009-admin origin/main
cd /Users/caio.maia/workspace/datamap/datamap-webapp/.claude/worktrees/rfc-009-admin
npm ci
cp /Users/caio.maia/workspace/datamap/datamap-webapp/.env.local .env.local
pwd
command git branch --show-current
```

Expected: `npm ci` ends with `added … packages`; `pwd` prints the worktree path; the branch is `feat/rfc-009-admin`. `.env.local` is git-ignored; never add it.

- [ ] **Step 3: Check PR B's shared code and this plan's anchors**

```bash
grep -c "export const PRODUCTION_PREFIX\|export const NAMESPACE_PATTERN\|export const NAMESPACE_MIN_LENGTH\|export const NAMESPACE_MAX_LENGTH\|export const DISPLAY_NAME_MAX_LENGTH\|export const MESSAGE_MAX_LENGTH\|export const TENANCY_PATH_PATTERN" contants/TenancyConstants.ts
grep -c "export interface TenancySummary\|export interface GatekeeperPage\|export interface UserRef\|export interface UserBrief\|export interface InviteeLookup" types/GatekeeperAPI.ts
grep -c "export function invalidRequest\|export function uuidOr404\|export function tenancyOr400\|export function pageOr400\|export function userIdOr400" lib/routeParams.ts
grep -c "export function asUser" lib/tenancies.ts
grep -c "useMembersPageTenancy" components/LoggedLayout.tsx
grep -c "export function TenancyIcon" components/Tenancy/TenancyIcon.tsx
grep -c "admin: boolean\|admin?: boolean" types/next-auth.d.ts
grep -c "session.user.admin = token.admin === true" "pages/api/auth/[...nextauth].ts"
grep -c "error.detail = await detailOf(res)" lib/fetcher.js
grep -c "tenancyOptional?: boolean;\|<MenuItem href={ROUTE_PAGE_PROFILE} text=\"Profile\" icon=\"person\" collapsed={menuClosed} />\|{!menuClosed && tenancySelected && (" components/LoggedLayout.tsx
grep -c "if (status === \"loading\" && !session) {\|export function RequireSession({ loading, children }: Props) {\|import { loginUrlFor } from \"../../lib/authRoutes\";" components/Auth/RequireSession.tsx
grep -c "<RequireSession loading={Component.auth.loading}>" pages/_app.tsx
grep -c "export const pendingOnlyChain" lib/middlewareChain.ts
grep -c "import { authOnlyChain } from \"./middlewareChain\";" lib/bffRoute.ts
grep -c "async withdrawWorkspaceInvitation(tenancy: string, invitationId: string)\|import { UserDetailsResponse } from \"../lib/users\";" gateways/BFFAPI.ts
```

Expected, in order: `7`, `5`, `5`, `1`, `2`, `1`, `2`, `1`, `1`, `3`, `3`, `1`, `1`, `1`, `2`. A `0` or a short count means PR B landed differently from its plan: find where the statement went and use that as the anchor in the task that edits it.

- [ ] **Step 4: Baseline**

```bash
npx jest --coverage=false 2>&1 | grep -E "^(Test Suites|Tests):"
npx tsc --noEmit -p .
```

Expected: every suite passes; write the two numbers down as `BASE_SUITES` and `BASE_TESTS`. `tsc` prints nothing.

---

### Task 2: Admin pages are not found for anyone else

**Files:**
- Modify: `components/Auth/RequireSession.tsx`
- Modify: `pages/_app.tsx`
- Test: `components/Auth/__tests__/RequireSessionAdmin.test.tsx`

**Interfaces:** Consumes `session.user.admin` (PR B) and `Custom404` from `pages/404.tsx`. Produces `RequireSession({ loading, children, admin?: boolean })` and `Component.auth.admin?: boolean`.

- [ ] **Step 1: Write the failing test**

Create `components/Auth/__tests__/RequireSessionAdmin.test.tsx`:

```tsx
/** @jest-environment jsdom */
import { render, screen } from "@testing-library/react";

let mockSession: { data: unknown, status: string } = { data: null, status: "loading" };

jest.mock("next-auth/react", () => ({
    useSession: () => mockSession,
}));

jest.mock("next/router", () => ({
    __esModule: true,
    default: { replace: jest.fn() },
    useRouter: () => ({ asPath: "/app/admin/requests", push: jest.fn() }),
}));

jest.mock("../../TenancyStore", () => ({
    useTenancyStore: (selector: (state: unknown) => unknown) => selector({
        setTenancySelected: jest.fn(),
        isTenancySelected: () => true,
    }),
}));

import { RequireSession } from "../RequireSession";

function sessionOf(user: object) {
    return { data: { user: { name: "Ada", tenancies: [], ...user }, expires: "2099-01-01" }, status: "authenticated" };
}

function renderGate(admin: boolean) {
    return render(
        <RequireSession loading={<div>loading</div>} admin={admin}>
            <div>admin page</div>
        </RequireSession>,
    );
}

test("an admin page renders for an admin", () => {
    mockSession = sessionOf({ admin: true });

    renderGate(true);

    expect(screen.getByText("admin page")).toBeTruthy();
});

test("an admin page is the not-found page for anyone else", () => {
    mockSession = sessionOf({ admin: false });

    renderGate(true);

    expect(screen.queryByText("admin page")).toBeNull();
    expect(screen.getByText("404 - Page Not Found")).toBeTruthy();
});

test("a session from before the claim existed is not an admin", () => {
    mockSession = sessionOf({});

    renderGate(true);

    expect(screen.getByText("404 - Page Not Found")).toBeTruthy();
});

test("while the session is unknown it shows the loading element, not the 404", () => {
    mockSession = { data: null, status: "loading" };

    renderGate(true);

    expect(screen.getByText("loading")).toBeTruthy();
    expect(screen.queryByText("404 - Page Not Found")).toBeNull();
});

test("a page that is not an admin page renders for everyone", () => {
    mockSession = sessionOf({ admin: false });

    renderGate(false);

    expect(screen.getByText("admin page")).toBeTruthy();
});
```

- [ ] **Step 2: Run it**

Run: `npx jest --coverage=false components/Auth/__tests__/RequireSessionAdmin.test.tsx`
Expected: FAIL — the suite does not compile: `Property 'admin' does not exist on type 'IntrinsicAttributes & Props'`.

- [ ] **Step 3: Add the gate**

In `components/Auth/RequireSession.tsx`, replace:

```tsx
import { loginUrlFor } from "../../lib/authRoutes";
```

with:

```tsx
import { loginUrlFor } from "../../lib/authRoutes";
import Custom404 from "../../pages/404";
```

replace:

```tsx
interface Props {
    loading: ReactNode
    children: ReactNode
}
```

with:

```tsx
interface Props {
    loading: ReactNode
    children: ReactNode
    admin?: boolean
}
```

replace:

```tsx
export function RequireSession({ loading, children }: Props) {
```

with:

```tsx
export function RequireSession({ loading, children, admin = false }: Props) {
```

and replace:

```tsx
    if (status === "loading" && !session) {
        return <>{loading}</>;
    }
```

with:

```tsx
    if (status === "loading" && !session) {
        return <>{loading}</>;
    }

    if (admin && session?.user?.admin !== true) {
        return <Custom404 />;
    }
```

In `pages/_app.tsx`, replace:

```tsx
      // The component that should be visible when the page is loading
      loading: any
    }
```

with:

```tsx
      // The component that should be visible when the page is loading
      loading: any
      // Admin pages: anyone without the admin role gets the not-found page.
      admin?: boolean
    }
```

and replace:

```tsx
          <RequireSession loading={Component.auth.loading}>
```

with:

```tsx
          <RequireSession loading={Component.auth.loading} admin={Component.auth.admin === true}>
```

- [ ] **Step 4: Run the new and the existing gate tests**

Run: `npx jest --coverage=false components/Auth/__tests__`
Expected: PASS, 5 new tests, `RequireSession.test.tsx` and `PendingSessionGuard.test.tsx` unchanged.

- [ ] **Step 5: Commit**

```bash
pwd
command git branch --show-current
command git add components/Auth/RequireSession.tsx pages/_app.tsx components/Auth/__tests__/RequireSessionAdmin.test.tsx
command git commit -m "feat: admin pages are not found for accounts without the admin role

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 3: `adminChain` and `adminBffRouter()`

**Files:**
- Modify: `lib/middlewareChain.ts`
- Modify: `lib/bffRoute.ts`
- Test: `lib/__tests__/adminChain.test.ts`

**Interfaces:** Consumes `token.admin` (PR B) and `requireJsonRequest` from `lib/accountRoute.ts`. Produces `export const adminChain` (requestLogging, auth, adminOnly) and `export function adminBffRouter()` (adminChain + JSON gate on `POST`/`PUT`/`PATCH`/`DELETE`).

- [ ] **Step 1: Write the failing test**

Create `lib/__tests__/adminChain.test.ts`:

```ts
jest.mock("next-auth/jwt", () => ({ getToken: jest.fn() }));

import { getToken } from "next-auth/jwt";
import { createRouter } from "next-connect";
import { adminBffRouter } from "../bffRoute";
import { adminChain } from "../middlewareChain";
import { TOKEN_VERSION } from "../sessionToken";

const mockGetToken = jest.mocked(getToken);

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

async function call(handler: (req: any, res: any) => Promise<unknown>, method = "GET", headers: Record<string, string> = {}) {
    const res = fakeRes();
    const original = process.stdout.write;
    // @ts-ignore
    process.stdout.write = () => true;
    try {
        await handler({ method, url: "/api/admin/x", headers, cookies: {}, query: {} } as any, res);
    } finally {
        process.stdout.write = original;
    }
    return res;
}

function chainOnly() {
    return createRouter<any, any>()
        .use(adminChain)
        .get((req, r) => r.status(200).end("ok"))
        .handler();
}

function adminRoute() {
    return adminBffRouter()
        .get((req, res) => { res.status(200).end("ok"); })
        .post((req, res) => { res.status(201).end("created"); })
        .delete((req, res) => { res.status(204).end(); })
        .handler();
}

const JSON_BODY = { "content-type": "application/json" };

describe("the admin chain", () => {
    test("lets an admin through", async () => {
        mockGetToken.mockResolvedValue({ uid: "u1", v: TOKEN_VERSION, admin: true } as any);

        expect((await call(chainOnly())).statusCode).toBe(200);
    });

    test("answers 404 to a signed-in account that is not an admin, so the area does not reveal itself", async () => {
        mockGetToken.mockResolvedValue({ uid: "u1", v: TOKEN_VERSION } as any);

        const res = await call(chainOnly());

        expect(res.statusCode).toBe(404);
        expect(res.json).toHaveBeenCalledWith({ detail: "not_found" });
    });

    test("answers 401 to a visitor who is not signed in", async () => {
        mockGetToken.mockResolvedValue(null);

        expect((await call(chainOnly())).statusCode).toBe(401);
    });

    test("refuses an admin claim on a token from before the version", async () => {
        mockGetToken.mockResolvedValue({ uid: "u1", admin: true } as any);

        expect((await call(chainOnly())).statusCode).toBe(401);
    });
});

describe("the admin BFF router", () => {
    beforeEach(() => {
        mockGetToken.mockResolvedValue({ uid: "u1", v: TOKEN_VERSION, admin: true } as any);
    });

    test("a read needs no content type", async () => {
        expect((await call(adminRoute(), "GET")).statusCode).toBe(200);
    });

    test("a change without a JSON content type is refused, so a cross-site form cannot make one", async () => {
        const post = await call(adminRoute(), "POST");
        const del = await call(adminRoute(), "DELETE", { "content-type": "text/plain" });

        expect(post.statusCode).toBe(415);
        expect(post.json).toHaveBeenCalledWith({ detail: "invalid_request" });
        expect(del.statusCode).toBe(415);
    });

    test("a change with a JSON content type goes through", async () => {
        expect((await call(adminRoute(), "POST", JSON_BODY)).statusCode).toBe(201);
        expect((await call(adminRoute(), "DELETE", JSON_BODY)).statusCode).toBe(204);
    });

    test("a non-admin gets the 404 before the content type is looked at", async () => {
        mockGetToken.mockResolvedValue({ uid: "u1", v: TOKEN_VERSION } as any);

        expect((await call(adminRoute(), "POST")).statusCode).toBe(404);
    });
});
```

- [ ] **Step 2: Run it**

Run: `npx jest --coverage=false lib/__tests__/adminChain.test.ts`
Expected: FAIL — `Module '"../bffRoute"' has no exported member 'adminBffRouter'` and `Module '"../middlewareChain"' has no exported member 'adminChain'`.

- [ ] **Step 3: Add `adminChain`**

In `lib/middlewareChain.ts`, replace:

```ts
export const pendingOnlyChain = createRouter<NextApiRequest, NextApiResponse>().use(requestLogging, pendingOnly);
```

with:

```ts
export const pendingOnlyChain = createRouter<NextApiRequest, NextApiResponse>().use(requestLogging, pendingOnly);

// Admin routes: a convenience in front of the gatekeeper's Casbin check, which is the authority.
export const adminChain = createRouter<NextApiRequest, NextApiResponse>().use(requestLogging, auth, adminOnly);
```

and replace:

```ts
async function tenancyChecker(req: NextApiRequest, res: NextApiResponse, next: any) {
```

with:

```ts
// The same 404 as a route that does not exist, so the admin area does not reveal itself.
async function adminOnly(req: NextApiRequest, res: NextApiResponse, next: any) {
    const token = await getToken({ req })
    if (token?.admin !== true) {
        res.status(404).json({ detail: "not_found" });
    } else {
        await next();
    }
}

async function tenancyChecker(req: NextApiRequest, res: NextApiResponse, next: any) {
```

- [ ] **Step 4: Add `adminBffRouter()`**

In `lib/bffRoute.ts`, replace:

```ts
import { authOnlyChain } from "./middlewareChain";
```

with:

```ts
import { requireJsonRequest } from "./accountRoute";
import { adminChain, authOnlyChain } from "./middlewareChain";
```

and replace:

```ts
export function bffHandler(router: ReturnType<typeof bffRouter>) {
```

with:

```ts
const CHANGES = new Set(["POST", "PUT", "PATCH", "DELETE"]);

async function requireJsonOnChanges(req: NextApiRequest, res: NextApiResponse, next: () => Promise<unknown>) {
    if (CHANGES.has((req.method ?? "").toUpperCase())) {
        await requireJsonRequest(req, res, next);
        return;
    }
    await next();
}

/** Admin routes answer through `accountHandler`, which keeps the gatekeeper's `detail` on every status. */
export function adminBffRouter() {
    return createRouter<NextApiRequest, NextApiResponse>().use(adminChain).use(requireJsonOnChanges);
}

export function bffHandler(router: ReturnType<typeof bffRouter>) {
```

- [ ] **Step 5: Run the chain tests**

Run: `npx jest --coverage=false lib/__tests__/adminChain.test.ts lib/__tests__/middlewareChain.test.ts lib/__tests__/accountRoutes.test.ts lib/__tests__/shareRoutes.test.ts`
Expected: PASS, 8 new tests, the others unchanged.

- [ ] **Step 6: Commit**

```bash
pwd
command git branch --show-current
command git add lib/middlewareChain.ts lib/bffRoute.ts lib/__tests__/adminChain.test.ts
command git commit -m "feat: an admin-only BFF chain that answers 404 to everyone else

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 4: Gatekeeper admin types and `lib/admin.ts`

**Files:**
- Modify: `types/GatekeeperAPI.ts`
- Create: `lib/admin.ts`
- Test: `lib/__tests__/admin.test.ts`

**Interfaces:** Consumes `axiosInstance` from `lib/rpc.ts`, PR B's `asUser` (`lib/tenancies.ts`), `TenancySummary`, `GatekeeperPage<T>`, `UserRef` and `UserBrief`. Produces the contract's `lib/admin.ts` signatures, `TenancyRequestsQuery`, and the types `TenancyRequestCounts`, `TenancyRequestKind`, `AdminRequester`, `AdminTenancyRequest`, `AdminTenancyRequestDetail`, `AdminTenancy`, `TenancyMember`, `AdminTenancyInvitation`, `TenancyMembers`, `RemovalImpact`, `AdminUserHit`, `TenancyDecision`.

- [ ] **Step 1: Write the failing test**

Create `lib/__tests__/admin.test.ts`:

```ts
import { AxiosError, AxiosHeaders } from "axios";
import {
    addTenancyMember,
    approveTenancyRequest,
    createTenancy,
    declineTenancyRequest,
    getMemberRemovalImpact,
    getTenancyRequest,
    getTenancyRequestCounts,
    listAdminTenancies,
    listTenancyMembers,
    listTenancyRequests,
    removeTenancyMember,
    searchAdminUsers,
    withdrawTenancyInvitationAsAdmin,
} from "../admin";
import axiosInstance from "../rpc";

jest.mock("../rpc");
const mockGet = jest.mocked(axiosInstance.get);
const mockPost = jest.mocked(axiosInstance.post);
const mockDelete = jest.mocked(axiosInstance.delete);

const asAdmin = { headers: { "X-User-Id": "admin-1" } };
const REQUEST_ID = "7a9b5d5e-fa6d-4c18-9a51-2b1e2c3d4e5f";
const USER_ID = "0c1d2e3f-4a5b-4c6d-8e7f-9a0b1c2d3e4f";
const ATTO = "datamap/production/atto";

describe("the admin request calls", () => {
    test("counts", async () => {
        mockGet.mockResolvedValue({ data: { open: 4, join: 2, new: 2, closed: 31 } });

        expect(await getTenancyRequestCounts("admin-1")).toEqual({ open: 4, join: 2, new: 2, closed: 31 });
        expect(mockGet).toHaveBeenCalledWith("/admin/tenancy-requests/counts", asAdmin);
    });

    test("the queue passes its query as parameters", async () => {
        mockGet.mockResolvedValue({ data: { items: [], total_count: 0, limit: 50, offset: 0 } });

        await listTenancyRequests("admin-1", { status: "open", kind: "join", q: "lima", limit: 50, offset: 0 });

        expect(mockGet).toHaveBeenCalledWith("/admin/tenancy-requests", { ...asAdmin, params: { status: "open", kind: "join", q: "lima", limit: 50, offset: 0 } });
    });

    test("one request", async () => {
        mockGet.mockResolvedValue({ data: { id: REQUEST_ID } });

        expect(await getTenancyRequest("admin-1", REQUEST_ID)).toEqual({ id: REQUEST_ID });
        expect(mockGet).toHaveBeenCalledWith(`/admin/tenancy-requests/${REQUEST_ID}`, asAdmin);
    });

    test("approving into an existing tenancy sends its path", async () => {
        mockPost.mockResolvedValue({ data: { id: REQUEST_ID, status: "approved" } });

        expect(await approveTenancyRequest("admin-1", REQUEST_ID, { tenancy: ATTO })).toEqual({ id: REQUEST_ID, status: "approved" });
        expect(mockPost).toHaveBeenCalledWith(`/admin/tenancy-requests/${REQUEST_ID}/approve`, { tenancy: ATTO }, asAdmin);
    });

    test("approving a new tenancy sends it in the gatekeeper's names", async () => {
        mockPost.mockResolvedValue({ data: { id: REQUEST_ID } });

        await approveTenancyRequest("admin-1", REQUEST_ID, { newTenancy: { displayName: "Cerrado Flux", namespace: "cerrado-flux" } });

        expect(mockPost).toHaveBeenCalledWith(
            `/admin/tenancy-requests/${REQUEST_ID}/approve`,
            { new_tenancy: { display_name: "Cerrado Flux", namespace: "cerrado-flux" } },
            asAdmin,
        );
    });

    test("declining sends the message, or null without one", async () => {
        mockPost.mockResolvedValue({ data: { id: REQUEST_ID } });

        await declineTenancyRequest("admin-1", REQUEST_ID, "Ask Luciana");
        await declineTenancyRequest("admin-1", REQUEST_ID);

        expect(mockPost).toHaveBeenNthCalledWith(1, `/admin/tenancy-requests/${REQUEST_ID}/decline`, { message: "Ask Luciana" }, asAdmin);
        expect(mockPost).toHaveBeenNthCalledWith(2, `/admin/tenancy-requests/${REQUEST_ID}/decline`, { message: null }, asAdmin);
    });
});

describe("the admin tenancy calls", () => {
    test("the list", async () => {
        mockGet.mockResolvedValue({ data: [] });

        expect(await listAdminTenancies("admin-1")).toEqual([]);
        expect(mockGet).toHaveBeenCalledWith("/admin/tenancies", asAdmin);
    });

    test("creating sends the gatekeeper's names", async () => {
        mockPost.mockResolvedValue({ data: { path: "datamap/production/cerrado-flux" } });

        expect(await createTenancy("admin-1", { displayName: "Cerrado Flux", namespace: "cerrado-flux" })).toEqual({ path: "datamap/production/cerrado-flux" });
        expect(mockPost).toHaveBeenCalledWith("/admin/tenancies", { display_name: "Cerrado Flux", namespace: "cerrado-flux" }, asAdmin);
    });

    test("members put the path in the URL as it is, and the page in parameters", async () => {
        mockGet.mockResolvedValue({ data: { members: { items: [], total_count: 0, limit: 50, offset: 50 }, invitations: [] } });

        await listTenancyMembers("admin-1", ATTO, { limit: 50, offset: 50 });

        expect(mockGet).toHaveBeenCalledWith("/admin/tenancies/datamap/production/atto/members", { ...asAdmin, params: { limit: 50, offset: 50 } });
    });

    test("removal impact", async () => {
        mockGet.mockResolvedValue({ data: { member_since: "2026-09-30T09:41:00+00:00", datasets_in_tenancy: 31, shared_with_user: 1, owned_by_user: 0 } });

        expect((await getMemberRemovalImpact("admin-1", ATTO, USER_ID)).datasets_in_tenancy).toBe(31);
        expect(mockGet).toHaveBeenCalledWith(`/admin/tenancies/datamap/production/atto/members/${USER_ID}`, asAdmin);
    });

    test("adding a member", async () => {
        mockPost.mockResolvedValue({ data: { id: USER_ID } });

        expect(await addTenancyMember("admin-1", ATTO, USER_ID)).toEqual({ id: USER_ID });
        expect(mockPost).toHaveBeenCalledWith("/admin/tenancies/datamap/production/atto/members", { user_id: USER_ID }, asAdmin);
    });

    test("removing a member", async () => {
        mockDelete.mockResolvedValue({ status: 204 });

        await expect(removeTenancyMember("admin-1", ATTO, USER_ID)).resolves.toBeUndefined();
        expect(mockDelete).toHaveBeenCalledWith(`/admin/tenancies/datamap/production/atto/members/${USER_ID}`, asAdmin);
    });

    test("withdrawing an invitation", async () => {
        mockDelete.mockResolvedValue({ status: 204 });

        await expect(withdrawTenancyInvitationAsAdmin("admin-1", REQUEST_ID)).resolves.toBeUndefined();
        expect(mockDelete).toHaveBeenCalledWith(`/admin/tenancy-invitations/${REQUEST_ID}`, asAdmin);
    });

    test("searching users", async () => {
        mockGet.mockResolvedValue({ data: [{ id: USER_ID, name: "Fernanda Lima", email: "fernanda.lima@inpe.br" }] });

        expect(await searchAdminUsers("admin-1", "fer")).toHaveLength(1);
        expect(mockGet).toHaveBeenCalledWith("/admin/users", { ...asAdmin, params: { q: "fer" } });
    });

    test("a gatekeeper error reaches the caller unchanged", async () => {
        const error = new AxiosError("conflict", "ERR", undefined, {}, {
            status: 409, data: { detail: "tenancy_exists" }, statusText: "", headers: {}, config: { headers: new AxiosHeaders() },
        } as any);
        mockPost.mockRejectedValue(error);

        await expect(createTenancy("admin-1", { displayName: "ATTO", namespace: "atto" })).rejects.toBe(error);
    });
});
```

- [ ] **Step 2: Run it**

Run: `npx jest --coverage=false lib/__tests__/admin.test.ts`
Expected: FAIL — `Cannot find module '../admin'`.

- [ ] **Step 3: Add the types**

`TenancySummary`, `GatekeeperPage`, `UserRef` and `UserBrief` are PR B's; they are used here, not redeclared.

In `types/GatekeeperAPI.ts`, replace PR B's last block:

```ts
/** @interface */
export interface InviteeLookup {
    user: UserBrief
    tenancy_member: boolean
    invitation_pending: boolean
    can_invite: boolean
    datasets: number
}
```

with:

```ts
/** @interface */
export interface InviteeLookup {
    user: UserBrief
    tenancy_member: boolean
    invitation_pending: boolean
    can_invite: boolean
    datasets: number
}

/** @interface */
export interface TenancyRequestCounts {
    open: number
    join: number
    new: number
    closed: number
}

export type TenancyRequestKind = "join" | "new";

/** @interface */
export interface AdminRequester {
    id: string
    name: string
    email: string | null
    email_verified: boolean
    orcid: string | null
}

/** @interface */
export interface AdminTenancyRequest {
    id: string
    requester: AdminRequester
    requested_name: string
    reason: string
    status: "pending" | "approved" | "declined"
    kind: TenancyRequestKind
    suggested_tenancy: TenancySummary | null
    created_at: string
    tenancy: TenancySummary | null
    created_tenancy: boolean
    decision_message: string | null
    decided_by: UserRef | null
    decided_at: string | null
}

/** @interface */
export interface AdminTenancyRequestDetail extends AdminTenancyRequest {
    requester_tenancies: TenancySummary[]
    suggested_tenancy_members: number | null
}

/** @interface */
export interface AdminTenancy {
    path: string
    display_name: string
    members: number
    datasets: number
    is_default: boolean
    is_legacy: boolean
    is_enabled: boolean
}

/** @interface */
export interface TenancyMember {
    id: string
    name: string
    email: string | null
    since: string
    invited_by: UserRef | null
}

/** @interface */
export interface AdminTenancyInvitation {
    id: string
    user: UserBrief
    invited_by: UserRef | null
    created_at: string
}

/** @interface */
export interface TenancyMembers {
    members: GatekeeperPage<TenancyMember>
    invitations: AdminTenancyInvitation[]
}

/** @interface */
export interface RemovalImpact {
    member_since: string
    datasets_in_tenancy: number
    shared_with_user: number
    owned_by_user: number
}

/** @interface */
export interface AdminUserHit {
    id: string
    name: string
    email: string | null
}

/** What the admin decided, as the browser sends it; `lib/admin.ts` renames it for the gatekeeper. */
export type TenancyDecision = { tenancy: string } | { newTenancy: { displayName: string, namespace: string } };
```

- [ ] **Step 4: Write `lib/admin.ts`**

```ts
import {
    AdminTenancy,
    AdminTenancyRequest,
    AdminTenancyRequestDetail,
    AdminUserHit,
    GatekeeperPage,
    RemovalImpact,
    TenancyDecision,
    TenancyMember,
    TenancyMembers,
    TenancyRequestCounts,
} from "../types/GatekeeperAPI";
import axiosInstance from "./rpc";
import { asUser } from "./tenancies";

export type TenancyRequestsQuery = { status: "open" | "closed"; kind?: "join" | "new"; q?: string; limit?: number; offset?: number };

export async function getTenancyRequestCounts(uid: string): Promise<TenancyRequestCounts> {
    const response = await axiosInstance.get("/admin/tenancy-requests/counts", asUser(uid));
    return response.data as TenancyRequestCounts;
}

export async function listTenancyRequests(uid: string, query: TenancyRequestsQuery): Promise<GatekeeperPage<AdminTenancyRequest>> {
    const response = await axiosInstance.get("/admin/tenancy-requests", { ...asUser(uid), params: query });
    return response.data as GatekeeperPage<AdminTenancyRequest>;
}

export async function getTenancyRequest(uid: string, requestId: string): Promise<AdminTenancyRequestDetail> {
    const response = await axiosInstance.get(`/admin/tenancy-requests/${requestId}`, asUser(uid));
    return response.data as AdminTenancyRequestDetail;
}

export async function approveTenancyRequest(uid: string, requestId: string, decision: TenancyDecision): Promise<AdminTenancyRequest> {
    const body = "tenancy" in decision
        ? { tenancy: decision.tenancy }
        : { new_tenancy: { display_name: decision.newTenancy.displayName, namespace: decision.newTenancy.namespace } };
    const response = await axiosInstance.post(`/admin/tenancy-requests/${requestId}/approve`, body, asUser(uid));
    return response.data as AdminTenancyRequest;
}

export async function declineTenancyRequest(uid: string, requestId: string, message?: string): Promise<AdminTenancyRequest> {
    const response = await axiosInstance.post(`/admin/tenancy-requests/${requestId}/decline`, { message: message ?? null }, asUser(uid));
    return response.data as AdminTenancyRequest;
}

export async function listAdminTenancies(uid: string): Promise<AdminTenancy[]> {
    const response = await axiosInstance.get("/admin/tenancies", asUser(uid));
    return response.data as AdminTenancy[];
}

export async function createTenancy(uid: string, input: { displayName: string; namespace: string }): Promise<AdminTenancy> {
    const response = await axiosInstance.post("/admin/tenancies", { display_name: input.displayName, namespace: input.namespace }, asUser(uid));
    return response.data as AdminTenancy;
}

export async function listTenancyMembers(uid: string, tenancy: string, page: { limit: number; offset: number }): Promise<TenancyMembers> {
    const response = await axiosInstance.get(`/admin/tenancies/${tenancy}/members`, { ...asUser(uid), params: { limit: page.limit, offset: page.offset } });
    return response.data as TenancyMembers;
}

export async function getMemberRemovalImpact(uid: string, tenancy: string, userId: string): Promise<RemovalImpact> {
    const response = await axiosInstance.get(`/admin/tenancies/${tenancy}/members/${userId}`, asUser(uid));
    return response.data as RemovalImpact;
}

export async function addTenancyMember(uid: string, tenancy: string, userId: string): Promise<TenancyMember> {
    const response = await axiosInstance.post(`/admin/tenancies/${tenancy}/members`, { user_id: userId }, asUser(uid));
    return response.data as TenancyMember;
}

export async function removeTenancyMember(uid: string, tenancy: string, userId: string): Promise<void> {
    await axiosInstance.delete(`/admin/tenancies/${tenancy}/members/${userId}`, asUser(uid));
}

export async function withdrawTenancyInvitationAsAdmin(uid: string, invitationId: string): Promise<void> {
    await axiosInstance.delete(`/admin/tenancy-invitations/${invitationId}`, asUser(uid));
}

export async function searchAdminUsers(uid: string, q: string): Promise<AdminUserHit[]> {
    const response = await axiosInstance.get("/admin/users", { ...asUser(uid), params: { q } });
    return response.data as AdminUserHit[];
}
```

- [ ] **Step 5: Run it**

Run: `npx jest --coverage=false lib/__tests__/admin.test.ts && npx tsc --noEmit -p .`
Expected: PASS, 15 tests; `tsc` prints nothing.

- [ ] **Step 6: Commit**

```bash
pwd
command git branch --show-current
command git add types/GatekeeperAPI.ts lib/admin.ts lib/__tests__/admin.test.ts
command git commit -m "feat: gatekeeper calls for the admin requests and tenancies

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 5: Admin constants, routes, display helpers and test data

**Files:**
- Create: `contants/AdminConstants.ts`
- Modify: `contants/InternalRoutesConstants.ts`
- Create: `lib/adminDisplay.ts`
- Create: `fake-data/adminFixtures.ts`
- Test: `contants/__tests__/AdminConstants.test.ts`, `lib/__tests__/adminDisplay.test.ts`

**Interfaces:** Consumes `NAMESPACE_MAX_LENGTH` (B's `TenancyConstants`), `formatShortDate` from `lib/embargoDisplay.ts`, Task 4's types. Produces:
- `ROUTE_PAGE_ADMIN`, `ROUTE_PAGE_ADMIN_REQUESTS`, `ROUTE_PAGE_ADMIN_USERS`, `ROUTE_PAGE_ADMIN_TENANCIES`, `ROUTE_PAGE_ADMIN_ACTIVITY`;
- `ADMIN_PAGE_SIZE = 50`, `RECENTLY_CLOSED_LIMIT = 5`, `ADMIN_COUNTS_REFRESH_MS = 60_000`, `ADMIN_SEARCH_DEBOUNCE_MS = 300`, `ADMIN_USER_SEARCH_MIN_LENGTH = 2`, `WAITING_STALE_DAYS = 3`, `type RequestFilter`, `interface AdminTab`, `ADMIN_TABS`, `ADMIN_COPY`, `adminErrorMessage(detail?: string): string`, `adminErrorFrom(error: unknown): string`, `slugifyNamespace(name: string): string`;
- `daysSince(iso, now): number`, `waitingLabel(createdAt, now): { text: string; stale: boolean }`, `requestedAgo(createdAt, now): string`, `requestTarget(request): string`, `closedOutcome(request): { text: string; tone: "approved" | "declined" }`, `closedTenancyName(request): string`, `plural(n, one, many): string`;
- fixtures `PUBLIC_TENANCY`, `DATA_AMAZON`, `ATTO`, `adminRequest()`, `newTenancyRequest()`, `adminRequestDetail()`, `adminTenancy()`, `ADMIN_TENANCIES`, `tenancyMember()`, `tenancyInvitation()`.

- [ ] **Step 1: Write the failing tests**

Create `contants/__tests__/AdminConstants.test.ts`:

```ts
import { ADMIN_COPY, ADMIN_TABS, adminErrorFrom, adminErrorMessage, slugifyNamespace } from "../AdminConstants";

const GENERIC = "Something went wrong. Try again.";

describe("admin error messages", () => {
    test("every code the admin routes answer has its own words", () => {
        const codes = [
            "invalid_request", "namespace_invalid", "display_name_invalid", "message_invalid",
            "request_not_found", "tenancy_not_found", "no_account", "member_not_found", "invitation_not_found",
            "request_not_pending", "already_member", "tenancy_exists", "display_name_taken",
            "requester_email_unverified", "public_tenancy_locked", "legacy_tenancy_read_only", "tenancy_disabled", "not_found",
        ];
        for (const code of codes) {
            expect(adminErrorMessage(code)).not.toBe(GENERIC);
        }
        expect(adminErrorMessage("requester_email_unverified")).toBe(ADMIN_COPY.unverifiedBanner);
    });

    test("an unknown code, or none, reads as a generic failure", () => {
        expect(adminErrorMessage("made_up")).toBe(GENERIC);
        expect(adminErrorMessage(undefined)).toBe(GENERIC);
        expect(adminErrorMessage("unavailable")).toBe(GENERIC);
    });

    test("reads the code from an Axios error, and nothing else", () => {
        expect(adminErrorFrom({ response: { status: 409, data: { detail: "display_name_taken" } } })).toBe("Another tenancy already has this display name.");
        expect(adminErrorFrom(new Error("network"))).toBe(GENERIC);
        expect(adminErrorFrom({ response: { data: { detail: { nested: true } } } })).toBe(GENERIC);
    });
});

describe("slugifyNamespace", () => {
    test("turns a display name into a namespace, accents dropped rather than split", () => {
        expect(slugifyNamespace("Cerrado Flux")).toBe("cerrado-flux");
        expect(slugifyNamespace("  LBA Legacy!! ")).toBe("lba-legacy");
        expect(slugifyNamespace("Data_Amazon 2")).toBe("data-amazon-2");
        expect(slugifyNamespace("João Silva")).toBe("joao-silva");
        expect(slugifyNamespace("João Ciência")).toBe("joao-ciencia");
        expect(slugifyNamespace("---")).toBe("");
        expect(slugifyNamespace("a".repeat(100))).toHaveLength(63);
    });
});

describe("the admin tabs", () => {
    test("are Requests, Users, Tenancies and Activity, in that order, and only Requests counts", () => {
        expect(ADMIN_TABS.map((tab) => tab.label)).toEqual(["Requests", "Users", "Tenancies", "Activity"]);
        expect(ADMIN_TABS.map((tab) => tab.href)).toEqual(["/app/admin/requests", "/app/admin/users", "/app/admin/tenancies", "/app/admin/activity"]);
        expect(ADMIN_TABS.filter((tab) => tab.showsOpenCount).map((tab) => tab.label)).toEqual(["Requests"]);
    });
});
```

Create `lib/__tests__/adminDisplay.test.ts`:

```ts
import { adminRequest, DATA_AMAZON } from "../../fake-data/adminFixtures";
import { closedOutcome, closedTenancyName, plural, requestTarget, requestedAgo, waitingLabel } from "../adminDisplay";

const NOW = new Date("2026-10-04T12:00:00Z");

describe("how long a request has waited", () => {
    test("counts calendar days and goes stale from the third", () => {
        expect(waitingLabel("2026-10-04T08:00:00+00:00", NOW)).toEqual({ text: "today", stale: false });
        expect(waitingLabel("2026-10-03T23:00:00+00:00", NOW)).toEqual({ text: "1 day waiting", stale: false });
        expect(waitingLabel("2026-10-02T09:00:00+00:00", NOW)).toEqual({ text: "2 days waiting", stale: false });
        expect(waitingLabel("2026-10-01T09:00:00+00:00", NOW)).toEqual({ text: "3 days waiting", stale: true });
        expect(waitingLabel("2026-09-28T16:20:00+00:00", NOW)).toEqual({ text: "6 days waiting", stale: true });
    });

    test("reads as a relative date in the review dialog", () => {
        expect(requestedAgo("2026-10-04T08:00:00+00:00", NOW)).toBe("today");
        expect(requestedAgo("2026-10-03T09:00:00+00:00", NOW)).toBe("yesterday");
        expect(requestedAgo("2026-09-28T16:20:00+00:00", NOW)).toBe("6 days ago");
    });
});

describe("names", () => {
    test("a request names the suggested tenancy, else what the user typed", () => {
        expect(requestTarget(adminRequest())).toBe("Data Amazon");
        expect(requestTarget(adminRequest({ suggested_tenancy: null, requested_name: "Cerrado Flux" }))).toBe("Cerrado Flux");
    });
});

describe("a closed request", () => {
    test("says how it ended and where", () => {
        const approved = adminRequest({ status: "approved", tenancy: DATA_AMAZON, requested_name: "data amazon" });
        const created = adminRequest({ status: "approved", created_tenancy: true, tenancy: { ...DATA_AMAZON, path: "datamap/production/cerrado-flux", display_name: "Cerrado Flux" } });
        const declined = adminRequest({ status: "declined", requested_name: "ATTO" });

        expect(closedOutcome(approved)).toEqual({ text: "Approved", tone: "approved" });
        expect(closedOutcome(created)).toEqual({ text: "Approved · new tenancy", tone: "approved" });
        expect(closedOutcome(declined)).toEqual({ text: "Declined", tone: "declined" });
        expect(closedTenancyName(approved)).toBe("Data Amazon");
        expect(closedTenancyName(declined)).toBe("ATTO");
    });
});

describe("plural", () => {
    test("one or many", () => {
        expect(plural(1, "dataset", "datasets")).toBe("dataset");
        expect(plural(0, "dataset", "datasets")).toBe("datasets");
        expect(plural(108, "dataset", "datasets")).toBe("datasets");
    });
});
```

- [ ] **Step 2: Run them**

Run: `npx jest --coverage=false contants/__tests__/AdminConstants.test.ts lib/__tests__/adminDisplay.test.ts`
Expected: FAIL — `Cannot find module '../AdminConstants'`, `Cannot find module '../../fake-data/adminFixtures'`.

- [ ] **Step 3: Add the routes**

In `contants/InternalRoutesConstants.ts`, replace:

```ts
export const ROUTE_PAGE_PROFILE = ROUTE_APP_CONTEXT + '/profile';
```

with:

```ts
export const ROUTE_PAGE_PROFILE = ROUTE_APP_CONTEXT + '/profile';

/**
 * Routes of the admin area; `/app/admin` itself opens the requests.
 * @constant
 */
export const ROUTE_PAGE_ADMIN = ROUTE_APP_CONTEXT + "/admin";
export const ROUTE_PAGE_ADMIN_REQUESTS = ROUTE_PAGE_ADMIN + "/requests";
export const ROUTE_PAGE_ADMIN_USERS = ROUTE_PAGE_ADMIN + "/users";
export const ROUTE_PAGE_ADMIN_TENANCIES = ROUTE_PAGE_ADMIN + "/tenancies";
export const ROUTE_PAGE_ADMIN_ACTIVITY = ROUTE_PAGE_ADMIN + "/activity";
```

- [ ] **Step 4: Write `contants/AdminConstants.ts`**

```ts
import {
    ROUTE_PAGE_ADMIN_ACTIVITY,
    ROUTE_PAGE_ADMIN_REQUESTS,
    ROUTE_PAGE_ADMIN_TENANCIES,
    ROUTE_PAGE_ADMIN_USERS,
} from "./InternalRoutesConstants";
import { NAMESPACE_MAX_LENGTH } from "./TenancyConstants";

export const ADMIN_PAGE_SIZE = 50;
export const RECENTLY_CLOSED_LIMIT = 5;
export const ADMIN_COUNTS_REFRESH_MS = 60_000;
export const ADMIN_SEARCH_DEBOUNCE_MS = 300;
export const ADMIN_USER_SEARCH_MIN_LENGTH = 2;
export const WAITING_STALE_DAYS = 3;

export type RequestFilter = "open" | "join" | "new" | "closed";

export interface AdminTab {
    href: string
    label: string
    showsOpenCount?: boolean
}

export const ADMIN_TABS: readonly AdminTab[] = [
    { href: ROUTE_PAGE_ADMIN_REQUESTS, label: "Requests", showsOpenCount: true },
    { href: ROUTE_PAGE_ADMIN_USERS, label: "Users" },
    { href: ROUTE_PAGE_ADMIN_TENANCIES, label: "Tenancies" },
    { href: ROUTE_PAGE_ADMIN_ACTIVITY, label: "Activity" },
];

export const ADMIN_COPY = {
    adminNav: "Admin",
    scope: "All tenancies",
    retry: "Try again",
    searchPlaceholder: "Name, email or ORCID",
    requestsTitle: "Requests",
    requestsEmpty: "No open requests. Requests people send from the app appear here.",
    requestsLoadError: "Requests could not be loaded.",
    closedEmpty: "No closed requests yet.",
    recentlyClosed: "Recently closed",
    recentlyClosedLoadError: "Recently closed requests could not be loaded.",
    activityLink: "Activity →",
    unverifiedBanner: "Email not verified. A new tenancy can't be created for an unverified account.",
    approveNoAccount: "This account is disabled or no longer exists, so it cannot be approved. Decline the request instead.",
    nothingToJoin: "This account is already in every tenancy it could join.",
    declinePlaceholder: "Ask a member of the tenancy to invite you from its Members page",
    declineBullet: "Stays in public · can request again",
    tenanciesTitle: "Tenancies",
    tenanciesEmpty: "No tenancies yet.",
    tenanciesLoadError: "Tenancies could not be loaded.",
    legacyGroup: "Legacy · staging",
    membersEmpty: "No members yet.",
    membersLoadError: "Members could not be loaded.",
    searchHint: "Type at least 2 characters of a name, email or ORCID iD.",
    searchError: "People could not be searched.",
    impactLoadError: "What changes could not be checked. Removing still works.",
    staysInPublic: "Stays in public",
    usersTitle: "Users",
    usersEmpty: "Coming soon. Until then, add and remove people from Tenancies.",
    activityTitle: "Activity",
    activityEmpty: "Coming soon: every admin action, who and when.",
} as const;

const GENERIC_ERROR = "Something went wrong. Try again.";

const ADMIN_ERROR_MESSAGES: Record<string, string> = {
    invalid_request: "That was not accepted. Reload the page and try again.",
    namespace_invalid: "Use 2 to 63 lower-case letters, digits or hyphens, and not “public”.",
    display_name_invalid: "Use a display name of 1 to 64 characters.",
    message_invalid: "Keep the message to 1000 characters.",
    request_not_found: "This request no longer exists.",
    tenancy_not_found: "This tenancy no longer exists.",
    no_account: "This account no longer exists or is disabled.",
    member_not_found: "This person is no longer a member.",
    invitation_not_found: "This invitation was already answered or withdrawn.",
    request_not_pending: "Another administrator already decided this request.",
    already_member: "They are already a member of this tenancy.",
    tenancy_exists: "A tenancy with this namespace already exists.",
    display_name_taken: "Another tenancy already has this display name.",
    requester_email_unverified: ADMIN_COPY.unverifiedBanner,
    public_tenancy_locked: "Everyone is in Public; its members can't be changed.",
    legacy_tenancy_read_only: "Legacy staging tenancies are read-only.",
    tenancy_disabled: "This tenancy is disabled.",
    not_found: "Your account no longer has the admin role. Reload the page.",
};

export function adminErrorMessage(detail?: string): string {
    return (detail && ADMIN_ERROR_MESSAGES[detail]) || GENERIC_ERROR;
}

export function adminErrorFrom(error: unknown): string {
    const detail = (error as { response?: { data?: { detail?: unknown } } })?.response?.data?.detail;
    return adminErrorMessage(typeof detail === "string" ? detail : undefined);
}

export function slugifyNamespace(name: string): string {
    return name
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "")
        .slice(0, NAMESPACE_MAX_LENGTH);
}
```

- [ ] **Step 5: Write `lib/adminDisplay.ts`**

```ts
import { WAITING_STALE_DAYS } from "../contants/AdminConstants";
import { AdminTenancyRequest } from "../types/GatekeeperAPI";

const DAY_MS = 24 * 60 * 60 * 1000;

function utcDay(date: Date): number {
    return Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate());
}

export function daysSince(iso: string, now: Date): number {
    return Math.max(0, Math.round((utcDay(now) - utcDay(new Date(iso))) / DAY_MS));
}

export function waitingLabel(createdAt: string, now: Date): { text: string; stale: boolean } {
    const days = daysSince(createdAt, now);
    const text = days === 0 ? "today" : days === 1 ? "1 day waiting" : `${days} days waiting`;
    return { text, stale: days >= WAITING_STALE_DAYS };
}

export function requestedAgo(createdAt: string, now: Date): string {
    const days = daysSince(createdAt, now);
    return days === 0 ? "today" : days === 1 ? "yesterday" : `${days} days ago`;
}

export function requestTarget(request: AdminTenancyRequest): string {
    return request.suggested_tenancy?.display_name ?? request.requested_name;
}

export function closedOutcome(request: AdminTenancyRequest): { text: string; tone: "approved" | "declined" } {
    if (request.status === "approved") {
        return { text: request.created_tenancy ? "Approved · new tenancy" : "Approved", tone: "approved" };
    }
    return { text: "Declined", tone: "declined" };
}

export function closedTenancyName(request: AdminTenancyRequest): string {
    return request.tenancy?.display_name ?? request.requested_name;
}

export function plural(n: number, one: string, many: string): string {
    return n === 1 ? one : many;
}
```

- [ ] **Step 6: Write `fake-data/adminFixtures.ts`**

```ts
import {
    AdminTenancy,
    AdminTenancyInvitation,
    AdminTenancyRequest,
    AdminTenancyRequestDetail,
    TenancyMember,
    TenancySummary,
} from "../types/GatekeeperAPI";

export const PUBLIC_TENANCY: TenancySummary = { path: "datamap/production/public", display_name: "Public", is_default: true, is_legacy: false };
export const DATA_AMAZON: TenancySummary = { path: "datamap/production/data-amazon", display_name: "Data Amazon", is_default: false, is_legacy: false };
export const ATTO: TenancySummary = { path: "datamap/production/atto", display_name: "ATTO", is_default: false, is_legacy: false };

export function adminRequest(overrides: Partial<AdminTenancyRequest> = {}): AdminTenancyRequest {
    return {
        id: "7a9b5d5e-fa6d-4c18-9a51-2b1e2c3d4e5f",
        requester: { id: "0c1d2e3f-4a5b-4c6d-8e7f-9a0b1c2d3e4f", name: "Fernanda Lima", email: "fernanda.lima@inpe.br", email_verified: true, orcid: "0000-0002-1825-0097" },
        requested_name: "Data Amazon",
        reason: "Postdoc in Luciana Rizzo's group, GoAmazon SMPS data",
        status: "pending",
        kind: "join",
        suggested_tenancy: DATA_AMAZON,
        created_at: "2026-09-28T16:20:00+00:00",
        tenancy: null,
        created_tenancy: false,
        decision_message: null,
        decided_by: null,
        decided_at: null,
        ...overrides,
    };
}

export function newTenancyRequest(overrides: Partial<AdminTenancyRequest> = {}): AdminTenancyRequest {
    return adminRequest({
        id: "8b0c6e6f-0b7e-4d29-8b62-3c2f3d4e5f60",
        requester: { id: "5e6f7a8b-9c0d-4e1f-8a2b-3c4d5e6f7a8b", name: "Kenji Tanaka", email: "k.tanaka@nagoya-u.ac.jp", email_verified: false, orcid: null },
        requested_name: "Cerrado Flux",
        reason: "Flux towers, joint project Nagoya–UnB",
        kind: "new",
        suggested_tenancy: null,
        created_at: "2026-10-03T09:00:00+00:00",
        ...overrides,
    });
}

export function adminRequestDetail(overrides: Partial<AdminTenancyRequestDetail> = {}): AdminTenancyRequestDetail {
    return { ...adminRequest(), requester_tenancies: [PUBLIC_TENANCY], suggested_tenancy_members: 14, ...overrides };
}

export function adminTenancy(overrides: Partial<AdminTenancy> = {}): AdminTenancy {
    return { ...DATA_AMAZON, members: 14, datasets: 108, is_enabled: true, ...overrides };
}

export const ADMIN_TENANCIES: AdminTenancy[] = [
    adminTenancy({ ...PUBLIC_TENANCY, members: 47, datasets: 9 }),
    adminTenancy({ ...ATTO, members: 9, datasets: 31 }),
    adminTenancy(),
    adminTenancy({ path: "datamap/staging/data-amazon", display_name: "Data Amazon", is_legacy: true, members: 4, datasets: 12 }),
];

export function tenancyMember(overrides: Partial<TenancyMember> = {}): TenancyMember {
    return {
        id: "1b2c3d4e-5f60-4a7b-8c9d-0e1f2a3b4c5d",
        name: "Luciana Rizzo",
        email: "luciana.rizzo@usp.br",
        since: "2026-09-30T09:41:00+00:00",
        invited_by: null,
        ...overrides,
    };
}

export function tenancyInvitation(overrides: Partial<AdminTenancyInvitation> = {}): AdminTenancyInvitation {
    return {
        id: "2c3d4e5f-6a7b-4c8d-9e0f-1a2b3c4d5e6f",
        user: { id: "3d4e5f6a-7b8c-4d9e-8f0a-1b2c3d4e5f6a", name: "Rafael Souza", email: "rafael.souza@usp.br" },
        invited_by: { id: "1b2c3d4e-5f60-4a7b-8c9d-0e1f2a3b4c5d", name: "Luciana Rizzo" },
        created_at: "2026-10-02T10:00:00+00:00",
        ...overrides,
    };
}
```

- [ ] **Step 7: Run them**

Run: `npx jest --coverage=false contants lib/__tests__/adminDisplay.test.ts`
Expected: PASS — 5 + 5 new tests, and every other suite under `contants/` unchanged (`TENANCY_PATH_PATTERN` is PR B's and tested in `TenancyConstants.test.ts`).

- [ ] **Step 8: Commit**

```bash
pwd
command git branch --show-current
command git add contants/AdminConstants.ts contants/InternalRoutesConstants.ts lib/adminDisplay.ts fake-data/adminFixtures.ts contants/__tests__/AdminConstants.test.ts lib/__tests__/adminDisplay.test.ts
command git commit -m "feat: admin routes, copy, error messages and display helpers

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 6: BFF routes for the requests

**Files:**
- Create: `lib/adminRoute.ts`
- Create: `pages/api/admin/tenancy-requests/counts.ts`, `pages/api/admin/tenancy-requests/index.ts`, `pages/api/admin/tenancy-requests/[requestId]/index.ts`, `pages/api/admin/tenancy-requests/[requestId]/approve.ts`, `pages/api/admin/tenancy-requests/[requestId]/decline.ts`
- Test: `lib/__tests__/adminRequestRoutes.test.ts`

**Interfaces:** Consumes `adminBffRouter()` (Task 3), `accountHandler` (`lib/accountRoute.ts`), `NewContext`, Task 4's calls, PR B's `TENANCY_PATH_PATTERN` and `lib/routeParams.ts` (`invalidRequest`, `uuidOr404`, `tenancyOr400`, `pageOr400`, `userIdOr400`), `ADMIN_PAGE_SIZE`, `ADMIN_USER_SEARCH_MIN_LENGTH`. Produces `lib/adminRoute.ts`: `uuidOr404`, `tenancyOr400` and `userIdOr400` re-exported from PR B's `lib/routeParams.ts` (so the admin routes import every parser from one place), `pageOr400(req, res)` (PR B's with `ADMIN_PAGE_SIZE` as the default limit), `requestsQueryOr400(req, res)`, `decisionOr400(req, res)`, `declineMessageOr400(req, res)`, `newTenancyOr400(req, res)`, `userIdOr400(req, res)`, `userSearchOr400(req, res)` — each answers the error itself and returns `undefined`, so a route does `if (!value) return;`.

- [ ] **Step 1: Write the failing test**

Create `lib/__tests__/adminRequestRoutes.test.ts`:

```ts
jest.mock("next-auth/jwt", () => ({ getToken: jest.fn() }));
jest.mock("../admin");

import { AxiosError, AxiosHeaders } from "axios";
import { getToken } from "next-auth/jwt";
import approveHandler from "../../pages/api/admin/tenancy-requests/[requestId]/approve";
import declineHandler from "../../pages/api/admin/tenancy-requests/[requestId]/decline";
import detailHandler from "../../pages/api/admin/tenancy-requests/[requestId]/index";
import countsHandler from "../../pages/api/admin/tenancy-requests/counts";
import listHandler from "../../pages/api/admin/tenancy-requests/index";
import { approveTenancyRequest, declineTenancyRequest, getTenancyRequest, getTenancyRequestCounts, listTenancyRequests } from "../admin";
import { TOKEN_VERSION } from "../sessionToken";

const REQUEST_ID = "7a9b5d5e-fa6d-4c18-9a51-2b1e2c3d4e5f";
const JSON_BODY = { "content-type": "application/json" };
const NEW_TENANCY = { newTenancy: { displayName: "Cerrado Flux", namespace: "cerrado-flux" } };

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

async function send(handler: any, method: string, query: Record<string, string> = {}, body: unknown = undefined, headers: Record<string, string> = {}) {
    const res = fakeRes();
    const original = process.stdout.write;
    // @ts-ignore
    process.stdout.write = () => true;
    try {
        await handler({ method, url: "/api/admin/x", headers, cookies: {}, query, body } as any, res);
    } finally {
        process.stdout.write = original;
    }
    return res;
}

beforeEach(() => {
    jest.mocked(getToken).mockResolvedValue({ uid: "admin-1", v: TOKEN_VERSION, admin: true } as any);
});

describe("the admin request routes", () => {
    test("counts come from the gatekeeper as they are, for the signed-in admin", async () => {
        jest.mocked(getTenancyRequestCounts).mockResolvedValue({ open: 4, join: 2, new: 2, closed: 31 });

        const res = await send(countsHandler, "GET");

        expect(res.statusCode).toBe(200);
        expect(res.json).toHaveBeenCalledWith({ open: 4, join: 2, new: 2, closed: 31 });
        expect(getTenancyRequestCounts).toHaveBeenCalledWith("admin-1");
    });

    test("an account that is not an admin gets 404 and the gatekeeper is not called", async () => {
        jest.mocked(getToken).mockResolvedValue({ uid: "u1", v: TOKEN_VERSION } as any);

        const res = await send(countsHandler, "GET");

        expect(res.statusCode).toBe(404);
        expect(getTenancyRequestCounts).not.toHaveBeenCalled();
    });

    test("the queue reads its filters from the query", async () => {
        jest.mocked(listTenancyRequests).mockResolvedValue({ items: [], total_count: 0, limit: 50, offset: 50 });

        await send(listHandler, "GET", { status: "open", kind: "new", q: " tanaka ", offset: "50" });

        expect(listTenancyRequests).toHaveBeenCalledWith("admin-1", { status: "open", kind: "new", q: "tanaka", limit: 50, offset: 50 });
    });

    test("the closed list drops the kind, and no query is the open queue's first page", async () => {
        jest.mocked(listTenancyRequests).mockResolvedValue({ items: [], total_count: 0, limit: 5, offset: 0 });

        await send(listHandler, "GET", { status: "closed", kind: "join", limit: "5" });
        await send(listHandler, "GET", {});

        expect(listTenancyRequests).toHaveBeenNthCalledWith(1, "admin-1", { status: "closed", limit: 5, offset: 0 });
        expect(listTenancyRequests).toHaveBeenNthCalledWith(2, "admin-1", { status: "open", limit: 50, offset: 0 });
    });

    test("a query the queue does not know is refused before the gatekeeper", async () => {
        for (const query of [{ status: "withdrawn" }, { kind: "both" }, { offset: "-1" }, { limit: "ten" }]) {
            const res = await send(listHandler, "GET", query);
            expect(res.statusCode).toBe(400);
            expect(res.json).toHaveBeenCalledWith({ detail: "invalid_request" });
        }
        expect(listTenancyRequests).not.toHaveBeenCalled();
    });

    test("one request; a gatekeeper 404 keeps its code", async () => {
        jest.mocked(getTenancyRequest).mockRejectedValue(gatekeeperError(404, "request_not_found"));

        const res = await send(detailHandler, "GET", { requestId: REQUEST_ID });

        expect(res.statusCode).toBe(404);
        expect(res.json).toHaveBeenCalledWith({ detail: "request_not_found" });
        expect(getTenancyRequest).toHaveBeenCalledWith("admin-1", REQUEST_ID);
    });

    test("an id that is not a UUID never reaches the gatekeeper", async () => {
        const res = await send(detailHandler, "GET", { requestId: "../counts" });

        expect(res.statusCode).toBe(404);
        expect(res.json).toHaveBeenCalledWith({ detail: "request_not_found" });
        expect(getTenancyRequest).not.toHaveBeenCalled();
    });

    test("approving into an existing tenancy", async () => {
        jest.mocked(approveTenancyRequest).mockResolvedValue({ id: REQUEST_ID } as any);

        const res = await send(approveHandler, "POST", { requestId: REQUEST_ID }, { tenancy: "datamap/production/atto" }, JSON_BODY);

        expect(res.statusCode).toBe(200);
        expect(res.json).toHaveBeenCalledWith({ id: REQUEST_ID });
        expect(approveTenancyRequest).toHaveBeenCalledWith("admin-1", REQUEST_ID, { tenancy: "datamap/production/atto" });
    });

    test("approving with a new tenancy", async () => {
        jest.mocked(approveTenancyRequest).mockResolvedValue({ id: REQUEST_ID } as any);

        await send(approveHandler, "POST", { requestId: REQUEST_ID }, NEW_TENANCY, JSON_BODY);

        expect(approveTenancyRequest).toHaveBeenCalledWith("admin-1", REQUEST_ID, NEW_TENANCY);
    });

    test("an approval names exactly one of the two, and a path that is a path", async () => {
        const bodies = [
            {},
            { tenancy: "datamap/production/atto", ...NEW_TENANCY },
            { tenancy: "../../users" },
            { newTenancy: { displayName: "Cerrado Flux" } },
        ];
        for (const body of bodies) {
            const res = await send(approveHandler, "POST", { requestId: REQUEST_ID }, body, JSON_BODY);
            expect(res.statusCode).toBe(400);
        }
        expect(approveTenancyRequest).not.toHaveBeenCalled();
    });

    test("a gatekeeper 409 reaches the browser with its code", async () => {
        jest.mocked(approveTenancyRequest).mockRejectedValue(gatekeeperError(409, "requester_email_unverified"));

        const res = await send(approveHandler, "POST", { requestId: REQUEST_ID }, NEW_TENANCY, JSON_BODY);

        expect(res.statusCode).toBe(409);
        expect(res.json).toHaveBeenCalledWith({ detail: "requester_email_unverified" });
    });

    test("an approval without a JSON content type is refused", async () => {
        const res = await send(approveHandler, "POST", { requestId: REQUEST_ID }, { tenancy: "datamap/production/atto" });

        expect(res.statusCode).toBe(415);
        expect(approveTenancyRequest).not.toHaveBeenCalled();
    });

    test("declining passes the message, and nothing when there is none", async () => {
        jest.mocked(declineTenancyRequest).mockResolvedValue({ id: REQUEST_ID } as any);

        await send(declineHandler, "POST", { requestId: REQUEST_ID }, { message: "Ask Luciana" }, JSON_BODY);
        await send(declineHandler, "POST", { requestId: REQUEST_ID }, { message: null }, JSON_BODY);

        expect(declineTenancyRequest).toHaveBeenNthCalledWith(1, "admin-1", REQUEST_ID, "Ask Luciana");
        expect(declineTenancyRequest).toHaveBeenNthCalledWith(2, "admin-1", REQUEST_ID, undefined);
    });

    test("a message that is not text is refused", async () => {
        const res = await send(declineHandler, "POST", { requestId: REQUEST_ID }, { message: 42 }, JSON_BODY);

        expect(res.statusCode).toBe(400);
        expect(declineTenancyRequest).not.toHaveBeenCalled();
    });
});
```

- [ ] **Step 2: Run it**

Run: `npx jest --coverage=false lib/__tests__/adminRequestRoutes.test.ts`
Expected: FAIL — `Cannot find module '../../pages/api/admin/tenancy-requests/[requestId]/approve'`.

- [ ] **Step 3: Write `lib/adminRoute.ts`**

```ts
import type { NextApiRequest, NextApiResponse } from "next";
import { ADMIN_PAGE_SIZE, ADMIN_USER_SEARCH_MIN_LENGTH } from "../contants/AdminConstants";
import { TENANCY_PATH_PATTERN } from "../contants/TenancyConstants";
import { TenancyDecision } from "../types/GatekeeperAPI";
import { TenancyRequestsQuery } from "./admin";
import { invalidRequest, pageOr400 as pageWithDefaultOr400 } from "./routeParams";

export { tenancyOr400, userIdOr400, uuidOr404 } from "./routeParams";

export function pageOr400(req: NextApiRequest, res: NextApiResponse): { limit: number; offset: number } | undefined {
    return pageWithDefaultOr400(req, res, ADMIN_PAGE_SIZE);
}

export function requestsQueryOr400(req: NextApiRequest, res: NextApiResponse): TenancyRequestsQuery | undefined {
    const status = req.query.status ?? "open";
    const kind = req.query.kind;
    const q = req.query.q;
    if ((status !== "open" && status !== "closed")
        || (kind !== undefined && kind !== "join" && kind !== "new")
        || (q !== undefined && typeof q !== "string")) {
        return invalidRequest(res);
    }
    const page = pageOr400(req, res);
    if (!page) {
        return undefined;
    }
    const search = typeof q === "string" ? q.trim() : "";
    return {
        status: status as "open" | "closed",
        ...(status === "open" && kind ? { kind: kind as "join" | "new" } : {}),
        ...(search ? { q: search } : {}),
        ...page,
    };
}

export function decisionOr400(req: NextApiRequest, res: NextApiResponse): TenancyDecision | undefined {
    const body = req.body ?? {};
    const hasTenancy = body.tenancy !== undefined;
    const hasNew = body.newTenancy !== undefined;
    if (hasTenancy && !hasNew && typeof body.tenancy === "string" && TENANCY_PATH_PATTERN.test(body.tenancy)) {
        return { tenancy: body.tenancy };
    }
    const fresh = body.newTenancy;
    if (hasNew && !hasTenancy && typeof fresh?.displayName === "string" && typeof fresh?.namespace === "string") {
        return { newTenancy: { displayName: fresh.displayName, namespace: fresh.namespace } };
    }
    return invalidRequest(res);
}

export function declineMessageOr400(req: NextApiRequest, res: NextApiResponse): { message?: string } | undefined {
    const message = req.body?.message;
    if (message === undefined || message === null) {
        return {};
    }
    return typeof message === "string" ? { message } : invalidRequest(res);
}

export function newTenancyOr400(req: NextApiRequest, res: NextApiResponse): { displayName: string; namespace: string } | undefined {
    const { displayName, namespace } = req.body ?? {};
    return typeof displayName === "string" && typeof namespace === "string" ? { displayName, namespace } : invalidRequest(res);
}

export function userSearchOr400(req: NextApiRequest, res: NextApiResponse): string | undefined {
    const q = req.query.q;
    const value = typeof q === "string" ? q.trim() : "";
    return value.length >= ADMIN_USER_SEARCH_MIN_LENGTH ? value : invalidRequest(res);
}
```

- [ ] **Step 4: Write the routes**

`pages/api/admin/tenancy-requests/counts.ts`:

```ts
import { accountHandler } from "../../../../lib/accountRoute";
import { getTenancyRequestCounts } from "../../../../lib/admin";
import { NewContext } from "../../../../lib/appLocalContext";
import { adminBffRouter } from "../../../../lib/bffRoute";

const router = adminBffRouter()
    .get(async (req, res) => {
        const { uid } = await NewContext(req);
        res.json(await getTenancyRequestCounts(uid));
    });

export default accountHandler(router);
```

`pages/api/admin/tenancy-requests/index.ts`:

```ts
import { accountHandler } from "../../../../lib/accountRoute";
import { listTenancyRequests } from "../../../../lib/admin";
import { requestsQueryOr400 } from "../../../../lib/adminRoute";
import { NewContext } from "../../../../lib/appLocalContext";
import { adminBffRouter } from "../../../../lib/bffRoute";

const router = adminBffRouter()
    .get(async (req, res) => {
        const query = requestsQueryOr400(req, res);
        if (!query) {
            return;
        }
        const { uid } = await NewContext(req);
        res.json(await listTenancyRequests(uid, query));
    });

export default accountHandler(router);
```

`pages/api/admin/tenancy-requests/[requestId]/index.ts`:

```ts
import { accountHandler } from "../../../../../lib/accountRoute";
import { getTenancyRequest } from "../../../../../lib/admin";
import { uuidOr404 } from "../../../../../lib/adminRoute";
import { NewContext } from "../../../../../lib/appLocalContext";
import { adminBffRouter } from "../../../../../lib/bffRoute";

const router = adminBffRouter()
    .get(async (req, res) => {
        const requestId = uuidOr404(req, res, "requestId", "request_not_found");
        if (!requestId) {
            return;
        }
        const { uid } = await NewContext(req);
        res.json(await getTenancyRequest(uid, requestId));
    });

export default accountHandler(router);
```

`pages/api/admin/tenancy-requests/[requestId]/approve.ts`:

```ts
import { accountHandler } from "../../../../../lib/accountRoute";
import { approveTenancyRequest } from "../../../../../lib/admin";
import { decisionOr400, uuidOr404 } from "../../../../../lib/adminRoute";
import { NewContext } from "../../../../../lib/appLocalContext";
import { adminBffRouter } from "../../../../../lib/bffRoute";

const router = adminBffRouter()
    .post(async (req, res) => {
        const requestId = uuidOr404(req, res, "requestId", "request_not_found");
        if (!requestId) {
            return;
        }
        const decision = decisionOr400(req, res);
        if (!decision) {
            return;
        }
        const { uid } = await NewContext(req);
        res.json(await approveTenancyRequest(uid, requestId, decision));
    });

export default accountHandler(router);
```

`pages/api/admin/tenancy-requests/[requestId]/decline.ts`:

```ts
import { accountHandler } from "../../../../../lib/accountRoute";
import { declineTenancyRequest } from "../../../../../lib/admin";
import { declineMessageOr400, uuidOr404 } from "../../../../../lib/adminRoute";
import { NewContext } from "../../../../../lib/appLocalContext";
import { adminBffRouter } from "../../../../../lib/bffRoute";

const router = adminBffRouter()
    .post(async (req, res) => {
        const requestId = uuidOr404(req, res, "requestId", "request_not_found");
        if (!requestId) {
            return;
        }
        const body = declineMessageOr400(req, res);
        if (!body) {
            return;
        }
        const { uid } = await NewContext(req);
        res.json(await declineTenancyRequest(uid, requestId, body.message));
    });

export default accountHandler(router);
```

- [ ] **Step 5: Run it**

Run: `npx jest --coverage=false lib/__tests__/adminRequestRoutes.test.ts`
Expected: PASS, 14 tests.

- [ ] **Step 6: Commit**

```bash
pwd
command git branch --show-current
command git add lib/adminRoute.ts pages/api/admin/tenancy-requests lib/__tests__/adminRequestRoutes.test.ts
command git commit -m "feat: BFF routes for the admin request queue

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 7: BFF routes for tenancies, members, invitations and user search

**Files:**
- Create: `pages/api/admin/tenancies/index.ts`, `pages/api/admin/tenancies/members/index.ts`, `pages/api/admin/tenancies/members/[userId].ts`, `pages/api/admin/tenancy-invitations/[invitationId].ts`, `pages/api/admin/users.ts`
- Test: `lib/__tests__/adminTenancyRoutes.test.ts`

**Interfaces:** Consumes Task 6's `lib/adminRoute.ts` and Task 4's calls. Produces the remaining seven contract routes.

- [ ] **Step 1: Write the failing test**

Create `lib/__tests__/adminTenancyRoutes.test.ts`:

```ts
jest.mock("next-auth/jwt", () => ({ getToken: jest.fn() }));
jest.mock("../admin");

import { AxiosError, AxiosHeaders } from "axios";
import { getToken } from "next-auth/jwt";
import tenanciesHandler from "../../pages/api/admin/tenancies/index";
import memberHandler from "../../pages/api/admin/tenancies/members/[userId]";
import membersHandler from "../../pages/api/admin/tenancies/members/index";
import invitationHandler from "../../pages/api/admin/tenancy-invitations/[invitationId]";
import usersHandler from "../../pages/api/admin/users";
import {
    addTenancyMember,
    createTenancy,
    getMemberRemovalImpact,
    listAdminTenancies,
    listTenancyMembers,
    removeTenancyMember,
    searchAdminUsers,
    withdrawTenancyInvitationAsAdmin,
} from "../admin";
import { TOKEN_VERSION } from "../sessionToken";

const ATTO = "datamap/production/atto";
const USER_ID = "0c1d2e3f-4a5b-4c6d-8e7f-9a0b1c2d3e4f";
const INVITATION_ID = "2c3d4e5f-6a7b-4c8d-9e0f-1a2b3c4d5e6f";
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

async function send(handler: any, method: string, query: Record<string, string> = {}, body: unknown = undefined, headers: Record<string, string> = {}) {
    const res = fakeRes();
    const original = process.stdout.write;
    // @ts-ignore
    process.stdout.write = () => true;
    try {
        await handler({ method, url: "/api/admin/x", headers, cookies: {}, query, body } as any, res);
    } finally {
        process.stdout.write = original;
    }
    return res;
}

beforeEach(() => {
    jest.mocked(getToken).mockResolvedValue({ uid: "admin-1", v: TOKEN_VERSION, admin: true } as any);
});

describe("the admin tenancy routes", () => {
    test("the list, for the signed-in admin", async () => {
        jest.mocked(listAdminTenancies).mockResolvedValue([]);

        const res = await send(tenanciesHandler, "GET");

        expect(res.json).toHaveBeenCalledWith([]);
        expect(listAdminTenancies).toHaveBeenCalledWith("admin-1");
    });

    test("creating answers 201 with the tenancy; a body without both names is refused", async () => {
        jest.mocked(createTenancy).mockResolvedValue({ path: "datamap/production/cerrado-flux" } as any);

        const created = await send(tenanciesHandler, "POST", {}, { displayName: "Cerrado Flux", namespace: "cerrado-flux" }, JSON_BODY);
        const refused = await send(tenanciesHandler, "POST", {}, { displayName: "Cerrado Flux" }, JSON_BODY);

        expect(created.statusCode).toBe(201);
        expect(created.json).toHaveBeenCalledWith({ path: "datamap/production/cerrado-flux" });
        expect(createTenancy).toHaveBeenCalledWith("admin-1", { displayName: "Cerrado Flux", namespace: "cerrado-flux" });
        expect(refused.statusCode).toBe(400);
        expect(createTenancy).toHaveBeenCalledTimes(1);
    });

    test("members take the tenancy from the query and page by 50", async () => {
        jest.mocked(listTenancyMembers).mockResolvedValue({ members: { items: [], total_count: 0, limit: 50, offset: 0 }, invitations: [] });

        await send(membersHandler, "GET", { tenancy: ATTO });
        await send(membersHandler, "GET", { tenancy: ATTO, limit: "50", offset: "50" });

        expect(listTenancyMembers).toHaveBeenNthCalledWith(1, "admin-1", ATTO, { limit: 50, offset: 0 });
        expect(listTenancyMembers).toHaveBeenNthCalledWith(2, "admin-1", ATTO, { limit: 50, offset: 50 });
    });

    test("a tenancy that is not a plain path is refused before the gatekeeper", async () => {
        for (const query of [{}, { tenancy: "../users" }, { tenancy: "datamap/production/../../users" }]) {
            const res = await send(membersHandler, "GET", query);
            expect(res.statusCode).toBe(400);
            expect(res.json).toHaveBeenCalledWith({ detail: "invalid_request" });
        }
        expect(listTenancyMembers).not.toHaveBeenCalled();
    });

    test("adding a member answers 201; a user id that is not a UUID is refused", async () => {
        jest.mocked(addTenancyMember).mockResolvedValue({ id: USER_ID } as any);

        const added = await send(membersHandler, "POST", { tenancy: ATTO }, { userId: USER_ID }, JSON_BODY);
        const refused = await send(membersHandler, "POST", { tenancy: ATTO }, { userId: "someone" }, JSON_BODY);

        expect(added.statusCode).toBe(201);
        expect(addTenancyMember).toHaveBeenCalledWith("admin-1", ATTO, USER_ID);
        expect(refused.statusCode).toBe(400);
        expect(addTenancyMember).toHaveBeenCalledTimes(1);
    });

    test("a gatekeeper refusal to add keeps its code", async () => {
        jest.mocked(addTenancyMember).mockRejectedValue(gatekeeperError(409, "public_tenancy_locked"));

        const res = await send(membersHandler, "POST", { tenancy: "datamap/production/public" }, { userId: USER_ID }, JSON_BODY);

        expect(res.statusCode).toBe(409);
        expect(res.json).toHaveBeenCalledWith({ detail: "public_tenancy_locked" });
    });

    test("the removal impact of one member", async () => {
        jest.mocked(getMemberRemovalImpact).mockResolvedValue({ member_since: "2026-09-30T09:41:00+00:00", datasets_in_tenancy: 31, shared_with_user: 1, owned_by_user: 0 });

        const res = await send(memberHandler, "GET", { tenancy: ATTO, userId: USER_ID });

        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ datasets_in_tenancy: 31 }));
        expect(getMemberRemovalImpact).toHaveBeenCalledWith("admin-1", ATTO, USER_ID);
    });

    test("removing a member answers 204; a user id that is not a UUID is not found", async () => {
        jest.mocked(removeTenancyMember).mockResolvedValue(undefined);

        const removed = await send(memberHandler, "DELETE", { tenancy: ATTO, userId: USER_ID }, {}, JSON_BODY);
        const unknown = await send(memberHandler, "DELETE", { tenancy: ATTO, userId: "x" }, {}, JSON_BODY);

        expect(removed.statusCode).toBe(204);
        expect(removeTenancyMember).toHaveBeenCalledWith("admin-1", ATTO, USER_ID);
        expect(unknown.statusCode).toBe(404);
        expect(unknown.json).toHaveBeenCalledWith({ detail: "member_not_found" });
    });

    test("withdrawing an invitation answers 204; an id that is not a UUID is not found", async () => {
        jest.mocked(withdrawTenancyInvitationAsAdmin).mockResolvedValue(undefined);

        const withdrawn = await send(invitationHandler, "DELETE", { invitationId: INVITATION_ID }, {}, JSON_BODY);
        const unknown = await send(invitationHandler, "DELETE", { invitationId: "x" }, {}, JSON_BODY);

        expect(withdrawn.statusCode).toBe(204);
        expect(withdrawTenancyInvitationAsAdmin).toHaveBeenCalledWith("admin-1", INVITATION_ID);
        expect(unknown.statusCode).toBe(404);
        expect(unknown.json).toHaveBeenCalledWith({ detail: "invitation_not_found" });
    });

    test("user search trims the query and needs two characters", async () => {
        jest.mocked(searchAdminUsers).mockResolvedValue([]);

        const found = await send(usersHandler, "GET", { q: " fer " });
        const short = await send(usersHandler, "GET", { q: " f " });

        expect(found.statusCode).toBe(200);
        expect(searchAdminUsers).toHaveBeenCalledWith("admin-1", "fer");
        expect(short.statusCode).toBe(400);
        expect(searchAdminUsers).toHaveBeenCalledTimes(1);
    });

    test("an account that is not an admin cannot remove anyone", async () => {
        jest.mocked(getToken).mockResolvedValue({ uid: "u1", v: TOKEN_VERSION } as any);

        const res = await send(memberHandler, "DELETE", { tenancy: ATTO, userId: USER_ID }, {}, JSON_BODY);

        expect(res.statusCode).toBe(404);
        expect(removeTenancyMember).not.toHaveBeenCalled();
    });
});
```

- [ ] **Step 2: Run it**

Run: `npx jest --coverage=false lib/__tests__/adminTenancyRoutes.test.ts`
Expected: FAIL — `Cannot find module '../../pages/api/admin/tenancies/index'`.

- [ ] **Step 3: Write the routes**

`pages/api/admin/tenancies/index.ts`:

```ts
import { accountHandler } from "../../../../lib/accountRoute";
import { createTenancy, listAdminTenancies } from "../../../../lib/admin";
import { newTenancyOr400 } from "../../../../lib/adminRoute";
import { NewContext } from "../../../../lib/appLocalContext";
import { adminBffRouter } from "../../../../lib/bffRoute";

const router = adminBffRouter()
    .get(async (req, res) => {
        const { uid } = await NewContext(req);
        res.json(await listAdminTenancies(uid));
    })
    .post(async (req, res) => {
        const input = newTenancyOr400(req, res);
        if (!input) {
            return;
        }
        const { uid } = await NewContext(req);
        res.status(201).json(await createTenancy(uid, input));
    });

export default accountHandler(router);
```

`pages/api/admin/tenancies/members/index.ts`:

```ts
import { accountHandler } from "../../../../../lib/accountRoute";
import { addTenancyMember, listTenancyMembers } from "../../../../../lib/admin";
import { pageOr400, tenancyOr400, userIdOr400 } from "../../../../../lib/adminRoute";
import { NewContext } from "../../../../../lib/appLocalContext";
import { adminBffRouter } from "../../../../../lib/bffRoute";

const router = adminBffRouter()
    .get(async (req, res) => {
        const tenancy = tenancyOr400(req, res);
        if (!tenancy) {
            return;
        }
        const page = pageOr400(req, res);
        if (!page) {
            return;
        }
        const { uid } = await NewContext(req);
        res.json(await listTenancyMembers(uid, tenancy, page));
    })
    .post(async (req, res) => {
        const tenancy = tenancyOr400(req, res);
        if (!tenancy) {
            return;
        }
        const userId = userIdOr400(req, res);
        if (!userId) {
            return;
        }
        const { uid } = await NewContext(req);
        res.status(201).json(await addTenancyMember(uid, tenancy, userId));
    });

export default accountHandler(router);
```

`pages/api/admin/tenancies/members/[userId].ts`:

```ts
import { accountHandler } from "../../../../../lib/accountRoute";
import { getMemberRemovalImpact, removeTenancyMember } from "../../../../../lib/admin";
import { tenancyOr400, uuidOr404 } from "../../../../../lib/adminRoute";
import { NewContext } from "../../../../../lib/appLocalContext";
import { adminBffRouter } from "../../../../../lib/bffRoute";

const router = adminBffRouter()
    .get(async (req, res) => {
        const tenancy = tenancyOr400(req, res);
        if (!tenancy) {
            return;
        }
        const userId = uuidOr404(req, res, "userId", "member_not_found");
        if (!userId) {
            return;
        }
        const { uid } = await NewContext(req);
        res.json(await getMemberRemovalImpact(uid, tenancy, userId));
    })
    .delete(async (req, res) => {
        const tenancy = tenancyOr400(req, res);
        if (!tenancy) {
            return;
        }
        const userId = uuidOr404(req, res, "userId", "member_not_found");
        if (!userId) {
            return;
        }
        const { uid } = await NewContext(req);
        await removeTenancyMember(uid, tenancy, userId);
        res.status(204).end();
    });

export default accountHandler(router);
```

`pages/api/admin/tenancy-invitations/[invitationId].ts`:

```ts
import { accountHandler } from "../../../../lib/accountRoute";
import { withdrawTenancyInvitationAsAdmin } from "../../../../lib/admin";
import { uuidOr404 } from "../../../../lib/adminRoute";
import { NewContext } from "../../../../lib/appLocalContext";
import { adminBffRouter } from "../../../../lib/bffRoute";

const router = adminBffRouter()
    .delete(async (req, res) => {
        const invitationId = uuidOr404(req, res, "invitationId", "invitation_not_found");
        if (!invitationId) {
            return;
        }
        const { uid } = await NewContext(req);
        await withdrawTenancyInvitationAsAdmin(uid, invitationId);
        res.status(204).end();
    });

export default accountHandler(router);
```

`pages/api/admin/users.ts`:

```ts
import { accountHandler } from "../../../lib/accountRoute";
import { searchAdminUsers } from "../../../lib/admin";
import { userSearchOr400 } from "../../../lib/adminRoute";
import { NewContext } from "../../../lib/appLocalContext";
import { adminBffRouter } from "../../../lib/bffRoute";

const router = adminBffRouter()
    .get(async (req, res) => {
        const q = userSearchOr400(req, res);
        if (!q) {
            return;
        }
        const { uid } = await NewContext(req);
        res.json(await searchAdminUsers(uid, q));
    });

export default accountHandler(router);
```

- [ ] **Step 4: Run it**

Run: `npx jest --coverage=false lib/__tests__/adminTenancyRoutes.test.ts lib/__tests__/adminRequestRoutes.test.ts`
Expected: PASS, 11 + 14 tests.

- [ ] **Step 5: Commit**

```bash
pwd
command git branch --show-current
command git add pages/api/admin/tenancies pages/api/admin/tenancy-invitations pages/api/admin/users.ts lib/__tests__/adminTenancyRoutes.test.ts
command git commit -m "feat: BFF routes for admin tenancies, members and user search

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 8: `BFFAPI` admin mutations

**Files:**
- Modify: `gateways/BFFAPI.ts`
- Test: `gateways/__tests__/BFFAPI.admin.test.ts`

**Interfaces:** Consumes the BFF routes (Tasks 6–7). Produces the contract's six methods, each rejecting with the Axios error:
`approveTenancyRequest(requestId: string, decision: TenancyDecision): Promise<AdminTenancyRequest>`, `declineTenancyRequest(requestId: string, message?: string): Promise<AdminTenancyRequest>`, `createTenancy(input: { displayName: string; namespace: string }): Promise<AdminTenancy>`, `addTenancyMember(tenancy: string, userId: string): Promise<TenancyMember>`, `removeTenancyMember(tenancy: string, userId: string): Promise<void>`, `withdrawTenancyInvitationAsAdmin(invitationId: string): Promise<void>`.

- [ ] **Step 1: Write the failing test**

Create `gateways/__tests__/BFFAPI.admin.test.ts`:

```ts
jest.mock("axios", () => {
    const actual = jest.requireActual("axios");
    return {
        __esModule: true,
        ...actual,
        default: {
            ...actual.default,
            post: jest.fn(),
            delete: jest.fn(),
            isAxiosError: actual.default.isAxiosError,
        },
    };
});

import axios, { AxiosError, AxiosHeaders } from "axios";
import { BFFAPI } from "../BFFAPI";

const bff = new BFFAPI();
const REQUEST_ID = "7a9b5d5e-fa6d-4c18-9a51-2b1e2c3d4e5f";
const USER_ID = "0c1d2e3f-4a5b-4c6d-8e7f-9a0b1c2d3e4f";
const INVITATION_ID = "2c3d4e5f-6a7b-4c8d-9e0f-1a2b3c4d5e6f";

describe("BFFAPI admin", () => {
    test("approving into an existing tenancy", async () => {
        jest.mocked(axios.post).mockResolvedValue({ status: 200, data: { id: REQUEST_ID, status: "approved" } });

        expect(await bff.approveTenancyRequest(REQUEST_ID, { tenancy: "datamap/production/atto" })).toEqual({ id: REQUEST_ID, status: "approved" });
        expect(axios.post).toHaveBeenCalledWith(`/api/admin/tenancy-requests/${REQUEST_ID}/approve`, { tenancy: "datamap/production/atto" });
    });

    test("approving with a new tenancy sends it as the browser names it", async () => {
        jest.mocked(axios.post).mockResolvedValue({ status: 200, data: {} });
        const decision = { newTenancy: { displayName: "Cerrado Flux", namespace: "cerrado-flux" } };

        await bff.approveTenancyRequest(REQUEST_ID, decision);

        expect(axios.post).toHaveBeenCalledWith(`/api/admin/tenancy-requests/${REQUEST_ID}/approve`, decision);
    });

    test("declining sends the message, or null", async () => {
        jest.mocked(axios.post).mockResolvedValue({ status: 200, data: {} });

        await bff.declineTenancyRequest(REQUEST_ID, "Ask Luciana");
        await bff.declineTenancyRequest(REQUEST_ID);

        expect(axios.post).toHaveBeenNthCalledWith(1, `/api/admin/tenancy-requests/${REQUEST_ID}/decline`, { message: "Ask Luciana" });
        expect(axios.post).toHaveBeenNthCalledWith(2, `/api/admin/tenancy-requests/${REQUEST_ID}/decline`, { message: null });
    });

    test("creating a tenancy", async () => {
        jest.mocked(axios.post).mockResolvedValue({ status: 201, data: { path: "datamap/production/cerrado-flux" } });
        const input = { displayName: "Cerrado Flux", namespace: "cerrado-flux" };

        expect(await bff.createTenancy(input)).toEqual({ path: "datamap/production/cerrado-flux" });
        expect(axios.post).toHaveBeenCalledWith("/api/admin/tenancies", input);
    });

    test("adding a member sends the tenancy as a query parameter", async () => {
        jest.mocked(axios.post).mockResolvedValue({ status: 201, data: { id: USER_ID } });

        expect(await bff.addTenancyMember("datamap/production/atto", USER_ID)).toEqual({ id: USER_ID });
        expect(axios.post).toHaveBeenCalledWith("/api/admin/tenancies/members?tenancy=datamap%2Fproduction%2Fatto", { userId: USER_ID });
    });

    test("removing a member sends a JSON body, which the admin routes require on a change", async () => {
        jest.mocked(axios.delete).mockResolvedValue({ status: 204, data: "" });

        await expect(bff.removeTenancyMember("datamap/production/atto", USER_ID)).resolves.toBeUndefined();
        expect(axios.delete).toHaveBeenCalledWith(`/api/admin/tenancies/members/${USER_ID}?tenancy=datamap%2Fproduction%2Fatto`, { data: {} });
    });

    test("withdrawing an invitation", async () => {
        jest.mocked(axios.delete).mockResolvedValue({ status: 204, data: "" });

        await expect(bff.withdrawTenancyInvitationAsAdmin(INVITATION_ID)).resolves.toBeUndefined();
        expect(axios.delete).toHaveBeenCalledWith(`/api/admin/tenancy-invitations/${INVITATION_ID}`, { data: {} });
    });

    test("an error rejects with the Axios error, so the caller can read its code", async () => {
        const error = new AxiosError("conflict", "ERR", undefined, {}, {
            status: 409, data: { detail: "request_not_pending" }, statusText: "", headers: {}, config: { headers: new AxiosHeaders() },
        } as any);
        jest.mocked(axios.post).mockRejectedValue(error);

        await expect(bff.declineTenancyRequest(REQUEST_ID)).rejects.toBe(error);
    });
});
```

- [ ] **Step 2: Run it**

Run: `npx jest --coverage=false gateways/__tests__/BFFAPI.admin.test.ts`
Expected: FAIL — `Property 'approveTenancyRequest' does not exist on type 'BFFAPI'`.

- [ ] **Step 3: Add the methods**

In `gateways/BFFAPI.ts`, replace:

```ts
import { UserDetailsResponse } from "../lib/users";
```

with:

```ts
import { UserDetailsResponse } from "../lib/users";
import { AdminTenancy, AdminTenancyRequest, TenancyDecision, TenancyMember } from "../types/GatekeeperAPI";
```

and replace PR B's last method:

```ts
    async withdrawWorkspaceInvitation(tenancy: string, invitationId: string): Promise<void> {
        await axios.delete(`/api/workspace/invitations/${encodeURIComponent(invitationId)}?tenancy=${encodeURIComponent(tenancy)}`);
    }
```

with:

```ts
    async withdrawWorkspaceInvitation(tenancy: string, invitationId: string): Promise<void> {
        await axios.delete(`/api/workspace/invitations/${encodeURIComponent(invitationId)}?tenancy=${encodeURIComponent(tenancy)}`);
    }

    async approveTenancyRequest(requestId: string, decision: TenancyDecision): Promise<AdminTenancyRequest> {
        const response = await axios.post(`/api/admin/tenancy-requests/${encodeURIComponent(requestId)}/approve`, decision);
        return response.data as AdminTenancyRequest;
    }

    async declineTenancyRequest(requestId: string, message?: string): Promise<AdminTenancyRequest> {
        const response = await axios.post(`/api/admin/tenancy-requests/${encodeURIComponent(requestId)}/decline`, { message: message ?? null });
        return response.data as AdminTenancyRequest;
    }

    async createTenancy(input: { displayName: string; namespace: string }): Promise<AdminTenancy> {
        const response = await axios.post("/api/admin/tenancies", input);
        return response.data as AdminTenancy;
    }

    async addTenancyMember(tenancy: string, userId: string): Promise<TenancyMember> {
        const response = await axios.post(`/api/admin/tenancies/members?tenancy=${encodeURIComponent(tenancy)}`, { userId });
        return response.data as TenancyMember;
    }

    async removeTenancyMember(tenancy: string, userId: string): Promise<void> {
        await axios.delete(`/api/admin/tenancies/members/${encodeURIComponent(userId)}?tenancy=${encodeURIComponent(tenancy)}`, { data: {} });
    }

    async withdrawTenancyInvitationAsAdmin(invitationId: string): Promise<void> {
        await axios.delete(`/api/admin/tenancy-invitations/${encodeURIComponent(invitationId)}`, { data: {} });
    }
```

- [ ] **Step 4: Run it**

Run: `npx jest --coverage=false gateways/__tests__`
Expected: PASS, 8 new tests, the other BFFAPI suites unchanged.

- [ ] **Step 5: Commit**

```bash
pwd
command git branch --show-current
command git add gateways/BFFAPI.ts gateways/__tests__/BFFAPI.admin.test.ts
command git commit -m "feat: BFFAPI methods for admin decisions and memberships

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 9: SWR keys and hooks

**Files:**
- Create: `lib/adminKeys.ts`
- Create: `hooks/UseAdmin.ts`
- Test: `lib/__tests__/adminKeys.test.ts`, `hooks/__tests__/UseAdmin.test.ts`

**Interfaces:** Consumes `fetcher` (`lib/fetcher.js`), Task 5's sizes, Task 4's types. Produces:
- `lib/adminKeys.ts`: `ADMIN_COUNTS_KEY`, `ADMIN_REQUESTS_PREFIX`, `ADMIN_TENANCIES_KEY`, `type AdminRequestsQuery = { status: "open" | "closed"; kind?: "join" | "new"; q?: string; limit?: number; offset?: number }`, `adminRequestsKey(query): string`, `RECENTLY_CLOSED_KEY`, `adminRequestKey(id)`, `adminMembersKey(path, offset)`, `adminRemovalImpactKey(path, userId)`, `adminUsersKey(q): string | null`, `isAdminRequestsKey(key: unknown): boolean`, `isAdminTenanciesKey(key: unknown): boolean`.
- `hooks/UseAdmin.ts`: `useAdminCounts(enabled = true)`, `useAdminRequests(query)`, `useRecentlyClosed()`, `useAdminRequest(requestId | null)`, `useAdminTenancies()`, `useTenancyMembers(path | null)` (SWR infinite), `useRemovalImpact(path | null, userId | null)`, `useAdminUserSearch(q)`, `revalidateAdminRequests()`, `revalidateAdminTenancies()`.

- [ ] **Step 1: Write the failing tests**

Create `lib/__tests__/adminKeys.test.ts`:

```ts
import {
    ADMIN_COUNTS_KEY,
    ADMIN_TENANCIES_KEY,
    RECENTLY_CLOSED_KEY,
    adminMembersKey,
    adminRemovalImpactKey,
    adminRequestKey,
    adminRequestsKey,
    adminUsersKey,
    isAdminRequestsKey,
    isAdminTenanciesKey,
} from "../adminKeys";

describe("admin SWR keys", () => {
    test("the counts", () => {
        expect(ADMIN_COUNTS_KEY).toBe("/api/admin/tenancy-requests/counts");
    });

    test("the open queue, plain and filtered", () => {
        expect(adminRequestsKey({ status: "open" })).toBe("/api/admin/tenancy-requests?status=open&limit=50&offset=0");
        expect(adminRequestsKey({ status: "open", kind: "join", q: " Lima ", offset: 50 }))
            .toBe("/api/admin/tenancy-requests?status=open&kind=join&q=Lima&limit=50&offset=50");
    });

    test("the closed list ignores a kind; recently closed is its first five", () => {
        expect(adminRequestsKey({ status: "closed", kind: "new" })).toBe("/api/admin/tenancy-requests?status=closed&limit=50&offset=0");
        expect(RECENTLY_CLOSED_KEY).toBe("/api/admin/tenancy-requests?status=closed&limit=5&offset=0");
    });

    test("a search is encoded and a blank one is left out", () => {
        expect(adminRequestsKey({ status: "open", q: "k.tanaka@nagoya" })).toBe("/api/admin/tenancy-requests?status=open&q=k.tanaka%40nagoya&limit=50&offset=0");
        expect(adminRequestsKey({ status: "open", q: "   " })).toBe("/api/admin/tenancy-requests?status=open&limit=50&offset=0");
    });

    test("one request and the tenancies", () => {
        expect(adminRequestKey("7a9b5d5e-fa6d-4c18-9a51-2b1e2c3d4e5f")).toBe("/api/admin/tenancy-requests/7a9b5d5e-fa6d-4c18-9a51-2b1e2c3d4e5f");
        expect(ADMIN_TENANCIES_KEY).toBe("/api/admin/tenancies");
    });

    test("members and removal impact carry the path encoded in the query", () => {
        expect(adminMembersKey("datamap/production/atto", 50)).toBe("/api/admin/tenancies/members?tenancy=datamap%2Fproduction%2Fatto&limit=50&offset=50");
        expect(adminRemovalImpactKey("datamap/production/atto", "u-1")).toBe("/api/admin/tenancies/members/u-1?tenancy=datamap%2Fproduction%2Fatto");
    });

    test("user search waits for two characters", () => {
        expect(adminUsersKey(" f ")).toBeNull();
        expect(adminUsersKey(" fer ")).toBe("/api/admin/users?q=fer");
        expect(adminUsersKey("a b")).toBe("/api/admin/users?q=a%20b");
    });

    test("the matchers pick the keys a mutation must refresh", () => {
        expect(isAdminRequestsKey(ADMIN_COUNTS_KEY)).toBe(true);
        expect(isAdminRequestsKey(RECENTLY_CLOSED_KEY)).toBe(true);
        expect(isAdminRequestsKey(ADMIN_TENANCIES_KEY)).toBe(false);
        expect(isAdminRequestsKey(["/api/admin/tenancy-requests"])).toBe(false);
        expect(isAdminTenanciesKey(adminMembersKey("datamap/production/atto", 0))).toBe(true);
        expect(isAdminTenanciesKey(ADMIN_COUNTS_KEY)).toBe(false);
    });
});
```

Create `hooks/__tests__/UseAdmin.test.ts`:

```ts
const mockUseSWR = jest.fn((..._args: unknown[]) => ({ data: undefined }));
const mockUseSWRInfinite = jest.fn((..._args: unknown[]) => ({ data: undefined }));
const mockMutate = jest.fn((..._args: unknown[]) => Promise.resolve([]));

jest.mock("swr", () => ({
    __esModule: true,
    default: (...args: unknown[]) => mockUseSWR(...args),
    mutate: (...args: unknown[]) => mockMutate(...args),
}));
jest.mock("swr/infinite", () => ({
    __esModule: true,
    default: (...args: unknown[]) => mockUseSWRInfinite(...args),
}));
jest.mock("../../lib/fetcher", () => ({ fetcher: jest.fn() }));

import {
    revalidateAdminRequests,
    revalidateAdminTenancies,
    useAdminCounts,
    useAdminRequest,
    useAdminRequests,
    useAdminUserSearch,
    useRemovalImpact,
    useTenancyMembers,
} from "../UseAdmin";
import { fetcher } from "../../lib/fetcher";

type GetKey = (index: number, previous: unknown) => string | null;

function page(offset: number, count: number, total: number) {
    return { members: { items: new Array(count).fill({}), total_count: total, limit: 50, offset }, invitations: [] };
}

describe("the admin hooks", () => {
    test("the counts revalidate on focus and every minute", () => {
        useAdminCounts();

        expect(mockUseSWR).toHaveBeenCalledWith("/api/admin/tenancy-requests/counts", fetcher, { revalidateOnFocus: true, refreshInterval: 60_000 });
    });

    test("the counts are not fetched for someone who is not an admin", () => {
        useAdminCounts(false);

        expect(mockUseSWR).toHaveBeenCalledWith(null, fetcher, expect.anything());
    });

    test("the queue is keyed by its query and keeps the last page while the next loads", () => {
        useAdminRequests({ status: "open", kind: "new", q: "", offset: 0 });

        expect(mockUseSWR).toHaveBeenCalledWith("/api/admin/tenancy-requests?status=open&kind=new&limit=50&offset=0", fetcher, { keepPreviousData: true });
    });

    test("one request is fetched only when there is an id", () => {
        useAdminRequest(null);
        useAdminRequest("r1");

        expect(mockUseSWR).toHaveBeenNthCalledWith(1, null, fetcher);
        expect(mockUseSWR).toHaveBeenNthCalledWith(2, "/api/admin/tenancy-requests/r1", fetcher);
    });

    test("members page by 50 and stop after the last page", () => {
        useTenancyMembers(null);
        useTenancyMembers("datamap/production/atto");
        const none = mockUseSWRInfinite.mock.calls[0][0] as GetKey;
        const getKey = mockUseSWRInfinite.mock.calls[1][0] as GetKey;

        expect(none(0, null)).toBeNull();
        expect(getKey(0, null)).toBe("/api/admin/tenancies/members?tenancy=datamap%2Fproduction%2Fatto&limit=50&offset=0");
        expect(getKey(1, page(0, 50, 120))).toBe("/api/admin/tenancies/members?tenancy=datamap%2Fproduction%2Fatto&limit=50&offset=50");
        expect(getKey(3, page(100, 20, 120))).toBeNull();
    });

    test("the removal impact waits for both the tenancy and the member", () => {
        useRemovalImpact("datamap/production/atto", null);
        useRemovalImpact("datamap/production/atto", "u-1");

        expect(mockUseSWR).toHaveBeenNthCalledWith(1, null, fetcher);
        expect(mockUseSWR).toHaveBeenNthCalledWith(2, "/api/admin/tenancies/members/u-1?tenancy=datamap%2Fproduction%2Fatto", fetcher);
    });

    test("user search does not fetch below two characters", () => {
        useAdminUserSearch("f");

        expect(mockUseSWR).toHaveBeenCalledWith(null, fetcher);
    });

    test("revalidation refreshes the request keys, counts included, or the tenancy keys", async () => {
        await revalidateAdminRequests();
        await revalidateAdminTenancies();
        const requests = mockMutate.mock.calls[0][0] as (key: unknown) => boolean;
        const tenancies = mockMutate.mock.calls[1][0] as (key: unknown) => boolean;

        expect(requests("/api/admin/tenancy-requests/counts")).toBe(true);
        expect(requests("/api/admin/tenancies")).toBe(false);
        expect(tenancies("/api/admin/tenancies/members?tenancy=x%2Fy&limit=50&offset=0")).toBe(true);
        expect(tenancies("/api/admin/tenancy-requests/counts")).toBe(false);
    });
});
```

- [ ] **Step 2: Run them**

Run: `npx jest --coverage=false lib/__tests__/adminKeys.test.ts hooks/__tests__/UseAdmin.test.ts`
Expected: FAIL — `Cannot find module '../adminKeys'` and `Cannot find module '../UseAdmin'`.

- [ ] **Step 3: Write `lib/adminKeys.ts`**

```ts
import { ADMIN_PAGE_SIZE, ADMIN_USER_SEARCH_MIN_LENGTH, RECENTLY_CLOSED_LIMIT } from "../contants/AdminConstants";

export const ADMIN_REQUESTS_PREFIX = "/api/admin/tenancy-requests";
export const ADMIN_COUNTS_KEY = ADMIN_REQUESTS_PREFIX + "/counts";
export const ADMIN_TENANCIES_KEY = "/api/admin/tenancies";

export type AdminRequestsQuery = { status: "open" | "closed"; kind?: "join" | "new"; q?: string; limit?: number; offset?: number };

export function adminRequestsKey(query: AdminRequestsQuery): string {
    const params = new URLSearchParams();
    params.set("status", query.status);
    if (query.status === "open" && query.kind) {
        params.set("kind", query.kind);
    }
    const q = query.q?.trim();
    if (q) {
        params.set("q", q);
    }
    params.set("limit", String(query.limit ?? ADMIN_PAGE_SIZE));
    params.set("offset", String(query.offset ?? 0));
    return `${ADMIN_REQUESTS_PREFIX}?${params.toString()}`;
}

export const RECENTLY_CLOSED_KEY = adminRequestsKey({ status: "closed", limit: RECENTLY_CLOSED_LIMIT, offset: 0 });

export function adminRequestKey(requestId: string): string {
    return `${ADMIN_REQUESTS_PREFIX}/${encodeURIComponent(requestId)}`;
}

export function adminMembersKey(path: string, offset: number): string {
    return `${ADMIN_TENANCIES_KEY}/members?tenancy=${encodeURIComponent(path)}&limit=${ADMIN_PAGE_SIZE}&offset=${offset}`;
}

export function adminRemovalImpactKey(path: string, userId: string): string {
    return `${ADMIN_TENANCIES_KEY}/members/${encodeURIComponent(userId)}?tenancy=${encodeURIComponent(path)}`;
}

export function adminUsersKey(q: string): string | null {
    const value = q.trim();
    return value.length >= ADMIN_USER_SEARCH_MIN_LENGTH ? `/api/admin/users?q=${encodeURIComponent(value)}` : null;
}

export function isAdminRequestsKey(key: unknown): boolean {
    return typeof key === "string" && key.startsWith(ADMIN_REQUESTS_PREFIX);
}

export function isAdminTenanciesKey(key: unknown): boolean {
    return typeof key === "string" && key.startsWith(ADMIN_TENANCIES_KEY);
}
```

- [ ] **Step 4: Write `hooks/UseAdmin.ts`**

```ts
import useSWR, { mutate } from "swr";
import useSWRInfinite from "swr/infinite";
import { ADMIN_COUNTS_REFRESH_MS, ADMIN_PAGE_SIZE } from "../contants/AdminConstants";
import {
    ADMIN_COUNTS_KEY,
    ADMIN_TENANCIES_KEY,
    AdminRequestsQuery,
    RECENTLY_CLOSED_KEY,
    adminMembersKey,
    adminRemovalImpactKey,
    adminRequestKey,
    adminRequestsKey,
    adminUsersKey,
    isAdminRequestsKey,
    isAdminTenanciesKey,
} from "../lib/adminKeys";
import { fetcher } from "../lib/fetcher";
import {
    AdminTenancy,
    AdminTenancyRequest,
    AdminTenancyRequestDetail,
    AdminUserHit,
    GatekeeperPage,
    RemovalImpact,
    TenancyMembers,
    TenancyRequestCounts,
} from "../types/GatekeeperAPI";

export function useAdminCounts(enabled = true) {
    return useSWR<TenancyRequestCounts>(enabled ? ADMIN_COUNTS_KEY : null, fetcher, {
        revalidateOnFocus: true,
        refreshInterval: ADMIN_COUNTS_REFRESH_MS,
    });
}

export function useAdminRequests(query: AdminRequestsQuery) {
    return useSWR<GatekeeperPage<AdminTenancyRequest>>(adminRequestsKey(query), fetcher, { keepPreviousData: true });
}

export function useRecentlyClosed() {
    return useSWR<GatekeeperPage<AdminTenancyRequest>>(RECENTLY_CLOSED_KEY, fetcher);
}

export function useAdminRequest(requestId: string | null) {
    return useSWR<AdminTenancyRequestDetail>(requestId ? adminRequestKey(requestId) : null, fetcher);
}

export function useAdminTenancies() {
    return useSWR<AdminTenancy[]>(ADMIN_TENANCIES_KEY, fetcher);
}

export function useTenancyMembers(path: string | null) {
    return useSWRInfinite<TenancyMembers>(
        (index: number, previous: TenancyMembers | null) => {
            if (!path) {
                return null;
            }
            if (previous && previous.members.offset + previous.members.items.length >= previous.members.total_count) {
                return null;
            }
            return adminMembersKey(path, index * ADMIN_PAGE_SIZE);
        },
        fetcher,
    );
}

export function useRemovalImpact(path: string | null, userId: string | null) {
    return useSWR<RemovalImpact>(path && userId ? adminRemovalImpactKey(path, userId) : null, fetcher);
}

export function useAdminUserSearch(q: string) {
    return useSWR<AdminUserHit[]>(adminUsersKey(q), fetcher);
}

export function revalidateAdminRequests() {
    return mutate(isAdminRequestsKey);
}

export function revalidateAdminTenancies() {
    return mutate(isAdminTenanciesKey);
}
```

- [ ] **Step 5: Run them**

Run: `npx jest --coverage=false lib/__tests__/adminKeys.test.ts hooks/__tests__/UseAdmin.test.ts && npx tsc --noEmit -p .`
Expected: PASS, 8 + 8 tests; `tsc` prints nothing.

- [ ] **Step 6: Commit**

```bash
pwd
command git branch --show-current
command git add lib/adminKeys.ts hooks/UseAdmin.ts lib/__tests__/adminKeys.test.ts hooks/__tests__/UseAdmin.test.ts
command git commit -m "feat: SWR keys and hooks for the admin area

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 10: Shell parts every admin tab uses

**Files:**
- Create: `components/Admin/AdminDialog.tsx`, `components/Admin/AdminPageHeader.tsx`, `components/Admin/AdminEmptyState.tsx`, `components/Admin/AdminLoadError.tsx`, `components/Admin/CountBadge.tsx`
- Test: `components/Admin/__tests__/AdminDialog.test.tsx`, `components/Admin/__tests__/AdminParts.test.tsx`

**Interfaces:** Consumes `ADMIN_COPY` (Task 5). Produces:
- `AdminDialog(props: { title: string; subtitle?: ReactNode; widthClassName: string; children?: ReactNode; onClose(): void; primary?: AdminDialogAction; secondaryLink?: { label: string; onClick(): void }; closeLabel?: string })` with `AdminDialogAction = { label: string; onClick(): void; disabled?: boolean; destructive?: boolean }` — the design's anatomy: title + subtitle + ✕ ("Close dialog"), body, footer with the red link on the left and Cancel + primary on the right (only "Close" without a primary);
- `AdminPageHeader({ title, subtitle?, action? })`, `AdminEmptyState({ title, text })`, `AdminLoadError({ message, onRetry })`, `CountBadge({ count?, label })` (renders nothing for `0` or `undefined`).

- [ ] **Step 1: Write the failing tests**

Create `components/Admin/__tests__/AdminDialog.test.tsx`:

```tsx
/** @jest-environment jsdom */
import { describe, expect, jest, test } from "@jest/globals";
import { fireEvent, render, screen } from "@testing-library/react";
import { AdminDialog } from "../AdminDialog";

describe("AdminDialog", () => {
    test("is a dialog named by its title, with the subtitle under it", () => {
        render(<AdminDialog title="Decline request?" subtitle="Fernanda Lima · join Data Amazon" widthClassName="max-w-[440px]" onClose={jest.fn()}><p>body</p></AdminDialog>);

        expect(screen.getByRole("dialog", { name: "Decline request?" })).toBeTruthy();
        expect(screen.getByText("Fernanda Lima · join Data Amazon")).toBeTruthy();
        expect(screen.getByText("body")).toBeTruthy();
    });

    test("the primary action, Cancel and the ✕ each do their job", () => {
        const onClose = jest.fn();
        const onApprove = jest.fn();
        render(<AdminDialog title="Join ATTO" widthClassName="max-w-[560px]" onClose={onClose} primary={{ label: "Approve", onClick: onApprove }} />);

        fireEvent.click(screen.getByRole("button", { name: "Approve" }));
        fireEvent.click(screen.getByRole("button", { name: "Cancel" }));
        fireEvent.click(screen.getByRole("button", { name: "Close dialog" }));

        expect(onApprove).toHaveBeenCalledTimes(1);
        expect(onClose).toHaveBeenCalledTimes(2);
    });

    test("a disabled primary action cannot be pressed and looks grey", () => {
        const onCreate = jest.fn();
        render(<AdminDialog title="New tenancy: Cerrado Flux" widthClassName="max-w-[560px]" onClose={jest.fn()} primary={{ label: "Create and approve", onClick: onCreate, disabled: true }} />);
        const button = screen.getByRole("button", { name: "Create and approve" }) as HTMLButtonElement;

        fireEvent.click(button);

        expect(button.disabled).toBe(true);
        expect(button.className).toContain("disabled:bg-primary-200");
        expect(onCreate).not.toHaveBeenCalled();
    });

    test("a destructive action is red", () => {
        render(<AdminDialog title="Remove from ATTO?" widthClassName="max-w-[440px]" onClose={jest.fn()} primary={{ label: "Remove", onClick: jest.fn(), destructive: true }} />);

        expect(screen.getByRole("button", { name: "Remove" }).className).toContain("bg-danger-700");
    });

    test("the footer link sits next to Cancel", () => {
        const onDecline = jest.fn();
        render(<AdminDialog title="Join ATTO" widthClassName="max-w-[560px]" onClose={jest.fn()} secondaryLink={{ label: "Decline…", onClick: onDecline }} primary={{ label: "Approve", onClick: jest.fn() }} />);

        fireEvent.click(screen.getByRole("button", { name: "Decline…" }));

        expect(onDecline).toHaveBeenCalled();
    });

    test("without a primary action the footer only closes", () => {
        render(<AdminDialog title="Review request" widthClassName="max-w-[560px]" onClose={jest.fn()} />);

        expect(screen.getByRole("button", { name: "Close" })).toBeTruthy();
        expect(screen.queryByRole("button", { name: "Cancel" })).toBeNull();
    });
});
```

Create `components/Admin/__tests__/AdminParts.test.tsx`:

```tsx
/** @jest-environment jsdom */
import { describe, expect, jest, test } from "@jest/globals";
import { fireEvent, render, screen } from "@testing-library/react";
import { ADMIN_COPY } from "../../../contants/AdminConstants";
import { AdminEmptyState } from "../AdminEmptyState";
import { AdminLoadError } from "../AdminLoadError";
import { AdminPageHeader } from "../AdminPageHeader";
import { CountBadge } from "../CountBadge";

describe("the admin shell parts", () => {
    test("a page header has its title, subtitle and action", () => {
        render(<AdminPageHeader title="Tenancies" subtitle="4 tenancies" action={<button>+ New tenancy</button>} />);

        expect(screen.getByRole("heading", { name: "Tenancies" })).toBeTruthy();
        expect(screen.getByText("4 tenancies")).toBeTruthy();
        expect(screen.getByRole("button", { name: "+ New tenancy" })).toBeTruthy();
    });

    test("Users and Activity say they are coming soon", () => {
        render(<>
            <AdminEmptyState title={ADMIN_COPY.usersTitle} text={ADMIN_COPY.usersEmpty} />
            <AdminEmptyState title={ADMIN_COPY.activityTitle} text={ADMIN_COPY.activityEmpty} />
        </>);

        expect(screen.getByRole("heading", { name: "Users" })).toBeTruthy();
        expect(screen.getByText("Coming soon. Until then, add and remove people from Tenancies.")).toBeTruthy();
        expect(screen.getByRole("heading", { name: "Activity" })).toBeTruthy();
        expect(screen.getByText("Coming soon: every admin action, who and when.")).toBeTruthy();
    });

    test("a load error says what failed and offers to try again", () => {
        const onRetry = jest.fn();
        render(<AdminLoadError message="Requests could not be loaded." onRetry={onRetry} />);

        expect(screen.getByRole("alert").textContent).toContain("Requests could not be loaded.");
        fireEvent.click(screen.getByRole("button", { name: "Try again" }));
        expect(onRetry).toHaveBeenCalled();
    });

    test("a count badge shows a positive count and nothing otherwise", () => {
        const { rerender } = render(<CountBadge count={4} label="open requests" />);
        expect(screen.getByLabelText("4 open requests").textContent).toBe("4");

        rerender(<CountBadge count={0} label="open requests" />);
        expect(screen.queryByLabelText(/open requests/)).toBeNull();

        rerender(<CountBadge label="open requests" />);
        expect(screen.queryByLabelText(/open requests/)).toBeNull();
    });
});
```

- [ ] **Step 2: Run them**

Run: `npx jest --coverage=false components/Admin/__tests__/AdminDialog.test.tsx components/Admin/__tests__/AdminParts.test.tsx`
Expected: FAIL — `Cannot find module '../AdminDialog'` (and the other four).

- [ ] **Step 3: Write `components/Admin/AdminDialog.tsx`**

```tsx
import { ReactNode, useId } from "react";
import { MaterialSymbol } from "react-material-symbols";

export interface AdminDialogAction {
    label: string
    onClick(): void
    disabled?: boolean
    destructive?: boolean
}

interface Props {
    title: string
    subtitle?: ReactNode
    widthClassName: string
    children?: ReactNode
    onClose(): void
    primary?: AdminDialogAction
    secondaryLink?: { label: string; onClick(): void }
    closeLabel?: string
}

export function AdminDialog(props: Props) {
    const titleId = useId();
    const primary = props.primary;
    const primaryColours = primary?.destructive
        ? "bg-danger-700 hover:bg-danger-800 text-primary-0"
        : "bg-primary-900 hover:bg-primary-800 text-primary-50";

    return (
        <>
            <div className="fixed inset-0 z-40 bg-primary-900/40" aria-hidden="true" />
            <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto p-4" role="dialog" aria-modal="true" aria-labelledby={titleId}>
                <div className={`relative flex w-full ${props.widthClassName} max-h-[calc(100vh-2rem)] flex-col rounded-xl border border-primary-200 bg-primary-0 shadow-2xl shadow-primary-900/20`}>
                    <div className="flex flex-none items-start justify-between gap-4 px-6 pt-5 pb-4">
                        <div className="min-w-0">
                            <h3 id={titleId} className="m-0 text-lg leading-7 font-semibold tracking-[-0.01em] text-primary-900">{props.title}</h3>
                            {props.subtitle && <p className="m-0 mt-1 text-[13px] leading-5 text-primary-500">{props.subtitle}</p>}
                        </div>
                        <button
                            type="button"
                            aria-label="Close dialog"
                            onClick={props.onClose}
                            className="flex h-8 w-8 flex-none items-center justify-center rounded-md text-primary-500 hover:bg-primary-100 hover:text-primary-900"
                        >
                            <MaterialSymbol icon="close" size={20} weight={400} grade={-25} />
                        </button>
                    </div>
                    <div className="flex min-h-0 flex-auto flex-col gap-4 overflow-y-auto px-6 pb-5 text-sm leading-5 text-primary-700">
                        {props.children}
                    </div>
                    <div className="flex flex-none items-center gap-2 border-t border-primary-200 px-6 py-4">
                        {props.secondaryLink && (
                            <button type="button" onClick={props.secondaryLink.onClick} className="text-[13px] font-semibold text-danger-700 hover:text-danger-800">
                                {props.secondaryLink.label}
                            </button>
                        )}
                        <span className="ml-auto" />
                        <button
                            type="button"
                            onClick={props.onClose}
                            className="h-9 rounded-md border border-primary-300 bg-primary-0 px-3.5 text-[13px] font-semibold whitespace-nowrap text-primary-900 hover:bg-primary-100"
                        >
                            {props.closeLabel ?? (primary ? "Cancel" : "Close")}
                        </button>
                        {primary && (
                            <button
                                type="button"
                                onClick={primary.onClick}
                                disabled={primary.disabled}
                                className={`h-9 rounded-md px-3.5 text-[13px] font-semibold whitespace-nowrap ${primaryColours} disabled:cursor-not-allowed disabled:bg-primary-200 disabled:text-primary-400`}
                            >
                                {primary.label}
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </>
    );
}
```

- [ ] **Step 4: Write the four small parts**

`components/Admin/AdminPageHeader.tsx`:

```tsx
import { ReactNode } from "react";

interface Props {
    title: string
    subtitle?: ReactNode
    action?: ReactNode
}

export function AdminPageHeader({ title, subtitle, action }: Props) {
    return (
        <div className="flex flex-wrap items-end justify-between gap-4">
            <div className="min-w-0">
                <h2 className="m-0">{title}</h2>
                {subtitle && <p className="m-0 mt-2 text-[15px] leading-[23px] text-primary-600">{subtitle}</p>}
            </div>
            {action}
        </div>
    );
}
```

`components/Admin/AdminEmptyState.tsx`:

```tsx
import { AdminPageHeader } from "./AdminPageHeader";

interface Props {
    title: string
    text: string
}

export function AdminEmptyState({ title, text }: Props) {
    return (
        <div className="w-full">
            <AdminPageHeader title={title} />
            <p className="m-0 mt-8 rounded-lg border border-primary-200 bg-primary-0 px-6 py-12 text-center text-sm text-primary-500">{text}</p>
        </div>
    );
}
```

`components/Admin/AdminLoadError.tsx`:

```tsx
import { ADMIN_COPY } from "../../contants/AdminConstants";

interface Props {
    message: string
    onRetry(): void
}

export function AdminLoadError({ message, onRetry }: Props) {
    return (
        <div role="alert" className="flex items-center justify-between gap-4 rounded-lg border border-danger-200 bg-danger-50 px-4 py-3 text-sm text-danger-800">
            <span>{message}</span>
            <button type="button" onClick={onRetry} className="text-[13px] font-semibold underline underline-offset-2">{ADMIN_COPY.retry}</button>
        </div>
    );
}
```

`components/Admin/CountBadge.tsx`:

```tsx
interface Props {
    count?: number
    label: string
}

export function CountBadge({ count, label }: Props) {
    if (!count) {
        return null;
    }
    return (
        <span aria-label={`${count} ${label}`} className="inline-flex min-w-[20px] items-center justify-center rounded-full bg-primary-900 px-[7px] py-px text-[11px] font-semibold leading-4 text-primary-50">
            {count}
        </span>
    );
}
```

- [ ] **Step 5: Run them**

Run: `npx jest --coverage=false components/Admin/__tests__/AdminDialog.test.tsx components/Admin/__tests__/AdminParts.test.tsx`
Expected: PASS, 6 + 4 tests.

- [ ] **Step 6: Commit**

```bash
pwd
command git branch --show-current
command git add components/Admin/AdminDialog.tsx components/Admin/AdminPageHeader.tsx components/Admin/AdminEmptyState.tsx components/Admin/AdminLoadError.tsx components/Admin/CountBadge.tsx components/Admin/__tests__/AdminDialog.test.tsx components/Admin/__tests__/AdminParts.test.tsx
command git commit -m "feat: dialog, header, empty state and badge for the admin area

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 11: The sidebar "Admin" entry and the layout slots

**Files:**
- Create: `components/Admin/AdminNavItem.tsx`
- Modify: `components/LoggedLayout.tsx`
- Test: `components/Admin/__tests__/AdminNavItem.test.tsx`, `components/Admin/__tests__/LoggedLayoutAdmin.test.tsx`

**Interfaces:** Consumes `session.user.admin` (PR B), `useAdminCounts` (Task 9), `CountBadge` (Task 10), `ROUTE_PAGE_ADMIN`, `ROUTE_PAGE_ADMIN_REQUESTS`. Produces `AdminNavItem({ collapsed }: { collapsed: boolean })` (a divider and the "Admin" item, only for admins), and `LoggedLayout` props `headerContent?: React.ReactNode` (left of the avatar in the 64 px header) and `scopeLabel?: string` (replaces the tenancy footer).

- [ ] **Step 1: Write the failing tests**

Create `components/Admin/__tests__/AdminNavItem.test.tsx`:

```tsx
/** @jest-environment jsdom */
import { render, screen } from "@testing-library/react";

let mockSession: unknown = null;
let mockPathname = "/app/home";
let mockCounts: unknown = undefined;
const mockCountsEnabled: boolean[] = [];

jest.mock("next-auth/react", () => ({ useSession: () => ({ data: mockSession }) }));
jest.mock("next/router", () => ({ useRouter: () => ({ pathname: mockPathname }) }));
jest.mock("../../../hooks/UseAdmin", () => ({
    useAdminCounts: (enabled: boolean) => {
        mockCountsEnabled.push(enabled);
        return { data: mockCounts };
    },
}));

import { AdminNavItem } from "../AdminNavItem";

const ADMIN = { user: { name: "Caio Maia", admin: true } };

beforeEach(() => {
    mockSession = ADMIN;
    mockPathname = "/app/home";
    mockCounts = { open: 4, join: 2, new: 2, closed: 31 };
    mockCountsEnabled.length = 0;
});

test("is not there for an account that is not an admin, which never asks for the counts", () => {
    mockSession = { user: { name: "Fernanda Lima", admin: false } };

    const { container } = render(<AdminNavItem collapsed={false} />);

    expect(container.innerHTML).toBe("");
    expect(mockCountsEnabled).toEqual([false]);
});

test("an admin gets the entry, opening the requests, with the open count", () => {
    render(<AdminNavItem collapsed={false} />);

    const link = screen.getByRole("link", { name: /Admin/ });
    expect(link.getAttribute("href")).toBe("/app/admin/requests");
    expect(screen.getByLabelText("4 open requests")).toBeTruthy();
    expect(mockCountsEnabled).toEqual([true]);
});

test("the badge is hidden when nothing is open", () => {
    mockCounts = { open: 0, join: 0, new: 0, closed: 31 };

    render(<AdminNavItem collapsed={false} />);

    expect(screen.queryByLabelText(/open requests/)).toBeNull();
});

test("is active on every admin page and only there", () => {
    mockPathname = "/app/admin/tenancies";
    const { unmount } = render(<AdminNavItem collapsed={false} />);
    expect(screen.getByRole("link", { name: /Admin/ }).getAttribute("aria-current")).toBe("page");
    expect(screen.getByRole("link", { name: /Admin/ }).className).toContain("bg-secondary-500");
    unmount();

    mockPathname = "/app/home";
    render(<AdminNavItem collapsed={false} />);
    expect(screen.getByRole("link", { name: /Admin/ }).getAttribute("aria-current")).toBeNull();
});

test("a collapsed sidebar shows the icon with its title, no label or badge", () => {
    render(<AdminNavItem collapsed />);

    expect(screen.getByTitle("Admin")).toBeTruthy();
    expect(screen.queryByText("Admin")).toBeNull();
    expect(screen.queryByLabelText(/open requests/)).toBeNull();
});
```

Create `components/Admin/__tests__/LoggedLayoutAdmin.test.tsx`:

```tsx
/** @jest-environment jsdom */
import { render, screen } from "@testing-library/react";

jest.mock("next/head", () => ({ __esModule: true, default: () => null }));
jest.mock("next/router", () => ({
    __esModule: true,
    default: { replace: jest.fn() },
    useRouter: () => ({ pathname: "/app/admin/requests" }),
}));
jest.mock("next-auth/react", () => ({ useSession: () => ({ data: { user: { name: "Caio Maia", admin: true } } }) }));
jest.mock("../../TenancyStore", () => ({
    useTenancyStore: (selector: (state: unknown) => unknown) => selector({
        isTenancySelected: () => true,
        tenancySelected: "datamap/production/public",
    }),
}));
jest.mock("../../Profile/AvatarButton", () => ({ __esModule: true, default: () => null }));
jest.mock("../../../hooks/UseAdmin", () => ({ useAdminCounts: () => ({ data: { open: 4, join: 2, new: 2, closed: 31 } }) }));
jest.mock("../../../hooks/UseWorkspace", () => ({ useMembersPageTenancy: () => ({ tenancy: null, loading: false }) }));

import LoggedLayout from "../../LoggedLayout";

test("an admin page reads All tenancies in the footer and puts its tabs in the header", () => {
    render(<LoggedLayout tenancyOptional scopeLabel="All tenancies" headerContent={<nav>admin tabs</nav>}><p>page</p></LoggedLayout>);

    expect(screen.getByText("All tenancies")).toBeTruthy();
    expect(screen.queryByText("datamap / production / public")).toBeNull();
    expect(screen.getByText("admin tabs")).toBeTruthy();
});

test("any other page keeps the selected tenancy, and an admin sees the Admin entry", () => {
    render(<LoggedLayout><p>page</p></LoggedLayout>);

    expect(screen.getByText("datamap / production / public")).toBeTruthy();
    expect(screen.getByRole("link", { name: /Admin/ })).toBeTruthy();
    expect(screen.getByLabelText("4 open requests")).toBeTruthy();
});
```

- [ ] **Step 2: Run them**

Run: `npx jest --coverage=false components/Admin/__tests__/AdminNavItem.test.tsx components/Admin/__tests__/LoggedLayoutAdmin.test.tsx`
Expected: FAIL — `Cannot find module '../AdminNavItem'`; the layout suite fails to compile on `Property 'scopeLabel' does not exist`.

- [ ] **Step 3: Write `components/Admin/AdminNavItem.tsx`**

```tsx
import { useSession } from "next-auth/react";
import Link from "next/link";
import { useRouter } from "next/router";
import { MaterialSymbol } from "react-material-symbols";
import { ADMIN_COPY } from "../../contants/AdminConstants";
import { ROUTE_PAGE_ADMIN, ROUTE_PAGE_ADMIN_REQUESTS } from "../../contants/InternalRoutesConstants";
import { useAdminCounts } from "../../hooks/UseAdmin";
import { CountBadge } from "./CountBadge";

export function AdminNavItem({ collapsed }: { collapsed: boolean }) {
    const { data: session } = useSession();
    const router = useRouter();
    const isAdmin = session?.user?.admin === true;
    const { data: counts } = useAdminCounts(isAdmin);

    if (!isAdmin) {
        return null;
    }

    const active = router.pathname === ROUTE_PAGE_ADMIN || router.pathname.startsWith(ROUTE_PAGE_ADMIN + "/");

    return (
        <>
            <hr className="mx-2 border-primary-200" />
            <ul className="p-2">
                <li>
                    <Link
                        href={ROUTE_PAGE_ADMIN_REQUESTS}
                        title={collapsed ? ADMIN_COPY.adminNav : undefined}
                        aria-current={active ? "page" : undefined}
                        className={`flex items-center gap-3 h-10 rounded-md text-sm ${collapsed ? "justify-center" : "px-3"} ${active
                            ? "bg-secondary-500 font-semibold text-primary-900"
                            : "font-medium text-primary-700 hover:bg-primary-100"
                            }`}
                    >
                        <MaterialSymbol icon="admin_panel_settings" size={20} weight={400} grade={-25} fill={active} className={active ? "text-primary-900" : "text-primary-500"} />
                        {!collapsed && <span>{ADMIN_COPY.adminNav}</span>}
                        {!collapsed && <span className="ml-auto"><CountBadge count={counts?.open} label="open requests" /></span>}
                    </Link>
                </li>
            </ul>
        </>
    );
}
```

- [ ] **Step 4: Give `LoggedLayout` the entry and the two slots**

In `components/LoggedLayout.tsx`, replace:

```tsx
import AvatarButton from "./Profile/AvatarButton";
```

with:

```tsx
import { AdminNavItem } from "./Admin/AdminNavItem";
import AvatarButton from "./Profile/AvatarButton";
```

replace:

```tsx
  tenancyOptional?: boolean;
}
```

with:

```tsx
  tenancyOptional?: boolean;
  headerContent?: React.ReactNode;
  scopeLabel?: string;
}
```

replace:

```tsx
          <ul className="p-2">
            <MenuItem href={ROUTE_PAGE_PROFILE} text="Profile" icon="person" collapsed={menuClosed} />
          </ul>
          {!menuClosed && tenancySelected && (
            <div className="mt-auto px-5 py-4 text-[11px] leading-4 tracking-[0.02em] text-primary-400">
              {tenancySelected.split("/").join(" / ")}
            </div>
          )}
```

with:

```tsx
          <ul className="p-2">
            <MenuItem href={ROUTE_PAGE_PROFILE} text="Profile" icon="person" collapsed={menuClosed} />
          </ul>
          <AdminNavItem collapsed={menuClosed} />
          {!menuClosed && (props.scopeLabel || tenancySelected) && (
            <div className="mt-auto px-5 py-4 text-[11px] leading-4 tracking-[0.02em] text-primary-400">
              {props.scopeLabel ?? tenancySelected.split("/").join(" / ")}
            </div>
          )}
```

and replace:

```tsx
          <div
            className="flex justify-end items-center w-full h-16 pr-6 border-b border-b-primary-200 sticky top-0
          backdrop-blur-md bg-primary-50/90 z-40"
          >
            <AvatarButton />
          </div>
```

with:

```tsx
          <div
            className={`flex ${props.headerContent ? "justify-between pl-8" : "justify-end"} items-center w-full h-16 pr-6 border-b border-b-primary-200 sticky top-0 backdrop-blur-md bg-primary-50/90 z-40`}
          >
            {props.headerContent}
            <AvatarButton />
          </div>
```

- [ ] **Step 5: Run them**

Run: `npx jest --coverage=false components/Admin/__tests__/AdminNavItem.test.tsx components/Admin/__tests__/LoggedLayoutAdmin.test.tsx`
Expected: PASS, 5 + 2 tests.

- [ ] **Step 6: Commit**

```bash
pwd
command git branch --show-current
command git add components/Admin/AdminNavItem.tsx components/LoggedLayout.tsx components/Admin/__tests__/AdminNavItem.test.tsx components/Admin/__tests__/LoggedLayoutAdmin.test.tsx
command git commit -m "feat: an Admin entry with the open-requests badge in the sidebar

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 12: Tabs, admin layout, the redirect and the two empty tabs

**Files:**
- Create: `components/Admin/AdminTabs.tsx`, `components/Admin/AdminLayout.tsx`
- Create: `pages/app/admin/index.tsx`, `pages/app/admin/users.tsx`, `pages/app/admin/activity.tsx`
- Modify: `contants/TelemetryConstants.ts`
- Test: `components/Admin/__tests__/AdminTabs.test.tsx`; modify `contants/__tests__/TelemetryConstants.test.ts`

**Interfaces:** Consumes `ADMIN_TABS`, `ADMIN_COPY`, `useAdminCounts`, `CountBadge`, `AdminEmptyState`, `LoggedLayout`'s new props (Task 11). Produces `AdminTabs()`, `AdminLayout({ children })` — the frame every admin page, now and in RFC 010, wraps its view in — and the pages `/app/admin` (client redirect to `/app/admin/requests`), `/app/admin/users`, `/app/admin/activity`, each with `auth = { role: "admin", admin: true, loading: <div>loading...</div> }`.

- [ ] **Step 1: Write the failing tests**

Create `components/Admin/__tests__/AdminTabs.test.tsx`:

```tsx
/** @jest-environment jsdom */
import { render, screen } from "@testing-library/react";

let mockPathname = "/app/admin/requests";
let mockCounts: unknown = { open: 4, join: 2, new: 2, closed: 31 };

jest.mock("next/router", () => ({ useRouter: () => ({ pathname: mockPathname }) }));
jest.mock("../../../hooks/UseAdmin", () => ({ useAdminCounts: () => ({ data: mockCounts }) }));

import { AdminTabs } from "../AdminTabs";

test("Requests, Users, Tenancies and Activity, with the open count on Requests", () => {
    render(<AdminTabs />);

    const links = screen.getAllByRole("link");
    expect(links.map((link) => link.getAttribute("href"))).toEqual(["/app/admin/requests", "/app/admin/users", "/app/admin/tenancies", "/app/admin/activity"]);
    expect(links[0].textContent).toBe("Requests4");
    expect(screen.getByLabelText("4 open requests")).toBeTruthy();
});

test("the tab of the current page is the active one", () => {
    mockPathname = "/app/admin/tenancies";

    render(<AdminTabs />);

    expect(screen.getByRole("link", { name: "Tenancies" }).getAttribute("aria-current")).toBe("page");
    expect(screen.getByRole("link", { name: "Tenancies" }).className).toContain("border-primary-900");
    expect(screen.getByRole("link", { name: "Users" }).getAttribute("aria-current")).toBeNull();
});

test("no badge when nothing is open", () => {
    mockCounts = { open: 0, join: 0, new: 0, closed: 31 };

    render(<AdminTabs />);

    expect(screen.queryByLabelText(/open requests/)).toBeNull();
});
```

In `contants/__tests__/TelemetryConstants.test.ts`, replace:

```ts
describe("members' access", () => {
  it("accepts its ui event", () => {
    expect(uiEventLabel("members_access_changed")).toBe("members_access_changed");
  });
});
```

with:

```ts
describe("members' access", () => {
  it("accepts its ui event", () => {
    expect(uiEventLabel("members_access_changed")).toBe("members_access_changed");
  });
});

describe("the admin area", () => {
  it("knows its pages", () => {
    for (const page of ["/app/admin", "/app/admin/requests", "/app/admin/users", "/app/admin/tenancies", "/app/admin/activity"]) {
      expect(pageLabel(page)).toBe(page);
    }
  });
});
```

- [ ] **Step 2: Run them**

Run: `npx jest --coverage=false components/Admin/__tests__/AdminTabs.test.tsx contants/__tests__/TelemetryConstants.test.ts`
Expected: FAIL — `Cannot find module '../AdminTabs'`; "the admin area › knows its pages" receives `"other"`.

- [ ] **Step 3: Write `components/Admin/AdminTabs.tsx` and `components/Admin/AdminLayout.tsx`**

`components/Admin/AdminTabs.tsx`:

```tsx
import Link from "next/link";
import { useRouter } from "next/router";
import { ADMIN_TABS } from "../../contants/AdminConstants";
import { useAdminCounts } from "../../hooks/UseAdmin";
import { CountBadge } from "./CountBadge";

export function AdminTabs() {
    const router = useRouter();
    const { data: counts } = useAdminCounts();

    return (
        <nav aria-label="Admin" className="flex h-16 items-stretch gap-6">
            {ADMIN_TABS.map((tab) => {
                const active = router.pathname === tab.href;
                return (
                    <Link
                        key={tab.href}
                        href={tab.href}
                        aria-current={active ? "page" : undefined}
                        className={`flex items-center gap-2 border-b-2 text-sm font-medium ${active
                            ? "border-primary-900 text-primary-900"
                            : "border-transparent text-primary-500 hover:text-primary-900"
                            }`}
                    >
                        {tab.label}
                        {tab.showsOpenCount && <CountBadge count={counts?.open} label="open requests" />}
                    </Link>
                );
            })}
        </nav>
    );
}
```

`components/Admin/AdminLayout.tsx`:

```tsx
import { ReactNode } from "react";
import { ADMIN_COPY } from "../../contants/AdminConstants";
import LoggedLayout from "../LoggedLayout";
import { AdminTabs } from "./AdminTabs";

export function AdminLayout({ children }: { children: ReactNode }) {
    return (
        <LoggedLayout tenancyOptional scopeLabel={ADMIN_COPY.scope} headerContent={<AdminTabs />}>
            <div className="w-full max-w-6xl">{children}</div>
        </LoggedLayout>
    );
}
```

- [ ] **Step 4: Write the three pages**

`pages/app/admin/index.tsx`:

```tsx
import Router from "next/router";
import { useEffect } from "react";
import { ROUTE_PAGE_ADMIN_REQUESTS } from "../../../contants/InternalRoutesConstants";

export default function AdminIndexPage() {
    useEffect(() => {
        Router.replace(ROUTE_PAGE_ADMIN_REQUESTS);
    }, []);
    return null;
}

AdminIndexPage.auth = {
    role: "admin",
    admin: true,
    loading: <div>loading...</div>,
};
```

`pages/app/admin/users.tsx`:

```tsx
import { AdminEmptyState } from "../../../components/Admin/AdminEmptyState";
import { AdminLayout } from "../../../components/Admin/AdminLayout";
import { ADMIN_COPY } from "../../../contants/AdminConstants";

export default function AdminUsersPage() {
    return (
        <AdminLayout>
            <AdminEmptyState title={ADMIN_COPY.usersTitle} text={ADMIN_COPY.usersEmpty} />
        </AdminLayout>
    );
}

AdminUsersPage.auth = {
    role: "admin",
    admin: true,
    loading: <div>loading...</div>,
};
```

`pages/app/admin/activity.tsx`:

```tsx
import { AdminEmptyState } from "../../../components/Admin/AdminEmptyState";
import { AdminLayout } from "../../../components/Admin/AdminLayout";
import { ADMIN_COPY } from "../../../contants/AdminConstants";

export default function AdminActivityPage() {
    return (
        <AdminLayout>
            <AdminEmptyState title={ADMIN_COPY.activityTitle} text={ADMIN_COPY.activityEmpty} />
        </AdminLayout>
    );
}

AdminActivityPage.auth = {
    role: "admin",
    admin: true,
    loading: <div>loading...</div>,
};
```

- [ ] **Step 5: List the admin pages for telemetry**

In `contants/TelemetryConstants.ts`, replace:

```ts
  "/anonymous/[token]",
  "/app/datasets",
```

with:

```ts
  "/anonymous/[token]",
  "/app/admin",
  "/app/admin/activity",
  "/app/admin/requests",
  "/app/admin/tenancies",
  "/app/admin/users",
  "/app/datasets",
```

(`requests` and `tenancies` pages arrive in Tasks 15 and 17; listing them now keeps the page walk green whichever lands first.)

- [ ] **Step 6: Run them**

Run: `npx jest --coverage=false components/Admin/__tests__/AdminTabs.test.tsx contants/__tests__/TelemetryConstants.test.ts`
Expected: PASS, 3 new tab tests and the telemetry suite with one more test; "include every page the app has" stays green with the three new pages.

- [ ] **Step 7: Commit**

```bash
pwd
command git branch --show-current
command git add components/Admin/AdminTabs.tsx components/Admin/AdminLayout.tsx pages/app/admin contants/TelemetryConstants.ts components/Admin/__tests__/AdminTabs.test.tsx contants/__tests__/TelemetryConstants.test.ts
command git commit -m "feat: the admin shell with its tabs, and Users and Activity as coming soon

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 13: The decline prompt

**Files:**
- Create: `components/Admin/Requests/DeclineRequestDialog.tsx`
- Test: `components/Admin/Requests/__tests__/DeclineRequestDialog.test.tsx`

**Interfaces:** Consumes `AdminDialog`, `BFFAPI.declineTenancyRequest`, `adminErrorFrom`, PR B's `firstNameOf` (`lib/tenancySelection.ts`), `MESSAGE_MAX_LENGTH`. Produces `DeclineRequestDialog({ request, onCancel, onDeclined }: { request: AdminTenancyRequest; onCancel(): void; onDeclined(): void })` and `declineSubtitle(request): string`.

- [ ] **Step 1: Write the failing test**

Create `components/Admin/Requests/__tests__/DeclineRequestDialog.test.tsx`:

```tsx
/** @jest-environment jsdom */
import { describe, expect, jest, test } from "@jest/globals";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";

const mockDecline = jest.fn() as any;

jest.mock("../../../../gateways/BFFAPI", () => ({
    BFFAPI: jest.fn().mockImplementation(() => ({ declineTenancyRequest: mockDecline })),
}));

import { adminRequest, newTenancyRequest } from "../../../../fake-data/adminFixtures";
import { DeclineRequestDialog } from "../DeclineRequestDialog";

function renderDialog(request = adminRequest()) {
    const onCancel = jest.fn();
    const onDeclined = jest.fn();
    render(<DeclineRequestDialog request={request} onCancel={onCancel} onDeclined={onDeclined} />);
    return { onCancel, onDeclined };
}

describe("DeclineRequestDialog", () => {
    test("asks to decline a join, with an optional message and what it means", () => {
        renderDialog();

        expect(screen.getByRole("dialog", { name: "Decline request?" })).toBeTruthy();
        expect(screen.getByText("Fernanda Lima · join Data Amazon")).toBeTruthy();
        const message = screen.getByLabelText(/Message to Fernanda/) as HTMLTextAreaElement;
        expect(message.placeholder).toBe("Ask a member of the tenancy to invite you from its Members page");
        expect(screen.getByText("optional")).toBeTruthy();
        expect(screen.getByText("Stays in public · can request again")).toBeTruthy();
    });

    test("names a new tenancy by what the user asked for", () => {
        renderDialog(newTenancyRequest());

        expect(screen.getByText("Kenji Tanaka · new tenancy Cerrado Flux")).toBeTruthy();
    });

    test("declines without a message", async () => {
        mockDecline.mockResolvedValue({});
        const { onDeclined } = renderDialog();

        fireEvent.click(screen.getByRole("button", { name: "Decline" }));

        await waitFor(() => expect(onDeclined).toHaveBeenCalled());
        expect(mockDecline).toHaveBeenCalledWith("7a9b5d5e-fa6d-4c18-9a51-2b1e2c3d4e5f", undefined);
    });

    test("sends the message trimmed", async () => {
        mockDecline.mockResolvedValue({});
        const { onDeclined } = renderDialog();

        fireEvent.change(screen.getByLabelText(/Message to Fernanda/), { target: { value: "  Ask Luciana Rizzo to invite you.  " } });
        fireEvent.click(screen.getByRole("button", { name: "Decline" }));

        await waitFor(() => expect(onDeclined).toHaveBeenCalled());
        expect(mockDecline).toHaveBeenCalledWith("7a9b5d5e-fa6d-4c18-9a51-2b1e2c3d4e5f", "Ask Luciana Rizzo to invite you.");
    });

    test("says so when another admin decided first, and stays open", async () => {
        mockDecline.mockRejectedValue({ response: { status: 409, data: { detail: "request_not_pending" } } });
        const { onDeclined } = renderDialog();

        fireEvent.click(screen.getByRole("button", { name: "Decline" }));

        expect(await screen.findByText("Another administrator already decided this request.")).toBeTruthy();
        expect(onDeclined).not.toHaveBeenCalled();
    });

    test("a message over 1000 characters is caught before the server", async () => {
        renderDialog();

        fireEvent.change(screen.getByLabelText(/Message to Fernanda/), { target: { value: "x".repeat(1001) } });
        fireEvent.click(screen.getByRole("button", { name: "Decline" }));

        expect(await screen.findByText("Keep the message to 1000 characters.")).toBeTruthy();
        expect(mockDecline).not.toHaveBeenCalled();
    });

    test("Cancel declines nothing", () => {
        const { onCancel } = renderDialog();

        fireEvent.click(screen.getByRole("button", { name: "Cancel" }));

        expect(onCancel).toHaveBeenCalled();
        expect(mockDecline).not.toHaveBeenCalled();
    });
});
```

- [ ] **Step 2: Run it**

Run: `npx jest --coverage=false components/Admin/Requests/__tests__/DeclineRequestDialog.test.tsx`
Expected: FAIL — `Cannot find module '../DeclineRequestDialog'`.

- [ ] **Step 3: Write `components/Admin/Requests/DeclineRequestDialog.tsx`**

```tsx
import { useFormik } from "formik";
import { useState } from "react";
import * as Yup from "yup";
import { ADMIN_COPY, adminErrorFrom, adminErrorMessage } from "../../../contants/AdminConstants";
import { MESSAGE_MAX_LENGTH } from "../../../contants/TenancyConstants";
import { BFFAPI } from "../../../gateways/BFFAPI";
import { firstNameOf } from "../../../lib/tenancySelection";
import { AdminTenancyRequest } from "../../../types/GatekeeperAPI";
import { AdminDialog } from "../AdminDialog";

interface Props {
    request: AdminTenancyRequest
    onCancel(): void
    onDeclined(): void
}

const schema = Yup.object({
    message: Yup.string().trim().max(MESSAGE_MAX_LENGTH, adminErrorMessage("message_invalid")),
});

export function declineSubtitle(request: AdminTenancyRequest): string {
    return request.kind === "join" && request.suggested_tenancy
        ? `${request.requester.name} · join ${request.suggested_tenancy.display_name}`
        : `${request.requester.name} · new tenancy ${request.requested_name}`;
}

export function DeclineRequestDialog({ request, onCancel, onDeclined }: Props) {
    const [error, setError] = useState<string | null>(null);
    const formik = useFormik({
        initialValues: { message: "" },
        validationSchema: schema,
        onSubmit: async (values) => {
            setError(null);
            const message = values.message.trim();
            try {
                await new BFFAPI().declineTenancyRequest(request.id, message || undefined);
                onDeclined();
            } catch (e) {
                setError(adminErrorFrom(e));
            }
        },
    });

    return (
        <AdminDialog
            title="Decline request?"
            subtitle={declineSubtitle(request)}
            widthClassName="max-w-[440px]"
            onClose={onCancel}
            primary={{ label: "Decline", destructive: true, disabled: formik.isSubmitting, onClick: () => { formik.submitForm(); } }}
        >
            <form onSubmit={formik.handleSubmit} className="flex flex-col gap-4" noValidate>
                <div>
                    <label htmlFor="decline-message" className="mb-1.5 text-[13px]">
                        Message to {firstNameOf(request.requester.name)} <span className="font-normal text-primary-400">optional</span>
                    </label>
                    <textarea
                        id="decline-message"
                        name="message"
                        rows={3}
                        placeholder={ADMIN_COPY.declinePlaceholder}
                        value={formik.values.message}
                        onChange={formik.handleChange}
                        onBlur={formik.handleBlur}
                    />
                    {formik.errors.message && <p role="alert" className="m-0 mt-1.5 text-[13px] text-danger-700">{formik.errors.message}</p>}
                </div>
                <ul className="m-0 flex list-none flex-col gap-2.5 p-0 text-sm leading-[21px] text-primary-700">
                    <li className="flex gap-2.5"><span className="text-primary-400">—</span><span>{ADMIN_COPY.declineBullet}</span></li>
                </ul>
                {error && <p role="alert" className="m-0 text-sm text-danger-700">{error}</p>}
            </form>
        </AdminDialog>
    );
}
```

- [ ] **Step 4: Run it**

Run: `npx jest --coverage=false components/Admin/Requests/__tests__/DeclineRequestDialog.test.tsx`
Expected: PASS, 7 tests.

- [ ] **Step 5: Commit**

```bash
pwd
command git branch --show-current
command git add components/Admin/Requests/DeclineRequestDialog.tsx components/Admin/Requests/__tests__/DeclineRequestDialog.test.tsx
command git commit -m "feat: decline a tenancy request with an optional message

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 14: The review dialog

**Files:**
- Create: `components/Admin/Requests/ReviewRequestDialog.tsx`
- Test: `components/Admin/Requests/__tests__/ReviewRequestDialog.test.tsx`

**Interfaces:** Consumes `useAdminRequest`, `useAdminTenancies` (Task 9), `AdminDialog`, `BFFAPI.approveTenancyRequest`, `slugifyNamespace`, `adminErrorFrom`, `adminErrorMessage`, `requestedAgo`, B's `firstNameOf` (`lib/tenancySelection.ts`), `plural`, `formatShortDate`, B's `PRODUCTION_PREFIX`, `NAMESPACE_*`, `DISPLAY_NAME_MAX_LENGTH`. Produces `ReviewRequestDialog({ requestId, now?, onClose, onApproved, onDecline }: { requestId: string; now?: Date; onClose(): void; onApproved(): void; onDecline(request: AdminTenancyRequest): void })`.

Behaviour (RFC 009 §Review dialog): loading and error states; a request already decided shows who decided it and offers only Close; a pending one opens on the suggestion's side of **Join existing** / **New tenancy**. Join: a picker of production, enabled, non-public tenancies the requester is not in, prefilled with the suggestion; info rows Tenancy / Reason / Currently in. New: Display name (the requested name) and Namespace (its slug), both editable, preview `datamap/production/{namespace} · requester becomes a member`; an unverified requester gets the amber banner and a disabled **Create and approve**. No role cards. An approval answered `404 no_account` (the requester's account is disabled or gone; PR A checks it first and leaves the request pending) shows "This account is disabled or no longer exists, so it cannot be approved. Decline the request instead.", disables the primary button and keeps **Decline…**.

- [ ] **Step 1: Write the failing test**

Create `components/Admin/Requests/__tests__/ReviewRequestDialog.test.tsx`:

```tsx
/** @jest-environment jsdom */
import { describe, expect, jest, test, beforeEach } from "@jest/globals";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";

const mockApprove = jest.fn() as any;
let mockDetail: { data?: unknown, error?: unknown } = {};

jest.mock("../../../../gateways/BFFAPI", () => ({
    BFFAPI: jest.fn().mockImplementation(() => ({ approveTenancyRequest: mockApprove })),
}));
jest.mock("../../../../hooks/UseAdmin", () => ({
    useAdminRequest: () => mockDetail,
    useAdminTenancies: () => ({ data: jest.requireActual<any>("../../../../fake-data/adminFixtures").ADMIN_TENANCIES }),
}));

import { ATTO, DATA_AMAZON, PUBLIC_TENANCY, adminRequestDetail, newTenancyRequest } from "../../../../fake-data/adminFixtures";
import { ReviewRequestDialog } from "../ReviewRequestDialog";

const NOW = new Date("2026-10-04T12:00:00Z");
const REQUEST_ID = "7a9b5d5e-fa6d-4c18-9a51-2b1e2c3d4e5f";

function renderDialog() {
    const onClose = jest.fn();
    const onApproved = jest.fn();
    const onDecline = jest.fn();
    render(<ReviewRequestDialog requestId={REQUEST_ID} now={NOW} onClose={onClose} onApproved={onApproved} onDecline={onDecline} />);
    return { onClose, onApproved, onDecline };
}

function newRequestDetail(verified: boolean) {
    const request = newTenancyRequest();
    return adminRequestDetail({ ...request, requester: { ...request.requester, email_verified: verified }, suggested_tenancy_members: null });
}

beforeEach(() => {
    mockDetail = { data: adminRequestDetail() };
});

describe("ReviewRequestDialog", () => {
    test("says the request is loading", () => {
        mockDetail = {};

        renderDialog();

        expect(screen.getByText("Loading request…")).toBeTruthy();
        expect(screen.queryByRole("button", { name: "Approve" })).toBeNull();
    });

    test("says when the request no longer exists", () => {
        mockDetail = { error: { status: 404, detail: "request_not_found" } };

        renderDialog();

        expect(screen.getByText("This request no longer exists.")).toBeTruthy();
    });

    test("a join opens on the suggested tenancy", () => {
        renderDialog();

        expect(screen.getByRole("dialog", { name: "Join Data Amazon" })).toBeTruthy();
        expect(screen.getByText("Fernanda Lima · fernanda.lima@inpe.br · requested 6 days ago")).toBeTruthy();
        expect((screen.getByLabelText("Tenancy") as HTMLSelectElement).value).toBe(DATA_AMAZON.path);
        expect(screen.getByText("datamap/production/data-amazon · 14 members")).toBeTruthy();
        expect(screen.getByText("“Postdoc in Luciana Rizzo's group, GoAmazon SMPS data”")).toBeTruthy();
        expect(screen.getByText(PUBLIC_TENANCY.path)).toBeTruthy();
        expect(screen.getByText("Fernanda is emailed either way.")).toBeTruthy();
        expect(screen.getByRole("button", { name: "Join existing" }).getAttribute("aria-pressed")).toBe("true");
    });

    test("the picker offers only production tenancies the requester can join", () => {
        renderDialog();

        const options = Array.from((screen.getByLabelText("Tenancy") as HTMLSelectElement).options).map((option) => option.value);
        expect(options).toEqual(["", ATTO.path, DATA_AMAZON.path]);
    });

    test("approving a join sends the chosen tenancy", async () => {
        mockApprove.mockResolvedValue({});
        const { onApproved } = renderDialog();

        fireEvent.change(screen.getByLabelText("Tenancy"), { target: { value: ATTO.path } });
        expect(screen.getByRole("dialog", { name: "Join ATTO" })).toBeTruthy();
        fireEvent.click(screen.getByRole("button", { name: "Approve" }));

        await waitFor(() => expect(onApproved).toHaveBeenCalled());
        expect(mockApprove).toHaveBeenCalledWith(REQUEST_ID, { tenancy: ATTO.path });
    });

    test("a new-tenancy request opens on New tenancy, prefilled, and creates it", async () => {
        mockDetail = { data: newRequestDetail(true) };
        mockApprove.mockResolvedValue({});
        const { onApproved } = renderDialog();

        expect(screen.getByRole("dialog", { name: "New tenancy: Cerrado Flux" })).toBeTruthy();
        expect(screen.getByText("Kenji Tanaka · k.tanaka@nagoya-u.ac.jp · requested yesterday")).toBeTruthy();
        expect((screen.getByLabelText("Display name") as HTMLInputElement).value).toBe("Cerrado Flux");
        expect((screen.getByLabelText("Namespace") as HTMLInputElement).value).toBe("cerrado-flux");
        expect(screen.getByText("datamap/production/cerrado-flux · requester becomes a member")).toBeTruthy();

        fireEvent.click(screen.getByRole("button", { name: "Create and approve" }));

        await waitFor(() => expect(onApproved).toHaveBeenCalled());
        expect(mockApprove).toHaveBeenCalledWith("8b0c6e6f-0b7e-4d29-8b62-3c2f3d4e5f60", { newTenancy: { displayName: "Cerrado Flux", namespace: "cerrado-flux" } });
    });

    test("an unverified requester cannot get a new tenancy", () => {
        mockDetail = { data: newRequestDetail(false) };

        renderDialog();

        expect(screen.getByText("Email not verified. A new tenancy can't be created for an unverified account.")).toBeTruthy();
        expect((screen.getByRole("button", { name: "Create and approve" }) as HTMLButtonElement).disabled).toBe(true);
    });

    test("an invalid namespace is caught before the server", async () => {
        mockDetail = { data: newRequestDetail(true) };
        renderDialog();

        fireEvent.change(screen.getByLabelText("Namespace"), { target: { value: "public" } });
        fireEvent.click(screen.getByRole("button", { name: "Create and approve" }));

        expect(await screen.findByText("Use 2 to 63 lower-case letters, digits or hyphens, and not “public”.")).toBeTruthy();
        expect(mockApprove).not.toHaveBeenCalled();
    });

    test("a refusal from the server is shown in the dialog", async () => {
        mockDetail = { data: newRequestDetail(true) };
        mockApprove.mockRejectedValue({ response: { status: 409, data: { detail: "display_name_taken" } } });
        const { onApproved } = renderDialog();

        fireEvent.click(screen.getByRole("button", { name: "Create and approve" }));

        expect(await screen.findByText("Another tenancy already has this display name.")).toBeTruthy();
        expect(onApproved).not.toHaveBeenCalled();
    });

    test("an account that is gone cannot be approved, and Decline… stays", async () => {
        mockApprove.mockRejectedValue({ response: { status: 404, data: { detail: "no_account" } } });
        const { onApproved, onDecline } = renderDialog();

        fireEvent.click(screen.getByRole("button", { name: "Approve" }));

        expect(await screen.findByText("This account is disabled or no longer exists, so it cannot be approved. Decline the request instead.")).toBeTruthy();
        expect((screen.getByRole("button", { name: "Approve" }) as HTMLButtonElement).disabled).toBe(true);
        expect(onApproved).not.toHaveBeenCalled();
        fireEvent.click(screen.getByRole("button", { name: "Decline…" }));
        expect(onDecline).toHaveBeenCalledWith(expect.objectContaining({ id: REQUEST_ID }));
    });

    test("Decline… hands the request to the decline prompt", () => {
        const { onDecline } = renderDialog();

        fireEvent.click(screen.getByRole("button", { name: "Decline…" }));

        expect(onDecline).toHaveBeenCalledWith(expect.objectContaining({ id: REQUEST_ID }));
    });

    test("a request decided elsewhere says so and cannot be approved again", () => {
        mockDetail = { data: adminRequestDetail({ status: "declined", decided_by: { id: "a1", name: "André Maia" }, decided_at: "2026-10-01T10:00:00+00:00" }) };

        renderDialog();

        expect(screen.getByText("This request was already declined by André Maia on Oct 1, 2026.")).toBeTruthy();
        expect(screen.queryByRole("button", { name: "Approve" })).toBeNull();
    });

    test("someone already in every tenancy has nothing to join", () => {
        mockDetail = { data: adminRequestDetail({ requester_tenancies: [PUBLIC_TENANCY, ATTO, DATA_AMAZON] }) };

        renderDialog();

        expect(screen.getByText("This account is already in every tenancy it could join.")).toBeTruthy();
        expect((screen.getByRole("button", { name: "Approve" }) as HTMLButtonElement).disabled).toBe(true);
    });
});
```

- [ ] **Step 2: Run it**

Run: `npx jest --coverage=false components/Admin/Requests/__tests__/ReviewRequestDialog.test.tsx`
Expected: FAIL — `Cannot find module '../ReviewRequestDialog'`.

- [ ] **Step 3: Write `components/Admin/Requests/ReviewRequestDialog.tsx`**

```tsx
import { useFormik } from "formik";
import { useState } from "react";
import { MaterialSymbol } from "react-material-symbols";
import * as Yup from "yup";
import { ADMIN_COPY, adminErrorFrom, adminErrorMessage, slugifyNamespace } from "../../../contants/AdminConstants";
import {
    DISPLAY_NAME_MAX_LENGTH,
    NAMESPACE_MAX_LENGTH,
    NAMESPACE_MIN_LENGTH,
    NAMESPACE_PATTERN,
    PRODUCTION_PREFIX,
} from "../../../contants/TenancyConstants";
import { BFFAPI } from "../../../gateways/BFFAPI";
import { useAdminRequest, useAdminTenancies } from "../../../hooks/UseAdmin";
import { plural, requestedAgo } from "../../../lib/adminDisplay";
import { formatShortDate } from "../../../lib/embargoDisplay";
import { firstNameOf } from "../../../lib/tenancySelection";
import { AdminTenancy, AdminTenancyRequest, AdminTenancyRequestDetail, TenancyDecision } from "../../../types/GatekeeperAPI";
import { AdminDialog } from "../AdminDialog";

type Mode = "join" | "new";

interface Props {
    requestId: string
    now?: Date
    onClose(): void
    onApproved(): void
    onDecline(request: AdminTenancyRequest): void
}

const WIDTH = "max-w-[560px]";
const FIELD_ERROR = "m-0 mt-1.5 text-[13px] text-danger-700";
const NAMESPACE_ERROR = adminErrorMessage("namespace_invalid");
const DISPLAY_NAME_ERROR = adminErrorMessage("display_name_invalid");

const schema = Yup.object({
    mode: Yup.string().oneOf(["join", "new"]).required(),
    tenancy: Yup.string().when("mode", {
        is: "join",
        then: (s) => s.required("Choose the tenancy to join."),
    }),
    displayName: Yup.string().when("mode", {
        is: "new",
        then: (s) => s.trim().required(DISPLAY_NAME_ERROR).max(DISPLAY_NAME_MAX_LENGTH, DISPLAY_NAME_ERROR),
    }),
    namespace: Yup.string().when("mode", {
        is: "new",
        then: (s) => s
            .required(NAMESPACE_ERROR)
            .min(NAMESPACE_MIN_LENGTH, NAMESPACE_ERROR)
            .max(NAMESPACE_MAX_LENGTH, NAMESPACE_ERROR)
            .matches(NAMESPACE_PATTERN, NAMESPACE_ERROR)
            .notOneOf(["public"], NAMESPACE_ERROR),
    }),
});

function joinable(tenancies: AdminTenancy[], detail: AdminTenancyRequestDetail): AdminTenancy[] {
    const current = new Set(detail.requester_tenancies.map((tenancy) => tenancy.path));
    return tenancies.filter((tenancy) => !tenancy.is_default && !tenancy.is_legacy && tenancy.is_enabled && !current.has(tenancy.path));
}

function decidedText(detail: AdminTenancyRequestDetail): string {
    const outcome = detail.status === "approved" ? `approved into ${detail.tenancy?.display_name ?? detail.requested_name}` : "declined";
    const who = detail.decided_by?.name ?? "an administrator";
    const when = detail.decided_at ? ` on ${formatShortDate(detail.decided_at)}` : "";
    return `This request was already ${outcome} by ${who}${when}.`;
}

export function ReviewRequestDialog(props: Props) {
    const { data: detail, error } = useAdminRequest(props.requestId);
    const { data: tenancies, error: tenanciesError } = useAdminTenancies();

    if (error || tenanciesError) {
        return (
            <AdminDialog title="Review request" widthClassName={WIDTH} onClose={props.onClose}>
                <p role="alert" className="m-0 text-sm text-danger-700">{adminErrorMessage(error?.detail)}</p>
            </AdminDialog>
        );
    }

    if (!detail || !tenancies) {
        return (
            <AdminDialog title="Review request" widthClassName={WIDTH} onClose={props.onClose}>
                <p role="status" className="m-0 text-sm text-primary-500">Loading request…</p>
            </AdminDialog>
        );
    }

    if (detail.status !== "pending") {
        return (
            <AdminDialog title="Review request" subtitle={`${detail.requester.name} · ${detail.requested_name}`} widthClassName={WIDTH} onClose={props.onClose}>
                <p className="m-0 text-sm text-primary-700">{decidedText(detail)}</p>
            </AdminDialog>
        );
    }

    return <ReviewForm {...props} detail={detail} tenancies={tenancies} />;
}

function ReviewForm({ detail, tenancies, now, onClose, onApproved, onDecline }: Props & { detail: AdminTenancyRequestDetail; tenancies: AdminTenancy[] }) {
    const options = joinable(tenancies, detail);
    const suggested = options.find((tenancy) => tenancy.path === detail.suggested_tenancy?.path);
    const [error, setError] = useState<string | null>(null);
    const [accountGone, setAccountGone] = useState(false);
    const formik = useFormik({
        initialValues: {
            mode: (detail.kind === "join" ? "join" : "new") as Mode,
            tenancy: suggested?.path ?? "",
            displayName: detail.requested_name.trim().slice(0, DISPLAY_NAME_MAX_LENGTH),
            namespace: slugifyNamespace(detail.requested_name),
        },
        validationSchema: schema,
        onSubmit: async (values) => {
            setError(null);
            const decision: TenancyDecision = values.mode === "join"
                ? { tenancy: values.tenancy }
                : { newTenancy: { displayName: values.displayName.trim(), namespace: values.namespace } };
            try {
                await new BFFAPI().approveTenancyRequest(detail.id, decision);
                onApproved();
            } catch (e) {
                const gone = (e as { response?: { data?: { detail?: unknown } } })?.response?.data?.detail === "no_account";
                setAccountGone(gone);
                setError(gone ? ADMIN_COPY.approveNoAccount : adminErrorFrom(e));
            }
        },
    });

    const { values } = formik;
    const joining = values.mode === "join";
    const selected = options.find((tenancy) => tenancy.path === values.tenancy);
    const unverified = !detail.requester.email_verified;
    const blocked = accountGone || (joining ? options.length === 0 : unverified);
    const shown = (field: "tenancy" | "displayName" | "namespace") => (formik.touched[field] || formik.submitCount > 0) && formik.errors[field];
    const title = joining
        ? `Join ${selected?.display_name ?? "an existing tenancy"}`
        : `New tenancy: ${values.displayName.trim() || detail.requested_name}`;
    const subtitle = `${detail.requester.name} · ${detail.requester.email ?? "no email"} · requested ${requestedAgo(detail.created_at, now ?? new Date())}`;

    return (
        <AdminDialog
            title={title}
            subtitle={subtitle}
            widthClassName={WIDTH}
            onClose={onClose}
            secondaryLink={{ label: "Decline…", onClick: () => onDecline(detail) }}
            primary={{ label: joining ? "Approve" : "Create and approve", disabled: blocked || formik.isSubmitting, onClick: () => { formik.submitForm(); } }}
        >
            <form onSubmit={formik.handleSubmit} className="flex flex-col gap-4" noValidate>
                <div role="group" aria-label="Decision" className="inline-flex self-start rounded-md border border-primary-300 p-0.5">
                    {(["join", "new"] as Mode[]).map((mode) => (
                        <button
                            key={mode}
                            type="button"
                            aria-pressed={values.mode === mode}
                            onClick={() => formik.setFieldValue("mode", mode)}
                            className={`h-8 rounded px-3 text-[13px] font-semibold ${values.mode === mode ? "bg-primary-900 text-primary-50" : "text-primary-700 hover:bg-primary-100"}`}
                        >
                            {mode === "join" ? "Join existing" : "New tenancy"}
                        </button>
                    ))}
                </div>

                {!joining && unverified && (
                    <p className="m-0 flex items-start gap-2 rounded-md bg-embargo-100 px-3 py-2.5 text-[13px] text-embargo-800">
                        <MaterialSymbol icon="warning" size={18} weight={400} grade={-25} fill />
                        <span>{ADMIN_COPY.unverifiedBanner}</span>
                    </p>
                )}

                {joining && (
                    <div>
                        <label htmlFor="review-tenancy" className="mb-1.5 text-[13px]">Tenancy</label>
                        {options.length > 0 ? (
                            <select id="review-tenancy" name="tenancy" value={values.tenancy} onChange={formik.handleChange} className="bg-primary-0">
                                <option value="">Choose a tenancy</option>
                                {options.map((tenancy) => (
                                    <option key={tenancy.path} value={tenancy.path}>{tenancy.display_name} · {tenancy.path}</option>
                                ))}
                            </select>
                        ) : (
                            <p className="m-0 text-[13px] text-primary-500">{ADMIN_COPY.nothingToJoin}</p>
                        )}
                        {shown("tenancy") && <p role="alert" className={FIELD_ERROR}>{formik.errors.tenancy}</p>}
                    </div>
                )}

                <dl className="m-0 grid grid-cols-[110px_minmax(0,1fr)] gap-x-4 gap-y-3 rounded-lg border border-primary-200 px-4 py-3.5 text-[13px]">
                    {joining && selected && (
                        <>
                            <dt className="text-primary-500">Tenancy</dt>
                            <dd className="m-0">
                                <span className="block font-semibold text-primary-900">{selected.display_name}</span>
                                <span className="block font-mono text-xs text-primary-500">{`${selected.path} · ${selected.members} ${plural(selected.members, "member", "members")}`}</span>
                            </dd>
                        </>
                    )}
                    <dt className="text-primary-500">Reason</dt>
                    <dd className="m-0 text-primary-900">{`“${detail.reason}”`}</dd>
                    <dt className="text-primary-500">Currently in</dt>
                    <dd className="m-0 font-mono text-xs text-primary-700">{detail.requester_tenancies.map((tenancy) => tenancy.path).join(", ")}</dd>
                </dl>

                {!joining && (
                    <>
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label htmlFor="review-display-name" className="mb-1.5 text-[13px]">Display name</label>
                                <input id="review-display-name" name="displayName" value={values.displayName} onChange={formik.handleChange} onBlur={formik.handleBlur} />
                                {shown("displayName") && <p role="alert" className={FIELD_ERROR}>{formik.errors.displayName}</p>}
                            </div>
                            <div>
                                <label htmlFor="review-namespace" className="mb-1.5 text-[13px]">Namespace</label>
                                <input id="review-namespace" name="namespace" className="font-mono" value={values.namespace} onChange={formik.handleChange} onBlur={formik.handleBlur} />
                                {shown("namespace") && <p role="alert" className={FIELD_ERROR}>{formik.errors.namespace}</p>}
                            </div>
                        </div>
                        <p className="m-0 font-mono text-xs text-primary-500">{`${PRODUCTION_PREFIX}${values.namespace} · requester becomes a member`}</p>
                    </>
                )}

                <p className="m-0 flex items-center gap-2 rounded-md bg-primary-100 px-3 py-2.5 text-[13px] text-primary-700">
                    <MaterialSymbol icon="mail" size={18} weight={400} grade={-25} />
                    <span>{`${firstNameOf(detail.requester.name)} is emailed either way.`}</span>
                </p>
                {error && <p role="alert" className="m-0 text-sm text-danger-700">{error}</p>}
            </form>
        </AdminDialog>
    );
}
```

- [ ] **Step 4: Run it**

Run: `npx jest --coverage=false components/Admin/Requests/__tests__/ReviewRequestDialog.test.tsx`
Expected: PASS, 13 tests.

- [ ] **Step 5: Commit**

```bash
pwd
command git branch --show-current
command git add components/Admin/Requests/ReviewRequestDialog.tsx components/Admin/Requests/__tests__/ReviewRequestDialog.test.tsx
command git commit -m "feat: review a tenancy request: join an existing tenancy or create one

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 15: The Requests tab

**Files:**
- Create: `components/Admin/Requests/RequestsTable.tsx`, `components/Admin/Requests/RecentlyClosed.tsx`, `components/Admin/Requests/RequestsView.tsx`
- Create: `pages/app/admin/requests.tsx`
- Test: `components/Admin/Requests/__tests__/RequestsTable.test.tsx`, `components/Admin/Requests/__tests__/RecentlyClosed.test.tsx`, `components/Admin/Requests/__tests__/RequestsView.test.tsx`

**Interfaces:** Consumes `useAdminCounts`, `useAdminRequests`, `useRecentlyClosed`, `revalidateAdminRequests`, `revalidateAdminTenancies` (Task 9), `useDebouncedValue`, `useComponentVisible`, `PersonInitial`, the display helpers, `AdminPageHeader`, `AdminLoadError`, `ReviewRequestDialog` (Task 14), `DeclineRequestDialog` (Task 13). Produces:
- `RequestsTable({ requests, closed, now, onReview, onDecline })` — the design's 1a table (`grid-cols-[minmax(0,1fr)_260px_130px_120px_130px]`);
- `RecentlyClosed()` — the last 5 decided requests and "Activity →";
- `RequestsView({ now? })` and `queryFor(filter, q, offset): AdminRequestsQuery` — header, counts, filter pills, search, table or its loading/empty/error state, pager by 50, Recently closed, and the dialogs; `?request={id}` opens the review dialog, closing it removes the parameter;
- the page `/app/admin/requests`.

- [ ] **Step 1: Write the failing tests**

Create `components/Admin/Requests/__tests__/RequestsTable.test.tsx`:

```tsx
/** @jest-environment jsdom */
import { describe, expect, jest, test } from "@jest/globals";
import { fireEvent, render, screen } from "@testing-library/react";
import { adminRequest, newTenancyRequest } from "../../../../fake-data/adminFixtures";
import { RequestsTable } from "../RequestsTable";

const NOW = new Date("2026-10-04T12:00:00Z");

function renderTable(requests: any[], closed = false) {
    const onReview = jest.fn();
    const onDecline = jest.fn();
    render(<RequestsTable requests={requests} closed={closed} now={NOW} onReview={onReview} onDecline={onDecline} />);
    return { onReview, onDecline };
}

describe("RequestsTable", () => {
    test("a join row: who, what, since when, email state, and Review", () => {
        const { onReview } = renderTable([adminRequest()]);

        expect(screen.getByText("Account")).toBeTruthy();
        expect(screen.getByText("Fernanda Lima")).toBeTruthy();
        expect(screen.getByText("fernanda.lima@inpe.br")).toBeTruthy();
        expect(screen.getByText("Join")).toBeTruthy();
        expect(screen.getByText("Data Amazon")).toBeTruthy();
        expect(screen.getByText("Postdoc in Luciana Rizzo's group, GoAmazon SMPS data")).toBeTruthy();
        expect(screen.getByText("Sep 28, 2026")).toBeTruthy();
        expect(screen.getByText("6 days waiting").className).toContain("text-embargo-800");
        expect(screen.getByText("verified")).toBeTruthy();

        fireEvent.click(screen.getByRole("button", { name: "Review" }));
        expect(onReview).toHaveBeenCalledWith(expect.objectContaining({ id: "7a9b5d5e-fa6d-4c18-9a51-2b1e2c3d4e5f" }));
    });

    test("a fresh new-tenancy row from an unverified account", () => {
        renderTable([newTenancyRequest()]);

        expect(screen.getByText("New")).toBeTruthy();
        expect(screen.getByText("Cerrado Flux")).toBeTruthy();
        expect(screen.getByText("1 day waiting").className).toContain("text-primary-500");
        expect(screen.getByText("unverified")).toBeTruthy();
    });

    test("the row menu holds Decline…", () => {
        const { onDecline } = renderTable([adminRequest()]);

        fireEvent.click(screen.getByRole("button", { name: "More actions for Fernanda Lima" }));
        fireEvent.click(screen.getByRole("menuitem", { name: "Decline…" }));

        expect(onDecline).toHaveBeenCalledWith(expect.objectContaining({ id: "7a9b5d5e-fa6d-4c18-9a51-2b1e2c3d4e5f" }));
    });

    test("a closed row shows how it ended instead of the actions", () => {
        renderTable([newTenancyRequest({
            status: "approved",
            created_tenancy: true,
            tenancy: { path: "datamap/production/cerrado-flux", display_name: "Cerrado Flux", is_default: false, is_legacy: false },
            decided_by: { id: "c1", name: "Caio Maia" },
            decided_at: "2026-10-01T10:48:00+00:00",
        })], true);

        expect(screen.getByText("Approved · new tenancy").className).toContain("text-success-500");
        expect(screen.getByText("decided Oct 1")).toBeTruthy();
        expect(screen.queryByRole("button", { name: "Review" })).toBeNull();
    });
});
```

Create `components/Admin/Requests/__tests__/RecentlyClosed.test.tsx`:

```tsx
/** @jest-environment jsdom */
import { describe, expect, test } from "@jest/globals";
import { render, screen } from "@testing-library/react";

let mockClosed: { data?: unknown, error?: unknown } = {};

jest.mock("../../../../hooks/UseAdmin", () => ({ useRecentlyClosed: () => mockClosed }));

import { DATA_AMAZON, adminRequest } from "../../../../fake-data/adminFixtures";
import { RecentlyClosed } from "../RecentlyClosed";

function page(items: unknown[]) {
    return { items, total_count: items.length, limit: 5, offset: 0 };
}

describe("RecentlyClosed", () => {
    test("says it is loading", () => {
        mockClosed = {};

        render(<RecentlyClosed />);

        expect(screen.getByText("Recently closed")).toBeTruthy();
        expect(screen.getByText("Loading…")).toBeTruthy();
    });

    test("says when nothing was closed yet", () => {
        mockClosed = { data: page([]) };

        render(<RecentlyClosed />);

        expect(screen.getByText("No closed requests yet.")).toBeTruthy();
    });

    test("says when it could not load", () => {
        mockClosed = { error: { status: 500 } };

        render(<RecentlyClosed />);

        expect(screen.getByText("Recently closed requests could not be loaded.")).toBeTruthy();
    });

    test("lists who, where, how it ended, by whom and when, with a way to Activity", () => {
        mockClosed = {
            data: page([
                adminRequest({ requester: { id: "m1", name: "Marcia Yamasoe", email: "m@usp.br", email_verified: true, orcid: null }, status: "approved", tenancy: DATA_AMAZON, decided_by: { id: "c1", name: "Caio Maia" }, decided_at: "2026-10-01T10:48:00+00:00" }),
                adminRequest({ requester: { id: "t1", name: "Test User", email: "t@usp.br", email_verified: true, orcid: null }, status: "declined", suggested_tenancy: null, requested_name: "ATTO", decided_by: { id: "a1", name: "André Maia" }, decided_at: "2026-09-24T10:00:00+00:00" }),
            ]),
        };

        render(<RecentlyClosed />);

        expect(screen.getByText((_, element) => element?.textContent === "Marcia Yamasoe · Data Amazon · Approved")).toBeTruthy();
        expect(screen.getByText("Approved").className).toContain("text-success-500");
        expect(screen.getByText("by Caio Maia · Oct 1")).toBeTruthy();
        expect(screen.getByText((_, element) => element?.textContent === "Test User · ATTO · Declined")).toBeTruthy();
        expect(screen.getByText("Declined").className).toContain("text-danger-700");
        expect(screen.getByRole("link", { name: "Activity →" }).getAttribute("href")).toBe("/app/admin/activity");
    });
});
```

Create `components/Admin/Requests/__tests__/RequestsView.test.tsx`:

```tsx
/** @jest-environment jsdom */
import { beforeEach, describe, expect, jest, test } from "@jest/globals";
import { fireEvent, render, screen } from "@testing-library/react";

const mockReplace = jest.fn();
const mockRetry = jest.fn();
const mockRevalidateRequests = jest.fn();
const mockRevalidateTenancies = jest.fn();
const mockQueries: unknown[] = [];
let mockRouter: { pathname: string, query: Record<string, string>, replace: typeof mockReplace };
let mockRequests: { data?: unknown, error?: unknown, mutate: typeof mockRetry };

jest.mock("next/router", () => ({ useRouter: () => mockRouter }));
jest.mock("../../../../hooks/UseDebouncedValue", () => ({ useDebouncedValue: (value: unknown) => value }));
jest.mock("../../../../hooks/UseAdmin", () => ({
    useAdminCounts: () => ({ data: { open: 4, join: 2, new: 2, closed: 31 } }),
    useAdminRequests: (query: unknown) => {
        mockQueries.push(query);
        return mockRequests;
    },
    useRecentlyClosed: () => ({ data: { items: [], total_count: 0, limit: 5, offset: 0 } }),
    revalidateAdminRequests: () => mockRevalidateRequests(),
    revalidateAdminTenancies: () => mockRevalidateTenancies(),
}));
jest.mock("../../../../gateways/BFFAPI", () => ({ BFFAPI: jest.fn().mockImplementation(() => ({})) }));
jest.mock("../ReviewRequestDialog", () => {
    const React = require("react");
    return {
        ReviewRequestDialog: (props: any) => React.createElement("div", null,
            `reviewing ${props.requestId}`,
            React.createElement("button", { onClick: props.onClose }, "stub close"),
            React.createElement("button", { onClick: props.onApproved }, "stub approve")),
    };
});

import { adminRequest } from "../../../../fake-data/adminFixtures";
import { RequestsView } from "../RequestsView";

const NOW = new Date("2026-10-04T12:00:00Z");
const REQUEST_ID = "7a9b5d5e-fa6d-4c18-9a51-2b1e2c3d4e5f";

function page(items: unknown[], total = items.length, offset = 0) {
    return { items, total_count: total, limit: 50, offset };
}

function lastQuery() {
    return mockQueries[mockQueries.length - 1];
}

beforeEach(() => {
    mockQueries.length = 0;
    mockRouter = { pathname: "/app/admin/requests", query: {}, replace: mockReplace };
    mockRequests = { data: page([adminRequest()]), mutate: mockRetry };
});

describe("RequestsView", () => {
    test("the header counts what is open, and each pill its share", () => {
        render(<RequestsView now={NOW} />);

        expect(screen.getByRole("heading", { name: "Requests" })).toBeTruthy();
        expect(screen.getByText("4 open · 2 for existing tenancies, 2 for new ones")).toBeTruthy();
        expect(screen.getByRole("button", { name: "Open 4" }).getAttribute("aria-pressed")).toBe("true");
        expect(screen.getByRole("button", { name: "Join existing 2" })).toBeTruthy();
        expect(screen.getByRole("button", { name: "New tenancy 2" })).toBeTruthy();
        expect(screen.getByRole("button", { name: "Closed 31" })).toBeTruthy();
        expect(screen.getByPlaceholderText("Name, email or ORCID")).toBeTruthy();
        expect(screen.getByText("Fernanda Lima")).toBeTruthy();
        expect(lastQuery()).toEqual({ status: "open", q: "", offset: 0 });
    });

    test("says the queue is loading", () => {
        mockRequests = { mutate: mockRetry };

        render(<RequestsView now={NOW} />);

        expect(screen.getByText("Loading requests…")).toBeTruthy();
    });

    test("says when the queue could not load, and retries", () => {
        mockRequests = { error: { status: 500 }, mutate: mockRetry };

        render(<RequestsView now={NOW} />);
        fireEvent.click(screen.getByRole("button", { name: "Try again" }));

        expect(screen.getByText("Requests could not be loaded.")).toBeTruthy();
        expect(mockRetry).toHaveBeenCalled();
    });

    test("an empty queue, and a search that matches nothing", () => {
        mockRequests = { data: page([]), mutate: mockRetry };

        render(<RequestsView now={NOW} />);
        expect(screen.getByText("No open requests. Requests people send from the app appear here.")).toBeTruthy();

        fireEvent.change(screen.getByPlaceholderText("Name, email or ORCID"), { target: { value: " tanaka " } });
        expect(screen.getByText("No requests match “tanaka”.")).toBeTruthy();
        expect(lastQuery()).toEqual({ status: "open", q: "tanaka", offset: 0 });
    });

    test("the pills change the query", () => {
        render(<RequestsView now={NOW} />);

        fireEvent.click(screen.getByRole("button", { name: "Join existing 2" }));
        expect(lastQuery()).toEqual({ status: "open", kind: "join", q: "", offset: 0 });

        fireEvent.click(screen.getByRole("button", { name: "New tenancy 2" }));
        expect(lastQuery()).toEqual({ status: "open", kind: "new", q: "", offset: 0 });

        fireEvent.click(screen.getByRole("button", { name: "Closed 31" }));
        expect(lastQuery()).toEqual({ status: "closed", q: "", offset: 0 });
    });

    test("Review puts the request in the URL", () => {
        render(<RequestsView now={NOW} />);

        fireEvent.click(screen.getByRole("button", { name: "Review" }));

        expect(mockReplace).toHaveBeenCalledWith({ pathname: "/app/admin/requests", query: { request: REQUEST_ID } }, undefined, { shallow: true });
    });

    test("?request= opens the review, and closing it takes the parameter away", () => {
        mockRouter.query = { request: REQUEST_ID };

        render(<RequestsView now={NOW} />);
        expect(screen.getByText(`reviewing ${REQUEST_ID}`)).toBeTruthy();

        fireEvent.click(screen.getByRole("button", { name: "stub close" }));
        expect(mockReplace).toHaveBeenCalledWith({ pathname: "/app/admin/requests", query: {} }, undefined, { shallow: true });
    });

    test("an approval refreshes the requests and the tenancies, and closes the review", () => {
        mockRouter.query = { request: REQUEST_ID };

        render(<RequestsView now={NOW} />);
        fireEvent.click(screen.getByRole("button", { name: "stub approve" }));

        expect(mockRevalidateRequests).toHaveBeenCalled();
        expect(mockRevalidateTenancies).toHaveBeenCalled();
        expect(mockReplace).toHaveBeenCalledWith({ pathname: "/app/admin/requests", query: {} }, undefined, { shallow: true });
    });

    test("Decline… from the row menu opens the decline prompt", () => {
        render(<RequestsView now={NOW} />);

        fireEvent.click(screen.getByRole("button", { name: "More actions for Fernanda Lima" }));
        fireEvent.click(screen.getByRole("menuitem", { name: "Decline…" }));

        expect(screen.getByRole("dialog", { name: "Decline request?" })).toBeTruthy();
    });

    test("more than 50 requests page by 50", () => {
        mockRequests = { data: page(Array.from({ length: 50 }, (_, i) => adminRequest({ id: `id-${i}` })), 120), mutate: mockRetry };

        render(<RequestsView now={NOW} />);
        expect(screen.getByText("1–50 of 120")).toBeTruthy();

        fireEvent.click(screen.getByRole("button", { name: "Next" }));
        expect(lastQuery()).toEqual({ status: "open", q: "", offset: 50 });
    });
});
```

- [ ] **Step 2: Run them**

Run: `npx jest --coverage=false components/Admin/Requests/__tests__/RequestsTable.test.tsx components/Admin/Requests/__tests__/RecentlyClosed.test.tsx components/Admin/Requests/__tests__/RequestsView.test.tsx`
Expected: FAIL — `Cannot find module '../RequestsTable'`, `'../RecentlyClosed'`, `'../RequestsView'`.

- [ ] **Step 3: Write `components/Admin/Requests/RequestsTable.tsx`**

```tsx
import { MaterialSymbol } from "react-material-symbols";
import useComponentVisible from "../../../hooks/UseComponentVisible";
import { closedOutcome, requestTarget, waitingLabel } from "../../../lib/adminDisplay";
import { formatShortDate } from "../../../lib/embargoDisplay";
import { AdminTenancyRequest, TenancyRequestKind } from "../../../types/GatekeeperAPI";
import { PersonInitial } from "../../Share/PersonInitial";

interface Props {
    requests: AdminTenancyRequest[]
    closed: boolean
    now: Date
    onReview(request: AdminTenancyRequest): void
    onDecline(request: AdminTenancyRequest): void
}

const GRID = "grid grid-cols-[minmax(0,1fr)_260px_130px_120px_130px] gap-4";

export function RequestsTable(props: Props) {
    return (
        <div className="mt-4 overflow-hidden rounded-lg border border-primary-200 bg-primary-0">
            <div className={`${GRID} h-10 items-center bg-primary-50 px-4 text-[11px] font-semibold uppercase tracking-[0.08em] text-primary-500`}>
                <span>Account</span>
                <span>Request</span>
                <span>Requested</span>
                <span>Email</span>
                <span className="sr-only">Actions</span>
            </div>
            <ul className="m-0 list-none p-0">
                {props.requests.map((request) => (
                    <RequestRow key={request.id} request={request} {...props} />
                ))}
            </ul>
        </div>
    );
}

function RequestRow({ request, closed, now, onReview, onDecline }: Omit<Props, "requests"> & { request: AdminTenancyRequest }) {
    const waiting = waitingLabel(request.created_at, now);
    return (
        <li className={`${GRID} min-h-[64px] items-center border-t border-primary-100 px-4 py-2.5`}>
            <div className="flex min-w-0 items-center gap-3">
                <PersonInitial name={request.requester.name} />
                <div className="min-w-0">
                    <p className="m-0 truncate text-sm font-semibold text-primary-900">{request.requester.name}</p>
                    <p className="m-0 truncate text-xs text-primary-500">{request.requester.email ?? "No email"}</p>
                </div>
            </div>
            <div className="min-w-0">
                <p className="m-0 flex min-w-0 items-center gap-2 text-sm text-primary-900">
                    <KindPill kind={request.kind} />
                    <span className="truncate">{requestTarget(request)}</span>
                </p>
                <p className="m-0 truncate text-xs text-primary-500" title={request.reason}>{request.reason}</p>
            </div>
            <div>
                <p className="m-0 text-[13px] text-primary-900">{formatShortDate(request.created_at)}</p>
                {closed
                    ? <p className="m-0 text-xs text-primary-500">{request.decided_at ? `decided ${formatShortDate(request.decided_at, false)}` : ""}</p>
                    : <p className={`m-0 text-xs font-medium ${waiting.stale ? "text-embargo-800" : "text-primary-500"}`}>{waiting.text}</p>}
            </div>
            <EmailState verified={request.requester.email_verified} />
            <div className="flex items-center justify-end gap-2">
                {closed ? (
                    <ClosedOutcome request={request} />
                ) : (
                    <>
                        <button
                            type="button"
                            onClick={() => onReview(request)}
                            className="h-8 rounded-md bg-primary-900 px-3 text-[13px] font-semibold text-primary-50 hover:bg-primary-800"
                        >
                            Review
                        </button>
                        <RowMenu name={request.requester.name} onDecline={() => onDecline(request)} />
                    </>
                )}
            </div>
        </li>
    );
}

function KindPill({ kind }: { kind: TenancyRequestKind }) {
    return kind === "join"
        ? <span className="flex-none rounded-full bg-secondary-500 px-2 py-px text-[11px] font-semibold text-primary-900">Join</span>
        : <span className="flex-none rounded-full bg-embargo-100 px-2 py-px text-[11px] font-semibold text-embargo-800">New</span>;
}

function EmailState({ verified }: { verified: boolean }) {
    return verified ? (
        <span className="flex items-center gap-1 text-[13px] text-success-500">
            <MaterialSymbol icon="check_circle" size={16} weight={400} grade={-25} fill />
            verified
        </span>
    ) : (
        <span className="flex items-center gap-1 text-[13px] text-embargo-800">
            <MaterialSymbol icon="cancel" size={16} weight={400} grade={-25} fill />
            unverified
        </span>
    );
}

function ClosedOutcome({ request }: { request: AdminTenancyRequest }) {
    const outcome = closedOutcome(request);
    return (
        <span className={`text-[13px] font-semibold ${outcome.tone === "approved" ? "text-success-500" : "text-danger-700"}`}>{outcome.text}</span>
    );
}

function RowMenu({ name, onDecline }: { name: string; onDecline(): void }) {
    const { ref, isComponentVisible, setIsComponentVisible } = useComponentVisible(false);
    return (
        <div ref={ref} className="relative">
            <button
                type="button"
                aria-label={`More actions for ${name}`}
                aria-expanded={isComponentVisible}
                onClick={() => setIsComponentVisible(!isComponentVisible)}
                className="flex h-8 w-8 items-center justify-center rounded-md border border-primary-300 bg-primary-0 text-primary-700 hover:bg-primary-100"
            >
                <MaterialSymbol icon="more_horiz" size={18} weight={400} grade={-25} />
            </button>
            {isComponentVisible && (
                <div role="menu" className="absolute right-0 z-10 mt-1 w-40 rounded-md border border-primary-200 bg-primary-0 py-1 shadow-lg">
                    <button
                        type="button"
                        role="menuitem"
                        onClick={() => {
                            setIsComponentVisible(false);
                            onDecline();
                        }}
                        className="block w-full px-3 py-2 text-left text-[13px] font-semibold text-danger-700 hover:bg-primary-100"
                    >
                        Decline…
                    </button>
                </div>
            )}
        </div>
    );
}
```

- [ ] **Step 4: Write `components/Admin/Requests/RecentlyClosed.tsx`**

```tsx
import Link from "next/link";
import { ADMIN_COPY } from "../../../contants/AdminConstants";
import { ROUTE_PAGE_ADMIN_ACTIVITY } from "../../../contants/InternalRoutesConstants";
import { useRecentlyClosed } from "../../../hooks/UseAdmin";
import { closedOutcome, closedTenancyName } from "../../../lib/adminDisplay";
import { formatShortDate } from "../../../lib/embargoDisplay";
import { AdminTenancyRequest } from "../../../types/GatekeeperAPI";

export function RecentlyClosed() {
    const { data, error } = useRecentlyClosed();

    return (
        <section className="mt-10" aria-labelledby="recently-closed">
            <div className="flex items-center justify-between">
                <h3 id="recently-closed" className="m-0 text-[11px] font-semibold uppercase tracking-[0.08em] text-primary-500">{ADMIN_COPY.recentlyClosed}</h3>
                <Link href={ROUTE_PAGE_ADMIN_ACTIVITY} className="text-[13px] font-semibold text-primary-900">{ADMIN_COPY.activityLink}</Link>
            </div>
            {error ? (
                <p className="m-0 mt-3 text-[13px] text-danger-700">{ADMIN_COPY.recentlyClosedLoadError}</p>
            ) : !data ? (
                <p role="status" className="m-0 mt-3 text-[13px] text-primary-500">Loading…</p>
            ) : data.items.length === 0 ? (
                <p className="m-0 mt-3 text-[13px] text-primary-500">{ADMIN_COPY.closedEmpty}</p>
            ) : (
                <ul className="m-0 mt-2 list-none p-0">
                    {data.items.map((request) => <ClosedRow key={request.id} request={request} />)}
                </ul>
            )}
        </section>
    );
}

function ClosedRow({ request }: { request: AdminTenancyRequest }) {
    const outcome = closedOutcome(request);
    return (
        <li className="flex items-center justify-between gap-4 border-t border-primary-100 py-2.5 text-[13px]">
            <span className="min-w-0 truncate text-primary-700">
                <span className="font-semibold text-primary-900">{request.requester.name}</span>
                {` · ${closedTenancyName(request)} · `}
                <span className={outcome.tone === "approved" ? "text-success-500" : "text-danger-700"}>{outcome.text}</span>
            </span>
            <span className="flex-none text-xs text-primary-500">
                {`by ${request.decided_by?.name ?? "an administrator"} · ${request.decided_at ? formatShortDate(request.decided_at, false) : ""}`}
            </span>
        </li>
    );
}
```

- [ ] **Step 5: Write `components/Admin/Requests/RequestsView.tsx`**

```tsx
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { MaterialSymbol } from "react-material-symbols";
import { ADMIN_COPY, ADMIN_SEARCH_DEBOUNCE_MS, RequestFilter } from "../../../contants/AdminConstants";
import { revalidateAdminRequests, revalidateAdminTenancies, useAdminCounts, useAdminRequests } from "../../../hooks/UseAdmin";
import { useDebouncedValue } from "../../../hooks/UseDebouncedValue";
import { AdminRequestsQuery } from "../../../lib/adminKeys";
import { AdminTenancyRequest, GatekeeperPage, TenancyRequestCounts } from "../../../types/GatekeeperAPI";
import { AdminLoadError } from "../AdminLoadError";
import { AdminPageHeader } from "../AdminPageHeader";
import { DeclineRequestDialog } from "./DeclineRequestDialog";
import { RecentlyClosed } from "./RecentlyClosed";
import { RequestsTable } from "./RequestsTable";
import { ReviewRequestDialog } from "./ReviewRequestDialog";

const FILTERS: { value: RequestFilter; label: string; count(counts: TenancyRequestCounts): number }[] = [
    { value: "open", label: "Open", count: (counts) => counts.open },
    { value: "join", label: "Join existing", count: (counts) => counts.join },
    { value: "new", label: "New tenancy", count: (counts) => counts.new },
    { value: "closed", label: "Closed", count: (counts) => counts.closed },
];

const STATE_BOX = "m-0 mt-4 rounded-lg border border-primary-200 bg-primary-0 px-4 py-10 text-center text-sm text-primary-500";

export function queryFor(filter: RequestFilter, q: string, offset: number): AdminRequestsQuery {
    if (filter === "closed") {
        return { status: "closed", q, offset };
    }
    return { status: "open", ...(filter === "open" ? {} : { kind: filter }), q, offset };
}

export function RequestsView({ now }: { now?: Date }) {
    const router = useRouter();
    const today = now ?? new Date();
    const [filter, setFilter] = useState<RequestFilter>("open");
    const [search, setSearch] = useState("");
    const [offset, setOffset] = useState(0);
    const [declining, setDeclining] = useState<AdminTenancyRequest | null>(null);
    const q = useDebouncedValue(search.trim(), ADMIN_SEARCH_DEBOUNCE_MS);
    const { data: counts } = useAdminCounts();
    const { data: page, error, mutate } = useAdminRequests(queryFor(filter, q, offset));
    const reviewing = typeof router.query.request === "string" ? router.query.request : null;
    const closed = filter === "closed";

    useEffect(() => {
        setOffset(0);
    }, [q]);

    function setReviewing(requestId: string | null) {
        const query = { ...router.query };
        delete query.request;
        router.replace({ pathname: router.pathname, query: requestId ? { ...query, request: requestId } : query }, undefined, { shallow: true });
    }

    function chooseFilter(value: RequestFilter) {
        setFilter(value);
        setOffset(0);
    }

    function approved() {
        setReviewing(null);
        revalidateAdminRequests();
        revalidateAdminTenancies();
    }

    function startDecline(request: AdminTenancyRequest) {
        if (reviewing) {
            setReviewing(null);
        }
        setDeclining(request);
    }

    function declined() {
        setDeclining(null);
        revalidateAdminRequests();
    }

    return (
        <div className="w-full">
            <AdminPageHeader
                title={ADMIN_COPY.requestsTitle}
                subtitle={counts ? `${counts.open} open · ${counts.join} for existing tenancies, ${counts.new} for new ones` : undefined}
            />
            <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
                <div role="group" aria-label="Filter requests" className="flex flex-wrap gap-2">
                    {FILTERS.map((option) => {
                        const active = filter === option.value;
                        return (
                            <button
                                key={option.value}
                                type="button"
                                aria-pressed={active}
                                onClick={() => chooseFilter(option.value)}
                                className={`flex h-8 items-center gap-1.5 rounded-full px-3 text-[13px] font-medium ${active
                                    ? "bg-primary-900 text-primary-50"
                                    : "border border-primary-300 bg-primary-0 text-primary-700 hover:bg-primary-100"
                                    }`}
                            >
                                {option.label}
                                {counts && <>{" "}<span className={active ? "text-primary-300" : "text-primary-500"}>{option.count(counts)}</span></>}
                            </button>
                        );
                    })}
                </div>
                <div className="relative w-[300px]">
                    <MaterialSymbol icon="search" size={18} weight={400} grade={-25} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-primary-500" />
                    <input
                        type="search"
                        aria-label="Search requests"
                        placeholder={ADMIN_COPY.searchPlaceholder}
                        value={search}
                        onChange={(event) => setSearch(event.target.value)}
                        className="h-9 py-0 pl-9"
                    />
                </div>
            </div>

            <RequestsBody
                page={page}
                error={error}
                closed={closed}
                q={q}
                now={today}
                onRetry={() => mutate()}
                onReview={(request) => setReviewing(request.id)}
                onDecline={startDecline}
            />
            {page && page.total_count > page.limit && <Pager page={page} onOffset={setOffset} />}

            <RecentlyClosed />

            {reviewing && (
                <ReviewRequestDialog requestId={reviewing} now={today} onClose={() => setReviewing(null)} onApproved={approved} onDecline={startDecline} />
            )}
            {declining && <DeclineRequestDialog request={declining} onCancel={() => setDeclining(null)} onDeclined={declined} />}
        </div>
    );
}

interface BodyProps {
    page?: GatekeeperPage<AdminTenancyRequest>
    error?: unknown
    closed: boolean
    q: string
    now: Date
    onRetry(): void
    onReview(request: AdminTenancyRequest): void
    onDecline(request: AdminTenancyRequest): void
}

function RequestsBody({ page, error, closed, q, now, onRetry, onReview, onDecline }: BodyProps) {
    if (error) {
        return <div className="mt-4"><AdminLoadError message={ADMIN_COPY.requestsLoadError} onRetry={onRetry} /></div>;
    }
    if (!page) {
        return <p role="status" className={STATE_BOX}>Loading requests…</p>;
    }
    if (page.items.length === 0) {
        const text = q ? `No requests match “${q}”.` : closed ? ADMIN_COPY.closedEmpty : ADMIN_COPY.requestsEmpty;
        return <p className={STATE_BOX}>{text}</p>;
    }
    return <RequestsTable requests={page.items} closed={closed} now={now} onReview={onReview} onDecline={onDecline} />;
}

function Pager({ page, onOffset }: { page: GatekeeperPage<AdminTenancyRequest>; onOffset(offset: number): void }) {
    const to = page.offset + page.items.length;
    return (
        <div className="mt-3 flex items-center justify-end gap-3 text-[13px] text-primary-500">
            <span>{`${page.offset + 1}–${to} of ${page.total_count}`}</span>
            <button type="button" disabled={page.offset === 0} onClick={() => onOffset(Math.max(0, page.offset - page.limit))} className="btn-primary-outline btn-small m-0">Previous</button>
            <button type="button" disabled={to >= page.total_count} onClick={() => onOffset(page.offset + page.limit)} className="btn-primary-outline btn-small m-0">Next</button>
        </div>
    );
}
```

- [ ] **Step 6: Write the page `pages/app/admin/requests.tsx`**

```tsx
import { AdminLayout } from "../../../components/Admin/AdminLayout";
import { RequestsView } from "../../../components/Admin/Requests/RequestsView";

export default function AdminRequestsPage() {
    return (
        <AdminLayout>
            <RequestsView />
        </AdminLayout>
    );
}

AdminRequestsPage.auth = {
    role: "admin",
    admin: true,
    loading: <div>loading...</div>,
};
```

- [ ] **Step 7: Run them**

Run: `npx jest --coverage=false components/Admin/Requests contants/__tests__/TelemetryConstants.test.ts`
Expected: PASS — `RequestsTable` 4, `RecentlyClosed` 4, `RequestsView` 10, with `DeclineRequestDialog` and `ReviewRequestDialog` still green; the telemetry page walk passes with `/app/admin/requests`.

- [ ] **Step 8: Commit**

```bash
pwd
command git branch --show-current
command git add components/Admin/Requests pages/app/admin/requests.tsx
command git commit -m "feat: the Requests tab: queue, filters, search, review and decline

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 16: The tenancy dialogs: new tenancy, add a member, remove a member

**Files:**
- Create: `components/Admin/Tenancies/NewTenancyDialog.tsx`, `components/Admin/Tenancies/AddMemberDialog.tsx`, `components/Admin/Tenancies/RemoveMemberDialog.tsx`
- Test: `components/Admin/Tenancies/__tests__/NewTenancyDialog.test.tsx`, `components/Admin/Tenancies/__tests__/AddMemberDialog.test.tsx`, `components/Admin/Tenancies/__tests__/RemoveMemberDialog.test.tsx`

**Interfaces:** Consumes `AdminDialog`, `BFFAPI.createTenancy`, `BFFAPI.addTenancyMember`, `BFFAPI.removeTenancyMember`, `useAdminUserSearch`, `useRemovalImpact`, `useDebouncedValue`, `PersonInitial`, `slugifyNamespace`, `adminErrorFrom`, `adminErrorMessage`, B's `firstNameOf` (`lib/tenancySelection.ts`), `plural`, `formatShortDate`, B's `PRODUCTION_PREFIX`, `NAMESPACE_*`, `DISPLAY_NAME_MAX_LENGTH`. Produces:
- `NewTenancyDialog({ onCancel, onCreated }: { onCancel(): void; onCreated(tenancy: AdminTenancy): void })` — Display name, Namespace (follows the display name until edited), preview `datamap/production/{namespace}`, **Cancel** / **Create**; no Environment field;
- `AddMemberDialog({ tenancy, onCancel, onAdded }: { tenancy: AdminTenancy; onCancel(): void; onAdded(): void })` — "Add to {tenancy}", search "Name, email or ORCID", pick one, "{first name} is emailed.", **Cancel** / **Add**; no role;
- `RemoveMemberDialog({ tenancy, member, onCancel, onRemoved }: { tenancy: AdminTenancy; member: TenancyMember; onCancel(): void; onRemoved(): void })` and `removalBullets(impact: RemovalImpact): string[]`.

- [ ] **Step 1: Write the failing tests**

Create `components/Admin/Tenancies/__tests__/NewTenancyDialog.test.tsx`:

```tsx
/** @jest-environment jsdom */
import { describe, expect, jest, test } from "@jest/globals";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";

const mockCreate = jest.fn() as any;

jest.mock("../../../../gateways/BFFAPI", () => ({
    BFFAPI: jest.fn().mockImplementation(() => ({ createTenancy: mockCreate })),
}));

import { NewTenancyDialog } from "../NewTenancyDialog";

function renderDialog() {
    const onCancel = jest.fn();
    const onCreated = jest.fn();
    render(<NewTenancyDialog onCancel={onCancel} onCreated={onCreated} />);
    return { onCancel, onCreated };
}

function value(label: string) {
    return (screen.getByLabelText(label) as HTMLInputElement).value;
}

describe("NewTenancyDialog", () => {
    test("the namespace follows the display name, and the path is previewed", async () => {
        renderDialog();

        expect(screen.getByRole("dialog", { name: "New tenancy" })).toBeTruthy();
        expect(screen.queryByLabelText("Environment")).toBeNull();
        fireEvent.change(screen.getByLabelText("Display name"), { target: { value: "Cerrado Flux" } });

        await waitFor(() => expect(value("Namespace")).toBe("cerrado-flux"));
        expect(screen.getByText("datamap/production/cerrado-flux")).toBeTruthy();
    });

    test("a namespace typed by hand stays when the display name changes", async () => {
        renderDialog();

        fireEvent.change(screen.getByLabelText("Namespace"), { target: { value: "cflux" } });
        fireEvent.change(screen.getByLabelText("Display name"), { target: { value: "Cerrado Flux" } });

        await waitFor(() => expect(value("Display name")).toBe("Cerrado Flux"));
        expect(value("Namespace")).toBe("cflux");
    });

    test("Create sends the trimmed name and hands back the tenancy", async () => {
        const created = { path: "datamap/production/cerrado-flux", display_name: "Cerrado Flux" };
        mockCreate.mockResolvedValue(created);
        const { onCreated } = renderDialog();

        fireEvent.change(screen.getByLabelText("Display name"), { target: { value: "  Cerrado Flux " } });
        await waitFor(() => expect(value("Namespace")).toBe("cerrado-flux"));
        fireEvent.click(screen.getByRole("button", { name: "Create" }));

        await waitFor(() => expect(onCreated).toHaveBeenCalledWith(created));
        expect(mockCreate).toHaveBeenCalledWith({ displayName: "Cerrado Flux", namespace: "cerrado-flux" });
    });

    test("public is not a namespace", async () => {
        renderDialog();

        fireEvent.change(screen.getByLabelText("Display name"), { target: { value: "Public" } });
        fireEvent.click(screen.getByRole("button", { name: "Create" }));

        expect(await screen.findByText("Use 2 to 63 lower-case letters, digits or hyphens, and not “public”.")).toBeTruthy();
        expect(mockCreate).not.toHaveBeenCalled();
    });

    test("an existing namespace is reported", async () => {
        mockCreate.mockRejectedValue({ response: { status: 409, data: { detail: "tenancy_exists" } } });
        const { onCreated } = renderDialog();

        fireEvent.change(screen.getByLabelText("Display name"), { target: { value: "ATTO" } });
        await waitFor(() => expect(value("Namespace")).toBe("atto"));
        fireEvent.click(screen.getByRole("button", { name: "Create" }));

        expect(await screen.findByText("A tenancy with this namespace already exists.")).toBeTruthy();
        expect(onCreated).not.toHaveBeenCalled();
    });
});
```

Create `components/Admin/Tenancies/__tests__/AddMemberDialog.test.tsx`:

```tsx
/** @jest-environment jsdom */
import { beforeEach, describe, expect, jest, test } from "@jest/globals";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";

const mockAdd = jest.fn() as any;
const mockSearches: string[] = [];
let mockHits: { data?: unknown, error?: unknown } = {};

jest.mock("../../../../gateways/BFFAPI", () => ({
    BFFAPI: jest.fn().mockImplementation(() => ({ addTenancyMember: mockAdd })),
}));
jest.mock("../../../../hooks/UseDebouncedValue", () => ({ useDebouncedValue: (value: unknown) => value }));
jest.mock("../../../../hooks/UseAdmin", () => ({
    useAdminUserSearch: (q: string) => {
        mockSearches.push(q);
        return mockHits;
    },
}));

import { adminTenancy } from "../../../../fake-data/adminFixtures";
import { AddMemberDialog } from "../AddMemberDialog";

const FERNANDA = { id: "0c1d2e3f-4a5b-4c6d-8e7f-9a0b1c2d3e4f", name: "Fernanda Lima", email: "fernanda.lima@inpe.br" };

function renderDialog() {
    const onCancel = jest.fn();
    const onAdded = jest.fn();
    render(<AddMemberDialog tenancy={adminTenancy()} onCancel={onCancel} onAdded={onAdded} />);
    return { onCancel, onAdded };
}

function search(value: string) {
    fireEvent.change(screen.getByPlaceholderText("Name, email or ORCID"), { target: { value } });
}

beforeEach(() => {
    mockSearches.length = 0;
    mockHits = {};
});

describe("AddMemberDialog", () => {
    test("asks for at least two characters, and Add waits for a pick", () => {
        renderDialog();

        expect(screen.getByRole("dialog", { name: "Add to Data Amazon" })).toBeTruthy();
        expect(screen.getByText("Type at least 2 characters of a name, email or ORCID iD.")).toBeTruthy();
        expect((screen.getByRole("button", { name: "Add" }) as HTMLButtonElement).disabled).toBe(true);
    });

    test("finds people, says who is emailed, and adds the one picked", async () => {
        mockHits = { data: [FERNANDA] };
        mockAdd.mockResolvedValue({ id: FERNANDA.id });
        const { onAdded } = renderDialog();

        search(" fer ");
        fireEvent.click(screen.getByRole("radio", { name: /Fernanda Lima/ }));

        expect(mockSearches[mockSearches.length - 1]).toBe("fer");
        expect(screen.getByText("Fernanda is emailed.")).toBeTruthy();
        fireEvent.click(screen.getByRole("button", { name: "Add" }));

        await waitFor(() => expect(onAdded).toHaveBeenCalled());
        expect(mockAdd).toHaveBeenCalledWith("datamap/production/data-amazon", FERNANDA.id);
    });

    test("says when nobody matches", () => {
        mockHits = { data: [] };
        renderDialog();

        search("zzz");

        expect(screen.getByText("No account matches “zzz”.")).toBeTruthy();
    });

    test("says when the search failed", () => {
        mockHits = { error: { status: 500 } };
        renderDialog();

        search("fer");

        expect(screen.getByText("People could not be searched.")).toBeTruthy();
    });

    test("someone already in the tenancy is reported", async () => {
        mockHits = { data: [FERNANDA] };
        mockAdd.mockRejectedValue({ response: { status: 409, data: { detail: "already_member" } } });
        const { onAdded } = renderDialog();

        search("fer");
        fireEvent.click(screen.getByRole("radio", { name: /Fernanda Lima/ }));
        fireEvent.click(screen.getByRole("button", { name: "Add" }));

        expect(await screen.findByText("They are already a member of this tenancy.")).toBeTruthy();
        expect(onAdded).not.toHaveBeenCalled();
    });
});
```

Create `components/Admin/Tenancies/__tests__/RemoveMemberDialog.test.tsx`:

```tsx
/** @jest-environment jsdom */
import { describe, expect, jest, test } from "@jest/globals";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";

const mockRemove = jest.fn() as any;
let mockImpact: { data?: unknown, error?: unknown } = {};

jest.mock("../../../../gateways/BFFAPI", () => ({
    BFFAPI: jest.fn().mockImplementation(() => ({ removeTenancyMember: mockRemove })),
}));
jest.mock("../../../../hooks/UseAdmin", () => ({ useRemovalImpact: () => mockImpact }));

import { adminTenancy, tenancyMember } from "../../../../fake-data/adminFixtures";
import { RemoveMemberDialog } from "../RemoveMemberDialog";

const IMPACT = { member_since: "2026-09-30T09:41:00+00:00", datasets_in_tenancy: 108, shared_with_user: 1, owned_by_user: 2 };

function renderDialog() {
    const onCancel = jest.fn();
    const onRemoved = jest.fn();
    render(<RemoveMemberDialog tenancy={adminTenancy()} member={tenancyMember()} onCancel={onCancel} onRemoved={onRemoved} />);
    return { onCancel, onRemoved };
}

describe("RemoveMemberDialog", () => {
    test("lists what changes before the red Remove", () => {
        mockImpact = { data: IMPACT };

        renderDialog();

        expect(screen.getByRole("dialog", { name: "Remove from Data Amazon?" })).toBeTruthy();
        expect(screen.getByText("Luciana Rizzo · member since Sep 30, 2026")).toBeTruthy();
        expect(screen.getByText("Loses access to the 108 datasets of the tenancy")).toBeTruthy();
        expect(screen.getByText("Keeps 1 dataset shared explicitly")).toBeTruthy();
        expect(screen.getByText("Still owns 2 datasets of the tenancy")).toBeTruthy();
        expect(screen.getByText("Stays in public")).toBeTruthy();
        expect(screen.getByRole("button", { name: "Remove" }).className).toContain("bg-danger-700");
    });

    test("leaves out what does not apply", () => {
        mockImpact = { data: { ...IMPACT, shared_with_user: 0, owned_by_user: 0 } };

        renderDialog();

        expect(screen.queryByText(/shared explicitly/)).toBeNull();
        expect(screen.queryByText(/Still owns/)).toBeNull();
        expect(screen.getByText("Stays in public")).toBeTruthy();
    });

    test("waits for the impact before Remove can be pressed", () => {
        mockImpact = {};

        renderDialog();

        expect(screen.getByText("Checking what changes…")).toBeTruthy();
        expect((screen.getByRole("button", { name: "Remove" }) as HTMLButtonElement).disabled).toBe(true);
    });

    test("removes the member", async () => {
        mockImpact = { data: IMPACT };
        mockRemove.mockResolvedValue(undefined);
        const { onRemoved } = renderDialog();

        fireEvent.click(screen.getByRole("button", { name: "Remove" }));

        await waitFor(() => expect(onRemoved).toHaveBeenCalled());
        expect(mockRemove).toHaveBeenCalledWith("datamap/production/data-amazon", "1b2c3d4e-5f60-4a7b-8c9d-0e1f2a3b4c5d");
    });

    test("a refusal is shown and the dialog stays", async () => {
        mockImpact = { data: IMPACT };
        mockRemove.mockRejectedValue({ response: { status: 404, data: { detail: "member_not_found" } } });
        const { onRemoved } = renderDialog();

        fireEvent.click(screen.getByRole("button", { name: "Remove" }));

        expect(await screen.findByText("This person is no longer a member.")).toBeTruthy();
        expect(onRemoved).not.toHaveBeenCalled();
    });
});
```

- [ ] **Step 2: Run them**

Run: `npx jest --coverage=false components/Admin/Tenancies/__tests__`
Expected: FAIL — `Cannot find module '../NewTenancyDialog'`, `'../AddMemberDialog'`, `'../RemoveMemberDialog'`.

- [ ] **Step 3: Write `components/Admin/Tenancies/NewTenancyDialog.tsx`**

```tsx
import { useFormik } from "formik";
import { useState } from "react";
import * as Yup from "yup";
import { adminErrorFrom, adminErrorMessage, slugifyNamespace } from "../../../contants/AdminConstants";
import {
    DISPLAY_NAME_MAX_LENGTH,
    NAMESPACE_MAX_LENGTH,
    NAMESPACE_MIN_LENGTH,
    NAMESPACE_PATTERN,
    PRODUCTION_PREFIX,
} from "../../../contants/TenancyConstants";
import { BFFAPI } from "../../../gateways/BFFAPI";
import { AdminTenancy } from "../../../types/GatekeeperAPI";
import { AdminDialog } from "../AdminDialog";

interface Props {
    onCancel(): void
    onCreated(tenancy: AdminTenancy): void
}

const FIELD_ERROR = "m-0 mt-1.5 text-[13px] text-danger-700";
const NAMESPACE_ERROR = adminErrorMessage("namespace_invalid");
const DISPLAY_NAME_ERROR = adminErrorMessage("display_name_invalid");

const schema = Yup.object({
    displayName: Yup.string().trim().required(DISPLAY_NAME_ERROR).max(DISPLAY_NAME_MAX_LENGTH, DISPLAY_NAME_ERROR),
    namespace: Yup.string()
        .required(NAMESPACE_ERROR)
        .min(NAMESPACE_MIN_LENGTH, NAMESPACE_ERROR)
        .max(NAMESPACE_MAX_LENGTH, NAMESPACE_ERROR)
        .matches(NAMESPACE_PATTERN, NAMESPACE_ERROR)
        .notOneOf(["public"], NAMESPACE_ERROR),
});

export function NewTenancyDialog({ onCancel, onCreated }: Props) {
    const [error, setError] = useState<string | null>(null);
    const [namespaceEdited, setNamespaceEdited] = useState(false);
    const formik = useFormik({
        initialValues: { displayName: "", namespace: "" },
        validationSchema: schema,
        onSubmit: async (values) => {
            setError(null);
            try {
                onCreated(await new BFFAPI().createTenancy({ displayName: values.displayName.trim(), namespace: values.namespace }));
            } catch (e) {
                setError(adminErrorFrom(e));
            }
        },
    });
    const shown = (field: "displayName" | "namespace") => (formik.touched[field] || formik.submitCount > 0) && formik.errors[field];

    return (
        <AdminDialog
            title="New tenancy"
            widthClassName="max-w-[440px]"
            onClose={onCancel}
            primary={{ label: "Create", disabled: formik.isSubmitting, onClick: () => { formik.submitForm(); } }}
        >
            <form onSubmit={formik.handleSubmit} className="flex flex-col gap-4" noValidate>
                <div>
                    <label htmlFor="new-tenancy-display-name" className="mb-1.5 text-[13px]">Display name</label>
                    <input
                        id="new-tenancy-display-name"
                        name="displayName"
                        value={formik.values.displayName}
                        onChange={(event) => {
                            formik.setFieldValue("displayName", event.target.value);
                            if (!namespaceEdited) {
                                formik.setFieldValue("namespace", slugifyNamespace(event.target.value));
                            }
                        }}
                        onBlur={formik.handleBlur}
                    />
                    {shown("displayName") && <p role="alert" className={FIELD_ERROR}>{formik.errors.displayName}</p>}
                </div>
                <div>
                    <label htmlFor="new-tenancy-namespace" className="mb-1.5 text-[13px]">Namespace</label>
                    <input
                        id="new-tenancy-namespace"
                        name="namespace"
                        className="font-mono"
                        value={formik.values.namespace}
                        onChange={(event) => {
                            setNamespaceEdited(true);
                            formik.setFieldValue("namespace", event.target.value);
                        }}
                        onBlur={formik.handleBlur}
                    />
                    {shown("namespace") && <p role="alert" className={FIELD_ERROR}>{formik.errors.namespace}</p>}
                </div>
                <p className="m-0 font-mono text-xs text-primary-500">{`${PRODUCTION_PREFIX}${formik.values.namespace}`}</p>
                {error && <p role="alert" className="m-0 text-sm text-danger-700">{error}</p>}
            </form>
        </AdminDialog>
    );
}
```

- [ ] **Step 4: Write `components/Admin/Tenancies/AddMemberDialog.tsx`**

```tsx
import { useFormik } from "formik";
import { useState } from "react";
import { MaterialSymbol } from "react-material-symbols";
import * as Yup from "yup";
import { ADMIN_COPY, ADMIN_SEARCH_DEBOUNCE_MS, ADMIN_USER_SEARCH_MIN_LENGTH, adminErrorFrom } from "../../../contants/AdminConstants";
import { BFFAPI } from "../../../gateways/BFFAPI";
import { useAdminUserSearch } from "../../../hooks/UseAdmin";
import { useDebouncedValue } from "../../../hooks/UseDebouncedValue";
import { firstNameOf } from "../../../lib/tenancySelection";
import { AdminTenancy, AdminUserHit } from "../../../types/GatekeeperAPI";
import { PersonInitial } from "../../Share/PersonInitial";
import { AdminDialog } from "../AdminDialog";

interface Props {
    tenancy: AdminTenancy
    onCancel(): void
    onAdded(): void
}

const HINT = "m-0 text-[13px] text-primary-500";

export function AddMemberDialog({ tenancy, onCancel, onAdded }: Props) {
    const [search, setSearch] = useState("");
    const [picked, setPicked] = useState<AdminUserHit | null>(null);
    const [error, setError] = useState<string | null>(null);
    const q = useDebouncedValue(search.trim(), ADMIN_SEARCH_DEBOUNCE_MS);
    const { data: hits, error: searchError } = useAdminUserSearch(q);
    const formik = useFormik({
        initialValues: { userId: "" },
        validationSchema: Yup.object({ userId: Yup.string().required("Pick the person to add.") }),
        onSubmit: async ({ userId }) => {
            setError(null);
            try {
                await new BFFAPI().addTenancyMember(tenancy.path, userId);
                onAdded();
            } catch (e) {
                setError(adminErrorFrom(e));
            }
        },
    });

    function pick(hit: AdminUserHit) {
        setPicked(hit);
        formik.setFieldValue("userId", hit.id);
    }

    return (
        <AdminDialog
            title={`Add to ${tenancy.display_name}`}
            widthClassName="max-w-[440px]"
            onClose={onCancel}
            primary={{ label: "Add", disabled: !picked || formik.isSubmitting, onClick: () => { formik.submitForm(); } }}
        >
            <form onSubmit={formik.handleSubmit} className="flex flex-col gap-4" noValidate>
                <div className="relative">
                    <MaterialSymbol icon="search" size={18} weight={400} grade={-25} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-primary-500" />
                    <input
                        type="search"
                        aria-label="Search people"
                        placeholder={ADMIN_COPY.searchPlaceholder}
                        value={search}
                        onChange={(event) => setSearch(event.target.value)}
                        className="h-9 py-0 pl-9"
                    />
                </div>
                {q.length < ADMIN_USER_SEARCH_MIN_LENGTH ? (
                    <p className={HINT}>{ADMIN_COPY.searchHint}</p>
                ) : searchError ? (
                    <p className="m-0 text-[13px] text-danger-700">{ADMIN_COPY.searchError}</p>
                ) : !hits ? (
                    <p role="status" className={HINT}>Searching…</p>
                ) : hits.length === 0 ? (
                    <p className={HINT}>{`No account matches “${q}”.`}</p>
                ) : (
                    <fieldset className="m-0 flex flex-col gap-1 border-0 p-0">
                        <legend className="sr-only">People</legend>
                        {hits.map((hit) => (
                            <label key={hit.id} className={`m-0 flex cursor-pointer items-center gap-3 rounded-md px-2.5 py-2 font-normal ${picked?.id === hit.id ? "bg-secondary-500" : "hover:bg-primary-100"}`}>
                                <input type="radio" name="userId" checked={picked?.id === hit.id} onChange={() => pick(hit)} className="h-3.5 w-3.5 p-0 accent-primary-900" />
                                <PersonInitial name={hit.name} />
                                <span className="min-w-0">
                                    <span className="block truncate text-[13px] font-semibold text-primary-900">{hit.name}</span>
                                    <span className="block truncate text-xs text-primary-500">{hit.email ?? "No email"}</span>
                                </span>
                            </label>
                        ))}
                    </fieldset>
                )}
                {picked && (
                    <p className="m-0 flex items-center gap-2 rounded-md bg-primary-100 px-3 py-2.5 text-[13px] text-primary-700">
                        <MaterialSymbol icon="mail" size={18} weight={400} grade={-25} />
                        <span>{`${firstNameOf(picked.name)} is emailed.`}</span>
                    </p>
                )}
                {error && <p role="alert" className="m-0 text-sm text-danger-700">{error}</p>}
            </form>
        </AdminDialog>
    );
}
```

- [ ] **Step 5: Write `components/Admin/Tenancies/RemoveMemberDialog.tsx`**

```tsx
import { useState } from "react";
import { ADMIN_COPY, adminErrorFrom } from "../../../contants/AdminConstants";
import { BFFAPI } from "../../../gateways/BFFAPI";
import { useRemovalImpact } from "../../../hooks/UseAdmin";
import { plural } from "../../../lib/adminDisplay";
import { formatShortDate } from "../../../lib/embargoDisplay";
import { AdminTenancy, RemovalImpact, TenancyMember } from "../../../types/GatekeeperAPI";
import { AdminDialog } from "../AdminDialog";

interface Props {
    tenancy: AdminTenancy
    member: TenancyMember
    onCancel(): void
    onRemoved(): void
}

export function removalBullets(impact: RemovalImpact): string[] {
    const datasets = (n: number) => `${n} ${plural(n, "dataset", "datasets")}`;
    return [
        `Loses access to the ${datasets(impact.datasets_in_tenancy)} of the tenancy`,
        ...(impact.shared_with_user > 0 ? [`Keeps ${datasets(impact.shared_with_user)} shared explicitly`] : []),
        ...(impact.owned_by_user > 0 ? [`Still owns ${datasets(impact.owned_by_user)} of the tenancy`] : []),
        ADMIN_COPY.staysInPublic,
    ];
}

export function RemoveMemberDialog({ tenancy, member, onCancel, onRemoved }: Props) {
    const { data: impact, error: impactError } = useRemovalImpact(tenancy.path, member.id);
    const [error, setError] = useState<string | null>(null);
    const [busy, setBusy] = useState(false);

    async function remove() {
        setBusy(true);
        setError(null);
        try {
            await new BFFAPI().removeTenancyMember(tenancy.path, member.id);
            onRemoved();
        } catch (e) {
            setError(adminErrorFrom(e));
            setBusy(false);
        }
    }

    return (
        <AdminDialog
            title={`Remove from ${tenancy.display_name}?`}
            subtitle={`${member.name} · member since ${formatShortDate(impact?.member_since ?? member.since)}`}
            widthClassName="max-w-[440px]"
            onClose={onCancel}
            primary={{ label: "Remove", destructive: true, disabled: busy || (!impact && !impactError), onClick: remove }}
        >
            {impactError ? (
                <p className="m-0 text-[13px] text-primary-500">{ADMIN_COPY.impactLoadError}</p>
            ) : !impact ? (
                <p role="status" className="m-0 text-[13px] text-primary-500">Checking what changes…</p>
            ) : (
                <ul className="m-0 flex list-none flex-col gap-2.5 p-0 text-sm leading-[21px] text-primary-700">
                    {removalBullets(impact).map((line) => (
                        <li key={line} className="flex gap-2.5"><span className="text-primary-400">—</span><span>{line}</span></li>
                    ))}
                </ul>
            )}
            {error && <p role="alert" className="m-0 text-sm text-danger-700">{error}</p>}
        </AdminDialog>
    );
}
```

- [ ] **Step 6: Run them**

Run: `npx jest --coverage=false components/Admin/Tenancies/__tests__`
Expected: PASS, 5 + 5 + 5 tests.

- [ ] **Step 7: Commit**

```bash
pwd
command git branch --show-current
command git add components/Admin/Tenancies
command git commit -m "feat: create a tenancy, add a member and remove one, from the admin area

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 17: The Tenancies tab

**Files:**
- Create: `components/Admin/Tenancies/TenancyList.tsx`, `components/Admin/Tenancies/TenancyMembersPanel.tsx`, `components/Admin/Tenancies/TenanciesView.tsx`
- Create: `pages/app/admin/tenancies.tsx`
- Test: `components/Admin/Tenancies/__tests__/TenancyList.test.tsx`, `components/Admin/Tenancies/__tests__/TenancyMembersPanel.test.tsx`, `components/Admin/Tenancies/__tests__/TenanciesView.test.tsx`

**Interfaces:** Consumes `useAdminTenancies`, `useTenancyMembers`, `revalidateAdminTenancies` (Task 9), `BFFAPI.withdrawTenancyInvitationAsAdmin`, B's `TenancyIcon`, `PersonInitial`, `AdminPageHeader`, `AdminLoadError`, Task 16's dialogs. Produces:
- `TenancyList({ tenancies, selectedPath, onSelect })` — public first with a `lock` and no chevron, production by display name (the gatekeeper's order), then the **Legacy · staging** group; each row icon, name, path, members, datasets; no environment pill;
- `TenancyMembersPanel({ tenancy })` — public: "Everyone · {n} accounts" and no list; otherwise "Members · {n}", **+ Add** (not for legacy or disabled), members with initials, name, email, "invited by {name}", a remove button (not for legacy or disabled), pending invitations below with the dashed icon, the invitee's name and email, "Invited by {inviter} {date} · not accepted yet" and **Withdraw**, "Show {n} more" by 50; loading, empty and error states. Invitations carry no dataset (PR A removed it; members invite from the workspace Members page), so the admin design spec's 1j "from “{dataset}”" is not drawn. A **Withdraw** answered `404 invitation_not_found` (answered meanwhile, or closed by **+ Add** or an approval) shows the sentence and revalidates the list, so the row leaves;
- `TenanciesView()` and `defaultTenancy(tenancies)` — header, list, panel, **+ New tenancy**; `?tenancy={path}` selects, a click sets it; without it the first production tenancy that is not public is selected;
- the page `/app/admin/tenancies`.

- [ ] **Step 1: Write the failing tests**

Create `components/Admin/Tenancies/__tests__/TenancyList.test.tsx`:

```tsx
/** @jest-environment jsdom */
import { describe, expect, jest, test } from "@jest/globals";
import { fireEvent, render, screen } from "@testing-library/react";
import { ADMIN_TENANCIES } from "../../../../fake-data/adminFixtures";
import { TenancyList } from "../TenancyList";

function rowFor(path: string) {
    return screen.getByRole("button", { name: new RegExp(path.replace(/\//g, "\\/")) });
}

describe("TenancyList", () => {
    test("public first, production next, then the legacy group", () => {
        render(<TenancyList tenancies={ADMIN_TENANCIES} selectedPath={null} onSelect={jest.fn()} />);

        const rows = screen.getAllByRole("listitem").map((item) => item.textContent ?? "");
        expect(rows[0]).toContain("datamap/production/public");
        expect(rows[1]).toContain("datamap/production/atto");
        expect(rows[2]).toContain("datamap/production/data-amazon");
        expect(rows[3]).toBe("Legacy · staging");
        expect(rows[4]).toContain("datamap/staging/data-amazon");
        expect(screen.queryByText("production")).toBeNull();
    });

    test("each row shows members and datasets; public is locked, the others open", () => {
        render(<TenancyList tenancies={ADMIN_TENANCIES} selectedPath={null} onSelect={jest.fn()} />);

        const amazon = rowFor("datamap/production/data-amazon");
        expect(amazon.textContent).toContain("14members");
        expect(amazon.textContent).toContain("108datasets");
        expect(amazon.textContent).toContain("chevron_right");
        const publicRow = rowFor("datamap/production/public");
        expect(publicRow.textContent).toContain("lock");
        expect(publicRow.textContent).not.toContain("chevron_right");
    });

    test("a click selects; the selected row is marked", () => {
        const onSelect = jest.fn();
        render(<TenancyList tenancies={ADMIN_TENANCIES} selectedPath="datamap/production/atto" onSelect={onSelect} />);

        expect(rowFor("datamap/production/atto").getAttribute("aria-current")).toBe("true");
        fireEvent.click(rowFor("datamap/production/data-amazon"));
        expect(onSelect).toHaveBeenCalledWith("datamap/production/data-amazon");
    });
});
```

Create `components/Admin/Tenancies/__tests__/TenancyMembersPanel.test.tsx`:

```tsx
/** @jest-environment jsdom */
import { beforeEach, describe, expect, jest, test } from "@jest/globals";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";

const mockWithdraw = jest.fn() as any;
const mockSetSize = jest.fn();
const mockMutate = jest.fn() as any;
const mockRevalidateTenancies = jest.fn();
const mockPaths: unknown[] = [];
let mockMembers: { data?: unknown, error?: unknown };

jest.mock("../../../../gateways/BFFAPI", () => ({
    BFFAPI: jest.fn().mockImplementation(() => ({ withdrawTenancyInvitationAsAdmin: mockWithdraw })),
}));
jest.mock("../../../../hooks/UseAdmin", () => ({
    useTenancyMembers: (path: unknown) => {
        mockPaths.push(path);
        return { ...mockMembers, size: 1, setSize: mockSetSize, mutate: mockMutate, isValidating: false };
    },
    revalidateAdminTenancies: () => mockRevalidateTenancies(),
}));
jest.mock("../AddMemberDialog", () => {
    const React = require("react");
    return {
        AddMemberDialog: (props: any) => React.createElement("div", null,
            `adding to ${props.tenancy.display_name}`,
            React.createElement("button", { onClick: props.onAdded }, "stub added")),
    };
});
jest.mock("../RemoveMemberDialog", () => {
    const React = require("react");
    return { RemoveMemberDialog: (props: any) => React.createElement("div", null, `removing ${props.member.name}`) };
});

import { ADMIN_TENANCIES, adminTenancy, tenancyInvitation, tenancyMember } from "../../../../fake-data/adminFixtures";
import { TenancyMembersPanel } from "../TenancyMembersPanel";

function membersPage(items: unknown[], total = items.length, invitations: unknown[] = []) {
    return [{ members: { items, total_count: total, limit: 50, offset: 0 }, invitations }];
}

beforeEach(() => {
    mockPaths.length = 0;
    mockMutate.mockResolvedValue(undefined);
    mockMembers = {
        data: membersPage(
            [tenancyMember(), tenancyMember({ id: "m2", name: "Marcia Yamasoe", email: "marcia@usp.br", invited_by: { id: "l1", name: "Luciana Rizzo" } })],
            2,
            [tenancyInvitation()],
        ),
    };
});

describe("TenancyMembersPanel", () => {
    test("public has no member list, only how many accounts are in it", () => {
        render(<TenancyMembersPanel tenancy={ADMIN_TENANCIES[0]} />);

        expect(screen.getByText("Everyone · 47 accounts")).toBeTruthy();
        expect(screen.queryByText("+ Add")).toBeNull();
        expect(mockPaths).toEqual([null]);
    });

    test("says the members are loading", () => {
        mockMembers = {};

        render(<TenancyMembersPanel tenancy={adminTenancy()} />);

        expect(screen.getByText("Loading members…")).toBeTruthy();
        expect(mockPaths).toEqual(["datamap/production/data-amazon"]);
    });

    test("says when the members could not load, and retries", () => {
        mockMembers = { error: { status: 500 } };

        render(<TenancyMembersPanel tenancy={adminTenancy()} />);
        fireEvent.click(screen.getByRole("button", { name: "Try again" }));

        expect(screen.getByText("Members could not be loaded.")).toBeTruthy();
        expect(mockMutate).toHaveBeenCalled();
    });

    test("an empty tenancy", () => {
        mockMembers = { data: membersPage([], 0) };

        render(<TenancyMembersPanel tenancy={adminTenancy({ members: 0 })} />);

        expect(screen.getByText("No members yet.")).toBeTruthy();
        expect(screen.getByText("Members · 0")).toBeTruthy();
    });

    test("members with their email, who invited them, and the pending invitations", () => {
        render(<TenancyMembersPanel tenancy={adminTenancy()} />);

        expect(screen.getByText("Members · 2")).toBeTruthy();
        expect(screen.getByText("luciana.rizzo@usp.br")).toBeTruthy();
        expect(screen.getByText("invited by Luciana Rizzo")).toBeTruthy();
        expect(screen.getByRole("button", { name: "Remove Marcia Yamasoe" })).toBeTruthy();
        expect(screen.getByText("Rafael Souza")).toBeTruthy();
        expect(screen.getByText("rafael.souza@usp.br")).toBeTruthy();
        expect(screen.getByText("Invited by Luciana Rizzo Oct 2 · not accepted yet")).toBeTruthy();
        expect(screen.queryByText(/Show \d+ more/)).toBeNull();
    });

    test("a legacy tenancy is read-only", () => {
        mockMembers = { data: membersPage([tenancyMember()], 1) };

        render(<TenancyMembersPanel tenancy={ADMIN_TENANCIES[3]} />);

        expect(screen.getByText("Luciana Rizzo")).toBeTruthy();
        expect(screen.queryByText("+ Add")).toBeNull();
        expect(screen.queryByRole("button", { name: /^Remove/ })).toBeNull();
    });

    test("more than 50 members load 50 more at a time", () => {
        mockMembers = { data: membersPage(Array.from({ length: 50 }, (_, i) => tenancyMember({ id: `m${i}`, name: `Member ${i}` })), 120) };

        render(<TenancyMembersPanel tenancy={adminTenancy({ members: 120 })} />);
        fireEvent.click(screen.getByRole("button", { name: "Show 50 more" }));

        expect(mockSetSize).toHaveBeenCalledWith(2);
    });

    test("Withdraw takes the invitation back and refreshes the list", async () => {
        mockWithdraw.mockResolvedValue(undefined);

        render(<TenancyMembersPanel tenancy={adminTenancy()} />);
        fireEvent.click(screen.getByRole("button", { name: "Withdraw" }));

        await waitFor(() => expect(mockMutate).toHaveBeenCalled());
        expect(mockWithdraw).toHaveBeenCalledWith("2c3d4e5f-6a7b-4c8d-9e0f-1a2b3c4d5e6f");
    });

    test("an invitation answered or closed meanwhile says so and leaves the list", async () => {
        mockMutate.mockClear();
        mockWithdraw.mockRejectedValue({ response: { status: 404, data: { detail: "invitation_not_found" } } });

        render(<TenancyMembersPanel tenancy={adminTenancy()} />);
        fireEvent.click(screen.getByRole("button", { name: "Withdraw" }));

        expect(await screen.findByText("This invitation was already answered or withdrawn.")).toBeTruthy();
        expect(mockMutate).toHaveBeenCalled();
    });

    test("+ Add and remove open their dialogs; a change refreshes members and the tenancy list", () => {
        render(<TenancyMembersPanel tenancy={adminTenancy()} />);

        fireEvent.click(screen.getByRole("button", { name: "Remove Luciana Rizzo" }));
        expect(screen.getByText("removing Luciana Rizzo")).toBeTruthy();

        fireEvent.click(screen.getByRole("button", { name: "+ Add" }));
        expect(screen.getByText("adding to Data Amazon")).toBeTruthy();
        fireEvent.click(screen.getByRole("button", { name: "stub added" }));

        expect(mockMutate).toHaveBeenCalled();
        expect(mockRevalidateTenancies).toHaveBeenCalled();
        expect(screen.queryByText("adding to Data Amazon")).toBeNull();
    });
});
```

Create `components/Admin/Tenancies/__tests__/TenanciesView.test.tsx`:

```tsx
/** @jest-environment jsdom */
import { beforeEach, describe, expect, jest, test } from "@jest/globals";
import { fireEvent, render, screen } from "@testing-library/react";

const mockReplace = jest.fn();
const mockRetry = jest.fn();
const mockRevalidateTenancies = jest.fn();
let mockRouter: { pathname: string, query: Record<string, string>, replace: typeof mockReplace };
let mockTenancies: { data?: unknown, error?: unknown, mutate: typeof mockRetry };

jest.mock("next/router", () => ({ useRouter: () => mockRouter }));
jest.mock("../../../../hooks/UseAdmin", () => ({
    useAdminTenancies: () => mockTenancies,
    revalidateAdminTenancies: () => mockRevalidateTenancies(),
}));
jest.mock("../TenancyMembersPanel", () => {
    const React = require("react");
    return { TenancyMembersPanel: (props: any) => React.createElement("div", null, `panel ${props.tenancy.path}`) };
});
jest.mock("../NewTenancyDialog", () => {
    const React = require("react");
    return {
        NewTenancyDialog: (props: any) => React.createElement("button", {
            onClick: () => props.onCreated({ path: "datamap/production/cerrado-flux" }),
        }, "stub create"),
    };
});

import { ADMIN_TENANCIES } from "../../../../fake-data/adminFixtures";
import { TenanciesView } from "../TenanciesView";

beforeEach(() => {
    mockRouter = { pathname: "/app/admin/tenancies", query: {}, replace: mockReplace };
    mockTenancies = { data: ADMIN_TENANCIES, mutate: mockRetry };
});

describe("TenanciesView", () => {
    test("says the tenancies are loading", () => {
        mockTenancies = { mutate: mockRetry };

        render(<TenanciesView />);

        expect(screen.getByText("Loading tenancies…")).toBeTruthy();
    });

    test("says when the tenancies could not load, and retries", () => {
        mockTenancies = { error: { status: 500 }, mutate: mockRetry };

        render(<TenanciesView />);
        fireEvent.click(screen.getByRole("button", { name: "Try again" }));

        expect(screen.getByText("Tenancies could not be loaded.")).toBeTruthy();
        expect(mockRetry).toHaveBeenCalled();
    });

    test("the header, the list, and the first production tenancy selected", () => {
        render(<TenanciesView />);

        expect(screen.getByRole("heading", { name: "Tenancies" })).toBeTruthy();
        expect(screen.getByText((_, element) => element?.tagName === "P" && element.textContent === "4 tenancies · root datamap · everyone is in public")).toBeTruthy();
        expect(screen.getByRole("button", { name: "+ New tenancy" })).toBeTruthy();
        expect(screen.getByText("panel datamap/production/atto")).toBeTruthy();
    });

    test("?tenancy= selects that tenancy", () => {
        mockRouter.query = { tenancy: "datamap/production/public" };

        render(<TenanciesView />);

        expect(screen.getByText("panel datamap/production/public")).toBeTruthy();
    });

    test("a click puts the tenancy in the URL", () => {
        render(<TenanciesView />);

        fireEvent.click(screen.getByRole("button", { name: /datamap\/production\/data-amazon/ }));

        expect(mockReplace).toHaveBeenCalledWith(
            { pathname: "/app/admin/tenancies", query: { tenancy: "datamap/production/data-amazon" } },
            undefined,
            { shallow: true },
        );
    });

    test("a new tenancy refreshes the list and is selected", () => {
        render(<TenanciesView />);

        fireEvent.click(screen.getByRole("button", { name: "+ New tenancy" }));
        fireEvent.click(screen.getByRole("button", { name: "stub create" }));

        expect(mockRevalidateTenancies).toHaveBeenCalled();
        expect(mockReplace).toHaveBeenCalledWith(
            { pathname: "/app/admin/tenancies", query: { tenancy: "datamap/production/cerrado-flux" } },
            undefined,
            { shallow: true },
        );
        expect(screen.queryByRole("button", { name: "stub create" })).toBeNull();
    });
});
```

- [ ] **Step 2: Run them**

Run: `npx jest --coverage=false components/Admin/Tenancies/__tests__/TenancyList.test.tsx components/Admin/Tenancies/__tests__/TenancyMembersPanel.test.tsx components/Admin/Tenancies/__tests__/TenanciesView.test.tsx`
Expected: FAIL — `Cannot find module '../TenancyList'`, `'../TenancyMembersPanel'`, `'../TenanciesView'`.

- [ ] **Step 3: Write `components/Admin/Tenancies/TenancyList.tsx`**

```tsx
import { MaterialSymbol } from "react-material-symbols";
import { ADMIN_COPY } from "../../../contants/AdminConstants";
import { AdminTenancy } from "../../../types/GatekeeperAPI";
import { TenancyIcon } from "../../Tenancy/TenancyIcon";

interface Props {
    tenancies: AdminTenancy[]
    selectedPath: string | null
    onSelect(path: string): void
}

export function TenancyList({ tenancies, selectedPath, onSelect }: Props) {
    const current = tenancies.filter((tenancy) => !tenancy.is_legacy);
    const legacy = tenancies.filter((tenancy) => tenancy.is_legacy);

    return (
        <ul className="m-0 list-none overflow-hidden rounded-lg border border-primary-200 bg-primary-0 p-0">
            {current.map((tenancy) => (
                <TenancyRow key={tenancy.path} tenancy={tenancy} selected={tenancy.path === selectedPath} onSelect={onSelect} />
            ))}
            {legacy.length > 0 && (
                <li className="border-t border-primary-200 bg-primary-50 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.08em] text-primary-500">{ADMIN_COPY.legacyGroup}</li>
            )}
            {legacy.map((tenancy) => (
                <TenancyRow key={tenancy.path} tenancy={tenancy} selected={tenancy.path === selectedPath} onSelect={onSelect} />
            ))}
        </ul>
    );
}

function TenancyRow({ tenancy, selected, onSelect }: { tenancy: AdminTenancy; selected: boolean; onSelect(path: string): void }) {
    return (
        <li className="border-t border-primary-100 first:border-t-0">
            <button
                type="button"
                aria-current={selected ? "true" : undefined}
                onClick={() => onSelect(tenancy.path)}
                className={`flex w-full items-center gap-4 px-4 py-3 text-left ${selected ? "bg-primary-50" : "hover:bg-primary-50"}`}
            >
                <TenancyIcon tenancy={tenancy} />
                <span className="flex min-w-0 flex-1 flex-col">
                    <span className="flex items-center gap-2 truncate text-sm font-semibold text-primary-900">
                        {tenancy.display_name}
                        {!tenancy.is_enabled && <span className="rounded-full bg-primary-200 px-2 py-px text-[11px] font-semibold text-primary-700">Disabled</span>}
                    </span>
                    <span className="truncate font-mono text-xs text-primary-500">{tenancy.path}</span>
                </span>
                <Count value={tenancy.members} label="members" />
                <Count value={tenancy.datasets} label="datasets" />
                <MaterialSymbol icon={tenancy.is_default ? "lock" : "chevron_right"} size={20} weight={400} grade={-25} className="text-primary-400" />
            </button>
        </li>
    );
}

function Count({ value, label }: { value: number; label: string }) {
    return (
        <span className="flex w-16 flex-none flex-col items-end">
            <span className="text-sm font-semibold text-primary-900">{value}</span>
            <span className="text-[11px] text-primary-500">{label}</span>
        </span>
    );
}
```

- [ ] **Step 4: Write `components/Admin/Tenancies/TenancyMembersPanel.tsx`**

```tsx
import { useState } from "react";
import { MaterialSymbol } from "react-material-symbols";
import { ADMIN_COPY, ADMIN_PAGE_SIZE, adminErrorFrom } from "../../../contants/AdminConstants";
import { BFFAPI } from "../../../gateways/BFFAPI";
import { revalidateAdminTenancies, useTenancyMembers } from "../../../hooks/UseAdmin";
import { formatShortDate } from "../../../lib/embargoDisplay";
import { AdminTenancy, AdminTenancyInvitation, TenancyMember, TenancyMembers } from "../../../types/GatekeeperAPI";
import { PersonInitial } from "../../Share/PersonInitial";
import { AdminLoadError } from "../AdminLoadError";
import { AddMemberDialog } from "./AddMemberDialog";
import { RemoveMemberDialog } from "./RemoveMemberDialog";

const STATE = "m-0 px-4 pb-4 text-[13px] text-primary-500";
const ROW = "flex items-center gap-3 border-t border-primary-100 px-4 py-2.5";

export function TenancyMembersPanel({ tenancy }: { tenancy: AdminTenancy }) {
    const listed = !tenancy.is_default;
    const manageable = listed && !tenancy.is_legacy && tenancy.is_enabled;
    const { data, error, size, setSize, mutate, isValidating } = useTenancyMembers(listed ? tenancy.path : null);
    const [adding, setAdding] = useState(false);
    const [removing, setRemoving] = useState<TenancyMember | null>(null);
    const [actionError, setActionError] = useState<string | null>(null);

    const pages: TenancyMembers[] = data ?? [];
    const members = pages.flatMap((page) => page.members.items);
    const invitations = pages[0]?.invitations ?? [];
    const total = pages[0]?.members.total_count ?? 0;
    const remaining = Math.min(ADMIN_PAGE_SIZE, total - members.length);

    function changed() {
        setAdding(false);
        setRemoving(null);
        mutate();
        revalidateAdminTenancies();
    }

    async function withdraw(invitation: AdminTenancyInvitation) {
        setActionError(null);
        try {
            await new BFFAPI().withdrawTenancyInvitationAsAdmin(invitation.id);
            await mutate();
        } catch (e) {
            setActionError(adminErrorFrom(e));
            if ((e as { response?: { data?: { detail?: unknown } } })?.response?.data?.detail === "invitation_not_found") {
                await mutate();
            }
        }
    }

    return (
        <aside aria-label={`Members of ${tenancy.display_name}`} className="rounded-lg border border-primary-200 bg-primary-0">
            <div className="border-b border-primary-200 px-4 py-3.5">
                <p className="m-0 text-sm font-semibold text-primary-900">{tenancy.display_name}</p>
                <p className="m-0 font-mono text-xs text-primary-500">{tenancy.path}</p>
            </div>

            {!listed ? (
                <p className="m-0 px-4 py-4 text-[13px] text-primary-700">{`Everyone · ${tenancy.members} accounts`}</p>
            ) : (
                <>
                    <div className="flex items-center justify-between px-4 pt-3.5 pb-2">
                        <span className="text-[13px] font-semibold text-primary-900">{`Members · ${data ? total : "…"}`}</span>
                        {manageable && (
                            <button type="button" onClick={() => setAdding(true)} className="text-[13px] font-semibold text-primary-900 hover:text-primary-600">+ Add</button>
                        )}
                    </div>
                    {error ? (
                        <div className="px-4 pb-4"><AdminLoadError message={ADMIN_COPY.membersLoadError} onRetry={() => mutate()} /></div>
                    ) : !data ? (
                        <p role="status" className={STATE}>Loading members…</p>
                    ) : members.length === 0 && invitations.length === 0 ? (
                        <p className={STATE}>{ADMIN_COPY.membersEmpty}</p>
                    ) : (
                        <>
                            <ul className="m-0 list-none p-0">
                                {members.map((member) => (
                                    <li key={member.id} className={ROW}>
                                        <PersonInitial name={member.name} />
                                        <div className="min-w-0 flex-1">
                                            <p className="m-0 truncate text-[13px] font-semibold text-primary-900">{member.name}</p>
                                            <p className="m-0 truncate text-xs text-primary-500">{member.email ?? "No email"}</p>
                                            {member.invited_by && <p className="m-0 truncate text-xs text-primary-500">{`invited by ${member.invited_by.name}`}</p>}
                                        </div>
                                        {manageable && (
                                            <button
                                                type="button"
                                                aria-label={`Remove ${member.name}`}
                                                onClick={() => setRemoving(member)}
                                                className="flex h-7 w-7 flex-none items-center justify-center rounded-md text-primary-400 hover:bg-primary-100 hover:text-primary-900"
                                            >
                                                <MaterialSymbol icon="close" size={18} weight={400} grade={-25} />
                                            </button>
                                        )}
                                    </li>
                                ))}
                                {invitations.map((invitation) => (
                                    <li key={invitation.id} className={ROW}>
                                        <PersonInitial pendingIcon="mail" />
                                        <div className="min-w-0 flex-1">
                                            <p className="m-0 truncate text-[13px] font-semibold text-primary-900">{invitation.user.name}</p>
                                            {invitation.user.email && <p className="m-0 truncate text-xs text-primary-500">{invitation.user.email}</p>}
                                            <p className="m-0 truncate text-xs text-primary-500">
                                                {`Invited by ${invitation.invited_by?.name ?? "a member"} ${formatShortDate(invitation.created_at, false)} · not accepted yet`}
                                            </p>
                                        </div>
                                        <button type="button" onClick={() => withdraw(invitation)} className="flex-none text-[13px] font-semibold text-danger-700 hover:text-danger-800">Withdraw</button>
                                    </li>
                                ))}
                            </ul>
                            {remaining > 0 && (
                                <button
                                    type="button"
                                    disabled={isValidating}
                                    onClick={() => setSize(size + 1)}
                                    className="block w-full border-t border-primary-100 px-4 py-2.5 text-left text-[13px] font-semibold text-primary-900 hover:bg-primary-50"
                                >
                                    {`Show ${remaining} more`}
                                </button>
                            )}
                        </>
                    )}
                    {actionError && <p role="alert" className="m-0 px-4 pb-3 text-[13px] text-danger-700">{actionError}</p>}
                </>
            )}

            {adding && <AddMemberDialog tenancy={tenancy} onCancel={() => setAdding(false)} onAdded={changed} />}
            {removing && <RemoveMemberDialog tenancy={tenancy} member={removing} onCancel={() => setRemoving(null)} onRemoved={changed} />}
        </aside>
    );
}
```

- [ ] **Step 5: Write `components/Admin/Tenancies/TenanciesView.tsx`**

```tsx
import { useRouter } from "next/router";
import { useState } from "react";
import { ADMIN_COPY } from "../../../contants/AdminConstants";
import { revalidateAdminTenancies, useAdminTenancies } from "../../../hooks/UseAdmin";
import { AdminTenancy } from "../../../types/GatekeeperAPI";
import { AdminLoadError } from "../AdminLoadError";
import { AdminPageHeader } from "../AdminPageHeader";
import { NewTenancyDialog } from "./NewTenancyDialog";
import { TenancyList } from "./TenancyList";
import { TenancyMembersPanel } from "./TenancyMembersPanel";

const STATE_BOX = "m-0 rounded-lg border border-primary-200 bg-primary-0 px-4 py-10 text-center text-sm text-primary-500";

export function defaultTenancy(tenancies: AdminTenancy[]): AdminTenancy | null {
    return tenancies.find((tenancy) => !tenancy.is_default && !tenancy.is_legacy) ?? tenancies[0] ?? null;
}

export function TenanciesView() {
    const router = useRouter();
    const { data: tenancies, error, mutate } = useAdminTenancies();
    const [creating, setCreating] = useState(false);
    const requested = typeof router.query.tenancy === "string" ? router.query.tenancy : null;
    const selected = tenancies ? tenancies.find((tenancy) => tenancy.path === requested) ?? defaultTenancy(tenancies) : null;

    function select(path: string) {
        router.replace({ pathname: router.pathname, query: { ...router.query, tenancy: path } }, undefined, { shallow: true });
    }

    function created(tenancy: AdminTenancy) {
        setCreating(false);
        revalidateAdminTenancies();
        select(tenancy.path);
    }

    return (
        <div className="w-full">
            <AdminPageHeader
                title={ADMIN_COPY.tenanciesTitle}
                subtitle={tenancies ? (
                    <>
                        {`${tenancies.length} tenancies · root `}<code className="font-mono text-[14px]">datamap</code>{" · everyone is in "}<code className="font-mono text-[14px]">public</code>
                    </>
                ) : undefined}
                action={<button type="button" className="btn-primary m-0" onClick={() => setCreating(true)}>+ New tenancy</button>}
            />
            <div className="mt-8">
                {error ? (
                    <AdminLoadError message={ADMIN_COPY.tenanciesLoadError} onRetry={() => mutate()} />
                ) : !tenancies ? (
                    <p role="status" className={STATE_BOX}>Loading tenancies…</p>
                ) : tenancies.length === 0 ? (
                    <p className={STATE_BOX}>{ADMIN_COPY.tenanciesEmpty}</p>
                ) : (
                    <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-[minmax(0,1fr)_300px]">
                        <TenancyList tenancies={tenancies} selectedPath={selected?.path ?? null} onSelect={select} />
                        {selected && <TenancyMembersPanel key={selected.path} tenancy={selected} />}
                    </div>
                )}
            </div>
            {creating && <NewTenancyDialog onCancel={() => setCreating(false)} onCreated={created} />}
        </div>
    );
}
```

- [ ] **Step 6: Write the page `pages/app/admin/tenancies.tsx`**

```tsx
import { AdminLayout } from "../../../components/Admin/AdminLayout";
import { TenanciesView } from "../../../components/Admin/Tenancies/TenanciesView";

export default function AdminTenanciesPage() {
    return (
        <AdminLayout>
            <TenanciesView />
        </AdminLayout>
    );
}

AdminTenanciesPage.auth = {
    role: "admin",
    admin: true,
    loading: <div>loading...</div>,
};
```

- [ ] **Step 7: Run them**

Run: `npx jest --coverage=false components/Admin/Tenancies contants/__tests__/TelemetryConstants.test.ts`
Expected: PASS — `TenancyList` 3, `TenancyMembersPanel` 10, `TenanciesView` 6, Task 16's three suites still green; the page walk passes with `/app/admin/tenancies`.

- [ ] **Step 8: Commit**

```bash
pwd
command git branch --show-current
command git add components/Admin/Tenancies pages/app/admin/tenancies.tsx
command git commit -m "feat: the Tenancies tab: list, members, invitations and new tenancies

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 18: Verify

**Files:** none changed (a fix goes in its own commit, with its own failing test first).

- [ ] **Step 1: Unit tests and types**

From the worktree: `npx jest --coverage=false 2>&1 | grep -E "^(Test Suites|Tests):"`
Expected: `Test Suites: {BASE_SUITES + 26} passed` and `Tests: {BASE_TESTS + 181} passed` (PR B as shipped in #113: 139 / 1118 → **165 / 1299**). The 26 new suites and their tests: `RequireSessionAdmin` 5, `adminChain` 8, `admin` 15, `AdminConstants` 5, `adminDisplay` 5, `adminRequestRoutes` 14, `adminTenancyRoutes` 11, `BFFAPI.admin` 8, `adminKeys` 8, `UseAdmin` 8, `AdminDialog` 6, `AdminParts` 4, `AdminNavItem` 5, `LoggedLayoutAdmin` 2, `AdminTabs` 3, `DeclineRequestDialog` 7, `ReviewRequestDialog` 13, `RequestsTable` 4, `RecentlyClosed` 4, `RequestsView` 10, `NewTenancyDialog` 5, `AddMemberDialog` 5, `RemoveMemberDialog` 5, `TenancyList` 3, `TenancyMembersPanel` 10, `TenanciesView` 6 (= 179), plus 1 in `TelemetryConstants` and 1 in `UseRowActions` (amendment C7). A route test answering `401` means a mocked token lost `v: TOKEN_VERSION`; one answering `404` means it lost `admin: true`.

Then: `npx tsc --noEmit -p .`
Expected: no output.

- [ ] **Step 2: Build**

Run: `npm run build`
Expected: exit code 0; the route list shows the pages `/app/admin`, `/app/admin/activity`, `/app/admin/requests`, `/app/admin/tenancies`, `/app/admin/users` and the API routes `/api/admin/tenancy-requests`, `/api/admin/tenancy-requests/counts`, `/api/admin/tenancy-requests/[requestId]`, `/api/admin/tenancy-requests/[requestId]/approve`, `/api/admin/tenancy-requests/[requestId]/decline`, `/api/admin/tenancies`, `/api/admin/tenancies/members`, `/api/admin/tenancies/members/[userId]`, `/api/admin/tenancy-invitations/[invitationId]`, `/api/admin/users`.

- [ ] **Step 3: Start the gatekeeper with PR A, and Mailpit**

PR A (`ardc-brazil/gatekeeper#145`) is merged: use a gatekeeper checkout of `main` at or after `32af272` (the worktree `/Users/caio.maia/workspace/datamap/gatekeeper/.claude/worktrees/rfc-009-e2e` is one). Check with `/opt/homebrew/bin/git -C <checkout> log --oneline -3`. The commands are the ones PR B's Task 24 uses:

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

Expected: nothing else on 5433 before `up`; the loop ends on `200` within three minutes (if not, `dc logs gatekeeper` first: a failed migration keeps the container unhealthy); the seed inserts the clients, the `data-amazon` tenancies and the Casbin policies. Mailpit at `http://localhost:8025`.

```bash
KEY=5060b1a2-9aaf-48db-871a-0839007fd478
SECRET=integration-test-not-a-real-secret
GK=http://localhost:9094/api/v1
psqlgk() { docker exec datamap_postgres_test_integration psql -U gk_admin -d gatekeeper_db -c "$1"; }
dispatch() { curl -s -X POST -H "X-Api-Key: $KEY" -H "X-Api-Secret: $SECRET" $GK/internal/notifications/dispatch; echo; }
```

In the worktree's `.env.local` (git-ignored, never committed) set `DATAMAP_BASE_URL=http://localhost:9094/api/v1`, `DATAMAP_API_KEY=$KEY`, `DATAMAP_API_SECRET=$SECRET`, then `npm run dev` from the worktree.

Create four accounts from the sign-up tab of `/account/login` (codes in Mailpit): Ana Souza `ana@example.org`, Bruno Lima `bruno@example.org`, Carla Dias `carla@example.org`, Eva Rocha `eva@example.org`; export their ids as `ANA`, `BRUNO`, `CARLA`, `EVA` from `psqlgk "SELECT id, email FROM users WHERE email LIKE '%@example.org' ORDER BY created_at;"`.

Make Carla the admin. Auto mode refuses grants from an agent, so hand this line to the owner to run:

```bash
psqlgk "INSERT INTO casbin_rule (ptype, v0, v1) VALUES ('g', '$CARLA', 'admin');"
```

Wait 6 s (Casbin reloads every 5 s), then sign Carla out and in (or keep her signed in: the next `update()` picks it up).

- [ ] **Step 4: Manual end-to-end checklist**

A separate browser profile (or private window) per account.

1. **Hidden from everyone else.** As Bruno: no divider or **Admin** under Profile; `/app/admin`, `/app/admin/requests` and `/app/admin/tenancies` show "404 - Page Not Found"; DevTools → Network shows no `/api/admin/...` request on any page. With Bruno's `next-auth.session-token` cookie: `curl -s -w " %{http_code}\n" -b "next-auth.session-token=<value>" http://localhost:3000/api/admin/tenancy-requests/counts` → `{"detail":"not_found"} 404`. Without a cookie → `401`.
2. **The entry and the shell.** As Carla: `await (await fetch('/api/auth/session')).json()` → `user.admin: true`. The sidebar has a divider after Profile and **Admin** (`admin_panel_settings`); no badge while nothing is open. `/app/admin` lands on `/app/admin/requests`; the item is filled and highlighted; the header shows **Requests · Users · Tenancies · Activity** with Requests underlined and the avatar on the right; the sidebar footer reads "All tenancies" (back on `/app/home` it reads the selected tenancy). Collapsing the sidebar leaves the icon with the tooltip "Admin". **Users** reads "Users" / "Coming soon. Until then, add and remove people from Tenancies."; **Activity** reads "Activity" / "Coming soon: every admin action, who and when.".
3. **Badge refresh.** Keep Carla on `/app/home`. As Bruno send a request for "Data Amazon" (avatar menu → "Request access to a tenancy"). Within 60 s, without reloading, Carla's sidebar shows a black **1**; switching tabs and back refreshes it at once. `dispatch` → "Tenancy request from Bruno Lima" in Mailpit, whose **Review request** link is `http://localhost:3000/app/admin/requests?request=<id>`.
4. **The queue.** As Eva send a request for "Cerrado Flux". On Carla's Requests: "2 open · 1 for existing tenancies, 1 for new ones"; pills **Open 2**, **Join existing 1**, **New tenancy 1**, **Closed 0**. Bruno's row: initials, name, email, **Join** pill, "Data Amazon", his reason, today's date, "today", "verified". Eva's: **New** pill, "Cerrado Flux". Age Bruno's request with `psqlgk "UPDATE tenancy_requests SET created_at = now() - interval '6 days' WHERE user_id = '$BRUNO' AND status = 'pending';"` → after a reload "6 days waiting" in amber. Search `bruno`, `eva@example`, and an ORCID iD connected to one of them (if none, skip ORCID) → one row each; `zzz` → "No requests match “zzz”.". Each pill filters; **Closed** reads "No closed requests yet.".
5. **Deep link.** Open the Mailpit link from case 3 in Carla's browser → the review dialog for Bruno's request is open; ✕ → the URL loses `?request=`. `/app/admin/requests?request=00000000-0000-4000-8000-000000000000` → "This request no longer exists.".
6. **Approve a join.** **Review** on Bruno → "Join Data Amazon", "Bruno Lima · bruno@example.org · requested 6 days ago", the picker on Data Amazon (Public and legacy tenancies are not offered), "datamap/production/data-amazon · {n} members", the reason in quotes, "Currently in datamap/production/public", "Bruno is emailed either way.", no role cards. **Approve** → the row leaves, the badge drops, *Recently closed* shows "Bruno Lima · Data Amazon · Approved" and "by Carla Dias · {today}". `dispatch` → "You now have access to Data Amazon" to Bruno.
7. **Unverified email blocks a new tenancy.** `psqlgk "UPDATE users SET email_verified_at = NULL WHERE id = '$EVA';"`, reload, **Review** Eva → "New tenancy: Cerrado Flux", the switch on **New tenancy**, Display name "Cerrado Flux", Namespace "cerrado-flux", "datamap/production/cerrado-flux · requester becomes a member", the amber "Email not verified. A new tenancy can't be created for an unverified account." and a grey, disabled **Create and approve**. Its row in the queue reads "unverified". Restore: `psqlgk "UPDATE users SET email_verified_at = now() WHERE id = '$EVA';"`.
8. **Create and approve.** Reload, **Review** Eva, change the namespace to `public` → the namespace error, nothing sent; set it back to `cerrado-flux` → **Create and approve** → *Recently closed* "Eva Rocha · Cerrado Flux · Approved · new tenancy"; Tenancies lists **Cerrado Flux** with 1 member.
9. **Two admins, one decision.** As Bruno request "ATTO". Open his review in two Carla tabs; **Approve** in the first, then in the second → "Another administrator already decided this request." and the dialog stays.
10. **Decline.** As Ana request "LBA Legacy". Row menu (`more_horiz`) → **Decline…** → "Decline request?", "Ana Souza · new tenancy LBA Legacy", "Message to Ana" (optional), the placeholder, "— Stays in public · can request again", red **Decline**. Type a message → **Decline** → *Recently closed* "Ana Souza · LBA Legacy · Declined" in red. `dispatch` → "Your request for LBA Legacy" with the message. Repeat with a new request from Ana, this time through **Review** → **Decline…**, with no message → the email has no quoted message.
11. **Tenancies.** `/app/admin/tenancies`: "{n} tenancies · root `datamap` · everyone is in `public`"; **Public** first with a lock and no chevron, then Cerrado Flux and Data Amazon (by name), then, if the seed has any `datamap/staging/*`, the **Legacy · staging** group; no environment pills. Without a parameter the first production tenancy other than Public is selected. Click **Public** → the URL gets `?tenancy=datamap%2Fproduction%2Fpublic` and the panel reads "Everyone · {n} accounts" with no list and no **+ Add**. Reload → still selected. Open Data Amazon: "Members · {n}", Bruno listed with his email.
12. **Add a member.** On Cerrado Flux **+ Add** → "Add to Cerrado Flux"; typing one letter keeps the hint; `ana` → Ana Souza; pick her → "Ana is emailed." → **Add** → she is listed; `dispatch` → "You now have access to Cerrado Flux". Add her again → "They are already a member of this tenancy.".
13. **Remove a member.** As Ana (now in Cerrado Flux) create one dataset there (the app's new-dataset form, in Cerrado Flux; stop before the upload if MinIO has no bucket — the dataset row is enough). As Carla, the `close` button on Ana → "Remove from Cerrado Flux?", "Ana Souza · member since {today}", "— Loses access to the {n} datasets of the tenancy", "— Still owns 1 dataset of the tenancy", "— Stays in public", red **Remove** → she leaves the list. No email is sent (`dispatch` sends nothing new for her).
14. **Pending invitation.** As Bruno (member of Data Amazon), sidebar → **Members** → **+ Invite** → `eva@example.org` → **Send invitation** (PR B). As Carla on Data Amazon: Eva below the members with the dashed icon, `eva@example.org`, "Invited by Bruno Lima {date} · not accepted yet" and red **Withdraw**, and nothing about a dataset → **Withdraw** → gone; Eva's home and Bruno's Members page no longer show it. Have Bruno invite her again, then as Carla **+ Add** Eva to Data Amazon → she is listed as a member and her pending row is gone (PR A withdraws it); Eva's home shows no invitation. With a stale tab still showing a pending row, **Withdraw** → "This invitation was already answered or withdrawn." and the row leaves. The email "Open tenancy" link of the admin notice (`/app/admin/tenancies?tenancy=datamap/production/data-amazon`) opens with Data Amazon selected.
15. **Legacy is read-only.** If the seed has a `datamap/staging/*` tenancy, select it: members listed, no **+ Add**, no remove buttons, no invitations. If not, `psqlgk "INSERT INTO tenancies (name, is_enabled) VALUES ('datamap/staging/data-amazon', true) ON CONFLICT DO NOTHING;"` and reload.
16. **New tenancy.** **+ New tenancy** → "New tenancy" with Display name, Namespace and the preview, no Environment. Type "Cerrado Flux" → namespace `cerrado-flux` → **Create** → "A tenancy with this namespace already exists.". Change the display name to "Cerrado Flux" and the namespace to `cflux` → "Another tenancy already has this display name.". "Manaus Radar" → created, listed, selected, `?tenancy=datamap%2Fproduction%2Fmanaus-radar`.
17. **An account that is gone.** As Ana request "ATTO". Disable her: `psqlgk "UPDATE users SET is_enabled = false WHERE id = '$ANA';"`. As Carla **Review** it → **Approve** → "This account is disabled or no longer exists, so it cannot be approved. Decline the request instead.", **Approve** greyed, **Decline…** still there → **Decline** works and the row leaves. Restore: `psqlgk "UPDATE users SET is_enabled = true WHERE id = '$ANA';"`.
18. **Losing the role.** Ask the owner to run `psqlgk "DELETE FROM casbin_rule WHERE ptype = 'g' AND v0 = '$CARLA' AND v1 = 'admin';"`. In Carla's open admin tab, **+ New tenancy** → the gatekeeper refuses (generic error; the BFF still trusted the old claim, the gatekeeper did not). Sign out and in → no **Admin** entry, the admin URLs are not found.

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
| `session.user.admin` from the `admin` role (built by PR B, consumed here) | 1 (checked), 2, 11, 18.2, 18.18 |
| Page gate: `auth = { admin: true }`; `RequireSession` renders the not-found page for a non-admin session | 2, 12, 15, 17, 18.1 |
| `adminChain` (`requestLogging`, `auth`, `adminOnly`), `404 {detail: "not_found"}` for non-admins; `adminBffRouter()` | 3, 18.1 |
| Gatekeeper status and `{detail}` reach the browser on every admin route | 6, 7 (`accountHandler`), 13–17 (`adminErrorFrom`) |
| JSON gate on changes; ids, paths and queries validated before the gatekeeper | 3, 6, 7 |
| `lib/admin.ts` — thirteen calls with the contract's signatures, `X-User-Id` only, path unencoded, `newTenancy` → `new_tenancy` | 4 |
| BFF routes with the contract's paths, chains, bodies and query strings; tenancy as the `tenancy` query parameter | 6, 7 |
| BFFAPI: six admin mutations, rejecting with the Axios error | 8 |
| SWR keys and options: counts on focus and every 60 s; queue via `adminRequestsKey`; recently closed; detail; tenancies; members with `useSWRInfinite`; removal impact; users `null` below 2 chars; revalidation after mutations | 9, 13–17 |
| `contants/AdminConstants.ts` with `adminErrorMessage` and `slugifyNamespace`; admin routes in `InternalRoutesConstants.ts` | 5 |
| Sidebar **Admin** (`admin_panel_settings`, filled when active) after a divider, black pill with `open`, hidden at zero; "All tenancies" footer on admin pages | 11, 12, 18.2, 18.3 |
| `AdminLayout`: sidebar + 64 px header with Requests (badge) · Users · Tenancies · Activity, active underlined, avatar right; `tenancyOptional`; reusable for RFC 010 (`ADMIN_TABS`, `AdminLayout`, `AdminDialog`, `AdminPageHeader`, `AdminEmptyState`, `AdminLoadError`) | 10, 11, 12 |
| `/app/admin` → `/app/admin/requests`; Users and Activity empty states with the RFC's copy | 12, 18.2 |
| Requests (1a): header counts, pills with counts, search, table Account / Request / Requested / Email, Join/New pills, reason, "{n} days waiting" amber from 3 days, verified/unverified, **Review** and the `more_horiz` menu with "Decline…", pager by 50, loading/empty/error | 15, 18.4 |
| Recently closed: last 5, "Approved" / "Approved · new tenancy" green, "Declined" red, "by {admin} · {when}", "Activity →" | 15, 18.6, 18.8, 18.10 |
| Review (1c, 560 px): header, Join existing / New tenancy switch on the suggestion's side, picker limited to production / enabled / not public / not the requester's, info rows, Display name + Namespace prefilled, preview, unverified banner and disabled **Create and approve**, "{first name} is emailed either way.", **Decline…**, no role cards; loading, error, already decided | 14, 18.6–18.9 |
| Approve answered `404 no_account` (PR A, beyond the contract): a message, **Approve** disabled, **Decline…** kept | 14, 18.17 |
| Decline (1e, 440 px): title, subtitle for join / new, optional message with placeholder, bullet, red **Decline**, message ≤ 1000 | 13, 18.10 |
| `?request={id}` opens the review; `?tenancy={path}` selects a tenancy | 15, 17, 18.5, 18.11, 18.14 |
| Tenancies (1d): header with counts and **+ New tenancy**; Public first with lock and no chevron, production by display name, **Legacy · staging** group; icon, name, path, members, datasets; no environment pill | 17, 18.11, 18.15 |
| Member panel: name, path, "Members · {n}", **+ Add**, members with initials, name, email, "invited by", remove; pending invitations dashed with the invitee's email and **Withdraw**, no dataset; "Show {n} more" by 50; Public "Everyone · {n} accounts"; legacy read-only | 17, 18.11–18.15 |
| An invitation withdrawn by PR A when an admin adds the invitee or approves their request leaves the panel; a stale **Withdraw** reads `invitation_not_found` and revalidates | 17, 18.14 |
| **+ Add** dialog: user search "Name, email or ORCID", pick, "{first name} is emailed.", **Cancel** / **Add** | 16, 18.12 |
| Remove prompt: title, "member since", the four bullets (two only when non-zero), red **Remove** | 16, 18.13 |
| New tenancy dialog without Environment: Display name, Namespace, preview, **Cancel** / **Create** | 16, 18.16 |
| Namespace / display-name / message validation as the gatekeeper's; `slugifyNamespace` drops diacritics before slugging ("João Ciência" → `joao-ciencia`) | 5, 13, 14, 16 |
| Decline placeholder "Ask a member of the tenancy to invite you from its Members page" (RFC, after invitations moved to the Members page) | 5, 13 |
| Not built: per-tenancy roles, environment picker or pills, user detail, system roles, Activity log | Global Constraints; 14 (no role cards), 16 (no Environment), 17 (no pills) |
| New pages in `TelemetryConstants` `PAGES` | 12 |
| Webapp Jest from the RFC: `RequireSession` hiding admin pages; the review dialog's disabled state for an unconfirmed email; the admin sidebar entry and badge | 2, 14, 11 |
| Component tests for each screen state (loading, empty, error) | 11, 13–17 |
| End-to-end against the gatekeeper with PR A, an admin seeded with the `admin` role | 18 |

Not in the contract, added because the flows break or leak without them: `accountHandler` instead of `bffHandler` on the admin routes (Tasks 6–7; `bffHandler` rewrites the `401`/`403`/`404` `detail` to fixed English, so `request_not_found`, `tenancy_not_found`, `member_not_found`, `no_account` and `not_found` would never reach the browser — PR B made the same call); the JSON gate on `DELETE` too, with `BFFAPI` sending `{ data: {} }` (Task 3, 8; Axios drops the `Content-Type` of a body-less request); PR B's `TENANCY_PATH_PATTERN` on every `tenancy` parameter and `decisionOr400`'s path check (Tasks 6–7; the path goes into the gatekeeper URL unencoded, so `..` must not reach it); the read-only "already decided" state of the review dialog (Task 14; a `?request=` link from an old email would otherwise offer **Approve** on a closed request); and `q` left out of the queue key when blank (Task 9; the contract's key lists `q=…` without saying whether an empty one is sent).

Re-anchored on PR B's plan as revised with this one, not on `main` alone:
- the session `admin` flag is B's Task 2, so this plan only consumes it;
- `RequireSession` is the file B's Task 17 rewrites (same `Props`, signature and loading branch, now inside `SWRConfig`);
- `types/GatekeeperAPI.ts` gains C's shapes after B's `InviteeLookup`, reusing B's `TenancySummary`, `GatekeeperPage`, `UserRef` and `UserBrief`;
- `BFFAPI` gains C's methods after B's `withdrawWorkspaceInvitation`;
- `lib/fetcher.js` errors carry `detail` (B's Task 17), which the review dialog reads;
- `lib/admin.ts` uses B's `asUser`, and `lib/adminRoute.ts` re-exports B's `lib/routeParams.ts` helpers and uses B's `TENANCY_PATH_PATTERN`, so neither is written twice;
- `LoggedLayout` already holds B's Members entry, which `LoggedLayoutAdmin.test.tsx` mocks;
- hook tests live in `hooks/__tests__/` as B's do.
