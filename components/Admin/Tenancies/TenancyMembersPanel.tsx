import { useState } from "react";
import { MaterialSymbol } from "react-material-symbols";
import { ADMIN_COPY, ADMIN_PAGE_SIZE, adminErrorMessage } from "../../../contants/AdminConstants";
import { SHARE_PERSON_DETAIL_CLASS, SHARE_PERSON_NAME_CLASS } from "../../../contants/ShareConstants";
import { BFFAPI } from "../../../gateways/BFFAPI";
import { revalidateAdminTenancies, useTenancyMembers } from "../../../hooks/UseAdmin";
import { useRowActions } from "../../../hooks/UseRowActions";
import { nextPageCount } from "../../../lib/paging";
import { invitedLine } from "../../../lib/tenancySelection";
import { AdminTenancy, TenancyMember, TenancyMembers } from "../../../types/GatekeeperAPI";
import { PersonInitial } from "../../Share/PersonInitial";
import { AdminLoadError } from "../AdminLoadError";
import { AddMemberDialog } from "./AddMemberDialog";
import { RemoveMemberDialog } from "./RemoveMemberDialog";

const STATE = "m-0 px-4 pb-4 text-[13px] text-primary-500";
const ROW = "flex items-center gap-3 border-t border-primary-100 px-4 py-2.5";

export function TenancyMembersPanel({ tenancy }: { tenancy: AdminTenancy }) {
    const listed = !tenancy.is_default;
    const manageable = listed && !tenancy.is_legacy && tenancy.is_enabled;
    const { data, error, size, setSize, mutate, isValidating } = useTenancyMembers(listed ? tenancy.path : null);
    const [adding, setAdding] = useState(false);
    const [removing, setRemoving] = useState<TenancyMember | null>(null);

    const pages: TenancyMembers[] = data ?? [];
    const members = pages.flatMap((page) => page.members.items);
    const invitations = pages[0]?.invitations ?? [];
    const total = pages[0]?.members.total_count ?? 0;
    const remaining = nextPageCount(total, members.length, ADMIN_PAGE_SIZE);

    function revalidate() {
        return Promise.all([mutate(), revalidateAdminTenancies()]);
    }

    const rows = useRowActions(revalidate, adminErrorMessage);

    const loadError = error && (
        <div className="px-4 pb-4"><AdminLoadError message={ADMIN_COPY.membersLoadError} onRetry={() => mutate()} /></div>
    );

    function changed() {
        setAdding(false);
        setRemoving(null);
        revalidate();
    }

    return (
        <aside aria-label={`Members of ${tenancy.display_name}`} className="rounded-lg border border-primary-200 bg-primary-0">
            <div className="border-b border-primary-200 px-4 py-3.5">
                <p className="m-0 text-sm font-semibold text-primary-900">{tenancy.display_name}</p>
                <p className="m-0 font-mono text-xs text-primary-500">{tenancy.path}</p>
            </div>

            {!listed ? (
                <p className="m-0 px-4 py-4 text-[13px] text-primary-700">{`Everyone · ${tenancy.members} accounts`}</p>
            ) : (
                <>
                    <div className="flex items-center justify-between px-4 pt-3.5 pb-2">
                        <span className="text-[13px] font-semibold text-primary-900">{`Members · ${data ? total : "…"}`}</span>
                        {manageable && (
                            <button type="button" data-testid="admin-member-add" onClick={() => setAdding(true)} className="text-[13px] font-semibold text-primary-900 hover:text-primary-600">+ Add</button>
                        )}
                    </div>
                    {!data ? (
                        loadError || <p role="status" className={STATE}>Loading members…</p>
                    ) : members.length === 0 && invitations.length === 0 ? (
                        <p className={STATE}>{ADMIN_COPY.membersEmpty}</p>
                    ) : (
                        <>
                            <ul className="m-0 list-none p-0">
                                {members.map((member) => (
                                    <li key={member.id} className={ROW}>
                                        <PersonInitial name={member.name} />
                                        <div className="min-w-0 flex-1">
                                            <p className={`m-0 ${SHARE_PERSON_NAME_CLASS}`}>{member.name}</p>
                                            <p className={`m-0 ${SHARE_PERSON_DETAIL_CLASS}`}>{member.email ?? "No email"}</p>
                                            {member.invited_by && <p className={`m-0 ${SHARE_PERSON_DETAIL_CLASS}`}>{`invited by ${member.invited_by.name}`}</p>}
                                        </div>
                                        {manageable && (
                                            <button
                                                type="button"
                                                aria-label={`Remove ${member.name}`}
                                                onClick={() => setRemoving(member)}
                                                className="flex h-7 w-7 flex-none items-center justify-center rounded-md text-primary-400 hover:bg-primary-100 hover:text-primary-900"
                                            >
                                                <MaterialSymbol icon="close" size={18} weight={400} grade={-25} />
                                            </button>
                                        )}
                                    </li>
                                ))}
                                {invitations.map((invitation) => (
                                    <li key={invitation.id} className={ROW}>
                                        <PersonInitial pendingIcon="mail" />
                                        <div className="min-w-0 flex-1">
                                            <p className={`m-0 ${SHARE_PERSON_NAME_CLASS}`}>{invitation.user.name}</p>
                                            {invitation.user.email && <p className={`m-0 ${SHARE_PERSON_DETAIL_CLASS}`}>{invitation.user.email}</p>}
                                            <p className={`m-0 ${SHARE_PERSON_DETAIL_CLASS}`}>{invitedLine(invitation)}</p>
                                            {rows.error(invitation.id) && <p role="alert" className="m-0 text-xs text-danger-700">{rows.error(invitation.id)}</p>}
                                        </div>
                                        <button
                                            type="button"
                                            aria-label={`Withdraw the invitation of ${invitation.user.name}`}
                                            disabled={rows.busy(invitation.id)}
                                            onClick={() => rows.run(invitation.id, () => new BFFAPI().withdrawTenancyInvitationAsAdmin(invitation.id))}
                                            className="flex-none text-[13px] font-semibold text-danger-700 hover:text-danger-800 disabled:opacity-50"
                                        >
                                            Withdraw
                                        </button>
                                    </li>
                                ))}
                            </ul>
                            {remaining > 0 && (
                                <button
                                    type="button"
                                    disabled={isValidating}
                                    onClick={() => setSize(size + 1)}
                                    className="block w-full border-t border-primary-100 px-4 py-2.5 text-left text-[13px] font-semibold text-primary-900 hover:bg-primary-50"
                                >
                                    {`Show ${remaining} more`}
                                </button>
                            )}
                        </>
                    )}
                    {data && loadError && <div className="pt-3">{loadError}</div>}
                </>
            )}

            {adding && <AddMemberDialog tenancy={tenancy} onCancel={() => setAdding(false)} onAdded={changed} />}
            {removing && <RemoveMemberDialog tenancy={tenancy} member={removing} onCancel={() => setRemoving(null)} onRemoved={changed} />}
        </aside>
    );
}
