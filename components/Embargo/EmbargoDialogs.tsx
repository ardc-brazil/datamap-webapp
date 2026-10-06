import { useRouter } from "next/router";
import { useRef, useState } from "react";
import useSWR from "swr";
import { EDIT_FORM_ERROR_CLASS, EDIT_FORM_INPUT_CLASS } from "../../contants/EditFormConstants";
import { messageForApiError } from "../../contants/EmbargoConstants";
import { BFFAPI } from "../../gateways/BFFAPI";
import { maxEmbargoDate, minExtensionDate, toEmbargoUntil, validateEmbargoDate } from "../../lib/embargoDates";
import { formatShortDate, tenancyDisplayName } from "../../lib/embargoDisplay";
import { fetcher } from "../../lib/fetcher";
import { GetDatasetDetailsResponse } from "../../types/BffAPI";
import { ShareState } from "../../types/GatekeeperAPI";
import { ConsequenceList } from "../base/ConsequenceList";
import Modal from "../base/PopupModal";

interface DialogProps {
    dataset: GetDatasetDetailsResponse
    show: boolean
    onClose(): void
}

function useAction(onClose: () => void) {
    const router = useRouter();
    const [error, setError] = useState<string | null>(null);
    const [busy, setBusy] = useState(false);
    const busyRef = useRef(false);

    async function run(action: () => Promise<unknown>) {
        if (busyRef.current) {
            return;
        }
        busyRef.current = true;
        setBusy(true);
        setError(null);
        try {
            await action();
            onClose();
            router.reload();
        } catch (e) {
            setError(messageForApiError(e));
        } finally {
            busyRef.current = false;
            setBusy(false);
        }
    }

    return { error, setError, busy, run };
}

export function ExtendEmbargoDialog(props: DialogProps) {
    const [bffGateway] = useState(() => new BFFAPI());
    const [date, setDate] = useState("");
    const [reason, setReason] = useState("");
    const { error, setError, busy, run } = useAction(props.onClose);
    const now = new Date();
    const embargo = props.dataset.embargo;
    if (!embargo) {
        return null;
    }
    const min = minExtensionDate(embargo.until, now);
    const max = maxEmbargoDate(now);

    function confirm() {
        const message = validateEmbargoDate(date, now, min);
        if (message) {
            setError(message);
            return;
        }
        run(() => bffGateway.extendEmbargo(props.dataset.id, { until: toEmbargoUntil(date), reason: reason.trim() || null }));
    }

    return (
        <Modal
            title="Extend embargo"
            show={props.show}
            confimButtonText={date ? `Extend to ${formatShortDate(toEmbargoUntil(date), false)}` : "Extend"}
            cancelButtonText="Cancel"
            cancel={props.onClose}
            confim={confirm}
            confirmDisabled={busy}
            maxWidthClassName="max-w-[440px]"
        >
            <div className="flex flex-col gap-4">
                <p className="m-0 text-[13px] text-primary-500">Ends {formatShortDate(embargo.until)}</p>
                <div className="flex flex-col gap-1.5">
                    <label htmlFor="extend-until" className="m-0 text-[13px] font-semibold text-primary-900">New end date</label>
                    <input id="extend-until" type="date" min={min} max={max} value={date} onChange={(e) => setDate(e.target.value)} className={EDIT_FORM_INPUT_CLASS} />
                    <span className="text-xs text-primary-500">Up to 90 days from today · {formatShortDate(toEmbargoUntil(max))}</span>
                </div>
                <div className="flex flex-col gap-1.5">
                    <label htmlFor="extend-reason" className="m-0 text-[13px] font-semibold text-primary-900">Reason <span className="font-normal text-primary-400">optional</span></label>
                    <input id="extend-reason" type="text" maxLength={500} placeholder="Second review round requested" value={reason} onChange={(e) => setReason(e.target.value)} className={EDIT_FORM_INPUT_CLASS} />
                </div>
                {error && <p role="alert" className={EDIT_FORM_ERROR_CLASS}>{error}</p>}
            </div>
        </Modal>
    );
}

export function EndEmbargoDialog(props: DialogProps) {
    const [bffGateway] = useState(() => new BFFAPI());
    const { error, busy, run } = useAction(props.onClose);
    const { data } = useSWR(props.show ? `/api/datasets/${props.dataset.id}/share` : null, fetcher);
    const people = (data as ShareState)?.permissions?.length ?? 0;
    const tenancy = tenancyDisplayName(props.dataset.tenancy);
    const emailed = people === 0
        ? "Nobody else has access; only you are emailed"
        : `${people} ${people === 1 ? "person" : "people"} with access ${people === 1 ? "is" : "are"} emailed`;

    return (
        <Modal
            title="End embargo now?"
            show={props.show}
            confimButtonText="End embargo"
            cancelButtonText="Keep embargo"
            destructive
            cancel={props.onClose}
            confim={() => run(() => bffGateway.endEmbargo(props.dataset.id))}
            confirmDisabled={busy}
            maxWidthClassName="max-w-[440px]"
        >
            <div className="flex flex-col gap-4">
                <p className="m-0 text-[13px] text-primary-500">Set to end {formatShortDate(props.dataset.embargo?.until ?? "")} · can&apos;t be undone</p>
                <ConsequenceList items={[
                    `Files open to ${tenancy} members now`,
                    "Nothing becomes public until the DOI is promoted",
                    "Anonymous links keep showing the redacted page until you publish",
                    emailed,
                ]} />
                {error && <p role="alert" className={EDIT_FORM_ERROR_CLASS}>{error}</p>}
            </div>
        </Modal>
    );
}

export function EmbargoModeDialog(props: DialogProps) {
    const [bffGateway] = useState(() => new BFFAPI());
    const { error, busy, run } = useAction(props.onClose);
    const visible = props.dataset.embargo?.metadata_visible === true;
    const tenancy = tenancyDisplayName(props.dataset.tenancy);

    return (
        <Modal
            title={visible ? "Hide from members?" : "Show to members?"}
            show={props.show}
            confimButtonText={visible ? "Hide dataset" : "Show dataset"}
            cancelButtonText="Cancel"
            cancel={props.onClose}
            confim={() => run(() => bffGateway.setEmbargoMode(props.dataset.id, { metadata_visible: !visible }))}
            confirmDisabled={busy}
            maxWidthClassName="max-w-[440px]"
        >
            <div className="flex flex-col gap-4">
                <p className="m-0 text-[13px] text-primary-500">
                    {visible ? "Currently listed with an \"Embargoed\" badge" : `Currently hidden from members of ${tenancy}`}
                </p>
                <ConsequenceList items={visible
                    ? ["Removed from listings and search for everyone without access", "Administrators included", "File access unchanged"]
                    : [`Listed for members of ${tenancy} with an "Embargoed" badge`, "Title, description and authors readable; file names and downloads withheld", "File access unchanged"]} />
                {error && <p role="alert" className={EDIT_FORM_ERROR_CLASS}>{error}</p>}
            </div>
        </Modal>
    );
}

export function EmbargoNoteDialog(props: DialogProps) {
    const [bffGateway] = useState(() => new BFFAPI());
    const [note, setNote] = useState(props.dataset.embargo?.note ?? "");
    const { error, busy, run } = useAction(props.onClose);

    return (
        <Modal
            title="Edit note"
            show={props.show}
            confimButtonText="Save note"
            cancelButtonText="Cancel"
            cancel={props.onClose}
            confim={() => run(() => bffGateway.setEmbargoNote(props.dataset.id, { note: note.trim() || null }))}
            confirmDisabled={busy}
            maxWidthClassName="max-w-[440px]"
        >
            <div className="flex flex-col gap-1.5">
                <label htmlFor="embargo-note" className="m-0 text-[13px] font-semibold text-primary-900">Note</label>
                <input id="embargo-note" type="text" maxLength={2000} value={note} onChange={(e) => setNote(e.target.value)} className={EDIT_FORM_INPUT_CLASS} />
                <span className="text-xs text-primary-500">Visible to you and the people with access.</span>
                {error && <p role="alert" className={EDIT_FORM_ERROR_CLASS}>{error}</p>}
            </div>
        </Modal>
    );
}
