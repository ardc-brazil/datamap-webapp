import {
    ADMIN_COUNTS_KEY,
    ADMIN_TENANCIES_KEY,
    RECENTLY_CLOSED_KEY,
    adminMembersKey,
    adminRemovalImpactKey,
    adminRequestKey,
    adminRequestsKey,
    adminUsersKey,
    isAdminRequestsKey,
    isAdminTenanciesKey,
} from "../adminKeys";

describe("admin SWR keys", () => {
    test("the counts", () => {
        expect(ADMIN_COUNTS_KEY).toBe("/api/admin/tenancy-requests/counts");
    });

    test("the open queue, plain and filtered", () => {
        expect(adminRequestsKey({ status: "open" })).toBe("/api/admin/tenancy-requests?status=open&limit=50&offset=0");
        expect(adminRequestsKey({ status: "open", kind: "join", q: " Lima ", offset: 50 }))
            .toBe("/api/admin/tenancy-requests?status=open&kind=join&q=Lima&limit=50&offset=50");
    });

    test("the closed list ignores a kind; recently closed is its first five", () => {
        expect(adminRequestsKey({ status: "closed", kind: "new" })).toBe("/api/admin/tenancy-requests?status=closed&limit=50&offset=0");
        expect(RECENTLY_CLOSED_KEY).toBe("/api/admin/tenancy-requests?status=closed&limit=5&offset=0");
    });

    test("a search is encoded and a blank one is left out", () => {
        expect(adminRequestsKey({ status: "open", q: "k.tanaka@nagoya" })).toBe("/api/admin/tenancy-requests?status=open&q=k.tanaka%40nagoya&limit=50&offset=0");
        expect(adminRequestsKey({ status: "open", q: "   " })).toBe("/api/admin/tenancy-requests?status=open&limit=50&offset=0");
    });

    test("one request and the tenancies", () => {
        expect(adminRequestKey("7a9b5d5e-fa6d-4c18-9a51-2b1e2c3d4e5f")).toBe("/api/admin/tenancy-requests/7a9b5d5e-fa6d-4c18-9a51-2b1e2c3d4e5f");
        expect(ADMIN_TENANCIES_KEY).toBe("/api/admin/tenancies");
    });

    test("members and removal impact carry the path encoded in the query", () => {
        expect(adminMembersKey("datamap/production/atto", 50)).toBe("/api/admin/tenancies/members?tenancy=datamap%2Fproduction%2Fatto&limit=50&offset=50");
        expect(adminRemovalImpactKey("datamap/production/atto", "u-1")).toBe("/api/admin/tenancies/members/u-1?tenancy=datamap%2Fproduction%2Fatto");
    });

    test("user search waits for two characters", () => {
        expect(adminUsersKey(" f ")).toBeNull();
        expect(adminUsersKey(" fer ")).toBe("/api/admin/users?q=fer");
        expect(adminUsersKey("a b")).toBe("/api/admin/users?q=a%20b");
    });

    test("the matchers pick the keys a mutation must refresh", () => {
        expect(isAdminRequestsKey(ADMIN_COUNTS_KEY)).toBe(true);
        expect(isAdminRequestsKey(RECENTLY_CLOSED_KEY)).toBe(true);
        expect(isAdminRequestsKey(ADMIN_TENANCIES_KEY)).toBe(false);
        expect(isAdminRequestsKey(["/api/admin/tenancy-requests"])).toBe(false);
        expect(isAdminTenanciesKey(adminMembersKey("datamap/production/atto", 0))).toBe(true);
        expect(isAdminTenanciesKey(ADMIN_COUNTS_KEY)).toBe(false);
    });
});
