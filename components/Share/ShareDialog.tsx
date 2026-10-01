import { useState } from "react";
import { useSession } from "next-auth/react";
import { MaterialSymbol } from "react-material-symbols";
import useSWR from "swr";
import { messageForApiError } from "../../contants/EmbargoConstants";
import { BFFAPI } from "../../gateways/BFFAPI";
import { tenancyDisplayName } from "../../lib/embargoDisplay";
import { fetcher } from "../../lib/fetcher";
import { GetDatasetDetailsResponse } from "../../types/BffAPI";
import { GrantRequest, PermissionLevel, SharePermission, ShareState } from "../../types/GatekeeperAPI";
import { AccessList } from "./AccessList";
import { AnonymousLinksSection } from "./AnonymousLinksSection";
import { NewAnonymousLinkDialog } from "./NewAnonymousLinkDialog";
import { OneTimeLinkDialog } from "./OneTimeLinkDialog";
import { RemoveAccessDialog } from "./RemoveAccessDialog";
import { ShareInput } from "./ShareInput";

interface Props {
    dataset: GetDatasetDetailsResponse
    show: boolean
    onClose(): void
}

export function ShareDialog(props: Props) {
    const [bffGateway] = useState(() => new BFFAPI());
    const session = useSession();
    const [error, setError] = useState<string | null>(null);
    const [busy, setBusy] = useState(false);
    const [oneTime, setOneTime] = useState<{ link: string, kind: "anonymous" | "invitation" } | null>(null);
    const [newLink, setNewLink] = useState(false);
    const [removing, setRemoving] = useState<SharePermission | null>(null);
    const datasetId = props.dataset.id;
    const embargoActive = props.dataset.embargo?.active === true;

    const { data, error: loadError, mutate } = useSWR(props.show ? `/api/datasets/${datasetId}/share` : null, fetcher);
    const state = data as ShareState;

    if (!props.show) {
        return null;
    }

    async function run<T>(action: () => Promise<T>): Promise<T | undefined> {
        if (busy) {
            return undefined;
        }
        setBusy(true);
        setError(null);
        try {
            const result = await action();
            await mutate();
            return result;
        } catch (e) {
            setError(messageForApiError(e));
            return undefined;
        } finally {
            setBusy(false);
        }
    }

    async function onGrant(request: GrantRequest) {
        const result = await run(() => bffGateway.grantAccess(datasetId, request));
        if (result?.kind === "invitation" && !result.invitation.email) {
            setOneTime({ link: result.link, kind: "invitation" });
        }
    }

    return (
        <>
            <div className="fixed inset-0 z-40 bg-primary-900/40" aria-hidden="true"></div>
            <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto p-4">
                <div role="dialog" aria-modal="true" aria-labelledby="share-dialog-title" className="flex flex-col w-full max-w-[640px] max-h-[calc(100vh-2rem)] bg-primary-0 border border-primary-300 rounded-xl shadow-xl shadow-primary-900/20">
                    <div className="flex justify-between items-start gap-4 px-6 pt-5 pb-4">
                        <div className="flex flex-col gap-0.5 min-w-0">
                            <h3 id="share-dialog-title" className="m-0 text-lg font-semibold tracking-[-0.01em] text-primary-900">Share</h3>
                            <span className="text-[13px] text-primary-500 truncate">{props.dataset.name}{embargoActive ? "" : " · not under embargo"}</span>
                        </div>
                        <button type="button" aria-label="Close" onClick={props.onClose} className="text-primary-500 hover:text-primary-900">
                            <MaterialSymbol icon="close" size={20} grade={-25} weight={400} />
                        </button>
                    </div>

                    <div className="flex flex-col gap-4 px-6 pb-5 overflow-y-auto">
                        <ShareInput datasetId={datasetId} tenancyName={tenancyDisplayName(props.dataset.tenancy)} onGrant={onGrant} busy={busy} />
                        {error && <p role="alert" className="m-0 text-sm text-danger-700">{error}</p>}
                        {loadError && <p className="m-0 text-sm text-danger-700">The people with access could not be loaded.</p>}
                        {state &&
                            <AccessList
                                state={state}
                                embargoActive={embargoActive}
                                me={(session?.data?.user as any)?.uid}
                                onChangeLevel={(userId, level: PermissionLevel) => run(() => bffGateway.changePermissionLevel(datasetId, userId, level))}
                                onRemove={(permission) => setRemoving(permission)}
                                onRevokeInvitation={(id) => run(() => bffGateway.revokeInvitation(datasetId, id))}
                            />
                        }
                        {state && embargoActive &&
                            <div className="border-t border-primary-200 pt-4">
                                <AnonymousLinksSection
                                    links={state.anonymous_links}
                                    onNew={() => setNewLink(true)}
                                    onRevoke={(id) => run(() => bffGateway.revokeAnonymousLink(datasetId, id))}
                                />
                            </div>
                        }
                    </div>

                    <div className="flex justify-between items-center gap-4 px-6 py-3.5 border-t border-primary-200 bg-primary-50 rounded-b-xl">
                        <span className="text-xs leading-[17px] text-primary-500">
                            {embargoActive ? "Access continues after the embargo ends" : "Anonymous links are available under embargo"}
                        </span>
                        <button type="button" onClick={props.onClose} className="h-9 px-4 rounded-md bg-primary-900 text-primary-50 text-sm font-semibold hover:bg-primary-800">Done</button>
                    </div>
                </div>
            </div>

            <NewAnonymousLinkDialog
                show={newLink}
                busy={busy}
                onCancel={() => setNewLink(false)}
                onCreate={async (label) => {
                    const result = await run(() => bffGateway.createAnonymousLink(datasetId, label));
                    setNewLink(false);
                    if (result) setOneTime({ link: result.link, kind: "anonymous" });
                }}
            />
            <OneTimeLinkDialog link={oneTime?.link ?? null} kind={oneTime?.kind ?? "anonymous"} onDone={() => setOneTime(null)} />
            <RemoveAccessDialog
                permission={removing}
                embargoActive={embargoActive}
                onCancel={() => setRemoving(null)}
                onConfirm={(permission) => {
                    setRemoving(null);
                    run(() => bffGateway.revokePermission(datasetId, permission.user.id));
                }}
            />
        </>
    );
}
