jest.mock("axios", () => {
    const actual = jest.requireActual("axios");
    return {
        __esModule: true,
        ...actual,
        default: {
            ...actual.default,
            post: jest.fn(),
            delete: jest.fn(),
            isAxiosError: actual.default.isAxiosError,
        },
    };
});

import axios, { AxiosError, AxiosHeaders } from "axios";
import { BFFAPI } from "../BFFAPI";

const bff = new BFFAPI();
const REQUEST_ID = "7a9b5d5e-fa6d-4c18-9a51-2b1e2c3d4e5f";
const USER_ID = "0c1d2e3f-4a5b-4c6d-8e7f-9a0b1c2d3e4f";
const INVITATION_ID = "2c3d4e5f-6a7b-4c8d-9e0f-1a2b3c4d5e6f";

describe("BFFAPI admin", () => {
    test("approving into an existing tenancy", async () => {
        jest.mocked(axios.post).mockResolvedValue({ status: 200, data: { id: REQUEST_ID, status: "approved" } });

        expect(await bff.approveTenancyRequest(REQUEST_ID, { tenancy: "datamap/production/atto" })).toEqual({ id: REQUEST_ID, status: "approved" });
        expect(axios.post).toHaveBeenCalledWith(`/api/admin/tenancy-requests/${REQUEST_ID}/approve`, { tenancy: "datamap/production/atto" });
    });

    test("approving with a new tenancy sends it as the browser names it", async () => {
        jest.mocked(axios.post).mockResolvedValue({ status: 200, data: {} });
        const decision = { newTenancy: { displayName: "Cerrado Flux", namespace: "cerrado-flux" } };

        await bff.approveTenancyRequest(REQUEST_ID, decision);

        expect(axios.post).toHaveBeenCalledWith(`/api/admin/tenancy-requests/${REQUEST_ID}/approve`, decision);
    });

    test("declining sends the message, or null", async () => {
        jest.mocked(axios.post).mockResolvedValue({ status: 200, data: {} });

        await bff.declineTenancyRequest(REQUEST_ID, "Ask Luciana");
        await bff.declineTenancyRequest(REQUEST_ID);

        expect(axios.post).toHaveBeenNthCalledWith(1, `/api/admin/tenancy-requests/${REQUEST_ID}/decline`, { message: "Ask Luciana" });
        expect(axios.post).toHaveBeenNthCalledWith(2, `/api/admin/tenancy-requests/${REQUEST_ID}/decline`, { message: null });
    });

    test("creating a tenancy", async () => {
        jest.mocked(axios.post).mockResolvedValue({ status: 201, data: { path: "datamap/production/cerrado-flux" } });
        const input = { displayName: "Cerrado Flux", namespace: "cerrado-flux" };

        expect(await bff.createTenancy(input)).toEqual({ path: "datamap/production/cerrado-flux" });
        expect(axios.post).toHaveBeenCalledWith("/api/admin/tenancies", input);
    });

    test("adding a member sends the tenancy as a query parameter", async () => {
        jest.mocked(axios.post).mockResolvedValue({ status: 201, data: { id: USER_ID } });

        expect(await bff.addTenancyMember("datamap/production/atto", USER_ID)).toEqual({ id: USER_ID });
        expect(axios.post).toHaveBeenCalledWith("/api/admin/tenancies/members?tenancy=datamap%2Fproduction%2Fatto", { userId: USER_ID });
    });

    test("removing a member sends a JSON body, which the admin routes require on a change", async () => {
        jest.mocked(axios.delete).mockResolvedValue({ status: 204, data: "" });

        await expect(bff.removeTenancyMember("datamap/production/atto", USER_ID)).resolves.toBeUndefined();
        expect(axios.delete).toHaveBeenCalledWith(`/api/admin/tenancies/members/${USER_ID}?tenancy=datamap%2Fproduction%2Fatto`, { data: {} });
    });

    test("withdrawing an invitation", async () => {
        jest.mocked(axios.delete).mockResolvedValue({ status: 204, data: "" });

        await expect(bff.withdrawTenancyInvitationAsAdmin(INVITATION_ID)).resolves.toBeUndefined();
        expect(axios.delete).toHaveBeenCalledWith(`/api/admin/tenancy-invitations/${INVITATION_ID}`, { data: {} });
    });

    test("an error rejects with the Axios error, so the caller can read its code", async () => {
        const error = new AxiosError("conflict", "ERR", undefined, {}, {
            status: 409, data: { detail: "request_not_pending" }, statusText: "", headers: {}, config: { headers: new AxiosHeaders() },
        } as any);
        jest.mocked(axios.post).mockRejectedValue(error);

        await expect(bff.declineTenancyRequest(REQUEST_ID)).rejects.toBe(error);
    });
});
