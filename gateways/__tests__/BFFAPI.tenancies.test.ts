jest.mock("axios", () => {
    const actual = jest.requireActual("axios");
    return {
        __esModule: true,
        ...actual,
        default: {
            ...actual.default,
            get: jest.fn(),
            post: jest.fn(),
            delete: jest.fn(),
            isAxiosError: actual.default.isAxiosError,
        },
    };
});
jest.mock("../../lib/telemetryClient", () => ({ trackUiEvent: jest.fn() }));

import axios, { AxiosError, AxiosHeaders } from "axios";
import { trackUiEvent } from "../../lib/telemetryClient";
import { BFFAPI } from "../BFFAPI";

const bff = new BFFAPI();
const AMAZON = "datamap/production/data-amazon";

describe("BFFAPI tenancies", () => {
    test("a request sends the browser's names and is counted", async () => {
        jest.mocked(axios.post).mockResolvedValue({ status: 201, data: { id: "r1" } });

        expect(await bff.requestTenancyAccess({ tenancyName: "Data Amazon", reason: "SMPS data" })).toEqual({ id: "r1" });
        expect(axios.post).toHaveBeenCalledWith("/api/tenancy-requests", { tenancyName: "Data Amazon", reason: "SMPS data" });
        expect(trackUiEvent).toHaveBeenCalledWith("tenancy_access_requested");
    });

    test("withdrawing a request deletes it", async () => {
        jest.mocked(axios.delete).mockResolvedValue({ status: 204 });

        await bff.withdrawTenancyRequest("r1");

        expect(axios.delete).toHaveBeenCalledWith("/api/tenancy-requests/r1");
    });

    test("accepting posts JSON and answers the tenancy", async () => {
        jest.mocked(axios.post).mockResolvedValue({ status: 200, data: { tenancy: { path: AMAZON } } });

        expect(await bff.acceptTenancyInvitation("ti1")).toEqual({ tenancy: { path: AMAZON } });
        expect(axios.post).toHaveBeenCalledWith("/api/tenancy-invitations/ti1/accept", {});
        expect(trackUiEvent).toHaveBeenCalledWith("tenancy_invitation_accepted");
    });

    test("declining posts JSON", async () => {
        jest.mocked(axios.post).mockResolvedValue({ status: 204 });

        await bff.declineTenancyInvitation("ti1");

        expect(axios.post).toHaveBeenCalledWith("/api/tenancy-invitations/ti1/decline", {});
    });

    test("the lookup encodes the tenancy and the typed value", async () => {
        jest.mocked(axios.get).mockResolvedValue({ status: 200, data: { can_invite: true } });

        expect(await bff.lookupInvitee(AMAZON, "a+b@inpe.br")).toEqual({ can_invite: true });
        expect(axios.get).toHaveBeenCalledWith("/api/workspace/lookup?tenancy=datamap%2Fproduction%2Fdata-amazon&value=a%2Bb%40inpe.br");
    });

    test("inviting sends the invitee and is counted", async () => {
        jest.mocked(axios.post).mockResolvedValue({ status: 201, data: { id: "ti1" } });

        expect(await bff.inviteToWorkspace(AMAZON, "u7")).toEqual({ id: "ti1" });
        expect(axios.post).toHaveBeenCalledWith("/api/workspace/invitations?tenancy=datamap%2Fproduction%2Fdata-amazon", { userId: "u7" });
        expect(trackUiEvent).toHaveBeenCalledWith("tenancy_invitation_sent");
    });

    test("withdrawing an invitation deletes it", async () => {
        jest.mocked(axios.delete).mockResolvedValue({ status: 204 });

        await bff.withdrawWorkspaceInvitation(AMAZON, "ti1");

        expect(axios.delete).toHaveBeenCalledWith("/api/workspace/invitations/ti1?tenancy=datamap%2Fproduction%2Fdata-amazon");
    });

    test("a failure rejects with the Axios error, so the caller reads its code", async () => {
        const error = new AxiosError("conflict", "ERR", undefined, {}, {
            status: 409, data: { detail: "request_pending" }, statusText: "", headers: {}, config: { headers: new AxiosHeaders() },
        } as any);
        jest.mocked(axios.post).mockRejectedValue(error);

        await expect(bff.requestTenancyAccess({ tenancyName: "x", reason: "y" })).rejects.toBe(error);
    });
});
