import {
    acceptInvitation,
    changePermissionLevel,
    claimInvitations,
    createAnonymousLink,
    getAnonymousPage,
    getInvitationPreview,
    getShareState,
    grantAccess,
    regenerateInvitationLink,
    revokeInvitation,
    revokePermission,
    revokeAnonymousLink,
    searchShareCandidates,
} from "../share";
import axiosInstance, { buildHeaders } from "../rpc";

jest.mock("../rpc")
const mockGet = jest.mocked(axiosInstance.get)
const mockPut = jest.mocked(axiosInstance.put)
const mockPost = jest.mocked(axiosInstance.post)
const mockDelete = jest.mocked(axiosInstance.delete)
const mockBuildHeaders = jest.mocked(buildHeaders)

const context = { uid: "u1", tenancy: "datamap/production/data-amazon" };
const headers = { headers: { "X-User-Id": "u1" } };

beforeEach(() => {
    mockBuildHeaders.mockReturnValue(headers as any);
});

describe("share calls", () => {
    test("candidates carry the query as a parameter", async () => {
        mockGet.mockResolvedValue({ data: [{ id: "u2", name: "Ana", email: "ana@usp.br" }] });

        expect(await searchShareCandidates(context, "d1", "an")).toHaveLength(1);
        expect(mockGet).toHaveBeenCalledWith("/datasets/d1/share/candidates", { ...headers, params: { q: "an" } });
    });

    test("state", async () => {
        mockGet.mockResolvedValue({ data: { owner: {}, permissions: [], invitations: [], anonymous_links: [] } });

        await getShareState(context, "d1");
        expect(mockGet).toHaveBeenCalledWith("/datasets/d1/share", headers);
    });

    test("grant", async () => {
        mockPost.mockResolvedValue({ data: { kind: "invitation", invitation: {}, link: "https://x/invitations/t" } });

        expect((await grantAccess(context, "d1", { email: "a@b.co", level: "read" })).kind).toBe("invitation");
        expect(mockPost).toHaveBeenCalledWith("/datasets/d1/share", { email: "a@b.co", level: "read" }, headers);
    });

    test("change level", async () => {
        mockPut.mockResolvedValue({ data: {} });

        await changePermissionLevel(context, "d1", "u2", "write");
        expect(mockPut).toHaveBeenCalledWith("/datasets/d1/share/permissions/u2", { level: "write" }, headers);
    });

    test("revoke permission", async () => {
        mockDelete.mockResolvedValue({ status: 204 });

        await revokePermission(context, "d1", "u2");
        expect(mockDelete).toHaveBeenCalledWith("/datasets/d1/share/permissions/u2", headers);
    });

    test("revoke invitation", async () => {
        mockDelete.mockResolvedValue({ status: 204 });

        await revokeInvitation(context, "d1", "i1");
        expect(mockDelete).toHaveBeenCalledWith("/datasets/d1/share/invitations/i1", headers);
    });

    test("regenerate an invitation link", async () => {
        mockPost.mockResolvedValue({ data: { link: "https://x/invitations/new" } });

        expect(await regenerateInvitationLink(context, "d1", "i1")).toEqual({ link: "https://x/invitations/new" });
        expect(mockPost).toHaveBeenCalledWith("/datasets/d1/share/invitations/i1/link", {}, headers);
    });

    test("create an anonymous link", async () => {
        mockPost.mockResolvedValue({ data: { id: "r1", link: "https://x/anonymous/t" } });

        await createAnonymousLink(context, "d1", "JGR, round 1");
        expect(mockPost).toHaveBeenCalledWith("/datasets/d1/anonymous-links", { label: "JGR, round 1" }, headers);
    });

    test("revoke an anonymous link", async () => {
        mockDelete.mockResolvedValue({ status: 204 });

        await revokeAnonymousLink(context, "d1", "r1");
        expect(mockDelete).toHaveBeenCalledWith("/datasets/d1/anonymous-links/r1", headers);
    });

    test("the anonymous page is asked without a user", async () => {
        mockGet.mockResolvedValue({ data: { state: "published", dataset_id: "d1" } });

        await getAnonymousPage("a/b");
        expect(mockGet).toHaveBeenCalledWith("/anonymous/a%2Fb");
    });

    test("accept sends the user and the token", async () => {
        mockPost.mockResolvedValue({ data: { dataset_id: "d1", level: "read" } });

        await acceptInvitation(context, "tok");
        expect(mockPost).toHaveBeenCalledWith("/invitations/accept", { token: "tok" }, { headers: { "X-User-Id": "u1" } });
    });

    test("claim sends the user", async () => {
        mockPost.mockResolvedValue({ data: { accepted: [] } });

        await claimInvitations("u1");
        expect(mockPost).toHaveBeenCalledWith("/users/u1/invitations/claim", {}, { headers: { "X-User-Id": "u1" } });
    });
});

describe("invitation preview", () => {
    test("is read without a user", async () => {
        const preview = { state: "pending", dataset_name: "Ozone", inviter_name: "Ana", owner_name: "Ana", level: "read", invited_as: "x@y.org", embargo_until: null, accepted_at: null };
        jest.mocked(axiosInstance.get).mockResolvedValue({ data: preview });

        expect(await getInvitationPreview("tok/1")).toEqual(preview);
        expect(axiosInstance.get).toHaveBeenCalledWith("/invitations/tok%2F1");
    });
});
