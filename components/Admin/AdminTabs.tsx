import Link from "next/link";
import { useRouter } from "next/router";
import { ADMIN_TABS } from "../../contants/AdminConstants";
import { useAdminCounts } from "../../hooks/UseAdmin";
import { isWithinRoute } from "../../lib/routeMatch";
import { CountBadge } from "./CountBadge";

export function AdminTabs() {
    const router = useRouter();
    const { data: counts } = useAdminCounts();

    return (
        <nav aria-label="Admin" className="flex h-16 items-stretch gap-6">
            {ADMIN_TABS.map((tab) => {
                const active = isWithinRoute(router.pathname, tab.href);
                return (
                    <Link
                        key={tab.href}
                        href={tab.href}
                        aria-current={active ? "page" : undefined}
                        className={`flex items-center gap-2 border-b-2 text-sm font-medium ${active
                            ? "border-primary-900 text-primary-900"
                            : "border-transparent text-primary-500 hover:text-primary-900"
                            }`}
                    >
                        {tab.label}
                        {tab.showsOpenCount && <CountBadge count={counts?.open} label="open requests" />}
                    </Link>
                );
            })}
        </nav>
    );
}
