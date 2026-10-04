import { User } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { DEV_ORCID_MOCK_PROVIDER_ID, DEV_ORCID_MOCK_PROVIDER_NAME, ORCID_ID_PATTERN } from "../contants/AccountConstants";

export async function authorizeDevOrcidMock(credentials?: Record<string, string>): Promise<User | null> {
    const orcid = credentials?.orcid?.trim() ?? "";
    if (!ORCID_ID_PATTERN.test(orcid)) {
        return null;
    }
    const name = credentials?.name?.trim() || "Dev User";
    const publicEmail = credentials?.email?.trim();
    return { id: orcid, name, ...(publicEmail ? { publicEmail } : {}) };
}

/** Signs in as any ORCID iD: register it only behind NODE_ENV === "development" and ENABLE_DEV_ORCID_MOCK === "true". */
export function devOrcidMockProvider() {
    return CredentialsProvider({
        id: DEV_ORCID_MOCK_PROVIDER_ID,
        name: DEV_ORCID_MOCK_PROVIDER_NAME,
        credentials: {},
        authorize: authorizeDevOrcidMock,
    });
}
