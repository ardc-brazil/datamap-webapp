jest.mock("next-auth/jwt", () => ({ getToken: jest.fn() }));
jest.mock("../admin");

import { AxiosError, AxiosHeaders } from "axios";
import { getToken } from "next-auth/jwt";
import tenanciesHandler from "../../pages/api/admin/tenancies/index";
import memberHandler from "../../pages/api/admin/tenancies/members/[userId]";
import membersHandler from "../../pages/api/admin/tenancies/members/index";
import invitationHandler from "../../pages/api/admin/tenancy-invitations/[invitationId]";
import usersHandler from "../../pages/api/admin/users";
import {
    addTenancyMember,
    createTenancy,
    getMemberRemovalImpact,
    listAdminTenancies,
    listTenancyMembers,
    removeTenancyMember,
    searchAdminUsers,
    withdrawTenancyInvitationAsAdmin,
} from "../admin";
import { TOKEN_VERSION } from "../sessionToken";

const ATTO = "datamap/production/atto";
const USER_ID = "0c1d2e3f-4a5b-4c6d-8e7f-9a0b1c2d3e4f";
const INVITATION_ID = "2c3d4e5f-6a7b-4c8d-9e0f-1a2b3c4d5e6f";
const JSON_BODY = { "content-type": "application/json" };

function gatekeeperError(status: number, detail: string) {
    return new AxiosError("gatekeeper", "ERR", undefined, {}, {
        status, data: { detail }, statusText: "", headers: {}, config: { headers: new AxiosHeaders() },
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
        await handler({ method, url: "/api/admin/x", headers, cookies: {}, query, body } as any, res);
    } finally {
        process.stdout.write = original;
    }
    return res;
}

beforeEach(() => {
    jest.mocked(getToken).mockResolvedValue({ uid: "admin-1", v: TOKEN_VERSION, admin: true } as any);
});

describe("the admin tenancy routes", () => {
    test("the list, for the signed-in admin", async () => {
        jest.mocked(listAdminTenancies).mockResolvedValue([]);

        const res = await send(tenanciesHandler, "GET");

        expect(res.json).toHaveBeenCalledWith([]);
        expect(listAdminTenancies).toHaveBeenCalledWith("admin-1");
    });

    test("creating answers 201 with the tenancy; a body without both names is refused", async () => {
        jest.mocked(createTenancy).mockResolvedValue({ path: "datamap/production/cerrado-flux" } as any);

        const created = await send(tenanciesHandler, "POST", {}, { displayName: "Cerrado Flux", namespace: "cerrado-flux" }, JSON_BODY);
        const refused = await send(tenanciesHandler, "POST", {}, { displayName: "Cerrado Flux" }, JSON_BODY);

        expect(created.statusCode).toBe(201);
        expect(created.json).toHaveBeenCalledWith({ path: "datamap/production/cerrado-flux" });
        expect(createTenancy).toHaveBeenCalledWith("admin-1", { displayName: "Cerrado Flux", namespace: "cerrado-flux" });
        expect(refused.statusCode).toBe(400);
        expect(createTenancy).toHaveBeenCalledTimes(1);
    });

    test("members take the tenancy from the query and page by 50", async () => {
        jest.mocked(listTenancyMembers).mockResolvedValue({ members: { items: [], total_count: 0, limit: 50, offset: 0 }, invitations: [] });

        await send(membersHandler, "GET", { tenancy: ATTO });
        await send(membersHandler, "GET", { tenancy: ATTO, limit: "50", offset: "50" });

        expect(listTenancyMembers).toHaveBeenNthCalledWith(1, "admin-1", ATTO, { limit: 50, offset: 0 });
        expect(listTenancyMembers).toHaveBeenNthCalledWith(2, "admin-1", ATTO, { limit: 50, offset: 50 });
    });

    test("a tenancy that is not a plain path is refused before the gatekeeper", async () => {
        for (const query of [{}, { tenancy: "../users" }, { tenancy: "datamap/production/../../users" }]) {
            const res = await send(membersHandler, "GET", query);
            expect(res.statusCode).toBe(400);
            expect(res.json).toHaveBeenCalledWith({ detail: "invalid_request" });
        }
        expect(listTenancyMembers).not.toHaveBeenCalled();
    });

    test("adding a member answers 201; a user id that is not a UUID is refused", async () => {
        jest.mocked(addTenancyMember).mockResolvedValue({ id: USER_ID } as any);

        const added = await send(membersHandler, "POST", { tenancy: ATTO }, { userId: USER_ID }, JSON_BODY);
        const refused = await send(membersHandler, "POST", { tenancy: ATTO }, { userId: "someone" }, JSON_BODY);

        expect(added.statusCode).toBe(201);
        expect(addTenancyMember).toHaveBeenCalledWith("admin-1", ATTO, USER_ID);
        expect(refused.statusCode).toBe(400);
        expect(addTenancyMember).toHaveBeenCalledTimes(1);
    });

    test("a gatekeeper refusal to add keeps its code", async () => {
        jest.mocked(addTenancyMember).mockRejectedValue(gatekeeperError(409, "public_tenancy_locked"));

        const res = await send(membersHandler, "POST", { tenancy: "datamap/production/public" }, { userId: USER_ID }, JSON_BODY);

        expect(res.statusCode).toBe(409);
        expect(res.json).toHaveBeenCalledWith({ detail: "public_tenancy_locked" });
    });

    test("the removal impact of one member", async () => {
        jest.mocked(getMemberRemovalImpact).mockResolvedValue({ member_since: "2026-09-30T09:41:00+00:00", datasets_in_tenancy: 31, shared_with_user: 1, owned_by_user: 0 });

        const res = await send(memberHandler, "GET", { tenancy: ATTO, userId: USER_ID });

        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ datasets_in_tenancy: 31 }));
        expect(getMemberRemovalImpact).toHaveBeenCalledWith("admin-1", ATTO, USER_ID);
    });

    test("removing a member answers 204; a user id that is not a UUID is not found", async () => {
        jest.mocked(removeTenancyMember).mockResolvedValue(undefined);

        const removed = await send(memberHandler, "DELETE", { tenancy: ATTO, userId: USER_ID }, {}, JSON_BODY);
        const unknown = await send(memberHandler, "DELETE", { tenancy: ATTO, userId: "x" }, {}, JSON_BODY);

        expect(removed.statusCode).toBe(204);
        expect(removeTenancyMember).toHaveBeenCalledWith("admin-1", ATTO, USER_ID);
        expect(unknown.statusCode).toBe(404);
        expect(unknown.json).toHaveBeenCalledWith({ detail: "member_not_found" });
    });

    test("withdrawing an invitation answers 204; an id that is not a UUID is not found", async () => {
        jest.mocked(withdrawTenancyInvitationAsAdmin).mockResolvedValue(undefined);

        const withdrawn = await send(invitationHandler, "DELETE", { invitationId: INVITATION_ID }, {}, JSON_BODY);
        const unknown = await send(invitationHandler, "DELETE", { invitationId: "x" }, {}, JSON_BODY);

        expect(withdrawn.statusCode).toBe(204);
        expect(withdrawTenancyInvitationAsAdmin).toHaveBeenCalledWith("admin-1", INVITATION_ID);
        expect(unknown.statusCode).toBe(404);
        expect(unknown.json).toHaveBeenCalledWith({ detail: "invitation_not_found" });
    });

    test("a DELETE with no content type is refused before the gatekeeper", async () => {
        const member = await send(memberHandler, "DELETE", { tenancy: ATTO, userId: USER_ID });
        const invitation = await send(invitationHandler, "DELETE", { invitationId: INVITATION_ID });

        expect(member.statusCode).toBe(415);
        expect(invitation.statusCode).toBe(415);
        expect(removeTenancyMember).not.toHaveBeenCalled();
        expect(withdrawTenancyInvitationAsAdmin).not.toHaveBeenCalled();
    });

    test("user search trims the query and needs two characters", async () => {
        jest.mocked(searchAdminUsers).mockResolvedValue([]);

        const found = await send(usersHandler, "GET", { q: " fer " });
        const short = await send(usersHandler, "GET", { q: " f " });

        expect(found.statusCode).toBe(200);
        expect(searchAdminUsers).toHaveBeenCalledWith("admin-1", "fer");
        expect(short.statusCode).toBe(400);
        expect(searchAdminUsers).toHaveBeenCalledTimes(1);
    });

    test("an account that is not an admin cannot remove anyone", async () => {
        jest.mocked(getToken).mockResolvedValue({ uid: "u1", v: TOKEN_VERSION } as any);

        const res = await send(memberHandler, "DELETE", { tenancy: ATTO, userId: USER_ID }, {}, JSON_BODY);

        expect(res.statusCode).toBe(404);
        expect(removeTenancyMember).not.toHaveBeenCalled();
    });
});
