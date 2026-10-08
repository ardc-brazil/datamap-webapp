import { ReactNode } from "react";

interface Props {
    title: string
    subtitle?: ReactNode
    action?: ReactNode
}

export function AdminPageHeader({ title, subtitle, action }: Props) {
    return (
        <div className="flex flex-wrap items-end justify-between gap-4">
            <div className="min-w-0">
                <h2 className="m-0">{title}</h2>
                {subtitle && <p className="m-0 mt-2 text-[15px] leading-[23px] text-primary-600">{subtitle}</p>}
            </div>
            {action}
        </div>
    );
}
