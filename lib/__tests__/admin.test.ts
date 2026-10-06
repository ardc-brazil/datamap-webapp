import { AxiosError, AxiosHeaders } from "axios";
import {
    addTenancyMember,
    approveTenancyRequest,
    createTenancy,
    declineTenancyRequest,
    getMemberRemovalImpact,
    getTenancyRequest,
    getTenancyRequestCounts,
    listAdminTenancies,
    listTenancyMembers,
    listTenancyRequests,
    removeTenancyMember,
    searchAdminUsers,
    withdrawTenancyInvitationAsAdmin,
} from "../admin";
import axiosInstance from "../rpc";

jest.mock("../rpc");
const mockGet = jest.mocked(axiosInstance.get);
const mockPost = jest.mocked(axiosInstance.post);
const mockDelete = jest.mocked(axiosInstance.delete);

const asAdmin = { headers: { "X-User-Id": "admin-1" } };
const REQUEST_ID = "7a9b5d5e-fa6d-4c18-9a51-2b1e2c3d4e5f";
const USER_ID = "0c1d2e3f-4a5b-4c6d-8e7f-9a0b1c2d3e4f";
const ATTO = "datamap/production/atto";

describe("the admin request calls", () => {
    test("counts", async () => {
        mockGet.mockResolvedValue({ data: { open: 4, join: 2, new: 2, closed: 31 } });

        expect(await getTenancyRequestCounts("admin-1")).toEqual({ open: 4, join: 2, new: 2, closed: 31 });
        expect(mockGet).toHaveBeenCalledWith("/admin/tenancy-requests/counts", asAdmin);
    });

    test("the queue passes its query as parameters", async () => {
        mockGet.mockResolvedValue({ data: { items: [], total_count: 0, limit: 50, offset: 0 } });

        await listTenancyRequests("admin-1", { status: "open", kind: "join", q: "lima", limit: 50, offset: 0 });

        expect(mockGet).toHaveBeenCalledWith("/admin/tenancy-requests", { ...asAdmin, params: { status: "open", kind: "join", q: "lima", limit: 50, offset: 0 } });
    });

    test("one request", async () => {
        mockGet.mockResolvedValue({ data: { id: REQUEST_ID } });

        expect(await getTenancyRequest("admin-1", REQUEST_ID)).toEqual({ id: REQUEST_ID });
        expect(mockGet).toHaveBeenCalledWith(`/admin/tenancy-requests/${REQUEST_ID}`, asAdmin);
    });

    test("approving into an existing tenancy sends its path", async () => {
        mockPost.mockResolvedValue({ data: { id: REQUEST_ID, status: "approved" } });

        expect(await approveTenancyRequest("admin-1", REQUEST_ID, { tenancy: ATTO })).toEqual({ id: REQUEST_ID, status: "approved" });
        expect(mockPost).toHaveBeenCalledWith(`/admin/tenancy-requests/${REQUEST_ID}/approve`, { tenancy: ATTO }, asAdmin);
    });

    test("approving a new tenancy sends it in the gatekeeper's names", async () => {
        mockPost.mockResolvedValue({ data: { id: REQUEST_ID } });

        await approveTenancyRequest("admin-1", REQUEST_ID, { newTenancy: { displayName: "Cerrado Flux", namespace: "cerrado-flux" } });

        expect(mockPost).toHaveBeenCalledWith(
            `/admin/tenancy-requests/${REQUEST_ID}/approve`,
            { new_tenancy: { display_name: "Cerrado Flux", namespace: "cerrado-flux" } },
            asAdmin,
        );
    });

    test("declining sends the message, or null without one", async () => {
        mockPost.mockResolvedValue({ data: { id: REQUEST_ID } });

        await declineTenancyRequest("admin-1", REQUEST_ID, "Ask Luciana");
        await declineTenancyRequest("admin-1", REQUEST_ID);

        expect(mockPost).toHaveBeenNthCalledWith(1, `/admin/tenancy-requests/${REQUEST_ID}/decline`, { message: "Ask Luciana" }, asAdmin);
        expect(mockPost).toHaveBeenNthCalledWith(2, `/admin/tenancy-requests/${REQUEST_ID}/decline`, { message: null }, asAdmin);
    });
});

describe("the admin tenancy calls", () => {
    test("the list", async () => {
        mockGet.mockResolvedValue({ data: [] });

        expect(await listAdminTenancies("admin-1")).toEqual([]);
        expect(mockGet).toHaveBeenCalledWith("/admin/tenancies", asAdmin);
    });

    test("creating sends the gatekeeper's names", async () => {
        mockPost.mockResolvedValue({ data: { path: "datamap/production/cerrado-flux" } });

        expect(await createTenancy("admin-1", { displayName: "Cerrado Flux", namespace: "cerrado-flux" })).toEqual({ path: "datamap/production/cerrado-flux" });
        expect(mockPost).toHaveBeenCalledWith("/admin/tenancies", { display_name: "Cerrado Flux", namespace: "cerrado-flux" }, asAdmin);
    });

    test("members put the path in the URL as it is, and the page in parameters", async () => {
        mockGet.mockResolvedValue({ data: { members: { items: [], total_count: 0, limit: 50, offset: 50 }, invitations: [] } });

        await listTenancyMembers("admin-1", ATTO, { limit: 50, offset: 50 });

        expect(mockGet).toHaveBeenCalledWith("/admin/tenancies/datamap/production/atto/members", { ...asAdmin, params: { limit: 50, offset: 50 } });
    });

    test("removal impact", async () => {
        mockGet.mockResolvedValue({ data: { member_since: "2026-09-30T09:41:00+00:00", datasets_in_tenancy: 31, shared_with_user: 1, owned_by_user: 0 } });

        expect((await getMemberRemovalImpact("admin-1", ATTO, USER_ID)).datasets_in_tenancy).toBe(31);
        expect(mockGet).toHaveBeenCalledWith(`/admin/tenancies/datamap/production/atto/members/${USER_ID}`, asAdmin);
    });

    test("adding a member", async () => {
        mockPost.mockResolvedValue({ data: { id: USER_ID } });

        expect(await addTenancyMember("admin-1", ATTO, USER_ID)).toEqual({ id: USER_ID });
        expect(mockPost).toHaveBeenCalledWith("/admin/tenancies/datamap/production/atto/members", { user_id: USER_ID }, asAdmin);
    });

    test("removing a member", async () => {
        mockDelete.mockResolvedValue({ status: 204 });

        await expect(removeTenancyMember("admin-1", ATTO, USER_ID)).resolves.toBeUndefined();
        expect(mockDelete).toHaveBeenCalledWith(`/admin/tenancies/datamap/production/atto/members/${USER_ID}`, asAdmin);
    });

    test("withdrawing an invitation", async () => {
        mockDelete.mockResolvedValue({ status: 204 });

        await expect(withdrawTenancyInvitationAsAdmin("admin-1", REQUEST_ID)).resolves.toBeUndefined();
        expect(mockDelete).toHaveBeenCalledWith(`/admin/tenancy-invitations/${REQUEST_ID}`, asAdmin);
    });

    test("searching users", async () => {
        mockGet.mockResolvedValue({ data: [{ id: USER_ID, name: "Fernanda Lima", email: "fernanda.lima@inpe.br" }] });

        expect(await searchAdminUsers("admin-1", "fer")).toHaveLength(1);
        expect(mockGet).toHaveBeenCalledWith("/admin/users", { ...asAdmin, params: { q: "fer" } });
    });

    test("a gatekeeper error reaches the caller unchanged", async () => {
        const error = new AxiosError("conflict", "ERR", undefined, {}, {
            status: 409, data: { detail: "tenancy_exists" }, statusText: "", headers: {}, config: { headers: new AxiosHeaders() },
        } as any);
        mockPost.mockRejectedValue(error);

        await expect(createTenancy("admin-1", { displayName: "ATTO", namespace: "atto" })).rejects.toBe(error);
    });
});
