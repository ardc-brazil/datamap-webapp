const mockUseSWR = jest.fn((..._args: unknown[]) => ({ data: undefined }));
const mockUseSWRInfinite = jest.fn((..._args: unknown[]) => ({ data: undefined }));
let mockTenancies: unknown;
let mockTenanciesError: unknown;

jest.mock("swr", () => ({ __esModule: true, default: (...args: unknown[]) => mockUseSWR(...args) }));
jest.mock("swr/infinite", () => ({ __esModule: true, default: (...args: unknown[]) => mockUseSWRInfinite(...args) }));
jest.mock("../../lib/fetcher", () => ({ fetcher: jest.fn() }));
jest.mock("../../components/TenancyStore", () => ({
    useTenancyStore: (selector: (state: unknown) => unknown) => selector({ tenancySelected: "datamap/production/data-amazon" }),
}));
jest.mock("../UseTenancies", () => ({ useMyTenancies: () => ({ data: mockTenancies, error: mockTenanciesError }) }));

import { fetcher } from "../../lib/fetcher";
import { useMembersPageTenancy, useWorkspaceInvitations, useWorkspaceMembers } from "../UseWorkspace";

type GetKey = (index: number, previous: unknown) => string | null;

const PUBLIC = { path: "datamap/production/public", display_name: "Public", is_default: true, is_legacy: false };
const AMAZON = { path: "datamap/production/data-amazon", display_name: "Data Amazon", is_default: false, is_legacy: false };

function lastCall(mock: jest.Mock): unknown[] {
    return mock.mock.calls[mock.mock.calls.length - 1];
}

function page(offset: number, count: number, total: number) {
    return { items: new Array(count).fill({}), total_count: total, limit: 50, offset };
}

describe("the workspace hooks", () => {
    test("the Members page is for the selected tenancy, once the user's tenancies are known", () => {
        mockTenancies = undefined;
        mockTenanciesError = undefined;
        expect(useMembersPageTenancy()).toEqual({ tenancy: null, loading: true, error: undefined });

        mockTenancies = [PUBLIC, AMAZON];
        expect(useMembersPageTenancy()).toEqual({ tenancy: AMAZON, loading: false, error: undefined });
    });

    test("the user's tenancies that cannot load are an error, not a tenancy without a Members page", () => {
        const failure = { status: 500, detail: "unavailable" };
        mockTenancies = undefined;
        mockTenanciesError = failure;
        expect(useMembersPageTenancy()).toEqual({ tenancy: null, loading: false, error: failure });

        mockTenancies = [PUBLIC, AMAZON];
        expect(useMembersPageTenancy()).toEqual({ tenancy: AMAZON, loading: false, error: undefined });
        mockTenanciesError = undefined;
    });

    test("members load 50 at a time and stop after the last page", () => {
        useWorkspaceMembers(AMAZON.path);

        const [getKey, fetch] = lastCall(mockUseSWRInfinite) as [GetKey, unknown];
        expect(fetch).toBe(fetcher);
        expect(getKey(0, null)).toBe("/api/workspace/members?tenancy=datamap%2Fproduction%2Fdata-amazon&limit=50&offset=0");
        expect(getKey(1, page(0, 50, 120))).toBe("/api/workspace/members?tenancy=datamap%2Fproduction%2Fdata-amazon&limit=50&offset=50");
        expect(getKey(3, page(100, 20, 120))).toBeNull();
    });

    test("without a tenancy nothing is fetched", () => {
        useWorkspaceMembers(null);
        useWorkspaceInvitations(null);

        expect((lastCall(mockUseSWRInfinite)[0] as GetKey)(0, null)).toBeNull();
        expect(mockUseSWR).toHaveBeenLastCalledWith(null, fetcher);
    });

    test("the pending invitations of the tenancy", () => {
        useWorkspaceInvitations(AMAZON.path);

        expect(mockUseSWR).toHaveBeenLastCalledWith("/api/workspace/invitations?tenancy=datamap%2Fproduction%2Fdata-amazon", fetcher);
    });
});
