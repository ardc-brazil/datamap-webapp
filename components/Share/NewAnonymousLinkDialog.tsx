import { useState } from "react";
import { MaterialSymbol } from "react-material-symbols";
import { EDIT_FORM_INPUT_CLASS } from "../../contants/EditFormConstants";
import { ANONYMOUS_LINK_LABEL_MAX } from "../../contants/EmbargoConstants";
import Modal from "../base/PopupModal";

interface Props {
    show: boolean
    busy?: boolean
    onCreate(label: string): Promise<void>
    onCancel(): void
}

export function NewAnonymousLinkDialog(props: Props) {
    const [label, setLabel] = useState("");

    return (
        <Modal
            title="New anonymous link"
            show={props.show}
            confimButtonText="Create link"
            cancelButtonText="Cancel"
            cancel={() => { setLabel(""); props.onCancel(); }}
            confim={async () => {
                if (props.busy) {
                    return;
                }
                if (label.trim()) {
                    await props.onCreate(label.trim());
                    setLabel("");
                }
            }}
            confirmDisabled={props.busy}
            maxWidthClassName="max-w-[520px]"
        >
            <div className="flex flex-col gap-4">
                <p className="m-0 text-[13px] leading-[19px] text-primary-500">
                    Metadata only · authors, institution, references and DOI redacted. Can be used to share with publication reviewers.
                </p>
                <div className="flex flex-col gap-1.5">
                    <label htmlFor="anonymous-link-label" className="m-0 text-[13px] font-semibold text-primary-900">
                        Label <span className="font-normal text-primary-400">only you see it</span>
                    </label>
                    <input
                        id="anonymous-link-label"
                        type="text"
                        className={EDIT_FORM_INPUT_CLASS}
                        maxLength={ANONYMOUS_LINK_LABEL_MAX}
                        placeholder="JGR Atmospheres, round 2"
                        value={label}
                        onChange={(e) => setLabel(e.target.value)}
                    />
                </div>
                <div className="flex gap-2.5 items-start rounded-md bg-embargo-100 px-3 py-2.5 text-xs leading-[18px] text-embargo-800">
                    <MaterialSymbol icon="warning" size={18} grade={-25} weight={400} className="flex-none" />
                    <span>Free text isn&apos;t redacted — check the description for names.</span>
                </div>
            </div>
        </Modal>
    );
}
