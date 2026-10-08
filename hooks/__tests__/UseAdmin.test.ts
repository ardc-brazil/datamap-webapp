const mockUseSWR = jest.fn((..._args: unknown[]) => ({ data: undefined }));
const mockUseSWRInfinite = jest.fn((..._args: unknown[]) => ({ data: undefined }));
const mockMutate = jest.fn((..._args: unknown[]) => Promise.resolve([]));

jest.mock("swr", () => ({
    __esModule: true,
    default: (...args: unknown[]) => mockUseSWR(...args),
    mutate: (...args: unknown[]) => mockMutate(...args),
}));
jest.mock("swr/infinite", () => ({
    __esModule: true,
    default: (...args: unknown[]) => mockUseSWRInfinite(...args),
}));
jest.mock("../../lib/fetcher", () => ({ fetcher: jest.fn() }));

import {
    revalidateAdminRequests,
    revalidateAdminTenancies,
    useAdminCounts,
    useAdminRequest,
    useAdminRequests,
    useAdminUserSearch,
    useRemovalImpact,
    useTenancyMembers,
} from "../UseAdmin";
import { fetcher } from "../../lib/fetcher";

type GetKey = (index: number, previous: unknown) => string | null;

function page(offset: number, count: number, total: number) {
    return { members: { items: new Array(count).fill({}), total_count: total, limit: 50, offset }, invitations: [] };
}

describe("the admin hooks", () => {
    test("the counts revalidate on focus and every minute", () => {
        useAdminCounts();

        expect(mockUseSWR).toHaveBeenCalledWith("/api/admin/tenancy-requests/counts", fetcher, { revalidateOnFocus: true, refreshInterval: 60_000 });
    });

    test("the counts are not fetched for someone who is not an admin", () => {
        useAdminCounts(false);

        expect(mockUseSWR).toHaveBeenCalledWith(null, fetcher, expect.anything());
    });

    test("the queue is keyed by its query and keeps the last page while the next loads", () => {
        useAdminRequests({ status: "open", kind: "new", q: "", offset: 0 });

        expect(mockUseSWR).toHaveBeenCalledWith("/api/admin/tenancy-requests?status=open&kind=new&limit=50&offset=0", fetcher, { keepPreviousData: true });
    });

    test("one request is fetched only when there is an id", () => {
        useAdminRequest(null);
        useAdminRequest("r1");

        expect(mockUseSWR).toHaveBeenNthCalledWith(1, null, fetcher);
        expect(mockUseSWR).toHaveBeenNthCalledWith(2, "/api/admin/tenancy-requests/r1", fetcher);
    });

    test("members page by 50 and stop after the last page", () => {
        useTenancyMembers(null);
        useTenancyMembers("datamap/production/atto");
        const none = mockUseSWRInfinite.mock.calls[0][0] as GetKey;
        const getKey = mockUseSWRInfinite.mock.calls[1][0] as GetKey;

        expect(none(0, null)).toBeNull();
        expect(getKey(0, null)).toBe("/api/admin/tenancies/members?tenancy=datamap%2Fproduction%2Fatto&limit=50&offset=0");
        expect(getKey(1, page(0, 50, 120))).toBe("/api/admin/tenancies/members?tenancy=datamap%2Fproduction%2Fatto&limit=50&offset=50");
        expect(getKey(3, page(100, 20, 120))).toBeNull();
    });

    test("the removal impact waits for both the tenancy and the member", () => {
        useRemovalImpact("datamap/production/atto", null);
        useRemovalImpact("datamap/production/atto", "u-1");

        expect(mockUseSWR).toHaveBeenNthCalledWith(1, null, fetcher);
        expect(mockUseSWR).toHaveBeenNthCalledWith(2, "/api/admin/tenancies/members/u-1?tenancy=datamap%2Fproduction%2Fatto", fetcher);
    });

    test("user search does not fetch below two characters", () => {
        useAdminUserSearch("f");

        expect(mockUseSWR).toHaveBeenCalledWith(null, fetcher);
    });

    test("revalidation refreshes the request keys, counts included, or the tenancy keys", async () => {
        await revalidateAdminRequests();
        await revalidateAdminTenancies();
        const requests = mockMutate.mock.calls[0][0] as (key: unknown) => boolean;
        const tenancies = mockMutate.mock.calls[1][0] as (key: unknown) => boolean;

        expect(requests("/api/admin/tenancy-requests/counts")).toBe(true);
        expect(requests("/api/admin/tenancies")).toBe(false);
        expect(tenancies("/api/admin/tenancies/members?tenancy=x%2Fy&limit=50&offset=0")).toBe(true);
        expect(tenancies("/api/admin/tenancy-requests/counts")).toBe(false);
    });
});
