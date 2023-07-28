import NextAuth from "next-auth"
import GithubProvider from "next-auth/providers/github"


// const authCode = query.code;
const clientId = process.env.OAUTH_ORCID_CLIENT_ID;
const clientSecret = process.env.OAUTH_ORCID_CLIENT_SECRET;
const redirectUriBase = process.env.OAUTH_ORCID_REDIRECT_URI_BASE;
// const requestData = `client_id=${clientId}&client_secret=${clientSecret}&grant_type=authorization_code&code=${authCode}&redirect_uri=${redirectUriBase}&code=${authCode}`;

export const authOptions = {
  // Configure one or more authentication providers
  providers: [
    GithubProvider({
      // clientId: process.env.GITHUB_ID,
      clientId: "86022afddf74b7be9a50",
      // clientSecret: process.env.GITHUB_SECRET,
      clientSecret: "b8b638a6b435c9bb93505b3dfd7f22a2911fc75d"
    }),
    {
      id: "orcid",
      name: "Orcid",
      type: "oauth",
      authorization: {
        url: "https://orcid.org/oauth/authorize",
        params: {
          response_type: "code",
          scope: "/authenticate",
          redirect_uri: redirectUriBase
        }
      },
      token: "https://orcid.org/oauth/token",
      idToken: true,
      // checks: ["pkce", "state"],
      clientId: process.env.OAUTH_ORCID_CLIENT_ID,
      clientSecret: process.env.OAUTH_ORCID_CLIENT_SECRET,
      profile(profile) {
        return {
          // id: profile.sub,
          // name: profile.name,
          // email: profile.email,
          // image: profile.picture,
          id: profile.orcid,
          orcid: profile.orcid,
          name: profile.name,
        }
      },
    }
  ],
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