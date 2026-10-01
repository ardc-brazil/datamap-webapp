import { AccessHistoryEntry, AnonymousLink } from "../types/GatekeeperAPI";

const DAY_MS = 24 * 60 * 60 * 1000;

export function formatShortDate(iso: string, withYear = true): string {
    return new Date(iso).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        ...(withYear ? { year: "numeric" } : {}),
        timeZone: "UTC",
    });
}

export function formatHistoryWhen(iso: string): string {
    const date = new Date(iso);
    const time = `${String(date.getUTCHours()).padStart(2, "0")}:${String(date.getUTCMinutes()).padStart(2, "0")}`;
    return `${formatShortDate(iso)} ${time}`;
}

export function daysLeft(iso: string, now: Date): number {
    return Math.max(0, Math.ceil((new Date(iso).getTime() - now.getTime()) / DAY_MS));
}

export function daysFromToday(dateInput: string, now: Date): number {
    const today = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
    return Math.round((new Date(`${dateInput}T00:00:00Z`).getTime() - today) / DAY_MS);
}

export function tenancyDisplayName(path?: string | null): string {
    if (!path) {
        return "the workspace";
    }
    const last = path.replace(/\/+$/, "").split("/").pop() ?? path;
    return last.split(/[-_]/).filter(Boolean).map((word) => word[0].toUpperCase() + word.slice(1)).join(" ");
}

export function initialsOf(name: string): string {
    const words = (name ?? "").trim().split(/\s+/).filter(Boolean);
    if (words.length === 0) {
        return "?";
    }
    const first = words[0][0];
    const last = words.length > 1 ? words[words.length - 1][0] : "";
    return (first + last).toUpperCase();
}

function relativeDay(iso: string, now: Date): string {
    const days = daysFromToday(new Date(iso).toISOString().slice(0, 10), now);
    if (days === 0) {
        return "today";
    }
    if (days === -1) {
        return "yesterday";
    }
    return formatShortDate(iso, false);
}

export function describeLinkStats(link: AnonymousLink, now: Date): string {
    const created = `Created ${formatShortDate(link.created_at, false)}`;
    if (!link.views?.count || !link.views.first_at || !link.views.last_at) {
        return `${created} · not opened yet`;
    }
    return `${created} · first opened ${formatShortDate(link.views.first_at, false)} · last opened ${relativeDay(link.views.last_at, now)}`;
}

function quoted(text: string | null | undefined): string {
    return text ? `"${text}"` : "";
}

function joined(...parts: string[]): string {
    return parts.filter(Boolean).join(" · ");
}

export function describeAccessEvent(entry: AccessHistoryEntry): { icon: string, who: string, what: string, detail: string } {
    const who = entry.actor?.name ?? "DataMap";
    const before = (entry.old_value ?? {}) as Record<string, any>;
    const after = (entry.new_value ?? {}) as Record<string, any>;
    const subject = entry.subject ?? "someone";

    switch (entry.event_type) {
        case "created":
            return { icon: "lock", who, what: `set an embargo until ${formatShortDate(after.until)}`, detail: joined(after.metadata_visible ? "visible to members" : "hidden from members", quoted(entry.note)) };
        case "extended":
            return { icon: "update", who, what: `extended the embargo to ${formatShortDate(after.until)}`, detail: joined(before.until ? `was ${formatShortDate(before.until)}` : "", quoted(entry.note)) };
        case "ended_early":
            return { icon: "lock_open", who, what: "ended the embargo early", detail: entry.note === "manual DOI" ? "by registering an external DOI" : "" };
        case "expired":
            return { icon: "lock_open", who, what: "the embargo ended", detail: "" };
        case "metadata_mode_changed":
            return after.metadata_visible
                ? { icon: "visibility", who, what: "made the dataset visible to members", detail: "was hidden" }
                : { icon: "visibility_off", who, what: "hid the dataset from members", detail: "was visible" };
        case "note_changed":
            return { icon: "edit_note", who, what: after.note ? "changed the note" : "removed the note", detail: quoted(after.note) };
        case "permission_granted":
            return entry.old_value
                ? { icon: "manage_accounts", who, what: `changed ${subject}'s access to ${after.level}`, detail: "" }
                : { icon: "person_add", who, what: `granted ${after.level} access to ${subject}`, detail: "" };
        case "permission_revoked":
            return { icon: "person_remove", who, what: `removed ${subject}'s access`, detail: "" };
        case "invitation_created":
            return { icon: "mail", who, what: `invited ${subject}`, detail: "" };
        case "invitation_revoked":
            return { icon: "cancel_schedule_send", who, what: `revoked the invitation to ${subject}`, detail: "" };
        case "anonymous_link_created":
            return { icon: "link", who, what: "created anonymous link", detail: entry.subject ?? "" };
        case "anonymous_link_revoked":
            return { icon: "link_off", who, what: "revoked anonymous link", detail: entry.subject ?? "" };
        default:
            return { icon: "history", who, what: entry.event_type.replace(/_/g, " "), detail: "" };
    }
}
