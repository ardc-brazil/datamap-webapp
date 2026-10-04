import { ROUTE_PAGE_INVITATION } from "../contants/InternalRoutesConstants";
import { InvitationPreview } from "../types/GatekeeperAPI";
import { loginUrlFor } from "./authRoutes";
import { TOKEN_VERSION } from "./sessionToken";

export function invitationPageProps(preview: InvitationPreview | null, token: string, account: string | null) {
    if (!preview) {
        return { notFound: true as const };
    }
    if (preview.state === "pending" && !account) {
        return { redirect: { destination: loginUrlFor(ROUTE_PAGE_INVITATION({ token })), permanent: false } };
    }
    return { props: { token, preview, account } };
}

export function invitationAccount(session: { uid?: unknown, v?: unknown, email?: unknown, name?: unknown } | null): string | null {
    if (!session?.uid || session.v !== TOKEN_VERSION) {
        return null;
    }
    return ((session.email ?? session.name) as string | undefined) || "this account";
}
