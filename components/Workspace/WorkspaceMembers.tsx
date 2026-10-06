import { useState } from "react";
import { mutate } from "swr";
import { SHARE_PERSON_DETAIL_CLASS, SHARE_PERSON_NAME_CLASS, SHARE_ROW_CLASS, SHARE_SECTION_LABEL_CLASS } from "../../contants/ShareConstants";
import { WORKSPACE_PAGE_SIZE, tenancyErrorMessage, workspaceInvitationsKey } from "../../contants/TenancyConstants";
import { useMembersPageTenancy, useWorkspaceMembers } from "../../hooks/UseWorkspace";
import { GatekeeperPage, TenancySummary, WorkspaceMember } from "../../types/GatekeeperAPI";
import { PersonInitial } from "../Share/PersonInitial";
import { InviteMemberDialog } from "./InviteMemberDialog";
import { WorkspaceInvitations } from "./WorkspaceInvitations";

export const NO_MEMBERS_PAGE = "This tenancy has no Members page. Everyone on DataMap is in Public, and legacy tenancies are read-only.";

function LoadError({ detail }: { detail?: string }) {
    return <p role="alert" className="m-0 mt-3 text-sm text-danger-700">{tenancyErrorMessage(detail)}</p>;
}

export function WorkspaceMembers() {
    const { tenancy, loading, error } = useMembersPageTenancy();

    if (loading) {
        return <p role="status" className="m-0 text-sm text-primary-500">Loading…</p>;
    }
    if (!tenancy) {
        return (
            <div className="w-full max-w-5xl mx-auto">
                <h2 className="m-0">Members</h2>
                {error
                    ? <LoadError detail={error.detail} />
                    : <p className="mt-2 mb-0 text-[15px] leading-[23px] text-primary-600">{NO_MEMBERS_PAGE}</p>}
            </div>
        );
    }
    return <MembersOf tenancy={tenancy} />;
}

function MembersOf({ tenancy }: { tenancy: TenancySummary }) {
    const { data, error, size, setSize, isValidating } = useWorkspaceMembers(tenancy.path);
    const [inviting, setInviting] = useState(false);

    const pages: GatekeeperPage<WorkspaceMember>[] = data ?? [];
    const members = pages.flatMap((page) => page.items);
    const total = pages[0]?.total_count ?? 0;
    const remaining = Math.min(WORKSPACE_PAGE_SIZE, total - members.length);

    return (
        <div className="w-full max-w-5xl mx-auto">
            <div className="flex flex-wrap justify-between items-end gap-6">
                <div>
                    <h2 className="m-0">Members</h2>
                    <p className="mt-2 mb-0 text-[15px] leading-[23px] text-primary-600">
                        {tenancy.display_name} · <span className="font-mono text-[13px]">{tenancy.path}</span>
                    </p>
                </div>
                <button type="button" className="btn-primary m-0 flex-none" onClick={() => setInviting(true)}>+ Invite</button>
            </div>

            <section aria-label={`Members of ${tenancy.display_name}`} className="mt-8">
                <h3 className={SHARE_SECTION_LABEL_CLASS}>{`Members · ${data ? total : "…"}`}</h3>
                {!data ? (
                    error
                        ? <LoadError detail={error.detail} />
                        : <p role="status" className="m-0 mt-3 text-sm text-primary-500">Loading members…</p>
                ) : (
                    <>
                        <ul className="m-0 mt-3 p-0 px-4 list-none rounded-lg border border-primary-200 bg-primary-0 divide-y divide-primary-100">
                            {members.map((member) => (
                                <li key={member.id} className={SHARE_ROW_CLASS}>
                                    <PersonInitial name={member.name} />
                                    <span className="flex flex-col min-w-0">
                                        <span className={SHARE_PERSON_NAME_CLASS}>{member.name}</span>
                                        {member.orcid && <span className={`${SHARE_PERSON_DETAIL_CLASS} font-mono`}>{member.orcid}</span>}
                                    </span>
                                    <span></span>
                                </li>
                            ))}
                        </ul>
                        {error && <LoadError detail={error.detail} />}
                        {remaining > 0 &&
                            <button
                                type="button"
                                disabled={isValidating}
                                onClick={() => setSize(size + 1)}
                                className="mt-3 text-[13px] font-semibold text-primary-900 hover:text-primary-600 disabled:opacity-50"
                            >
                                {`Show ${remaining} more`}
                            </button>}
                    </>
                )}
            </section>

            <WorkspaceInvitations tenancy={tenancy} />
            <InviteMemberDialog
                tenancy={tenancy}
                show={inviting}
                onClose={() => setInviting(false)}
                onInvited={() => mutate(workspaceInvitationsKey(tenancy.path))}
            />
        </div>
    );
}
