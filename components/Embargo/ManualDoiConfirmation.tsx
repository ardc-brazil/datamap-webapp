import { ConsequenceList } from "../base/ConsequenceList";
import Modal from "../base/PopupModal";
import { ManualDoiGate } from "../../lib/embargoState";

interface Props {
    gate: ManualDoiGate
    identifier: string
    tenancyName: string
    show: boolean
    sending?: boolean
    onConfirm(): void
    onCancel(): void
    onSetEmbargo?(): void
}

export function ManualDoiConfirmation(props: Props) {
    if (props.gate === "owner_only") {
        return (
            <Modal title="Only the owner can do this" show={props.show} confimButtonText="" cancelButtonText="Close" cancel={props.onCancel} maxWidthClassName="max-w-[440px]">
                <p className="m-0 text-sm leading-[21px] text-primary-700">
                    A DOI minted outside DataMap ends the embargo. Only the owner of this dataset can end its embargo.
                    To keep the embargo, generate the DOI with DataMap instead.
                </p>
            </Modal>
        );
    }

    if (props.gate === "ends_embargo") {
        return (
            <Modal
                title="External DOI ends the embargo"
                show={props.show}
                confimButtonText="End embargo and register DOI"
                cancelButtonText="Cancel"
                destructive
                cancel={props.onCancel}
                confim={props.onConfirm}
                confirmDisabled={props.sending}
                cancelDisabled={props.sending}
                maxWidthClassName="max-w-[440px]"
            >
                <div className="flex flex-col gap-4">
                    <p className="m-0 font-mono text-[13px] text-primary-500">{props.identifier} · minted outside DataMap</p>
                    <ConsequenceList items={[
                        "Embargo ends · can't be undone",
                        `Files open to ${props.tenancyName} members now`,
                        "Public page published, with authors",
                        "Anonymous links redirect to it",
                    ]} />
                    <p className="m-0 text-[13px] text-primary-500">To keep the embargo, generate the DOI with DataMap instead.</p>
                </div>
            </Modal>
        );
    }

    return (
        <Modal
            title="Register external DOI?"
            show={props.show}
            confimButtonText="Register DOI"
            cancelButtonText="Cancel"
            cancel={props.onCancel}
            confim={props.onConfirm}
            confirmDisabled={props.sending}
            cancelDisabled={props.sending}
            maxWidthClassName="max-w-[440px]"
        >
            <div className="flex flex-col gap-3">
                <p className="m-0 font-mono text-[13px] text-primary-500">{props.identifier}</p>
                <p className="m-0 text-sm leading-[21px] text-primary-700">After this, the dataset can no longer be put under embargo.</p>
                {props.onSetEmbargo &&
                    <button
                        type="button"
                        disabled={props.sending}
                        onClick={() => props.onSetEmbargo()}
                        className="self-start p-0 bg-transparent border-0 text-[13px] font-semibold text-primary-900 underline underline-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        Set an embargo first
                    </button>
                }
            </div>
        </Modal>
    );
}
