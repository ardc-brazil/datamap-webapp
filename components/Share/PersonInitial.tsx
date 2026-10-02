import { MaterialSymbol } from "react-material-symbols";
import { initialsOf } from "../../lib/embargoDisplay";

interface Props {
    name?: string | null
    owner?: boolean
    pendingIcon?: "mail" | "badge"
}

export function PersonInitial(props: Props) {
    if (props.pendingIcon) {
        return (
            <span aria-hidden="true" className="flex flex-none items-center justify-center h-8 w-8 rounded-full border border-dashed border-primary-400 bg-primary-0 text-primary-500">
                <MaterialSymbol icon={props.pendingIcon} size={16} grade={-25} weight={400} />
            </span>
        );
    }
    const colours = props.owner ? "bg-primary-900 text-primary-50" : "bg-secondary-900 text-primary-900";
    return (
        <span aria-hidden="true" className={`flex flex-none items-center justify-center h-8 w-8 rounded-full text-xs font-semibold ${colours}`}>
            {initialsOf(props.name ?? "")}
        </span>
    );
}
