import { MaterialSymbol } from "react-material-symbols";

export function LockedDownloadButton() {
    return (
        <button
            type="button"
            disabled
            title="The files are under embargo"
            className="inline-flex items-center gap-2 h-[38px] px-3.5 rounded-md border border-primary-200 bg-primary-100 text-primary-400 text-sm font-semibold cursor-not-allowed"
        >
            <MaterialSymbol icon="lock" size={18} grade={-25} weight={400} aria-hidden="true" /> Download
        </button>
    );
}
