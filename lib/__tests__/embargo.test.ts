import { endEmbargo, extendEmbargo, getAccessEvents, getEmbargoStatus, setEmbargo, setEmbargoMode, setEmbargoNote } from "../embargo";
import axiosInstance, { buildHeaders } from "../rpc";

jest.mock("../rpc")
const mockGet = jest.mocked(axiosInstance.get)
const mockPut = jest.mocked(axiosInstance.put)
const mockPost = jest.mocked(axiosInstance.post)
const mockBuildHeaders = jest.mocked(buildHeaders)

const context = { uid: "u1", tenancy: "datamap/production/data-amazon" };
const headers = { headers: { "X-User-Id": "u1" } };
const embargo = { until: "2026-12-01T23:59:59+00:00", active: true, metadata_visible: false, note: null };

beforeEach(() => {
    mockBuildHeaders.mockReturnValue(headers as any);
});

describe("embargo calls", () => {
    test("set", async () => {
        mockPut.mockResolvedValue({ data: embargo });
        const request = { until: embargo.until, metadata_visible: false, note: null };

        expect(await setEmbargo(context, "d1", request)).toEqual(embargo);
        expect(mockPut).toHaveBeenCalledWith("/datasets/d1/embargo", request, headers);
    });

    test("extend", async () => {
        mockPost.mockResolvedValue({ data: embargo });

        await extendEmbargo(context, "d1", { until: embargo.until });
        expect(mockPost).toHaveBeenCalledWith("/datasets/d1/embargo/extend", { until: embargo.until }, headers);
    });

    test("end", async () => {
        mockPost.mockResolvedValue({ data: { ...embargo, active: false } });

        expect((await endEmbargo(context, "d1")).active).toBe(false);
        expect(mockPost).toHaveBeenCalledWith("/datasets/d1/embargo/end", {}, headers);
    });

    test("mode", async () => {
        mockPut.mockResolvedValue({ data: { ...embargo, metadata_visible: true } });

        await setEmbargoMode(context, "d1", { metadata_visible: true });
        expect(mockPut).toHaveBeenCalledWith("/datasets/d1/embargo/mode", { metadata_visible: true }, headers);
    });

    test("status is asked without a user", async () => {
        mockGet.mockResolvedValue({ data: { embargoed: true, until: embargo.until } });

        expect(await getEmbargoStatus("d1")).toEqual({ embargoed: true, until: embargo.until });
        expect(mockGet).toHaveBeenCalledWith("/datasets/d1/embargo-status");
    });
});

describe("what the design adds", () => {
    test("the status of a version carries its DOI", async () => {
        mockGet.mockResolvedValue({ data: { embargoed: true, until: embargo.until, doi: "10.5281/datamap.3f9c1e" } });

        expect((await getEmbargoStatus("d1", "2")).doi).toBe("10.5281/datamap.3f9c1e");
        expect(mockGet).toHaveBeenCalledWith("/datasets/d1/embargo-status", { params: { version: "2" } });
    });

    test("the note is set by itself", async () => {
        mockPut.mockResolvedValue({ data: { ...embargo, note: "Accepted" } });

        expect((await setEmbargoNote(context, "d1", { note: "Accepted" })).note).toBe("Accepted");
        expect(mockPut).toHaveBeenCalledWith("/datasets/d1/embargo/note", { note: "Accepted" }, headers);
    });

    test("the history is read with the user's headers", async () => {
        mockGet.mockResolvedValue({ data: { items: [] } });

        expect(await getAccessEvents(context, "d1")).toEqual({ items: [] });
        expect(mockGet).toHaveBeenCalledWith("/datasets/d1/access-events", headers);
    });
});
