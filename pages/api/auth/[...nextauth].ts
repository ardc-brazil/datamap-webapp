import axios, { AxiosError } from "axios";
import NextAuth, { Account, AuthOptions, User } from "next-auth";
import { JWT } from "next-auth/jwt";
import CredentialsProvider from "next-auth/providers/credentials";
import GithubProvider from "next-auth/providers/github";
import { login } from "../../../lib/account";
import OrcidProvider from "../../../lib/OrcidOAuthProvider";
import { CreateUserRequest, GetUserByProviderResponse, createUser, getUserByProviderID, getUserByUID } from "../../../lib/users";
import { logError } from "../../../lib/logging";
import { getMetrics } from "../../../lib/metrics";
import { claimInvitations } from "../../../lib/share";
import { STALE_SESSION_ERROR, TOKEN_VERSION } from "../../../lib/sessionToken";
import { fetchOrcidPublicEmail, isPlaceholderEmail } from "../../../lib/orcidEmail";
import { DEV_ORCID_MOCK_PROVIDER_ID } from "../../../contants/AccountConstants";
import { devOrcidMockProvider } from "../../../lib/devOrcidMock";

export { TOKEN_VERSION } from "../../../lib/sessionToken";

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

export async function authorizeCredentials(credentials?: Record<string, string>): Promise<User | null> {
  const email = credentials?.email;
  const password = credentials?.password;

  if (typeof email !== "string" || typeof password !== "string" || !email || !password) {
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
  // debug: true,
  callbacks: {
    async jwt({ token, account, trigger, user }) {
      if (!account && token.v !== TOKEN_VERSION) {
        throw new Error(STALE_SESSION_ERROR);
      }

      const orcid = trigger == "signIn" ? orcidSignIn(account, user) : null;
      if (orcid) {
        token = await signInWithOrcid(token, orcid);
      } else if (trigger == "signIn") {
        if (account?.provider == "credentials") {
          token = await hydratePasswordSignIn(token, user.id);
        } else {
          const signedIn = await getUserByProviderAuthentication(account, token);
          token = hydrateWithUserInfo(token, signedIn);
        }
        await claimPendingInvitations(token.uid as string);
      }

      if (trigger == "signIn") {
        getMetrics().recordLogin(account?.provider ?? "unknown", token.pending ? "pending" : "success");
      }

      if (trigger == "update" && token.pending) {
        token = await refreshPendingSignIn(token);
      } else if (trigger == "update" && token.uid) {
        // Roles and tenancies are granted by the team after the user signs in.
        // Without re-reading them here the session keeps the claims from login,
        // and being granted access looks to the user like nothing happened.
        try {
          const user = await getUserByUID({ uid: token.uid as string, tenancy: undefined });
          token = hydrateWithUserInfo(token, user);
        } catch (error) {
          // A failed refresh must not log the user out. Keep the current claims.
          logError("failed to refresh session claims", error);
        }
      }

      token.v = TOKEN_VERSION;
      return token
    },

    // eslint-disable-next-line no-unused-vars
    async session({ session, token, user }) {
      // Send properties to the client, like an access_token from a provider.
      if (session?.user) {
        // Hydarte the user in session with ID and the available tenancies
        session.user.uid = token.uid
        session.user.tenancies = token.tenancies
        session.user.pending = Boolean(token.pending)
        if (token.pending?.emailHint) {
          session.user.emailHint = token.pending.emailHint
        }
      }
      return session
    }
  },
  pages: {
    signIn: '/account/login?phase=sign-in',
    signOut: '/profile', // TODO: create a signOut page
    error: '/account/login?phase=sign-in', // Error code passed in query string as ?error=
    verifyRequest: '/', // (used for check email message)
    newUser: '/profile' // New users will be directed here on first sign in (leave the property out if not of interest)
  },
  session: {
    strategy: "jwt"
  }
}

export function hydrateWithUserInfo(token, user: any) {
  token.uid = user.id;

  if (user.tenancies?.length) {
    token.tenancies = user.tenancies as string[];
  } else {
    // The user has no tenancy. Leaving a claim from a previous hydration would
    // let a revoked session keep querying the tenancy it was removed from.
    delete token.tenancies;
  }

  return token;
}

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

export async function claimPendingInvitations(uid: string): Promise<void> {
  try {
    await claimInvitations(uid);
  } catch (error) {
    // A failed claim must not block the sign-in; the invitation link still works.
    logError("claiming pending invitations failed", error);
  }
}

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

async function emailHintFor(user: GetUserByProviderResponse | null, attempt: OrcidSignIn): Promise<string | undefined> {
  if (user && !isPlaceholderEmail(user.email)) {
    return user.email;
  }
  return attempt.publicEmail();
}

async function finishOrcidSignIn(token: JWT, user: GetUserByProviderResponse): Promise<JWT> {
  token = hydrateWithUserInfo(token, user);
  token.email = user.email;
  if (user.name) {
    token.name = user.name;
  }
  delete token.pending;
  await claimPendingInvitations(user.id);
  return token;
}

export async function signInWithOrcid(token: JWT, attempt: OrcidSignIn): Promise<JWT> {
  const { orcid } = attempt;
  const user = await findUserByOrcid(orcid);

  if (user?.email_verified_at) {
    return finishOrcidSignIn(token, user);
  }

  delete token.uid;
  delete token.tenancies;
  const emailHint = await emailHintFor(user, attempt);
  token.pending = {
    orcid,
    name: (token.name as string) || attempt.name || user?.name || orcid,
    ...(emailHint ? { emailHint } : {}),
  };
  return token;
}

export async function refreshPendingSignIn(token: JWT): Promise<JWT> {
  if (!token.pending) {
    return token;
  }

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

  token = await finishOrcidSignIn(token, user);
  getMetrics().recordLogin("orcid", "success");
  return token;
}

async function getUserByProviderAuthentication(account, token): Promise<GetUserByProviderResponse> {

  let params = null as CreateUserRequest;

  if (account.provider == "github") {
    params = {
      providerName: account.provider,
      providerID: token.email,
      personName: token.name,
      userName: token.email.split('@')[0],
      email: token.email
    };
  } else {
    throw new Error("Invalid provider authentication: " + account.provider);
  }

  let user = null;

  try {
    user = await getUserByProviderID(params);
  } catch (error: any | AxiosError) {
    // Always create a new user if it does not exist, but has successfully authenticated with a provider.
    if (axios.isAxiosError(error) && error?.response?.status == 404) {
      try {
        user = await createUser(params);
      } catch (error) {
        logError("sign in failed", error)
      }
    }
  }

  if (!user) {
    throw new Error("User not found and not created");
  }

  return user;
}


export default NextAuth(authOptions)