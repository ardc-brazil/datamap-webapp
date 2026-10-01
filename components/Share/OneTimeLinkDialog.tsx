import { useState } from "react";
import { MaterialSymbol } from "react-material-symbols";
import Modal from "../base/PopupModal";

interface Props {
    link: string | null
    kind: "anonymous" | "invitation"
    onDone(): void
}

export function OneTimeLinkDialog(props: Props) {
    const [copied, setCopied] = useState(false);

    async function copy() {
        await navigator.clipboard?.writeText(props.link ?? "");
        setCopied(true);
    }

    return (
        <Modal
            title="Copy the link now"
            show={!!props.link}
            confimButtonText="I've copied it"
            hideCancel
            cancel={() => { setCopied(false); props.onDone(); }}
            confim={() => { setCopied(false); props.onDone(); }}
            maxWidthClassName="max-w-[520px]"
        >
            <div className="flex flex-col gap-3">
                <p className="m-0 text-[13px] leading-[19px] text-primary-500">
                    {props.kind === "anonymous"
                        ? "Shown once. If lost, create a new link and revoke this one."
                        : "Shown once. Send it to them yourself; if lost, revoke the invitation and invite them again."}
                </p>
                <div className="flex items-center rounded-md border border-primary-300">
                    <input
                        aria-label="Link"
                        readOnly
                        value={props.link ?? ""}
                        onFocus={(e) => e.target.select()}
                        className="flex-1 h-11 px-3 border-0 bg-transparent font-mono text-xs text-primary-700 truncate focus:ring-0"
                    />
                    <button type="button" aria-label="Copy" onClick={copy} className="flex items-center gap-1.5 h-11 px-3.5 border-l border-primary-300 text-[13px] font-semibold text-primary-900">
                        <MaterialSymbol icon="content_copy" size={16} grade={-25} weight={400} /> {copied ? "Copied" : "Copy"}
                    </button>
                </div>
                <p className="m-0 text-[13px] leading-[19px] text-primary-500">
                    {props.kind === "anonymous"
                        ? "Works until the dataset is published, then leads to the public page · view count shown in Share, viewers stay anonymous"
                        : "It works once, for whoever opens it; you will see which account accepted."}
                </p>
            </div>
        </Modal>
    );
}
