export const DEFAULT_TENANCY = "datamap/production/public";
export const PRODUCTION_PREFIX = "datamap/production/";
export const LEGACY_PREFIX = "datamap/staging/";
export const NAMESPACE_PATTERN = /^[a-z0-9-]+$/;
export const NAMESPACE_MIN_LENGTH = 2;
export const NAMESPACE_MAX_LENGTH = 63;
export const DISPLAY_NAME_MAX_LENGTH = 64;
export const TENANCY_NAME_MAX_LENGTH = 128;
export const REASON_MAX_LENGTH = 1000;
export const MESSAGE_MAX_LENGTH = 1000;
export const TENANCY_ICON = "tenancy";
export const PUBLIC_TENANCY_ICON = "public";
export const isDefaultTenancy = (path: string) => path === DEFAULT_TENANCY;
export const isLegacyTenancy = (path: string) => path.startsWith(LEGACY_PREFIX);
export const tenancyNamespace = (path: string) => path.split("/").pop() ?? path;

/** Slash-separated segments only: no `..`, no empty segment, nothing a URL would read as more than a path. */
export const TENANCY_PATH_PATTERN = /^[A-Za-z0-9_-]+(\/[A-Za-z0-9_-]+)+$/;

export const TENANCIES_KEY = "/api/tenancies";
export const TENANCY_REQUESTS_KEY = "/api/tenancy-requests";
export const TENANCY_INVITATIONS_KEY = "/api/tenancy-invitations";

export const WORKSPACE_PAGE_SIZE = 50;
export const WORKSPACE_LOOKUP_DEBOUNCE_MS = 300;
export const REQUEST_OUTCOME_VISIBLE_DAYS = 30;

export const workspaceMembersKey = (tenancy: string, offset: number) =>
    `/api/workspace/members?tenancy=${encodeURIComponent(tenancy)}&limit=${WORKSPACE_PAGE_SIZE}&offset=${offset}`;
export const workspaceInvitationsKey = (tenancy: string) =>
    `/api/workspace/invitations?tenancy=${encodeURIComponent(tenancy)}`;

export const PUBLIC_TENANCY_NOTE = "Everyone is in public";
export const PUBLIC_MEMBERS_DETAIL = "Everyone on DataMap · can read";
export const PUBLIC_DATASET_HINT = "Visible to every DataMap account; only you and people you share with can edit";
export const REQUEST_PENDING_MESSAGE = "You already have a request waiting. Withdraw it to send another.";
export const TENANCY_GENERIC_ERROR_MESSAGE = "Something went wrong. Please try again.";

export const TENANCY_ERROR_MESSAGES: Record<string, string> = {
    invalid_request: "Something in the request was not valid. Check it and try again.",
    tenancy_name_invalid: "Name the tenancy in 1 to 128 characters.",
    reason_invalid: "Say why in 1 to 1000 characters.",
    request_pending: REQUEST_PENDING_MESSAGE,
    too_many_requests: "You have sent three requests in the last 24 hours. Try again tomorrow.",
    request_not_found: "This request is no longer waiting. It may have been answered or withdrawn.",
    invitation_not_found: "This invitation is no longer open. It may have been withdrawn.",
    tenancy_not_found: "You are not a member of this tenancy.",
    tenancy_disabled: "This tenancy is disabled, so nobody can join it now.",
    no_account: "No DataMap account has this email or ORCID iD.",
    already_member: "This person is already a member of the tenancy.",
    invitation_pending: "This person already has an invitation to the tenancy waiting.",
    public_tenancy_locked: "Everyone on DataMap is in Public, so it has no Members page.",
    legacy_tenancy_read_only: "Legacy tenancies are read-only, so they have no Members page.",
    forbidden: "Only the member who sent an invitation can withdraw it.",
    public_members_cannot_edit: "Members of Public can only read. Share the dataset with the people who should edit it.",
    tenancy_cannot_change: "A dataset stays in the tenancy it was created in.",
};

export function tenancyErrorMessage(detail?: string): string {
    if (typeof detail === "string" && Object.prototype.hasOwnProperty.call(TENANCY_ERROR_MESSAGES, detail)) {
        return TENANCY_ERROR_MESSAGES[detail];
    }
    return TENANCY_GENERIC_ERROR_MESSAGE;
}
