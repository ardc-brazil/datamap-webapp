import { useState } from "react";
import useSWR from "swr";
import { useMembersAccess } from "../../hooks/UseMembersAccess";
import { tenancyDisplayName } from "../../lib/embargoDisplay";
import { fetcher } from "../../lib/fetcher";
import { canChangeMembersAccess, membersAccessDetail, membersCanEditOf } from "../../lib/membersAccess";
import { GetDatasetDetailsResponse } from "../../types/BffAPI";
import { ShareState } from "../../types/GatekeeperAPI";
import { MembersAccessDialog } from "../Share/MembersAccessDialog";
import { ShareDialog } from "../Share/ShareDialog";
import { SettingsBlock } from "./EmbargoSettingsSection";

export function AccessSummary(props: { dataset: GetDatasetDetailsResponse }) {
    const [show, setShow] = useState(false);
    const canShare = props.dataset.access?.can_share === true;
    const { data, mutate } = useSWR(canShare ? `/api/datasets/${props.dataset.id}/share` : null, fetcher);
    const state = data as ShareState;
    const membersAccess = useMembersAccess(props.dataset.id, () => mutate());

    if (!canShare || !state) {
        return null;
    }

    const names = [state.owner.name, ...state.permissions.map((p) => p.level === "write" ? `${p.user.name} (write)` : p.user.name)];
    const pending = state.invitations.filter((i) => !i.accepted_at && !i.revoked_at).length;
    const links = state.anonymous_links.filter((l) => !l.revoked_at).length;
    const parts = [names.join(", "), pending ? `${pending} pending` : "", links ? `${links} anonymous link${links === 1 ? "" : "s"}` : ""].filter(Boolean);
    const embargoActive = props.dataset.embargo?.active === true;
    const tenancyName = tenancyDisplayName(props.dataset.tenancy);
    const membersCanEdit = membersCanEditOf(props.dataset, state);
    const showMembers = !!props.dataset.tenancy && (!!state.tenancy || embargoActive);

    return (
        <SettingsBlock title="Access">
            <div className="rounded-lg border border-primary-200 bg-primary-0 text-sm">
                <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 px-4 py-3.5 border-b border-primary-100 last:border-b-0">
                    <span className="min-w-0 text-primary-900">{parts.join(" · ")}</span>
                    <button type="button" className="text-[13px] font-medium text-primary-600 hover:underline underline-offset-2" onClick={() => setShow(true)}>Open share dialog</button>
                </div>
                {showMembers &&
                    <div className="grid grid-cols-[180px_minmax(0,1fr)_auto] gap-x-3 items-center px-4 py-3.5">
                        <span className="text-primary-500">Members of {tenancyName}</span>
                        <span className="min-w-0 text-primary-900">
                            {membersAccessDetail({ membersCanEdit, embargoActive, members: state.tenancy?.members ?? null })}
                        </span>
                        {canChangeMembersAccess(props.dataset)
                            ? <button
                                type="button"
                                aria-label={`Change what members of ${tenancyName} can do`}
                                className="text-[13px] font-medium text-primary-600 hover:underline underline-offset-2"
                                onClick={membersAccess.open}
                            >
                                Change
                            </button>
                            : <span></span>}
                    </div>
                }
            </div>
            <ShareDialog dataset={props.dataset} show={show} onClose={() => setShow(false)} />
            <MembersAccessDialog
                show={membersAccess.editing}
                tenancyName={tenancyName}
                membersCanEdit={membersCanEdit}
                embargoActive={embargoActive}
                busy={membersAccess.busy}
                error={membersAccess.error}
                onCancel={membersAccess.close}
                onSave={membersAccess.save}
            />
        </SettingsBlock>
    );
}
