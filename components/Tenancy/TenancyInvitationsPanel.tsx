import { useSession } from "next-auth/react";
import Router from "next/router";
import { useState } from "react";
import { ROUTE_PAGE_HOME } from "../../contants/InternalRoutesConstants";
import { tenancyErrorMessage } from "../../contants/TenancyConstants";
import { BFFAPI } from "../../gateways/BFFAPI";
import { useTenancyInvitations } from "../../hooks/UseTenancies";
import { formatShortDate } from "../../lib/embargoDisplay";
import { TenancyInvitation } from "../../types/GatekeeperAPI";
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
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState<string | null>(null);

    if (!invitations || invitations.length === 0) {
        return null;
    }

    async function failed(e: any) {
        const detail = e?.response?.data?.detail;
        setError(tenancyErrorMessage(detail));
        if (detail === "invitation_not_found") {
            await mutate();
        }
    }

    async function accept(invitation: TenancyInvitation) {
        setBusy(true);
        setError(null);
        try {
            const { tenancy } = await bffGateway.acceptTenancyInvitation(invitation.id);
            await update();
            setTenancySelected(tenancy.path);
            await mutate();
            Router.push(ROUTE_PAGE_HOME);
        } catch (e) {
            await failed(e);
        } finally {
            setBusy(false);
        }
    }

    async function decline(invitation: TenancyInvitation) {
        setBusy(true);
        setError(null);
        try {
            await bffGateway.declineTenancyInvitation(invitation.id);
            await mutate();
        } catch (e) {
            await failed(e);
        } finally {
            setBusy(false);
        }
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
                        <button type="button" className="btn-primary-outline btn-small m-0" disabled={busy} onClick={() => decline(invitation)}>Decline</button>
                        <button type="button" className="btn-primary btn-small m-0" disabled={busy} onClick={() => accept(invitation)}>Accept</button>
                    </span>
                </div>
            ))}
            {error && <p role="alert" className="m-0 text-sm text-danger-700">{error}</p>}
        </section>
    );
}
