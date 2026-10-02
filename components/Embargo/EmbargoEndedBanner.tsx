import { useRouter } from "next/router";
import { useState } from "react";
import { MaterialSymbol } from "react-material-symbols";
import { messageForApiError } from "../../contants/EmbargoConstants";
import { BFFAPI } from "../../gateways/BFFAPI";
import { formatShortDate, tenancyDisplayName } from "../../lib/embargoDisplay";
import { membersOutcomeSentence } from "../../lib/membersAccess";
import { GetDatasetDetailsDOIResponseState, GetDatasetDetailsResponse } from "../../types/BffAPI";
import Modal from "../base/PopupModal";

export function EmbargoEndedBanner(props: { dataset: GetDatasetDetailsResponse }) {
    const [bffGateway] = useState(() => new BFFAPI());
    const router = useRouter();
    const [confirming, setConfirming] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [promoting, setPromoting] = useState(false);
    const doi = props.dataset.current_version?.doi;
    const registered = doi?.state === GetDatasetDetailsDOIResponseState.REGISTERED;
    const draft = doi?.state === GetDatasetDetailsDOIResponseState.DRAFT;
    const tenancy = tenancyDisplayName(props.dataset.tenancy);

    async function promote() {
        if (promoting) {
            return;
        }
        setPromoting(true);
        setError(null);
        try {
            await bffGateway.navigateDOIStatus({
                datasetId: props.dataset.id,
                versionName: props.dataset.current_version.name,
                state: GetDatasetDetailsDOIResponseState.FINDABLE,
            });
            setConfirming(false);
            router.reload();
        } catch (e) {
            setError(messageForApiError(e));
        } finally {
            setPromoting(false);
        }
    }

    return (
        <div role="status" className="grid grid-cols-[40px_minmax(0,1fr)] md:grid-cols-[40px_minmax(0,1fr)_auto] gap-4 items-start rounded-lg border border-primary-200 bg-primary-0 px-6 py-5">
            <span aria-hidden="true" className="flex items-center justify-center h-10 w-10 rounded-full bg-secondary-500 text-primary-900">
                <MaterialSymbol icon="lock_open" size={22} grade={-25} weight={400} />
            </span>
            <div className="flex flex-col gap-2">
                <span className="text-base font-semibold text-primary-900">
                    The embargo ended on {formatShortDate(props.dataset.embargo?.until ?? "", false)}. One step left to publish.
                </span>
                <div className="flex flex-col gap-1.5 text-sm leading-[21px] text-primary-700">
                    <div className="flex gap-2.5">
                        <MaterialSymbol icon="check_circle" size={18} grade={-25} weight={400} fill className="flex-none text-success-500" aria-hidden="true" />
                        <span>Files are available to every member of {tenancy}.</span>
                    </div>
                    <div className="flex gap-2.5">
                        <MaterialSymbol icon="check_circle" size={18} grade={-25} weight={400} fill className="flex-none text-success-500" aria-hidden="true" />
                        <span>{membersOutcomeSentence(tenancy, props.dataset.members_can_edit !== false)}</span>
                    </div>
                    <div className="flex gap-2.5">
                        <MaterialSymbol icon="radio_button_unchecked" size={18} grade={-25} weight={400} className="flex-none text-primary-400" aria-hidden="true" />
                        {registered
                            ? <span>Nothing is public yet. The DOI <span className="font-mono text-[13px]">{doi.identifier}</span> is <strong className="font-semibold">registered but not findable</strong>: it resolves, but DataCite doesn&apos;t index it, so the dataset won&apos;t appear in DataCite search or in services that harvest from it, and there&apos;s no public page.</span>
                            : draft
                                ? <span>Nothing is public yet. The DOI <span className="font-mono text-[13px]">{doi.identifier}</span> is still a draft. Finish registering the DOI in the Citation section, then make it findable.</span>
                                : <span>Nothing is public yet. The dataset has no DOI to promote: create one in the Citation section, then make it findable.</span>}
                    </div>
                </div>
                <span className="text-[13px] text-primary-500">Promoting it publishes the public page with the authors; anonymous links then lead there. Nothing does this for you.</span>
                {error && <p role="alert" className="m-0 text-sm text-danger-700">{error}</p>}
            </div>
            {registered &&
                <div className="flex flex-col items-start md:items-end gap-2">
                    <button type="button" onClick={() => setConfirming(true)} className="h-10 px-3.5 rounded-md bg-primary-900 text-primary-50 text-sm font-semibold whitespace-nowrap hover:bg-primary-800">Make DOI findable</button>
                    <span className="text-xs text-primary-400">Shown until you do</span>
                </div>
            }
            <Modal
                title="Make the DOI findable?"
                show={confirming}
                confimButtonText="Make it findable"
                cancelButtonText="Not yet"
                cancel={() => setConfirming(false)}
                confim={promote}
                confirmDisabled={promoting}
                maxWidthClassName="max-w-[440px]"
            >
                <ul className="m-0 p-0 list-none flex flex-col gap-2.5 text-sm leading-[21px] text-primary-700">
                    <li className="flex gap-2.5"><span className="text-primary-400">—</span><span>The public page is published, with the authors</span></li>
                    <li className="flex gap-2.5"><span className="text-primary-400">—</span><span>DataCite indexes the DOI</span></li>
                    <li className="flex gap-2.5"><span className="text-primary-400">—</span><span>Anonymous links lead to the public page</span></li>
                </ul>
            </Modal>
        </div>
    );
}
