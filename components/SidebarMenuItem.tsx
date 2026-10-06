import Link from "next/link";
import { useRouter } from "next/router";
import { ReactNode } from "react";
import { MaterialSymbol, SymbolCodepoints } from "react-material-symbols";
import { isWithinRoute } from "../lib/routeMatch";

interface Props {
    href: string
    text: string
    icon: SymbolCodepoints
    collapsed: boolean
    activePrefix?: string
    trailing?: ReactNode
}

export function SidebarMenuItem({ href, text, icon, collapsed, activePrefix, trailing }: Props) {
    const router = useRouter();
    const isActive = isWithinRoute(router.pathname, activePrefix ?? href);

    return (
        <li>
            <Link
                href={href}
                title={collapsed ? text : undefined}
                aria-current={isActive ? "page" : undefined}
                className={`flex items-center gap-3 h-10 rounded-md text-sm ${collapsed ? "justify-center" : "px-3"} ${isActive
                    ? "bg-secondary-500 font-semibold text-primary-900"
                    : "font-medium text-primary-700 hover:bg-primary-100"
                    }`}
            >
                <MaterialSymbol icon={icon} size={20} weight={400} grade={-25} fill={isActive} className={isActive ? "text-primary-900" : "text-primary-500"} />
                {!collapsed && <span>{text}</span>}
                {!collapsed && trailing && <span className="ml-auto">{trailing}</span>}
            </Link>
        </li>
    );
}
