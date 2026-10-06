/** @jest-environment jsdom */
import { beforeEach, describe, expect, jest, test } from '@jest/globals';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';

const acceptTenancyInvitation = jest.fn() as any;
const declineTenancyInvitation = jest.fn() as any;
const update = jest.fn() as any;
const mutate = jest.fn() as any;
const push = jest.fn() as any;
const setTenancySelected = jest.fn() as any;
let invitations: any;
let calls: string[];

jest.mock("../../../gateways/BFFAPI", () => ({
    BFFAPI: jest.fn().mockImplementation(() => ({ acceptTenancyInvitation, declineTenancyInvitation })),
}));
jest.mock("../../../hooks/UseTenancies", () => ({
    useTenancyInvitations: () => ({ data: invitations, mutate }),
}));
jest.mock("next-auth/react", () => ({ useSession: () => ({ data: { user: {} }, update }) }));
jest.mock("../../TenancyStore", () => ({
    useTenancyStore: (selector: (state: unknown) => unknown) => selector({ setTenancySelected }),
}));
jest.mock("next/router", () => ({ __esModule: true, default: { push: (...args: unknown[]) => push(...args) } }));

import { TenancyInvitationsPanel } from "../TenancyInvitationsPanel";

const AMAZON = { path: "datamap/production/data-amazon", display_name: "Data Amazon", is_default: false, is_legacy: false };
const invitation = {
    id: "ti1",
    tenancy: AMAZON,
    invited_by: { id: "o", name: "Luciana Rizzo" },
    datasets: 108,
    created_at: "2026-10-04T09:50:00+00:00",
};

beforeEach(() => {
    calls = [];
    invitations = [invitation];
    acceptTenancyInvitation.mockReset().mockImplementation(async () => { calls.push("accept"); return { tenancy: AMAZON }; });
    declineTenancyInvitation.mockReset();
    update.mockReset().mockImplementation(async () => { calls.push("update"); });
    setTenancySelected.mockReset().mockImplementation(() => { calls.push("select"); });
    push.mockReset().mockImplementation(() => { calls.push("push"); });
    mutate.mockReset();
});

describe("TenancyInvitationsPanel", () => {
    test("one card per invitation, with who, where and how many datasets", () => {
        render(<TenancyInvitationsPanel />);

        expect(screen.getByText("Luciana Rizzo invited you to Data Amazon")).toBeTruthy();
        expect(screen.getByText("108 datasets · Oct 4")).toBeTruthy();
    });

    test("Accept joins, refreshes the session, selects the tenancy and opens the home, in that order", async () => {
        render(<TenancyInvitationsPanel />);

        fireEvent.click(screen.getByRole("button", { name: "Accept" }));

        await waitFor(() => expect(push).toHaveBeenCalledWith("/app/home"));
        expect(acceptTenancyInvitation).toHaveBeenCalledWith("ti1");
        expect(setTenancySelected).toHaveBeenCalledWith(AMAZON.path);
        expect(calls).toEqual(["accept", "update", "select", "push"]);
        expect(mutate).toHaveBeenCalled();
    });

    test("an accepted invitation leaves the list even if the session refresh fails", async () => {
        update.mockReset().mockImplementation(async () => { calls.push("update"); throw new Error("session refresh failed"); });
        render(<TenancyInvitationsPanel />);

        fireEvent.click(screen.getByRole("button", { name: "Accept" }));

        await waitFor(() => expect(push).toHaveBeenCalledWith("/app/home"));
        expect(mutate).toHaveBeenCalled();
        expect(screen.queryByRole("alert")).toBeNull();
    });

    test("Decline declines and refreshes the list", async () => {
        declineTenancyInvitation.mockResolvedValue(undefined);
        render(<TenancyInvitationsPanel />);

        fireEvent.click(screen.getByRole("button", { name: "Decline" }));

        await waitFor(() => expect(mutate).toHaveBeenCalled());
        expect(declineTenancyInvitation).toHaveBeenCalledWith("ti1");
        expect(update).not.toHaveBeenCalled();
    });

    test("an invitation closed meanwhile says so and leaves the list", async () => {
        acceptTenancyInvitation.mockReset().mockRejectedValue({ response: { status: 404, data: { detail: "invitation_not_found" } } });
        render(<TenancyInvitationsPanel />);

        fireEvent.click(screen.getByRole("button", { name: "Accept" }));

        await waitFor(() => expect(screen.getByRole("alert").textContent).toBe("This invitation is no longer open. It may have been withdrawn."));
        expect(mutate).toHaveBeenCalled();
        expect(update).not.toHaveBeenCalled();
        expect(push).not.toHaveBeenCalled();
    });

    test("without invitations nothing is shown", () => {
        invitations = [];
        const { container } = render(<TenancyInvitationsPanel />);

        expect(container.innerHTML).toBe("");
    });

    test("an invitation without an inviter still reads well", () => {
        invitations = [{ ...invitation, invited_by: null, datasets: 1 }];
        render(<TenancyInvitationsPanel />);

        expect(screen.getByText("You were invited to Data Amazon")).toBeTruthy();
        expect(screen.getByText("1 dataset · Oct 4")).toBeTruthy();
    });
});
