import {
    acceptTenancyInvitation,
    createTenancyRequest,
    declineTenancyInvitation,
    listMyTenancies,
    listMyTenancyInvitations,
    listMyTenancyRequests,
    withdrawTenancyRequest,
} from "../tenancies";
import axiosInstance from "../rpc";

jest.mock("../rpc");
const mockGet = jest.mocked(axiosInstance.get);
const mockPost = jest.mocked(axiosInstance.post);
const mockDelete = jest.mocked(axiosInstance.delete);

const asUser = { headers: { "X-User-Id": "u1" } };

describe("the user's own tenancy calls", () => {
    test("tenancies are read as the user, with no tenancy header", async () => {
        mockGet.mockResolvedValue({ data: [{ path: "datamap/production/public" }] });

        expect(await listMyTenancies("u1")).toEqual([{ path: "datamap/production/public" }]);
        expect(mockGet).toHaveBeenCalledWith("/users/u1/tenancies", asUser);
    });

    test("requests are read as the user", async () => {
        mockGet.mockResolvedValue({ data: [{ id: "r1" }] });

        expect(await listMyTenancyRequests("u1")).toEqual([{ id: "r1" }]);
        expect(mockGet).toHaveBeenCalledWith("/users/u1/tenancy-requests", asUser);
    });

    test("a request is sent in the gatekeeper's names", async () => {
        mockPost.mockResolvedValue({ data: { id: "r1", status: "pending" } });

        expect(await createTenancyRequest("u1", { tenancyName: "Data Amazon", reason: "SMPS data" })).toEqual({ id: "r1", status: "pending" });
        expect(mockPost).toHaveBeenCalledWith("/users/u1/tenancy-requests", { tenancy_name: "Data Amazon", reason: "SMPS data" }, asUser);
    });

    test("withdrawing deletes the request", async () => {
        mockDelete.mockResolvedValue({ status: 204 });

        await expect(withdrawTenancyRequest("u1", "r1")).resolves.toBeUndefined();
        expect(mockDelete).toHaveBeenCalledWith("/users/u1/tenancy-requests/r1", asUser);
    });

    test("pending invitations are read as the user", async () => {
        mockGet.mockResolvedValue({ data: [{ id: "ti1" }] });

        expect(await listMyTenancyInvitations("u1")).toEqual([{ id: "ti1" }]);
        expect(mockGet).toHaveBeenCalledWith("/users/u1/tenancy-invitations", asUser);
    });

    test("accepting answers the tenancy joined", async () => {
        mockPost.mockResolvedValue({ data: { tenancy: { path: "datamap/production/data-amazon" } } });

        expect(await acceptTenancyInvitation("u1", "ti1")).toEqual({ tenancy: { path: "datamap/production/data-amazon" } });
        expect(mockPost).toHaveBeenCalledWith("/users/u1/tenancy-invitations/ti1/accept", {}, asUser);
    });

    test("declining posts to the invitation", async () => {
        mockPost.mockResolvedValue({ status: 204 });

        await expect(declineTenancyInvitation("u1", "ti1")).resolves.toBeUndefined();
        expect(mockPost).toHaveBeenCalledWith("/users/u1/tenancy-invitations/ti1/decline", {}, asUser);
    });
});
