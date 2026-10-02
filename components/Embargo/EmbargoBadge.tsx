import { MaterialSymbol } from "react-material-symbols";
import { formatShortDate } from "../../lib/embargoDisplay";
import { DatasetEmbargo } from "../../types/GatekeeperAPI";

interface Props {
    embargo?: DatasetEmbargo | null
    compact?: boolean
}

export function EmbargoBadge(props: Props) {
    if (!props.embargo?.active) {
        return null;
    }

    return (
        <span
            data-testid="embargo-badge"
            className="inline-flex items-center gap-1.5 px-2.5 py-[3px] text-xs leading-[18px] font-semibold rounded-full bg-embargo-100 text-embargo-800 whitespace-nowrap"
        >
            <MaterialSymbol icon="lock" size={14} grade={-25} weight={400} fill aria-hidden="true" />
            Embargoed until {formatShortDate(props.embargo.until, !props.compact)}
        </span>
    );
}
