# RFC 008 PR 0 — Development-only GitHub and credentials providers Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** A production build of the webapp registers only the ORCID provider in NextAuth, so `POST /api/auth/callback/credentials` can no longer create a user and a session with any `@local.datamap.com` address; `next dev` keeps GitHub and the credentials stub exactly as they are.

**Architecture:** `pages/api/auth/[...nextauth].ts` builds a `developmentOnlyProviders` array at module load from `process.env.NODE_ENV === "development"` and spreads it after ORCID. Next.js inlines `NODE_ENV` at build time, so `next build` produces a bundle in which the two providers do not exist. The test re-imports the module under different `NODE_ENV` values with `jest.isolateModules` and reads `authOptions.providers[].id`. It lives in `lib/__tests__/`, not next to the route: `next build` compiles every file under `pages/` (including `pages/api/auth/__tests__/*.test.ts`, which ships as a route) and rewrites any assignment to `NODE_ENV` there into invalid code, failing the build.

**Tech Stack:** Next.js 14.2 (pages router), NextAuth 4.24.9, Jest 29 + ts-jest.

## Global Constraints

- Branch: `fix/dev-only-auth-providers` in worktree `.claude/worktrees/dev-only-auth-providers`, cut from an up-to-date `main`.
- Provider order in production: `["orcid"]`.
- Provider order in development: `["orcid", "github", "credentials"]`.
- Any `NODE_ENV` other than `"development"` (including `"test"` and `"production"`) is treated as production.
- The credentials stub's behaviour, `id: "credentials"` and the `jwt`/`session` callbacks are unchanged; only where the providers are registered changes.
- The login page is not touched: it already shows the GitHub button and the John Doe form only when `NODE_ENV == "development"`.
- All work happens in the worktree `/Users/caio.maia/workspace/datamap/datamap-webapp/.claude/worktrees/dev-only-auth-providers` (Task 1, Step 1); every command in this plan runs from its root. It gets its own `node_modules` with `npm ci` — never symlink `node_modules` from the main checkout (a symlinked `node_modules` is how the main checkout's was wiped: Next's TypeScript auto-install made npm replace it).
- Jest inside the worktree: plain `npx jest --coverage=false`. Do not add `--testPathIgnorePatterns /.claude/` there: the worktree's own path contains `/.claude/` and nothing would run.
- Every commit message ends with `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.

---

## File Structure

| File | Status | Responsibility |
|---|---|---|
| `lib/__tests__/authProviders.test.ts` | create | Imports `authOptions` under `NODE_ENV` = production, development and test; asserts the provider ids |
| `pages/api/auth/[...nextauth].ts` | modify | ORCID always; GitHub and the credentials stub only in development |

---

### Task 1: Register GitHub and the credentials stub only in development

**Files:**
- Create: `lib/__tests__/authProviders.test.ts`
- Modify: `pages/api/auth/[...nextauth].ts` (the `providers` array at the top of `authOptions`)

**Interfaces:**
- Consumes: `authOptions: AuthOptions` exported from `pages/api/auth/[...nextauth].ts`; `claimInvitations` from `lib/share.ts` (mocked, because the route imports it).
- Produces: `authOptions.providers` whose ids are `["orcid"]` unless `process.env.NODE_ENV === "development"`, then `["orcid", "github", "credentials"]`.

- [ ] **Step 1: Create the worktree**

```bash
cd /Users/caio.maia/workspace/datamap/datamap-webapp
git pull --ff-only                 # the main checkout is on main
git worktree add -b fix/dev-only-auth-providers .claude/worktrees/dev-only-auth-providers main
cd .claude/worktrees/dev-only-auth-providers
npm ci                             # its own node_modules; never a symlink to the main checkout's
cp ../../../.env.local .env.local  # untracked; needed by npm run dev and npm run build
npx jest --coverage=false          # baseline: everything passes before the first change
```

Every later command in this plan runs from `/Users/caio.maia/workspace/datamap/datamap-webapp/.claude/worktrees/dev-only-auth-providers`.

- [ ] **Step 2: Write the failing test**

Create `lib/__tests__/authProviders.test.ts`:

```ts
jest.mock("../share", () => ({ claimInvitations: jest.fn() }));

import { describe, expect, test } from '@jest/globals';

// next build compiles everything under pages/, and inlines NODE_ENV there: this test cannot live next to the route.
function providerIdsWhen(nodeEnv: string): string[] {
    const env = process.env as Record<string, string | undefined>;
    const original = env.NODE_ENV;
    env.NODE_ENV = nodeEnv;
    try {
        let ids: string[] = [];
        jest.isolateModules(() => {
            const { authOptions } = require("../../pages/api/auth/[...nextauth]");
            ids = authOptions.providers.map((provider: { id: string }) => provider.id);
        });
        return ids;
    } finally {
        env.NODE_ENV = original;
    }
}

describe("the sign-in providers", () => {
    test("production offers only ORCID", () => {
        expect(providerIdsWhen("production")).toEqual(["orcid"]);
    });

    test("development also offers GitHub and the credentials stub", () => {
        expect(providerIdsWhen("development")).toEqual(["orcid", "github", "credentials"]);
    });

    test("anything that is not development counts as production", () => {
        expect(providerIdsWhen("test")).toEqual(["orcid"]);
    });
});
```

- [ ] **Step 3: Run it and watch it fail**

Run: `npx jest --coverage=false lib/__tests__/authProviders.test.ts`

Expected: FAIL, 3 failed. Production and test receive `["github", "orcid", "credentials"]`; development receives the same three in the wrong order (`"github"` first).

- [ ] **Step 4: Register the two providers only in development**

In `pages/api/auth/[...nextauth].ts`, replace everything from the line `export const authOptions: AuthOptions = {` down to and including the line `  ],` that closes the `providers` array (the block that today lists `GithubProvider`, `OrcidProvider` and `CredentialsProvider` with its stub `authorize`) with:

```ts
// The credentials stub signs in any @local.datamap.com address and GitHub is for local work: neither may exist in production.
const developmentOnlyProviders = process.env.NODE_ENV === "development"
  ? [
    GithubProvider({
      clientId: process.env.GITHUB_ID,
      clientSecret: process.env.GITHUB_SECRET,
    }),
    CredentialsProvider({
      id: "credentials",
      name: "Credentials",
      credentials: {},
      async authorize(credentials) {

        const { name, email, password } = credentials as {
          name: string,
          email: string;
          password: string
        };

        if (email.indexOf("@local.datamap.com") > 0 && password?.length > 5) {
          return {
            id: crypto.randomUUID(),
            name: name,
            email: email,
          }
        }

        getMetrics().recordLogin("credentials", "failure");
        throw new Error("invalid credentials");
      }
    }),
  ]
  : [];

export const authOptions: AuthOptions = {
  providers: [
    OrcidProvider({
      clientId: process.env.OAUTH_ORCID_CLIENT_ID,
      clientSecret: process.env.OAUTH_ORCID_CLIENT_SECRET,
    }),
    ...developmentOnlyProviders,
  ],
```

The next line in the file must still be `  // debug: true,` followed by `  callbacks: {`. Nothing else in the file changes; the imports of `CredentialsProvider`, `GithubProvider` and `getMetrics` stay in use.

- [ ] **Step 5: Run the tests and watch them pass**

Run: `npx jest --coverage=false lib/__tests__/authProviders.test.ts pages/api/auth`

Expected: PASS — 3 tests in `authProviders.test.ts`, 7 in `pages/api/auth/__tests__/[...nextauth].test.ts`.

- [ ] **Step 6: Type-check**

Run: `npx tsc --noEmit -p .`

Expected: no output, exit code 0.

- [ ] **Step 7: Commit**

```bash
git add lib/__tests__/authProviders.test.ts "pages/api/auth/[...nextauth].ts"
git commit -m "$(cat <<'EOF'
fix: register GitHub and the credentials stub only in development

The credentials provider accepted any @local.datamap.com address without
asking the gatekeeper, and it was registered in production: a direct POST
to /api/auth/callback/credentials created a user and a session. The login
page hid the form, but the provider was live. ORCID stays the only
provider of a production build.

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 2: Verify the whole suite, the build, and both environments

**Files:** none changed.

**Interfaces:**
- Consumes: the commit from Task 1.
- Produces: evidence that `next build` succeeds, that a production server lists only ORCID, and that `next dev` still lists all three.

- [ ] **Step 1: Run the whole Jest suite**

Run (from the worktree): `npx jest --coverage=false`

Expected: every suite passes (69 suites and 448 tests on `main` today, plus the 3 new tests: 70 suites, 451 tests).

- [ ] **Step 2: Build for production**

Run: `npm run build`

Expected: exit code 0 and the route table printed (warnings from ESLint are pre-existing and do not fail the build).

- [ ] **Step 3: Check the providers of the production server**

```bash
npm run start -- -p 3001
```

In a second terminal:

```bash
curl -s http://localhost:3001/api/auth/providers
```

Expected: a JSON object with the single key `"orcid"`; no `"github"`, no `"credentials"`. (`next start` prints a warning about `output: "standalone"`; it still serves.) Stop the server with Ctrl-C.

- [ ] **Step 4: Check that development is unchanged**

```bash
npm run dev
```

In a second terminal:

```bash
curl -s http://localhost:3000/api/auth/providers
```

Expected: keys `"orcid"`, `"github"` and `"credentials"`. Open `http://localhost:3000/account/login`, submit the pre-filled John Doe form, and confirm the sign-in still works (if `/app/tenancy` answers 401, the local John Doe user lacks its `casbin_rule`/`users_tenancies` rows — a known local-data gap, not this change). Stop the dev server.

- [ ] **Step 5: Push and open the PR**

```bash
git push -u origin fix/dev-only-auth-providers
gh pr create --title "fix: register GitHub and the credentials stub only in development" --body "$(cat <<'EOF'
RFC 008, PR 0.

The credentials provider's `authorize()` accepted any `@local.datamap.com` address with a 6+ character password without calling the gatekeeper, and it was registered in production. A direct `POST /api/auth/callback/credentials` therefore created a real user and a session. GitHub had the same shape.

Both are now registered only when `NODE_ENV === "development"`; ORCID is always registered.

- `lib/__tests__/authProviders.test.ts` imports `authOptions` under `production`, `development` and `test` and checks the provider ids.
- Checked by hand: `GET /api/auth/providers` on `next start` lists only `orcid`; on `next dev` it lists all three.

🤖 Generated with [Claude Code](https://claude.com/claude-code)
EOF
)"
```

---

## Self-review

| Requirement (RFC 008, *Webapp → Session* and *Delivery*) | Where |
|---|---|
| "GitHub and the credentials stub are registered only when `NODE_ENV === "development"`" | Task 1, Step 4 |
| "This ships first, on its own" — no gatekeeper dependency, no UI change | Global Constraints; Task 1 touches only the route and a test |
| ORCID remains available in every environment | Task 1, Step 2 (production test) and Step 4 |
| Test first: production yields only `orcid`, development yields all three | Task 1, Steps 2–5 |
| A direct POST to the credentials callback cannot sign in on production | Task 2, Step 3 (`/api/auth/providers` lists only `orcid`; NextAuth refuses a callback for an unregistered provider) |
| Local development keeps working | Task 2, Step 4 |

Gaps checked: the login page's dev-only GitHub button and John Doe form already match the new registration, so no page change is needed; the `jwt` callback's `github` and `credentials` branches become unreachable in production but are harmless and are rewritten by PR 2.
