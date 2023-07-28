import type { OAuthConfig, OAuthUserConfig } from "next-auth/providers"

export interface OrcidProfile extends Record<string, any> {
    orcid: string
    email: string
    name: string
}

export default function Orcid<P extends OrcidProfile>(
    options: OAuthUserConfig<P>
): OAuthConfig<P> {
    return {
        id: "orcid",
        name: "Orcid",
        type: "oauth",
        // authorization: `https://orcid.org/oauth/authorize?response_type=code&scope=/authenticate&redirect_uri=${redirectUriBase}`,
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
}