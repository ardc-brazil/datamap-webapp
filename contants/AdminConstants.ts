import { errorDetail } from "../lib/gatekeeperDetail";
import {
    ROUTE_PAGE_ADMIN_ACTIVITY,
    ROUTE_PAGE_ADMIN_REQUESTS,
    ROUTE_PAGE_ADMIN_TENANCIES,
    ROUTE_PAGE_ADMIN_USERS,
} from "./InternalRoutesConstants";
import { messageFor, NAMESPACE_MAX_LENGTH, TENANCY_GENERIC_ERROR_MESSAGE } from "./TenancyConstants";

export const ADMIN_PAGE_SIZE = 50;
export const RECENTLY_CLOSED_LIMIT = 5;
export const ADMIN_COUNTS_REFRESH_MS = 60_000;
export const ADMIN_SEARCH_DEBOUNCE_MS = 300;
export const ADMIN_USER_SEARCH_MIN_LENGTH = 2;
export const WAITING_STALE_DAYS = 3;

export type RequestFilter = "open" | "join" | "new" | "closed";

export interface AdminTab {
    href: string
    label: string
    showsOpenCount?: boolean
}

export const ADMIN_TABS: readonly AdminTab[] = [
    { href: ROUTE_PAGE_ADMIN_REQUESTS, label: "Requests", showsOpenCount: true },
    { href: ROUTE_PAGE_ADMIN_USERS, label: "Users" },
    { href: ROUTE_PAGE_ADMIN_TENANCIES, label: "Tenancies" },
    { href: ROUTE_PAGE_ADMIN_ACTIVITY, label: "Activity" },
];

export const ADMIN_COPY = {
    adminNav: "Admin",
    scope: "All tenancies",
    retry: "Try again",
    searchPlaceholder: "Name, email or ORCID",
    requestsTitle: "Requests",
    requestsEmpty: "No open requests. Requests people send from the app appear here.",
    requestsLoadError: "Requests could not be loaded.",
    closedEmpty: "No closed requests yet.",
    recentlyClosed: "Recently closed",
    recentlyClosedLoadError: "Recently closed requests could not be loaded.",
    activityLink: "Activity →",
    unverifiedBanner: "Email not verified. A new tenancy can't be created for an unverified account.",
    approveNoAccount: "This account is disabled or no longer exists, so it cannot be approved. Decline the request instead.",
    nothingToJoin: "This account is already in every tenancy it could join.",
    declinePlaceholder: "Ask a member of the tenancy to invite you from its Members page",
    declineBullet: "Stays in public · can request again",
    tenanciesTitle: "Tenancies",
    tenanciesEmpty: "No tenancies yet.",
    tenanciesLoadError: "Tenancies could not be loaded.",
    legacyGroup: "Legacy · staging",
    membersEmpty: "No members yet.",
    membersLoadError: "Members could not be loaded.",
    searchHint: "Type at least 2 characters of a name, email or ORCID iD.",
    searchError: "People could not be searched.",
    impactLoadError: "What changes could not be checked. Removing still works.",
    staysInPublic: "Stays in public",
    usersTitle: "Users",
    usersEmpty: "Coming soon. Until then, add and remove people from Tenancies.",
    activityTitle: "Activity",
    activityEmpty: "Coming soon: every admin action, who and when.",
} as const;

const ADMIN_ERROR_MESSAGES: Record<string, string> = {
    invalid_request: "That was not accepted. Reload the page and try again.",
    namespace_invalid: "Use 2 to 63 lower-case letters, digits or hyphens, and not “public” or “members”.",
    display_name_invalid: "Use a display name of 1 to 64 characters.",
    message_invalid: "Keep the message to 1000 characters.",
    request_not_found: "This request no longer exists.",
    tenancy_not_found: "This tenancy no longer exists.",
    no_account: "This account no longer exists or is disabled.",
    member_not_found: "This person is no longer a member.",
    invitation_not_found: "This invitation was already answered or withdrawn.",
    request_not_pending: "Another administrator already decided this request.",
    already_member: "They are already a member of this tenancy.",
    tenancy_exists: "A tenancy with this namespace already exists.",
    display_name_taken: "Another tenancy already has this display name.",
    requester_email_unverified: ADMIN_COPY.unverifiedBanner,
    public_tenancy_locked: "Everyone is in Public; its members can't be changed.",
    legacy_tenancy_read_only: "Legacy staging tenancies are read-only.",
    tenancy_disabled: "This tenancy is disabled.",
    not_found: "Your account no longer has the admin role. Reload the page.",
};

export function adminErrorMessage(detail?: string): string {
    return messageFor(ADMIN_ERROR_MESSAGES, detail, TENANCY_GENERIC_ERROR_MESSAGE);
}

export function adminErrorFrom(error: unknown): string {
    return adminErrorMessage(errorDetail(error));
}

export function slugifyNamespace(name: string): string {
    return name
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .slice(0, NAMESPACE_MAX_LENGTH)
        .replace(/^-+|-+$/g, "");
}
