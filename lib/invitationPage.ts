import { ROUTE_PAGE_INVITATION } from "../contants/InternalRoutesConstants";
import { InvitationPreview } from "../types/GatekeeperAPI";
import { loginUrlFor } from "./authRoutes";

export function invitationPageProps(preview: InvitationPreview | null, token: string, account: string | null) {
    if (!preview) {
        return { notFound: true as const };
    }
    if (preview.state === "pending" && !account) {
        return { redirect: { destination: loginUrlFor(ROUTE_PAGE_INVITATION({ token })), permanent: false } };
    }
    return { props: { token, preview, account } };
}

export function invitationAccount(session: { uid?: unknown, email?: unknown, name?: unknown } | null): string | null {
    if (!session?.uid) {
        return null;
    }
    return ((session.email ?? session.name) as string | undefined) || "this account";
}
