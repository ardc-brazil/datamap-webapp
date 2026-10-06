/*
 This the file to declare requests responses from the Gatekeeper API.
*/

/**
 * Represents a request to dataset creation.
 * @interface
 */
export interface DatasetCreationRequest {
    name: string
    data: any
    tenancy: string
}

/**
 * Represents a response from a dataset creation.
 * @interface
 */
export interface DatasetResponse {
    id: string;
    name: string;
    data: string;
    is_enabled: boolean
}

export interface DatasetInfo {
    id: string,
    name: string,
    database: string,
    creation_date: Date,
    license: string,
    description: string,
    realm: string,
    project: string,
    source_instrument: string,
    source: string,
    institution: string,
    start_date: Date,
    end_date: Date,
    tags: string[],
    category: string,
    data_type: string,
    grid_type: string,
    location: Location,
    owner: Person
    authors: Person[],
    contacts: Person[],
    colaborators: {
        name: string
        permission: string
    }[],
    reference: any[],
    additional_information: any[],
    level: string,
    resolution: Resolution,
    variables: any[],
    is_enabled: boolean
    citation?: {
        doi?: string
    }
    references?: string
}

interface Location {
    location: string,
    latitude?: string
    longitude?: string
}

interface Person {
    name: string
}

interface Resolution {
    temporal: string,
    spatial: string
}

export interface DOICreationRequest {
    mode: string
    tenancy: string
    identifier?: string
    end_embargo?: boolean
}

export interface DOIUpdateRequest {
    state: string
    tenancy: string
}

export interface DOIUpdateResponse {
    new_state: string
}

/**
 * Represents a response for dataset snapshot data.
 * @interface
 */
export interface DatasetSnapshotResponse {
    name: string
    dataset_id: string
    version_name: string
    doi_identifier: string
    doi_link: string
    doi_state: string
    publication_date: string
    files_summary: {
        total_files: number
        total_size_bytes: number
        extensions_breakdown: {
            extension: string
            count: number
            total_size_bytes: number
        }[]
    }
    versions: DatasetSnapshotResponseVersion[]
    data: {
        id: string
        description: string
        tags: string[]
        level: string
        owner: Person | null
        realm: string
        source: string
        authors: Person[]
        license: string
        project: string
        category: string
        contacts: Person[] | null
        database: string
        end_date: string
        location: Location
        data_type: string
        grid_type: string
        reference: any[]
        variables: any[]
        is_enabled: boolean
        resolution: Resolution
        start_date: string
        institution: string
        colaborators: {
            name: string
            permission: string
        }[] | null
        creation_date: string
        source_instrument: string
        additional_information: any[]
    }
}

export interface DatasetSnapshotResponseVersion {
    id: string
    name: string
    doi_identifier: string
    doi_state: string
    created_at: string
}

/**
 * Contracts: docs/superpowers/plans/2026-09-30-embargo-00-contracts.md (gatekeeper repo).
 */
export type PermissionLevel = "read" | "write";

export type AccessLevel = "owner" | "write" | "read" | "tenancy";

/** @interface */
export interface DatasetEmbargo {
    until: string
    active: boolean
    metadata_visible: boolean
    note: string | null
}

/** @interface */
export interface DatasetAccess {
    level: AccessLevel
    can_edit: boolean
    can_share: boolean
    can_manage_embargo: boolean
    can_extend_embargo: boolean
    can_delete: boolean
}

/** @interface */
export interface FilesSummary {
    count: number
    total_size_bytes: number
}

/** @interface */
export interface SetEmbargoRequest {
    until: string
    metadata_visible: boolean
    note: string | null
}

/** @interface */
export interface ExtendEmbargoRequest {
    until: string
    reason?: string | null
}

/** @interface */
export interface EmbargoNoteRequest {
    note: string | null
}

/** @interface */
export interface DatasetOwner {
    id: string
    name: string
}

/** @interface */
export interface EmbargoModeRequest {
    metadata_visible: boolean
}

/** @interface */
export interface EmbargoStatusResponse {
    embargoed: boolean
    until: string | null
    doi: string | null
}

/** @interface */
export interface ShareUser {
    id: string
    name: string
    email: string
}

/** @interface */
export interface SharePermission {
    user: ShareUser
    level: PermissionLevel
    granted_at: string
    granted_by: string
    invited_as: string | null
}

/** @interface */
export interface ShareInvitation {
    id: string
    email: string | null
    orcid: string | null
    level: PermissionLevel
    created_at: string
    accepted_at: string | null
    accepted_by: ShareUser | null
    revoked_at: string | null
}

/** @interface */
export interface AnonymousLinkViews {
    count: number
    first_at: string | null
    last_at: string | null
}

/** @interface */
export interface AnonymousLink {
    id: string
    label: string
    token_hint: string | null
    created_at: string
    revoked_at: string | null
    views: AnonymousLinkViews
}

/** @interface */
export interface CreatedAnonymousLink extends AnonymousLink {
    link: string
}

/** @interface */
export interface ShareTenancy {
    name: string
    path: string
    members: number
    members_can_edit: boolean
    is_default: boolean
    is_legacy: boolean
    datasets: number
}

/** @interface */
export interface ShareState {
    owner: ShareUser
    permissions: SharePermission[]
    invitations: ShareInvitation[]
    anonymous_links: AnonymousLink[]
    tenancy: ShareTenancy | null
}

/** Exactly one of user_id, email, orcid. */
export interface GrantRequest {
    user_id?: string
    email?: string
    orcid?: string
    level: PermissionLevel
}

export type GrantResult =
    | { kind: "permission", permission: SharePermission }
    | { kind: "invitation", invitation: ShareInvitation, link: string };

/** @interface */
export interface FileExtensionSummary {
    extension: string | null
    count: number
    total_size_bytes: number
}

/** @interface */
export interface AnonymousPageVersion {
    name: string
    created_at: string
    files_summary: FilesSummary & { extensions: FileExtensionSummary[] }
}

/** @interface */
export interface AnonymousPageActive {
    state: "active"
    embargo_until: string
    dataset: {
        name: string
        data: Record<string, unknown>
        versions: AnonymousPageVersion[]
    }
}

/** @interface */
export interface AnonymousPageEnded {
    state: "ended"
    embargo_ended_at: string
    dataset: AnonymousPageActive["dataset"]
}

/** @interface */
export interface AnonymousPagePublished {
    state: "published"
    dataset_id: string
}

export type AnonymousPageResponse = AnonymousPageActive | AnonymousPageEnded | AnonymousPagePublished;

/** @interface */
export interface AcceptInvitationResponse {
    dataset_id: string
    level: PermissionLevel
}

/** @interface */
export interface ClaimInvitationsResponse {
    accepted: AcceptInvitationResponse[]
}

/** @interface */
export interface InvitationPreview {
    state: "pending" | "accepted"
    dataset_name: string
    inviter_name: string
    owner_name: string
    level: PermissionLevel
    invited_as: string
    embargo_until: string | null
    accepted_at: string | null
}

/** @interface */
export interface AccessHistoryEntry {
    event_type: string
    occurred_at: string
    actor: { id: string, name: string } | null
    subject: string | null
    old_value: Record<string, unknown> | null
    new_value: Record<string, unknown> | null
    note: string | null
}

/** @interface */
export interface AccessHistoryResponse {
    items: AccessHistoryEntry[]
}

/** @interface */
export interface MembersAccessRequest {
    members_can_edit: boolean
}

/** @interface */
export interface MembersAccessResponse {
    members_can_edit: boolean
    access: DatasetAccess
}

/** @interface */
export interface TenancySummary {
    path: string
    display_name: string
    is_default: boolean
    is_legacy: boolean
}

/** @interface */
export interface GatekeeperPage<T> {
    items: T[]
    total_count: number
    limit: number
    offset: number
}

/** @interface */
export interface UserRef {
    id: string
    name: string
}

/** @interface */
export interface UserBrief {
    id: string
    name: string
    email: string | null
}

/** @interface */
export interface TenancyRequest {
    id: string
    requested_name: string
    reason: string
    status: "pending" | "approved" | "declined" | "withdrawn"
    tenancy: TenancySummary | null
    created_tenancy: boolean
    decision_message: string | null
    created_at: string
    decided_at: string | null
}

/** @interface */
export interface TenancyInvitation {
    id: string
    tenancy: TenancySummary
    invited_by: UserRef | null
    datasets: number
    created_at: string
}

/** @interface */
export interface WorkspaceMember {
    id: string
    name: string
    orcid: string | null
}

/** @interface */
export interface WorkspaceInvitation {
    id: string
    user: UserRef
    invited_by: UserRef | null
    created_at: string
    can_withdraw: boolean
}

/** @interface */
export interface InviteeLookup {
    user: UserBrief
    tenancy_member: boolean
    invitation_pending: boolean
    can_invite: boolean
    datasets: number
}

/** @interface */
export interface TenancyRequestCounts {
    open: number
    join: number
    new: number
    closed: number
}

export type TenancyRequestKind = "join" | "new";

/** @interface */
export interface AdminRequester {
    id: string
    name: string
    email: string | null
    email_verified: boolean
    orcid: string | null
}

/** @interface */
export interface AdminTenancyRequest {
    id: string
    requester: AdminRequester
    requested_name: string
    reason: string
    status: "pending" | "approved" | "declined"
    kind: TenancyRequestKind
    suggested_tenancy: TenancySummary | null
    created_at: string
    tenancy: TenancySummary | null
    created_tenancy: boolean
    decision_message: string | null
    decided_by: UserRef | null
    decided_at: string | null
}

/** @interface */
export interface AdminTenancyRequestDetail extends AdminTenancyRequest {
    requester_tenancies: TenancySummary[]
    suggested_tenancy_members: number | null
}

/** @interface */
export interface AdminTenancy {
    path: string
    display_name: string
    members: number
    datasets: number
    is_default: boolean
    is_legacy: boolean
    is_enabled: boolean
}

/** @interface */
export interface TenancyMember {
    id: string
    name: string
    email: string | null
    since: string
    invited_by: UserRef | null
}

/** @interface */
export interface AdminTenancyInvitation {
    id: string
    user: UserBrief
    invited_by: UserRef | null
    created_at: string
}

/** @interface */
export interface TenancyMembers {
    members: GatekeeperPage<TenancyMember>
    invitations: AdminTenancyInvitation[]
}

/** @interface */
export interface RemovalImpact {
    member_since: string
    datasets_in_tenancy: number
    shared_with_user: number
    owned_by_user: number
}

/** @interface */
export interface AdminUserHit {
    id: string
    name: string
    email: string | null
}

/** What the admin decided, as the browser sends it; `lib/admin.ts` renames it for the gatekeeper. */
export type TenancyDecision = { tenancy: string } | { newTenancy: { displayName: string, namespace: string } };
