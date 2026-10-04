import { useSession } from "next-auth/react";
import Router, { useRouter } from "next/router";
import { ReactNode } from "react";
import { loginUrlFor } from "../../lib/authRoutes";
import { useTenancyStore } from "../TenancyStore";

interface Props {
    loading: ReactNode
    children: ReactNode
}

/** Renders a page only for a signed-in visitor; a session refresh keeps the page mounted. */
export function RequireSession({ loading, children }: Props) {
    const router = useRouter();
    const setTenancySelected = useTenancyStore((state) => state.setTenancySelected);
    const isTenancySelected = useTenancyStore((state) => state.isTenancySelected);

    const { data: session, status } = useSession({
        required: true,
        onUnauthenticated() {
            Router.replace(loginUrlFor(router.asPath));
        },
    });

    if (status === "loading" && !session) {
        return <>{loading}</>;
    }

    if (!isTenancySelected() && session?.user?.tenancies?.length == 1) {
        setTenancySelected(session.user.tenancies[0]);
    }

    return <>{children}</>;
}
