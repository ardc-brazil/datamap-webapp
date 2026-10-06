import { useSession } from "next-auth/react";
import Router, { useRouter } from "next/router";
import { ReactNode, useRef } from "react";
import { SWRConfig } from "swr";
import { ROUTE_PAGE_TENANCY_SELECTOR } from "../../contants/InternalRoutesConstants";
import { loginUrlFor } from "../../lib/authRoutes";
import { isTenancyRevoked } from "../../lib/tenancyRevocation";
import { useTenancyStore } from "../TenancyStore";

interface Props {
    loading: ReactNode
    children: ReactNode
}

function tenanciesKey(tenancies: string[] | undefined): string {
    return (tenancies ?? []).join("\n");
}

/** Renders a page only for a signed-in visitor; a session refresh keeps the page mounted. */
export function RequireSession({ loading, children }: Props) {
    const router = useRouter();
    const setTenancySelected = useTenancyStore((state) => state.setTenancySelected);
    const isTenancySelected = useTenancyStore((state) => state.isTenancySelected);
    const leaving = useRef(false);
    const revokedFrom = useRef<string | null>(null);

    const { data: session, status, update } = useSession({
        required: true,
        onUnauthenticated() {
            Router.replace(loginUrlFor(router.asPath));
        },
    });
    const tenancies = session?.user?.tenancies;

    async function leaveRevokedTenancy() {
        if (leaving.current) {
            return;
        }
        leaving.current = true;
        revokedFrom.current = tenanciesKey(tenancies);
        try {
            setTenancySelected("");
            await update();
            await Router.replace(ROUTE_PAGE_TENANCY_SELECTOR);
        } finally {
            leaving.current = false;
        }
    }

    if (status === "loading" && !session) {
        return <>{loading}</>;
    }

    // A session still listing the tenancy the user was just removed from must not select it again.
    if (!isTenancySelected() && tenancies?.length == 1 && tenanciesKey(tenancies) !== revokedFrom.current) {
        setTenancySelected(tenancies[0]);
    }

    return (
        <SWRConfig value={{ onError: (error) => { if (isTenancyRevoked(error?.status, error?.detail)) leaveRevokedTenancy(); } }}>
            {children}
        </SWRConfig>
    );
}
