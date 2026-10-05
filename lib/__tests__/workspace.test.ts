import { inviteToWorkspace, listWorkspaceInvitations, listWorkspaceMembers, lookupInvitee, withdrawWorkspaceInvitation } from "../workspace";
import axiosInstance from "../rpc";

jest.mock("../rpc");
const mockGet = jest.mocked(axiosInstance.get);
const mockPost = jest.mocked(axiosInstance.post);
const mockDelete = jest.mocked(axiosInstance.delete);

const asUser = { headers: { "X-User-Id": "u1" } };
const AMAZON = "datamap/production/data-amazon";

describe("the workspace calls", () => {
    test("members put the path in the URL as it is, and the page in parameters", async () => {
        mockGet.mockResolvedValue({ data: { items: [], total_count: 0, limit: 50, offset: 50 } });

        await listWorkspaceMembers("u1", AMAZON, { limit: 50, offset: 50 });

        expect(mockGet).toHaveBeenCalledWith("/users/u1/tenancies/datamap/production/data-amazon/members", { ...asUser, params: { limit: 50, offset: 50 } });
    });

    test("pending invitations of the tenancy", async () => {
        mockGet.mockResolvedValue({ data: [{ id: "ti1" }] });

        expect(await listWorkspaceInvitations("u1", AMAZON)).toEqual([{ id: "ti1" }]);
        expect(mockGet).toHaveBeenCalledWith("/users/u1/tenancies/datamap/production/data-amazon/invitations", asUser);
    });

    test("inviting sends the invitee in the gatekeeper's names", async () => {
        mockPost.mockResolvedValue({ data: { id: "ti1", can_withdraw: true } });

        expect(await inviteToWorkspace("u1", AMAZON, "u7")).toEqual({ id: "ti1", can_withdraw: true });
        expect(mockPost).toHaveBeenCalledWith("/users/u1/tenancies/datamap/production/data-amazon/invitations", { user_id: "u7" }, asUser);
    });

    test("withdrawing deletes the invitation", async () => {
        mockDelete.mockResolvedValue({ status: 204 });

        await expect(withdrawWorkspaceInvitation("u1", AMAZON, "ti1")).resolves.toBeUndefined();
        expect(mockDelete).toHaveBeenCalledWith("/users/u1/tenancies/datamap/production/data-amazon/invitations/ti1", asUser);
    });

    test("the lookup sends the typed value as a parameter", async () => {
        mockGet.mockResolvedValue({ data: { user: { id: "u7" }, can_invite: true, datasets: 108 } });

        expect(await lookupInvitee("u1", AMAZON, "fernanda@inpe.br")).toEqual({ user: { id: "u7" }, can_invite: true, datasets: 108 });
        expect(mockGet).toHaveBeenCalledWith("/users/u1/tenancies/datamap/production/data-amazon/lookup", { ...asUser, params: { value: "fernanda@inpe.br" } });
    });
});
