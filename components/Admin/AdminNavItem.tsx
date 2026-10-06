import { useSession } from "next-auth/react";
import { ADMIN_COPY } from "../../contants/AdminConstants";
import { ROUTE_PAGE_ADMIN, ROUTE_PAGE_ADMIN_REQUESTS } from "../../contants/InternalRoutesConstants";
import { useAdminCounts } from "../../hooks/UseAdmin";
import { SidebarMenuItem } from "../SidebarMenuItem";
import { CountBadge } from "./CountBadge";

export function AdminNavItem({ collapsed }: { collapsed: boolean }) {
    const { data: session } = useSession();
    const isAdmin = session?.user?.admin === true;
    const { data: counts } = useAdminCounts(isAdmin);

    if (!isAdmin) {
        return null;
    }

    return (
        <>
            <hr className="mx-2 border-primary-200" />
            <ul className="p-2">
                <SidebarMenuItem
                    href={ROUTE_PAGE_ADMIN_REQUESTS}
                    activePrefix={ROUTE_PAGE_ADMIN}
                    text={ADMIN_COPY.adminNav}
                    icon="admin_panel_settings"
                    collapsed={collapsed}
                    trailing={<CountBadge count={counts?.open} label="open requests" />}
                />
            </ul>
        </>
    );
}
