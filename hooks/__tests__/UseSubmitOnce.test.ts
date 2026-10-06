/** @jest-environment jsdom */
import { describe, expect, jest, test } from "@jest/globals";
import { act, renderHook } from "@testing-library/react";
import { useSubmitOnce } from "../UseSubmitOnce";

function deferred() {
    let resolve: () => void = () => undefined;
    let reject: (error: unknown) => void = () => undefined;
    const promise = new Promise<void>((res, rej) => { resolve = res; reject = rej; });
    return { promise, resolve, reject };
}

describe("useSubmitOnce", () => {
    test("is idle until submitted", () => {
        const { result } = renderHook(() => useSubmitOnce());

        expect(result.current.busy).toBe(false);
        expect(result.current.done).toBe(false);
    });

    test("is busy while the action runs and ignores a second call meanwhile", async () => {
        const call = deferred();
        const action = jest.fn(() => call.promise);
        const { result } = renderHook(() => useSubmitOnce());

        let first: Promise<void> = Promise.resolve();
        act(() => {
            first = result.current.submit(action);
            void result.current.submit(action);
        });

        expect(result.current.busy).toBe(true);
        expect(action).toHaveBeenCalledTimes(1);
        await act(async () => { call.resolve(); await first; });
        expect(result.current.busy).toBe(false);
        expect(result.current.done).toBe(true);
    });

    test("ignores a call after success", async () => {
        const action = jest.fn(() => Promise.resolve());
        const { result } = renderHook(() => useSubmitOnce());

        await act(async () => { await result.current.submit(action); });
        await act(async () => { await result.current.submit(action); });

        expect(action).toHaveBeenCalledTimes(1);
        expect(result.current.done).toBe(true);
    });

    test("hands a failure back and allows a retry", async () => {
        const failure = new Error("refused");
        const action = jest.fn<() => Promise<void>>().mockRejectedValueOnce(failure).mockResolvedValueOnce(undefined);
        const { result } = renderHook(() => useSubmitOnce());

        await act(async () => { await expect(result.current.submit(action)).rejects.toBe(failure); });
        expect(result.current.busy).toBe(false);
        expect(result.current.done).toBe(false);

        await act(async () => { await result.current.submit(action); });
        expect(action).toHaveBeenCalledTimes(2);
        expect(result.current.done).toBe(true);
    });

    test("reset allows a fresh submit after success", async () => {
        const action = jest.fn(() => Promise.resolve());
        const { result } = renderHook(() => useSubmitOnce());

        await act(async () => { await result.current.submit(action); });
        act(() => { result.current.reset(); });
        expect(result.current.done).toBe(false);
        await act(async () => { await result.current.submit(action); });

        expect(action).toHaveBeenCalledTimes(2);
    });
});
