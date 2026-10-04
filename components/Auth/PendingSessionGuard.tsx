import { useSession } from "next-auth/react";
import Router, { useRouter } from "next/router";
import { ReactNode, useEffect } from "react";
import { pendingSessionRedirect } from "../../lib/authRoutes";

interface Props {
    loading?: ReactNode
    children: ReactNode
}

/** Sends a pending session to confirm its email from any page, and a confirmed one off the confirmation page. */
export function PendingSessionGuard({ loading, children }: Props) {
    const { data: session, status } = useSession();
    const router = useRouter();

    const redirectTo = status === "authenticated" && router.isReady
        ? pendingSessionRedirect(session?.user?.pending === true, router.pathname, router.asPath, router.query.callbackUrl)
        : null;

    useEffect(() => {
        if (redirectTo) {
            Router.replace(redirectTo);
        }
    }, [redirectTo]);

    if (redirectTo && loading) {
        return <>{loading}</>;
    }
    return <>{children}</>;
}
