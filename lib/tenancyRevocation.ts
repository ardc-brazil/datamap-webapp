export const TENANCY_REVOKED_PREFIX = "unauthorized_tenancy";

export function isTenancyRevoked(status: unknown, detail: unknown): boolean {
    return status === 401 && typeof detail === "string" && detail.startsWith(TENANCY_REVOKED_PREFIX);
}
