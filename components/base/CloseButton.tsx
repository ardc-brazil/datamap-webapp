import { MaterialSymbol } from "react-material-symbols";

export default function CloseButton(props) {
    return <button
        className="flex flex-none items-center justify-center h-10 w-10 rounded-md text-primary-500 hover:bg-primary-100 hover:text-primary-900 transition-colors"
        type="button"
        aria-label={props.label ?? "Remove"}
        title={props.label ?? "Remove"}
        onClick={props.onClick}
    >
        <MaterialSymbol icon="close" size={18} grade={-25} weight={400} />
    </button>;
}
