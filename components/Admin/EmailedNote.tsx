import { MaterialSymbol } from "react-material-symbols";

export function EmailedNote({ text }: { text: string }) {
    return (
        <p className="m-0 flex items-center gap-2 rounded-md bg-primary-100 px-3 py-2.5 text-[13px] text-primary-700">
            <MaterialSymbol icon="mail" size={18} weight={400} grade={-25} />
            <span>{text}</span>
        </p>
    );
}
