jest.mock("../../lib/telemetryClient", () => ({ trackUiEvent: jest.fn() }));
jest.mock("axios", () => {
    const actual = jest.requireActual("axios");
    return {
        __esModule: true,
        ...actual,
        default: {
            ...actual.default,
            get: jest.fn(),
            post: jest.fn(),
            put: jest.fn(),
            delete: jest.fn(),
            isAxiosError: actual.default.isAxiosError,
        },
    };
});

import axios, { AxiosError, AxiosHeaders } from "axios";
import { trackUiEvent } from "../../lib/telemetryClient";
import { BFFAPI } from "../BFFAPI";

const bff = new BFFAPI();

describe("BFFAPI embargo and sharing", () => {
    test("setting an embargo calls the BFF and records the event", async () => {
        jest.mocked(axios.put).mockResolvedValue({ status: 200, data: { active: true } });
        const request = { until: "2026-12-01T23:59:59+00:00", metadata_visible: true, note: null };

        expect(await bff.setEmbargo("d1", request)).toEqual({ active: true });
        expect(axios.put).toHaveBeenCalledWith("/api/datasets/d1/embargo", request);
        expect(trackUiEvent).toHaveBeenCalledWith("embargo_set");
    });

    test("a refused grant throws the API error with its code, and records nothing", async () => {
        jest.mocked(axios.post).mockRejectedValue(new AxiosError("bad", "ERR", undefined, {}, {
            status: 400, data: { errors: [{ code: "already_has_access" }] },
            statusText: "", headers: {}, config: { headers: new AxiosHeaders() },
        } as any));

        await expect(bff.grantAccess("d1", { email: "a@b.co", level: "read" }))
            .rejects.toMatchObject({ httpCode: 400, errors: [{ code: "already_has_access" }] });
        expect(trackUiEvent).not.toHaveBeenCalled();
    });

    test("candidates are searched with the query encoded", async () => {
        jest.mocked(axios.get).mockResolvedValue({ status: 200, data: [] });

        await bff.searchShareCandidates("d1", "ana souza");

        expect(axios.get).toHaveBeenCalledWith("/api/datasets/d1/share/candidates?q=ana%20souza");
    });

    test("changing what members can do calls the BFF and records the event", async () => {
        const answer = { members_can_edit: false, access: { level: "owner" } };
        jest.mocked(axios.put).mockResolvedValue({ status: 200, data: answer });

        expect(await bff.setMembersAccess("d1", { members_can_edit: false })).toEqual(answer);
        expect(axios.put).toHaveBeenCalledWith("/api/datasets/d1/members-access", { members_can_edit: false });
        expect(trackUiEvent).toHaveBeenCalledWith("members_access_changed");
    });
});
