import { useSession } from "next-auth/react";
import Router, { useRouter } from "next/router";
import { ReactNode, useMemo, useRef } from "react";
import { SWRConfig } from "swr";
import { ROUTE_PAGE_TENANCY_SELECTOR } from "../../contants/InternalRoutesConstants";
import { revalidateMyTenancies } from "../../hooks/UseTenancies";
import { loginUrlFor } from "../../lib/authRoutes";
import { isTenancyRevoked } from "../../lib/tenancyRevocation";
import Custom404 from "../../pages/404";
import { useTenancyStore } from "../TenancyStore";

interface Props {
    loading: ReactNode
    children: ReactNode
    admin?: boolean
}

function tenanciesKey(tenancies: string[] | undefined): string {
    return (tenancies ?? []).join("\n");
}

/** Renders a page only for a signed-in visitor; a session refresh keeps the page mounted. */
export function RequireSession({ loading, children, admin = false }: Props) {
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

    const swrConfig = useMemo(() => {
        async function leaveRevokedTenancy() {
            if (leaving.current) {
                return;
            }
            leaving.current = true;
            revokedFrom.current = tenanciesKey(tenancies);
            try {
                setTenancySelected("");
                await update();
                await revalidateMyTenancies();
                await Router.replace(ROUTE_PAGE_TENANCY_SELECTOR);
            } finally {
                leaving.current = false;
            }
        }
        return { onError: (error: { status?: unknown; detail?: unknown } | undefined) => { if (isTenancyRevoked(error?.status, error?.detail)) leaveRevokedTenancy(); } };
    }, [tenancies, update, setTenancySelected]);

    if (status === "loading" && !session) {
        return <>{loading}</>;
    }

    if (admin && session?.user?.admin !== true) {
        return <Custom404 />;
    }

    if (revokedFrom.current !== null && tenanciesKey(tenancies) !== revokedFrom.current) {
        revokedFrom.current = null;
    }
    // A session still listing the tenancy the user was just removed from must not select it again.
    if (!isTenancySelected() && tenancies?.length == 1 && revokedFrom.current === null) {
        setTenancySelected(tenancies[0]);
    }

    return (
        <SWRConfig value={swrConfig}>
            {children}
        </SWRConfig>
    );
}
