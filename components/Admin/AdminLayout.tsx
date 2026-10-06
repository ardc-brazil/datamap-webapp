import { ReactNode } from "react";
import { ADMIN_COPY } from "../../contants/AdminConstants";
import LoggedLayout from "../LoggedLayout";
import { AdminTabs } from "./AdminTabs";

export function AdminLayout({ children }: { children: ReactNode }) {
    return (
        <LoggedLayout tenancyOptional scopeLabel={ADMIN_COPY.scope} headerContent={<AdminTabs />}>
            <div className="w-full max-w-6xl">{children}</div>
        </LoggedLayout>
    );
}
