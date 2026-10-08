import { MaterialSymbol } from "react-material-symbols";
import { ADMIN_COPY } from "../../contants/AdminConstants";

interface Props {
    label: string
    value: string
    onChange(value: string): void
    className?: string
}

export function AdminSearchField({ label, value, onChange, className }: Props) {
    return (
        <div className={className ? `relative ${className}` : "relative"}>
            <MaterialSymbol icon="search" size={18} weight={400} grade={-25} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-primary-500" />
            <input
                type="search"
                aria-label={label}
                placeholder={ADMIN_COPY.searchPlaceholder}
                value={value}
                onChange={(event) => onChange(event.target.value)}
                className="h-9 py-0 pl-9"
            />
        </div>
    );
}
