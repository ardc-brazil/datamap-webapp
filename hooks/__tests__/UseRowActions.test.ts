/** @jest-environment jsdom */
import { describe, expect, jest, test } from '@jest/globals';
import { act, renderHook, waitFor } from '@testing-library/react';
import { tenancyErrorMessage } from "../../contants/TenancyConstants";
import { useRowActions } from "../UseRowActions";

function deferred() {
    let resolve!: () => void;
    let reject!: (reason: unknown) => void;
    const promise = new Promise<void>((ok, fail) => { resolve = ok; reject = fail; });
    return { promise, resolve, reject };
}

function failure(status: number, detail: string) {
    return { response: { status, data: { detail } } };
}

describe("useRowActions", () => {
    test("a running row is busy until its action settles", async () => {
        const action = deferred();
        const { result } = renderHook(() => useRowActions(jest.fn(async () => undefined)));

        let running!: Promise<void>;
        act(() => { running = result.current.run("a", () => action.promise); });

        expect(result.current.busy("a")).toBe(true);
        expect(result.current.busy("b")).toBe(false);

        await act(async () => { action.resolve(); await running; });

        expect(result.current.busy("a")).toBe(false);
        expect(result.current.error("a")).toBeUndefined();
    });

    test("a second run on a busy row is ignored", async () => {
        const action = deferred();
        const work = jest.fn(() => action.promise);
        const { result } = renderHook(() => useRowActions(jest.fn(async () => undefined)));

        let first!: Promise<void>;
        act(() => {
            first = result.current.run("a", work);
            result.current.run("a", work);
        });

        await act(async () => { action.resolve(); await first; });

        expect(work).toHaveBeenCalledTimes(1);
    });

    test("an error stays on its own row and is mapped to its message", async () => {
        const revalidate = jest.fn(async () => undefined);
        const { result } = renderHook(() => useRowActions(revalidate));

        await act(async () => {
            await Promise.all([
                result.current.run("a", async () => { throw failure(403, "forbidden"); }),
                result.current.run("b", async () => undefined),
            ]);
        });

        expect(result.current.error("a")).toBe("Only the member who sent an invitation can withdraw it.");
        expect(result.current.error("b")).toBeUndefined();
        expect(result.current.busy("a")).toBe(false);
        expect(revalidate).toHaveBeenCalledTimes(1);
    });

    test.each(["invitation_not_found", "request_not_found"])("%s revalidates the list", async (detail) => {
        const revalidate = jest.fn(async () => undefined);
        const { result } = renderHook(() => useRowActions(revalidate));

        await act(async () => { await result.current.run("a", async () => { throw failure(404, detail); }); });

        expect(revalidate).toHaveBeenCalledTimes(1);
        expect(result.current.error("a")).toBeTruthy();
    });

    test("running a row again clears its previous error", async () => {
        const action = deferred();
        const { result } = renderHook(() => useRowActions(jest.fn(async () => undefined)));

        await act(async () => { await result.current.run("a", async () => { throw failure(500, "unavailable"); }); });
        expect(result.current.error("a")).toBe("Something went wrong. Please try again.");

        act(() => { result.current.run("a", () => action.promise); });

        expect(result.current.error("a")).toBeUndefined();
        await act(async () => { action.resolve(); });
        await waitFor(() => expect(result.current.busy("a")).toBe(false));
    });

    test("a successful action revalidates the list once", async () => {
        const revalidate = jest.fn(async () => undefined);
        const { result } = renderHook(() => useRowActions(revalidate));

        await act(async () => { await result.current.run("a", async () => undefined); });

        expect(revalidate).toHaveBeenCalledTimes(1);
    });

    test("a revalidation that fails after a successful action shows no error and does not reject", async () => {
        const consoleError = jest.spyOn(console, "error").mockImplementation(() => undefined);
        const { result } = renderHook(() => useRowActions(jest.fn(async () => { throw new Error("offline"); })));

        await act(async () => {
            await expect(result.current.run("a", async () => undefined)).resolves.toBeUndefined();
        });

        expect(result.current.error("a")).toBeUndefined();
        expect(result.current.busy("a")).toBe(false);
        consoleError.mockRestore();
    });

    test("a revalidation that fails after a gone row keeps the gone message and does not reject", async () => {
        const consoleError = jest.spyOn(console, "error").mockImplementation(() => undefined);
        const { result } = renderHook(() => useRowActions(jest.fn(async () => { throw new Error("offline"); })));

        await act(async () => {
            await expect(result.current.run("a", async () => { throw failure(404, "invitation_not_found"); })).resolves.toBeUndefined();
        });

        expect(result.current.error("a")).toBe(tenancyErrorMessage("invitation_not_found"));
        consoleError.mockRestore();
    });
});
