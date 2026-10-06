import { useSession } from "next-auth/react";
import Router from "next/router";
import { useState } from "react";
import { ROUTE_PAGE_HOME } from "../../contants/InternalRoutesConstants";
import { BFFAPI } from "../../gateways/BFFAPI";
import { useRowActions } from "../../hooks/UseRowActions";
import { useTenancyInvitations } from "../../hooks/UseTenancies";
import { formatShortDate } from "../../lib/embargoDisplay";
import { TenancyInvitation, TenancySummary } from "../../types/GatekeeperAPI";
import { useTenancyStore } from "../TenancyStore";
import { TenancyIcon } from "./TenancyIcon";

function invitationTitle(invitation: TenancyInvitation): string {
    return invitation.invited_by
        ? `${invitation.invited_by.name} invited you to ${invitation.tenancy.display_name}`
        : `You were invited to ${invitation.tenancy.display_name}`;
}

function invitationDetail(invitation: TenancyInvitation): string {
    return `${invitation.datasets} ${invitation.datasets === 1 ? "dataset" : "datasets"} · ${formatShortDate(invitation.created_at, false)}`;
}

export function TenancyInvitationsPanel(props: { className?: string }) {
    const { data: invitations, mutate } = useTenancyInvitations();
    const { update } = useSession();
    const setTenancySelected = useTenancyStore((state) => state.setTenancySelected);
    const [bffGateway] = useState(() => new BFFAPI());
    const cards = useRowActions(mutate);

    if (!invitations || invitations.length === 0) {
        return null;
    }

    function accept(invitation: TenancyInvitation) {
        return cards.run(invitation.id, async () => {
            const { tenancy } = await bffGateway.acceptTenancyInvitation(invitation.id);
            await joined(tenancy);
        });
    }

    async function joined(tenancy: TenancySummary) {
        try {
            await update();
        } catch (e) {
            console.error("Joined the tenancy, but refreshing the session failed", e);
        }
        setTenancySelected(tenancy.path);
        try {
            await mutate();
        } catch (e) {
            console.error("Joined the tenancy, but refreshing the invitations failed", e);
        }
        Router.push(ROUTE_PAGE_HOME);
    }

    function decline(invitation: TenancyInvitation) {
        return cards.run(invitation.id, async () => {
            await bffGateway.declineTenancyInvitation(invitation.id);
            await mutate();
        });
    }

    return (
        <section aria-label="Invitations to tenancies" className={`flex flex-col gap-3 ${props.className ?? ""}`}>
            {invitations.map((invitation) => (
                <div key={invitation.id} className="flex flex-wrap items-center gap-4 rounded-lg border border-primary-200 bg-primary-0 px-4 py-3.5">
                    <TenancyIcon tenancy={invitation.tenancy} />
                    <span className="flex min-w-0 flex-1 flex-col">
                        <span className="text-sm font-semibold text-primary-900">{invitationTitle(invitation)}</span>
                        <span className="text-[13px] text-primary-500">{invitationDetail(invitation)}</span>
                    </span>
                    <span className="flex flex-none gap-2">
                        <button type="button" className="btn-primary-outline btn-small m-0" disabled={cards.busy(invitation.id)} onClick={() => decline(invitation)}>Decline</button>
                        <button type="button" className="btn-primary btn-small m-0" disabled={cards.busy(invitation.id)} onClick={() => accept(invitation)}>Accept</button>
                    </span>
                    {cards.error(invitation.id) &&
                        <p role="alert" className="m-0 w-full text-sm text-danger-700">{cards.error(invitation.id)}</p>}
                </div>
            ))}
        </section>
    );
}
