/** @jest-environment jsdom */
import { beforeEach, describe, expect, jest, test } from '@jest/globals';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';

const withdrawTenancyRequest = jest.fn() as any;
const mutate = jest.fn() as any;
const push = jest.fn() as any;
const setTenancySelected = jest.fn() as any;
let requestState: any;
let selected = "";

jest.mock("../../../gateways/BFFAPI", () => ({
    BFFAPI: jest.fn().mockImplementation(() => ({ withdrawTenancyRequest })),
}));
jest.mock("../../../hooks/UseTenancies", () => ({
    useLatestTenancyRequest: () => ({ state: requestState, mutate }),
}));
jest.mock("../../TenancyStore", () => ({
    useTenancyStore: (selector: (state: unknown) => unknown) => selector({ tenancySelected: selected, setTenancySelected }),
}));
jest.mock("next/router", () => ({ __esModule: true, default: { push: (...args: unknown[]) => push(...args) } }));
jest.mock("../../../lib/telemetryClient", () => ({ trackUiEvent: jest.fn() }));

import { TenancyRequestNotice, TenancyRequestRow } from "../TenancyRequestStatus";

const AMAZON = { path: "datamap/production/data-amazon", display_name: "Data Amazon", is_default: false, is_legacy: false };
const pending: any = {
    id: "r1", requested_name: "Data Amazon", reason: "SMPS data", status: "pending", tenancy: null, created_tenancy: false,
    decision_message: null, created_at: "2026-09-28T12:00:00+00:00", decided_at: null,
};
const declined: any = { ...pending, status: "declined", decision_message: "Ask Luciana to invite you from a dataset's Share dialog", decided_at: "2026-10-01T12:00:00+00:00" };
const approved: any = { ...pending, status: "approved", tenancy: AMAZON, decided_at: "2026-10-02T12:00:00+00:00" };

beforeEach(() => {
    selected = "datamap/production/public";
    withdrawTenancyRequest.mockReset();
});

describe("TenancyRequestRow", () => {
    test("a pending request waits for an administrator, with a dashed icon", () => {
        requestState = { kind: "pending", request: pending };
        const { container } = render(<ul><TenancyRequestRow /></ul>);

        expect(screen.getByText("Data Amazon")).toBeTruthy();
        expect(screen.getByText("Requested Sep 28 · waiting for an administrator")).toBeTruthy();
        expect(container.querySelector('[data-pending="true"]')).toBeTruthy();
    });

    test("Withdraw withdraws it and refreshes the list", async () => {
        requestState = { kind: "pending", request: pending };
        withdrawTenancyRequest.mockResolvedValue(undefined);
        render(<ul><TenancyRequestRow /></ul>);

        fireEvent.click(screen.getByRole("button", { name: "Withdraw" }));

        await waitFor(() => expect(mutate).toHaveBeenCalled());
        expect(withdrawTenancyRequest).toHaveBeenCalledWith("r1");
    });

    test("a recent decline shows its date and the administrator's message", () => {
        requestState = { kind: "declined", request: declined };
        render(<ul><TenancyRequestRow /></ul>);

        expect(screen.getByText("Declined Oct 1")).toBeTruthy();
        expect(screen.getByText("“Ask Luciana to invite you from a dataset's Share dialog”")).toBeTruthy();
    });

    test("an approval offers to switch to the tenancy", () => {
        requestState = { kind: "approved", request: approved };
        render(<ul><TenancyRequestRow /></ul>);

        fireEvent.click(screen.getByRole("button", { name: "Switch to Data Amazon" }));

        expect(setTenancySelected).toHaveBeenCalledWith(AMAZON.path);
        expect(push).toHaveBeenCalledWith("/app/home");
    });

    test("an approval is not offered once its tenancy is the one selected", () => {
        requestState = { kind: "approved", request: approved };
        selected = AMAZON.path;
        render(<ul><TenancyRequestRow /></ul>);

        expect(screen.queryByText("Data Amazon")).toBeNull();
    });

    test("no request, no row", () => {
        requestState = null;
        const { container } = render(<ul><TenancyRequestRow /></ul>);

        expect(container.querySelector("li")).toBeNull();
    });
});

describe("TenancyRequestNotice", () => {
    test("on the home, a pending request is one line with Withdraw", () => {
        requestState = { kind: "pending", request: pending };
        render(<TenancyRequestNotice />);

        expect(screen.getByText("Your request for Data Amazon is waiting for an administrator")).toBeTruthy();
        expect(screen.getByRole("button", { name: "Withdraw" })).toBeTruthy();
    });

    test("a decline is not repeated on the home", () => {
        requestState = { kind: "declined", request: declined };
        const { container } = render(<TenancyRequestNotice />);

        expect(container.innerHTML).toBe("");
    });
});
