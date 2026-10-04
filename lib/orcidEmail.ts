import axios from "axios";

export const ORCID_PUBLIC_API_URL = "https://pub.orcid.org/v3.0";

export const ORCID_EMAIL_TIMEOUT_MS = 3000;

const PLACEHOLDER_EMAIL_DOMAIN = "@fake.mail.com";

const ORCID_ID = /^\d{4}-\d{4}-\d{4}-\d{3}[\dX]$/;

export interface OrcidEmail {
    email?: string
    primary?: boolean
    verified?: boolean
}

export function isPlaceholderEmail(email?: string | null): boolean {
    return !email || email.trim().toLowerCase().endsWith(PLACEHOLDER_EMAIL_DOMAIN);
}

export function pickOrcidEmail(emails: OrcidEmail[] | undefined): string | undefined {
    const usable = (emails ?? []).filter((entry) => typeof entry?.email === "string" && entry.email.includes("@"));
    const best = usable.find((entry) => entry.primary && entry.verified)
        ?? usable.find((entry) => entry.verified)
        ?? usable[0];
    return best?.email;
}

/** Only used to pre-fill the confirmation field: a slow or failing ORCID must never block a sign-in. */
export async function fetchOrcidPublicEmail(orcid: string, accessToken?: string): Promise<string | undefined> {
    if (!ORCID_ID.test(orcid)) {
        return undefined;
    }
    try {
        const response = await axios.get(`${ORCID_PUBLIC_API_URL}/${orcid}/email`, {
            timeout: ORCID_EMAIL_TIMEOUT_MS,
            headers: {
                Accept: "application/json",
                ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
            },
        });
        return pickOrcidEmail(response.data?.email);
    } catch {
        return undefined;
    }
}
