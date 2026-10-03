import axios, { AxiosError } from "axios";
import NextAuth, { AuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GithubProvider from "next-auth/providers/github";
import OrcidProvider from "../../../lib/OrcidOAuthProvider";
import { CreateUserRequest, GetUserByProviderResponse, createUser, getUserByProviderID, getUserByUID } from "../../../lib/users";
import { logError } from "../../../lib/logging";
import { getMetrics } from "../../../lib/metrics";
import { claimInvitations } from "../../../lib/share";

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
  // debug: true,
  callbacks: {
    async jwt({ token, account, trigger }) {
      // Persist the OAuth access_token to the token right after signin
      if (account) {
        token.accessToken = account.access_token
      }

      if (trigger == "signIn") {
        const user = await getUserByProviderAuthentication(account, token);
        token = hydrateWithUserInfo(token, user);
        await claimPendingInvitations(user.id);
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

      return token
    },

    // eslint-disable-next-line no-unused-vars
    async session({ session, token, user }) {
      // Send properties to the client, like an access_token from a provider.
      if (session?.user) {
        // Hydarte the user in session with ID and the available tenancies
        session.user.uid = token.uid
        session.user.tenancies = token.tenancies
      }
      return session
    }
  },
  events: {
    async signIn({ account }) {
      getMetrics().recordLogin(account?.provider ?? "unknown", "success");
    },
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

export async function claimPendingInvitations(uid: string): Promise<void> {
  try {
    await claimInvitations(uid);
  } catch (error) {
    // A failed claim must not block the sign-in; the invitation link still works.
    logError("claiming pending invitations failed", error);
  }
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
  } else if (account.provider == "orcid") {
    params = {
      providerName: account.provider,
      providerID: account.orcid,
      personName: token.name,
      userName: account.orcid,
      email: token.email
    };
  } else if (account.provider == "credentials") {
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