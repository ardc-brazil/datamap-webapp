import { TenancySummary, UserRef } from "../types/GatekeeperAPI";
import { formatShortDate } from "./embargoDisplay";

export type TenancySelection = { kind: "none" } | { kind: "only", path: string } | { kind: "choose" };

export function tenancySelectionFor(tenancies: TenancySummary[]): TenancySelection {
    if (tenancies.length === 0) {
        return { kind: "none" };
    }
    if (tenancies.length === 1) {
        return { kind: "only", path: tenancies[0].path };
    }
    return { kind: "choose" };
}

export function sessionTenanciesDiffer(sessionTenancies: string[] | undefined | null, tenancies: TenancySummary[]): boolean {
    const held = [...(sessionTenancies ?? [])].sort();
    const actual = tenancies.map((tenancy) => tenancy.path).sort();
    return held.length !== actual.length || held.some((path, index) => path !== actual[index]);
}

export function firstNameOf(name?: string | null): string {
    return (name ?? "").trim().split(/\s+/)[0] ?? "";
}

export function tenancyPathLabel(path: string): string {
    return path.split("/").join(" / ");
}

export function membersPageTenancy(tenancies: TenancySummary[] | undefined | null, selected: string | undefined | null): TenancySummary | null {
    const tenancy = (tenancies ?? []).find((candidate) => candidate.path === selected);
    return tenancy && !tenancy.is_default && !tenancy.is_legacy ? tenancy : null;
}

export function invitedLine(invitation: { invited_by: UserRef | null; created_at: string }): string {
    const by = invitation.invited_by ? `invited by ${invitation.invited_by.name}` : "invited";
    return `${by} ${formatShortDate(invitation.created_at, false)} · not accepted yet`;
}
