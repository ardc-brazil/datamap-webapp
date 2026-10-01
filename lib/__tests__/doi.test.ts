import { createDOI } from "../doi";
import axiosInstance, { buildHeaders } from "../rpc";

jest.mock("../rpc")
const mockPost = jest.mocked(axiosInstance.post)
const headers = { headers: { "X-User-Id": "u1" } };

beforeEach(() => {
    jest.mocked(buildHeaders).mockReturnValue(headers as any);
    mockPost.mockResolvedValue({ data: { identifier: "10.1000/182", mode: "manual", state: "findable" } });
});

const context = { uid: "u1", tenancy: "datamap/production/data-amazon" };

describe("createDOI", () => {
    test("a manual DOI that ends the embargo says so", async () => {
        await createDOI(context, { datasetId: "d1", versionName: "1", identifier: "10.1000/182", mode: "MANUAL", endEmbargo: true });

        expect(mockPost).toHaveBeenCalledWith("/datasets/d1/versions/1/doi", {
            mode: "MANUAL",
            identifier: "10.1000/182",
            tenancy: "datamap/production/data-amazon",
            end_embargo: true,
        }, headers);
    });

    test("otherwise the request is as before", async () => {
        await createDOI(context, { datasetId: "d1", versionName: "1", mode: "AUTO" });

        expect(mockPost).toHaveBeenCalledWith("/datasets/d1/versions/1/doi", {
            mode: "AUTO",
            identifier: undefined,
            tenancy: "datamap/production/data-amazon",
        }, headers);
    });
});
