jest.mock("next-auth/jwt", () => ({ getToken: jest.fn(async () => ({ uid: "u1", v: 2 })) }));
jest.mock("../workspace");

import { AxiosError, AxiosHeaders } from "axios";
import withdrawHandler from "../../pages/api/workspace/invitations/[invitationId]";
import invitationsHandler from "../../pages/api/workspace/invitations/index";
import lookupHandler from "../../pages/api/workspace/lookup";
import membersHandler from "../../pages/api/workspace/members";
import { inviteToWorkspace, listWorkspaceInvitations, listWorkspaceMembers, lookupInvitee, withdrawWorkspaceInvitation } from "../workspace";

const JSON_HEADERS = { "content-type": "application/json" };
const AMAZON = "datamap/production/data-amazon";
const INVITEE = "7d1f0a2b-3c4d-4e5f-8a9b-0c1d2e3f4a5b";
const INVITATION_ID = "0b9e8d7c-6a5b-4c3d-8e2f-1a2b3c4d5e6f";

function gatekeeperError(status: number, data: unknown) {
    return new AxiosError("gatekeeper", "ERR", undefined, {}, {
        status, data, statusText: "", headers: {}, config: { headers: new AxiosHeaders() },
    } as any);
}

function fakeRes() {
    const res: any = { statusCode: 200, headers: {} };
    res.setHeader = jest.fn((key: string, value: string) => (res.headers[key] = value));
    res.getHeader = jest.fn((key: string) => res.headers[key]);
    res.status = jest.fn((code: number) => {
        res.statusCode = code;
        return res;
    });
    res.end = jest.fn(() => res);
    res.json = jest.fn(() => res);
    return res;
}

async function send(handler: any, method: string, query: Record<string, string> = {}, body: unknown = undefined, headers: Record<string, string> = {}) {
    const res = fakeRes();
    const original = process.stdout.write;
    // @ts-ignore
    process.stdout.write = () => true;
    try {
        await handler({ method, url: "/api/workspace/x", headers, cookies: {}, query, body } as any, res);
    } finally {
        process.stdout.write = original;
    }
    return res;
}

beforeEach(() => {
    jest.mocked(listWorkspaceMembers).mockReset();
    jest.mocked(listWorkspaceInvitations).mockReset();
    jest.mocked(inviteToWorkspace).mockReset();
    jest.mocked(withdrawWorkspaceInvitation).mockReset();
    jest.mocked(lookupInvitee).mockReset();
});

describe("the workspace BFF routes", () => {
    test("members are read for the user in the token, 50 at a time from the start", async () => {
        jest.mocked(listWorkspaceMembers).mockResolvedValue({ items: [], total_count: 0, limit: 50, offset: 0 });

        const res = await send(membersHandler, "GET", { tenancy: AMAZON });

        expect(res.statusCode).toBe(200);
        expect(listWorkspaceMembers).toHaveBeenCalledWith("u1", AMAZON, { limit: 50, offset: 0 });
        expect(res.json).toHaveBeenCalledWith({ items: [], total_count: 0, limit: 50, offset: 0 });
    });

    test("the next page is asked for by its offset", async () => {
        jest.mocked(listWorkspaceMembers).mockResolvedValue({ items: [], total_count: 120, limit: 50, offset: 50 });

        await send(membersHandler, "GET", { tenancy: AMAZON, limit: "50", offset: "50" });

        expect(listWorkspaceMembers).toHaveBeenCalledWith("u1", AMAZON, { limit: 50, offset: 50 });
    });

    test("a tenancy that is not a plain path never reaches the gatekeeper", async () => {
        for (const query of [{}, { tenancy: "../../admin/tenancies/datamap/production/atto" }, { tenancy: "datamap/production/../../users" }, { tenancy: "atto" }]) {
            const res = await send(membersHandler, "GET", query);
            expect(res.statusCode).toBe(400);
            expect(res.json).toHaveBeenCalledWith({ detail: "invalid_request" });
        }
        expect(listWorkspaceMembers).not.toHaveBeenCalled();
    });

    test("paging that is not a whole number is refused", async () => {
        for (const query of [{ tenancy: AMAZON, offset: "-1" }, { tenancy: AMAZON, limit: "ten" }]) {
            const res = await send(membersHandler, "GET", query);
            expect(res.statusCode).toBe(400);
        }
        expect(listWorkspaceMembers).not.toHaveBeenCalled();
    });

    test("a page of no members or of more than 100 is refused", async () => {
        for (const limit of ["0", "101", "99999999999999999999"]) {
            const res = await send(membersHandler, "GET", { tenancy: AMAZON, limit });
            expect(res.statusCode).toBe(400);
            expect(res.json).toHaveBeenCalledWith({ detail: "invalid_request" });
        }
        expect(listWorkspaceMembers).not.toHaveBeenCalled();
    });

    test("a page of 1 or of 100 members is asked for as it is", async () => {
        jest.mocked(listWorkspaceMembers).mockResolvedValue({ items: [], total_count: 0, limit: 100, offset: 0 });

        await send(membersHandler, "GET", { tenancy: AMAZON, limit: "1" });
        await send(membersHandler, "GET", { tenancy: AMAZON, limit: "100" });

        expect(listWorkspaceMembers).toHaveBeenCalledWith("u1", AMAZON, { limit: 1, offset: 0 });
        expect(listWorkspaceMembers).toHaveBeenCalledWith("u1", AMAZON, { limit: 100, offset: 0 });
    });

    test("someone who is not a member keeps the gatekeeper's 404 code", async () => {
        jest.mocked(listWorkspaceMembers).mockRejectedValue(gatekeeperError(404, { detail: "tenancy_not_found" }));

        const res = await send(membersHandler, "GET", { tenancy: AMAZON });

        expect(res.statusCode).toBe(404);
        expect(res.json).toHaveBeenCalledWith({ detail: "tenancy_not_found" });
    });

    test("Public keeps the gatekeeper's 409 code", async () => {
        jest.mocked(listWorkspaceInvitations).mockRejectedValue(gatekeeperError(409, { detail: "public_tenancy_locked" }));

        const res = await send(invitationsHandler, "GET", { tenancy: "datamap/production/public" });

        expect(res.statusCode).toBe(409);
        expect(res.json).toHaveBeenCalledWith({ detail: "public_tenancy_locked" });
    });

    test("pending invitations of the tenancy", async () => {
        jest.mocked(listWorkspaceInvitations).mockResolvedValue([{ id: INVITATION_ID } as any]);

        const res = await send(invitationsHandler, "GET", { tenancy: AMAZON });

        expect(res.statusCode).toBe(200);
        expect(listWorkspaceInvitations).toHaveBeenCalledWith("u1", AMAZON);
    });

    test("inviting sends the invitee and answers 201", async () => {
        jest.mocked(inviteToWorkspace).mockResolvedValue({ id: INVITATION_ID, can_withdraw: true } as any);

        const res = await send(invitationsHandler, "POST", { tenancy: AMAZON }, { userId: INVITEE }, JSON_HEADERS);

        expect(res.statusCode).toBe(201);
        expect(inviteToWorkspace).toHaveBeenCalledWith("u1", AMAZON, INVITEE);
        expect(res.json).toHaveBeenCalledWith({ id: INVITATION_ID, can_withdraw: true });
    });

    test("an invitee that is not a UUID is invalid_request", async () => {
        const res = await send(invitationsHandler, "POST", { tenancy: AMAZON }, { userId: "u7" }, JSON_HEADERS);

        expect(res.statusCode).toBe(400);
        expect(res.json).toHaveBeenCalledWith({ detail: "invalid_request" });
        expect(inviteToWorkspace).not.toHaveBeenCalled();
    });

    test("an invitation that is not JSON is refused", async () => {
        const res = await send(invitationsHandler, "POST", { tenancy: AMAZON }, `userId=${INVITEE}`, { "content-type": "application/x-www-form-urlencoded" });

        expect(res.statusCode).toBe(415);
        expect(inviteToWorkspace).not.toHaveBeenCalled();
    });

    test("an invitation the gatekeeper refuses keeps its code", async () => {
        jest.mocked(inviteToWorkspace).mockRejectedValue(gatekeeperError(409, { detail: "invitation_pending" }));

        const res = await send(invitationsHandler, "POST", { tenancy: AMAZON }, { userId: INVITEE }, JSON_HEADERS);

        expect(res.statusCode).toBe(409);
        expect(res.json).toHaveBeenCalledWith({ detail: "invitation_pending" });
    });

    test("withdrawing answers 204", async () => {
        jest.mocked(withdrawWorkspaceInvitation).mockResolvedValue(undefined);

        const res = await send(withdrawHandler, "DELETE", { tenancy: AMAZON, invitationId: INVITATION_ID });

        expect(res.statusCode).toBe(204);
        expect(withdrawWorkspaceInvitation).toHaveBeenCalledWith("u1", AMAZON, INVITATION_ID);
    });

    test("withdrawing someone else's invitation keeps the 403 code", async () => {
        jest.mocked(withdrawWorkspaceInvitation).mockRejectedValue(gatekeeperError(403, { detail: "forbidden" }));

        const res = await send(withdrawHandler, "DELETE", { tenancy: AMAZON, invitationId: INVITATION_ID });

        expect(res.statusCode).toBe(403);
        expect(res.json).toHaveBeenCalledWith({ detail: "forbidden" });
    });

    test("an invitation id that is not a UUID is not found, and the gatekeeper is not called", async () => {
        const res = await send(withdrawHandler, "DELETE", { tenancy: AMAZON, invitationId: "../members" });

        expect(res.statusCode).toBe(404);
        expect(res.json).toHaveBeenCalledWith({ detail: "invitation_not_found" });
        expect(withdrawWorkspaceInvitation).not.toHaveBeenCalled();
    });

    test("the lookup passes the typed value, trimmed", async () => {
        jest.mocked(lookupInvitee).mockResolvedValue({ user: { id: INVITEE }, can_invite: true, datasets: 108 } as any);

        const res = await send(lookupHandler, "GET", { tenancy: AMAZON, value: " fernanda@inpe.br " });

        expect(res.statusCode).toBe(200);
        expect(lookupInvitee).toHaveBeenCalledWith("u1", AMAZON, "fernanda@inpe.br");
        expect(res.json).toHaveBeenCalledWith({ user: { id: INVITEE }, can_invite: true, datasets: 108 });
    });

    test("a lookup without a value is invalid_request; an unknown account keeps its 404 code", async () => {
        const empty = await send(lookupHandler, "GET", { tenancy: AMAZON, value: "  " });
        jest.mocked(lookupInvitee).mockRejectedValue(gatekeeperError(404, { detail: "no_account" }));
        const unknown = await send(lookupHandler, "GET", { tenancy: AMAZON, value: "nobody@inpe.br" });

        expect(empty.statusCode).toBe(400);
        expect(empty.json).toHaveBeenCalledWith({ detail: "invalid_request" });
        expect(unknown.statusCode).toBe(404);
        expect(unknown.json).toHaveBeenCalledWith({ detail: "no_account" });
        expect(lookupInvitee).toHaveBeenCalledTimes(1);
    });
});
