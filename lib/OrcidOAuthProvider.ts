import type { OAuthConfig, OAuthUserConfig } from "next-auth/providers"

export interface OrcidProfile extends Record<string, any> {
    id: string,
    name: string,
    orcid: string,
    given_name: string,
    family_name: string,
}

export default function Orcid<P extends OrcidProfile>(
    config: OAuthUserConfig<P>
): OAuthConfig<P> {
    return {
        id: "orcid",
        name: "Orcid",
        type: "oauth",
        authorization: {
            url: "https://orcid.org/oauth/authorize",
            params: {
                response_type: "code",
                scope: "/authenticate",
                redirect_uri: process.env.OAUTH_ORCID_REDIRECT_URI_BASE ?? "/"
            }
        },
        token: "https://orcid.org/oauth/token",
        userinfo: {
            url: "https://orcid.org/oauth/userinfo",
        },
        profile(profile) {
            return {
                id: profile.id,
                name: profile.name ?? (profile.given_name + " " + profile.family_name),
                orcid: profile.sub,
                given_name: profile.given_name,
                family_name: profile.family_name,
            }
        },
        style: {
            logo: "/orcidid.svg",
            logoDark: "/orcidid-dark.svg",
            bg: "#fff",
            bgDark: "#24292f",
            text: "#000",
            textDark: "#fff",
        },
        options: config
    }
}