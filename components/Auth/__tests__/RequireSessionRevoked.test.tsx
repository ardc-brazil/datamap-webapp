/** @jest-environment jsdom */
import { beforeEach, describe, expect, jest, test } from '@jest/globals';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { useSWRConfig } from "swr";

const update = jest.fn() as any;
const replace = jest.fn() as any;
const setTenancySelected = jest.fn() as any;
let mockSessionData: unknown;
let mockSelected: boolean;

jest.mock("next-auth/react", () => ({
    useSession: () => ({
        data: mockSessionData,
        status: "authenticated",
        update,
    }),
}));
jest.mock("next/router", () => ({
    __esModule: true,
    default: { replace: (...args: unknown[]) => replace(...args) },
    useRouter: () => ({ asPath: "/app/datasets" }),
}));
jest.mock("../../TenancyStore", () => ({
    useTenancyStore: (selector: (state: unknown) => unknown) => selector({ setTenancySelected, isTenancySelected: () => mockSelected }),
}));

import { RequireSession } from "../RequireSession";

const seenOnError: unknown[] = [];

function Probe(props: { error: unknown }) {
    const { onError } = useSWRConfig();
    seenOnError.push(onError);
    return <button type="button" onClick={() => onError(props.error as any, "/api/datasets", {} as any)}>fail</button>;
}

function gate(error: unknown) {
    return <RequireSession loading={<div>loading</div>}><Probe error={error} /></RequireSession>;
}

function renderWith(error: unknown) {
    return render(gate(error));
}

function sessionWith(tenancies: string[]) {
    return { user: { tenancies }, expires: "2099-01-01" };
}

beforeEach(() => {
    update.mockReset();
    replace.mockReset();
    setTenancySelected.mockReset();
    seenOnError.length = 0;
    mockSessionData = sessionWith(["datamap/production/public", "datamap/production/data-amazon"]);
    mockSelected = true;
});

describe("RequireSession and a revoked tenancy", () => {
    test("a 401 for a tenancy the user was removed from clears it, refreshes the session and opens the selector", async () => {
        renderWith({ status: 401, detail: "unauthorized_tenancy: user is not a member" });

        fireEvent.click(screen.getByRole("button", { name: "fail" }));

        await waitFor(() => expect(replace).toHaveBeenCalledWith("/app/tenancy"));
        expect(setTenancySelected).toHaveBeenCalledWith("");
        expect(update).toHaveBeenCalledTimes(1);
    });

    test("any other error is left to the page", async () => {
        renderWith({ status: 401, detail: "user not authorized to perform the operation" });

        await act(async () => {
            fireEvent.click(screen.getByRole("button", { name: "fail" }));
        });

        expect(setTenancySelected).not.toHaveBeenCalled();
        expect(update).not.toHaveBeenCalled();
        expect(replace).not.toHaveBeenCalled();
    });

    test("the only tenancy of a session that has not caught up with the removal is not selected again", async () => {
        const revoked = { status: 401, detail: "unauthorized_tenancy: user is not a member" };
        mockSessionData = sessionWith(["datamap/production/data-amazon"]);
        setTenancySelected.mockImplementation((path: string) => { mockSelected = path !== ""; });
        const { rerender } = renderWith(revoked);

        fireEvent.click(screen.getByRole("button", { name: "fail" }));
        await waitFor(() => expect(replace).toHaveBeenCalledWith("/app/tenancy"));
        mockSessionData = sessionWith(["datamap/production/data-amazon"]);
        rerender(gate(revoked));

        expect(setTenancySelected).not.toHaveBeenCalledWith("datamap/production/data-amazon");

        mockSessionData = sessionWith(["datamap/production/atto"]);
        rerender(gate(revoked));

        expect(setTenancySelected).toHaveBeenLastCalledWith("datamap/production/atto");
    });

    test("a tenancy the user is invited back into is selected again once the session has moved on", async () => {
        const revoked = { status: 401, detail: "unauthorized_tenancy: user is not a member" };
        mockSessionData = sessionWith(["datamap/production/data-amazon"]);
        setTenancySelected.mockImplementation((path: string) => { mockSelected = path !== ""; });
        const { rerender } = renderWith(revoked);

        fireEvent.click(screen.getByRole("button", { name: "fail" }));
        await waitFor(() => expect(replace).toHaveBeenCalledWith("/app/tenancy"));
        mockSessionData = sessionWith(["datamap/production/public", "datamap/production/atto"]);
        rerender(gate(revoked));
        mockSessionData = sessionWith(["datamap/production/data-amazon"]);
        rerender(gate(revoked));

        expect(setTenancySelected).toHaveBeenLastCalledWith("datamap/production/data-amazon");
    });

    test("two revoked errors before update() resolves cause one update and one redirect", async () => {
        let resolveUpdate: () => void;
        update.mockImplementation(() => new Promise<void>((resolve) => { resolveUpdate = resolve; }));
        renderWith({ status: 401, detail: "unauthorized_tenancy: user is not a member" });

        fireEvent.click(screen.getByRole("button", { name: "fail" }));
        fireEvent.click(screen.getByRole("button", { name: "fail" }));

        expect(update).toHaveBeenCalledTimes(1);

        await act(async () => { resolveUpdate(); });
        await waitFor(() => expect(replace).toHaveBeenCalledTimes(1));
        expect(update).toHaveBeenCalledTimes(1);
    });

    test("a render that changes nothing keeps the same error handler", () => {
        const { rerender } = renderWith({ status: 500 });

        rerender(gate({ status: 500 }));

        expect(seenOnError).toHaveLength(2);
        expect(seenOnError[1]).toBe(seenOnError[0]);
    });
});
