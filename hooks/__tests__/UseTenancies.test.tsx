/** @jest-environment jsdom */
import { beforeEach, describe, expect, jest, test } from '@jest/globals';
import { renderHook, waitFor } from '@testing-library/react';

const update = jest.fn() as any;
const mutate = jest.fn() as any;
let requests: any;
let sessionTenancies: string[];

jest.mock("swr", () => ({ __esModule: true, default: () => ({ data: requests, mutate: jest.fn() }), mutate: (...args: unknown[]) => mutate(...args) }));
jest.mock("next-auth/react", () => ({ useSession: () => ({ data: { user: { tenancies: sessionTenancies } }, update }) }));
jest.mock("../../lib/fetcher", () => ({ fetcher: jest.fn() }));

import { TENANCIES_KEY } from "../../contants/TenancyConstants";
import { revalidateMyTenancies, useLatestTenancyRequest } from "../UseTenancies";

const AMAZON = { path: "datamap/production/data-amazon", display_name: "Data Amazon", is_default: false, is_legacy: false };

function approved(): any {
    return {
        id: "r1", requested_name: "Data Amazon", reason: "SMPS data", status: "approved", tenancy: AMAZON,
        created_tenancy: false, decision_message: null, created_at: new Date().toISOString(), decided_at: new Date().toISOString(),
    };
}

beforeEach(() => {
    update.mockReset();
    mutate.mockReset();
    sessionTenancies = ["datamap/production/public"];
});

describe("useLatestTenancyRequest", () => {
    test("an approval the session lacks refreshes the session once", () => {
        requests = [approved()];

        const { rerender } = renderHook(() => useLatestTenancyRequest());
        rerender();

        expect(update).toHaveBeenCalledTimes(1);
    });

    test("an approval the session lacks revalidates the user's tenancies once", async () => {
        requests = [approved()];

        const { rerender } = renderHook(() => useLatestTenancyRequest());
        rerender();

        await waitFor(() => expect(mutate).toHaveBeenCalledTimes(1));
        expect(mutate).toHaveBeenCalledWith(TENANCIES_KEY);
    });

    test("an approval the session already has does not", () => {
        requests = [approved()];
        sessionTenancies = ["datamap/production/public", AMAZON.path];

        renderHook(() => useLatestTenancyRequest());

        expect(update).not.toHaveBeenCalled();
        expect(mutate).not.toHaveBeenCalled();
    });

    test("a pending request is reported and refreshes nothing", () => {
        requests = [{ ...approved(), status: "pending", tenancy: null, decided_at: null }];

        const { result } = renderHook(() => useLatestTenancyRequest());

        expect(result.current.state?.kind).toBe("pending");
        expect(update).not.toHaveBeenCalled();
    });

    test("a session that changes after the refresh does not trigger a second update()", () => {
        requests = [approved()];

        const { rerender } = renderHook(() => useLatestTenancyRequest());
        expect(update).toHaveBeenCalledTimes(1);

        sessionTenancies = [...sessionTenancies];
        rerender();

        expect(update).toHaveBeenCalledTimes(1);
    });
});

describe("revalidateMyTenancies", () => {
    test("revalidates the user's tenancies", async () => {
        await revalidateMyTenancies();

        expect(mutate).toHaveBeenCalledWith(TENANCIES_KEY);
    });

    test("a failed revalidation is logged, never thrown", async () => {
        mutate.mockRejectedValue(new Error("offline"));
        const consoleError = jest.spyOn(console, "error").mockImplementation(() => undefined);

        await expect(revalidateMyTenancies()).resolves.toBeUndefined();

        expect(consoleError).toHaveBeenCalled();
        consoleError.mockRestore();
    });
});
