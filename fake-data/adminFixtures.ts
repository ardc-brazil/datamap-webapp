import {
    AdminTenancy,
    AdminTenancyInvitation,
    AdminTenancyRequest,
    AdminTenancyRequestDetail,
    TenancyMember,
    TenancySummary,
} from "../types/GatekeeperAPI";

export const PUBLIC_TENANCY: TenancySummary = { path: "datamap/production/public", display_name: "Public", is_default: true, is_legacy: false };
export const DATA_AMAZON: TenancySummary = { path: "datamap/production/data-amazon", display_name: "Data Amazon", is_default: false, is_legacy: false };
export const ATTO: TenancySummary = { path: "datamap/production/atto", display_name: "ATTO", is_default: false, is_legacy: false };

export function adminRequest(overrides: Partial<AdminTenancyRequest> = {}): AdminTenancyRequest {
    return {
        id: "7a9b5d5e-fa6d-4c18-9a51-2b1e2c3d4e5f",
        requester: { id: "0c1d2e3f-4a5b-4c6d-8e7f-9a0b1c2d3e4f", name: "Fernanda Lima", email: "fernanda.lima@inpe.br", email_verified: true, orcid: "0000-0002-1825-0097" },
        requested_name: "Data Amazon",
        reason: "Postdoc in Luciana Rizzo's group, GoAmazon SMPS data",
        status: "pending",
        kind: "join",
        suggested_tenancy: DATA_AMAZON,
        created_at: "2026-09-28T16:20:00+00:00",
        tenancy: null,
        created_tenancy: false,
        decision_message: null,
        decided_by: null,
        decided_at: null,
        ...overrides,
    };
}

export function newTenancyRequest(overrides: Partial<AdminTenancyRequest> = {}): AdminTenancyRequest {
    return adminRequest({
        id: "8b0c6e6f-0b7e-4d29-8b62-3c2f3d4e5f60",
        requester: { id: "5e6f7a8b-9c0d-4e1f-8a2b-3c4d5e6f7a8b", name: "Kenji Tanaka", email: "k.tanaka@nagoya-u.ac.jp", email_verified: false, orcid: null },
        requested_name: "Cerrado Flux",
        reason: "Flux towers, joint project Nagoya–UnB",
        kind: "new",
        suggested_tenancy: null,
        created_at: "2026-10-03T09:00:00+00:00",
        ...overrides,
    });
}

export function adminRequestDetail(overrides: Partial<AdminTenancyRequestDetail> = {}): AdminTenancyRequestDetail {
    return { ...adminRequest(), requester_tenancies: [PUBLIC_TENANCY], suggested_tenancy_members: 14, ...overrides };
}

export function adminTenancy(overrides: Partial<AdminTenancy> = {}): AdminTenancy {
    return { ...DATA_AMAZON, members: 14, datasets: 108, is_enabled: true, ...overrides };
}

export const ADMIN_TENANCIES: AdminTenancy[] = [
    adminTenancy({ ...PUBLIC_TENANCY, members: 47, datasets: 9 }),
    adminTenancy({ ...ATTO, members: 9, datasets: 31 }),
    adminTenancy(),
    adminTenancy({ path: "datamap/staging/data-amazon", display_name: "Data Amazon", is_legacy: true, members: 4, datasets: 12 }),
];

export function tenancyMember(overrides: Partial<TenancyMember> = {}): TenancyMember {
    return {
        id: "1b2c3d4e-5f60-4a7b-8c9d-0e1f2a3b4c5d",
        name: "Luciana Rizzo",
        email: "luciana.rizzo@usp.br",
        since: "2026-09-30T09:41:00+00:00",
        invited_by: null,
        ...overrides,
    };
}

export function tenancyInvitation(overrides: Partial<AdminTenancyInvitation> = {}): AdminTenancyInvitation {
    return {
        id: "2c3d4e5f-6a7b-4c8d-9e0f-1a2b3c4d5e6f",
        user: { id: "3d4e5f6a-7b8c-4d9e-8f0a-1b2c3d4e5f6a", name: "Rafael Souza", email: "rafael.souza@usp.br" },
        invited_by: { id: "1b2c3d4e-5f60-4a7b-8c9d-0e1f2a3b4c5d", name: "Luciana Rizzo" },
        created_at: "2026-10-02T10:00:00+00:00",
        ...overrides,
    };
}
