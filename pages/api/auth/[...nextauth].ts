import axios, { AxiosError } from "axios";
import NextAuth, { AuthOptions } from "next-auth";
import GithubProvider from "next-auth/providers/github";
import OrcidProvider from "../../../lib/OrcidOAuthProvider";
import { CreateUserRequest, createUser, getUserByProviderID } from "../../../lib/users";
import { defaultTenancy } from "../../../lib/rpc";

export const authOptions: AuthOptions = {
  // Configure one or more authentication providers
  providers: [
    GithubProvider({
      clientId: process.env.GITHUB_ID,
      clientSecret: process.env.GITHUB_SECRET,
    }),
    OrcidProvider({
      clientId: process.env.OAUTH_ORCID_CLIENT_ID,
      clientSecret: process.env.OAUTH_ORCID_CLIENT_SECRET,
    }),
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
      }

      return token
    },
    async session({ session, token, user }) {
      // Send properties to the client, like an access_token from a provider.
      if (session?.user) {
        session.user.uid = token.uid
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
    token.tenancies = [defaultTenancy];
  }

  return token;
}

async function getUserByProviderAuthentication(account, token) {

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
  } else {
    throw new Error("Invalid provider authentication: " + account.provider);
  }

  let user = null;

  try {
    user = await getUserByProviderID(params);
  } catch (error: any | AxiosError) {
    // Always create a new user if it does not exist, but has successfully authenticated with a provider.
    if (axios.isAxiosError(error) && error?.response?.status == 404) {
      user = createUser(params);
    }
  };

  if (!user) {
    throw new Error("User not found and not created");
  }

  return user;
}


export default NextAuth(authOptions)