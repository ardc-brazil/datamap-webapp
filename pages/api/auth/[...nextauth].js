import NextAuth from "next-auth"
import GithubProvider from "next-auth/providers/github"
import OrcidProvider from "../../../lib/OrcidOAuthProvider";


// const authCode = query.code;
const clientId = process.env.OAUTH_ORCID_CLIENT_ID;
const clientSecret = process.env.OAUTH_ORCID_CLIENT_SECRET;
const redirectUriBase = process.env.OAUTH_ORCID_REDIRECT_URI_BASE;
// const requestData = `client_id=${clientId}&client_secret=${clientSecret}&grant_type=authorization_code&code=${authCode}&redirect_uri=${redirectUriBase}&code=${authCode}`;

export const authOptions = {
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
  debug: true,
  callbacks: {
    async jwt({ token, account }) {
      // Persist the OAuth access_token to the token right after signin
      if (account) {
        token.accessToken = account.access_token
      }
      return token
    },
    async session({ session, token, user }) {
      // Send properties to the client, like an access_token from a provider.
      session.accessToken = token.accessToken
      return session
    }
  }
}

export default NextAuth(authOptions)