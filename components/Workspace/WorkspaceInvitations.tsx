import { useState } from "react";
import {
    SHARE_DANGER_ACTION_CLASS,
    SHARE_PERSON_DETAIL_CLASS,
    SHARE_PERSON_NAME_CLASS,
    SHARE_ROW_CLASS,
    SHARE_SECTION_LABEL_CLASS,
} from "../../contants/ShareConstants";
import { BFFAPI } from "../../gateways/BFFAPI";
import { useRowActions } from "../../hooks/UseRowActions";
import { useWorkspaceInvitations } from "../../hooks/UseWorkspace";
import { formatShortDate } from "../../lib/embargoDisplay";
import { TenancySummary, WorkspaceInvitation } from "../../types/GatekeeperAPI";
import { PersonInitial } from "../Share/PersonInitial";

function invitedLine(invitation: WorkspaceInvitation): string {
    const by = invitation.invited_by ? `invited by ${invitation.invited_by.name}` : "invited";
    return `${by} ${formatShortDate(invitation.created_at, false)} · not accepted yet`;
}

export function WorkspaceInvitations({ tenancy }: { tenancy: TenancySummary }) {
    const { data: invitations, mutate } = useWorkspaceInvitations(tenancy.path);
    const [bffGateway] = useState(() => new BFFAPI());
    const rows = useRowActions(mutate);

    if (!invitations || invitations.length === 0) {
        return null;
    }

    function withdraw(invitation: WorkspaceInvitation) {
        return rows.run(invitation.id, async () => {
            await bffGateway.withdrawWorkspaceInvitation(tenancy.path, invitation.id);
        });
    }

    return (
        <section aria-label="Pending invitations" className="mt-10">
            <h3 className={SHARE_SECTION_LABEL_CLASS}>Pending invitations</h3>
            <ul className="m-0 mt-3 p-0 px-4 list-none rounded-lg border border-dashed border-primary-300 bg-primary-0">
                {invitations.map((invitation) => (
                    <li key={invitation.id} className={SHARE_ROW_CLASS}>
                        <PersonInitial pendingIcon="mail" />
                        <span className="flex flex-col min-w-0">
                            <span className={SHARE_PERSON_NAME_CLASS}>{invitation.user.name}</span>
                            <span className={SHARE_PERSON_DETAIL_CLASS}>{invitedLine(invitation)}</span>
                            {rows.error(invitation.id) &&
                                <span role="alert" className="text-xs text-danger-700">{rows.error(invitation.id)}</span>}
                        </span>
                        {invitation.can_withdraw
                            ? <button
                                type="button"
                                aria-label={`Withdraw the invitation of ${invitation.user.name}`}
                                className={SHARE_DANGER_ACTION_CLASS}
                                disabled={rows.busy(invitation.id)}
                                onClick={() => withdraw(invitation)}
                            >
                                Withdraw
                            </button>
                            : <span></span>}
                    </li>
                ))}
            </ul>
        </section>
    );
}
