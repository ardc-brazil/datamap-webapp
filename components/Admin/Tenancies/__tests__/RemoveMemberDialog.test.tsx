/** @jest-environment jsdom */
import { describe, expect, jest, test } from "@jest/globals";
import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";

const mockRemove = jest.fn() as any;
let mockImpact: { data?: unknown, error?: unknown } = {};

jest.mock("../../../../gateways/BFFAPI", () => ({
    BFFAPI: jest.fn().mockImplementation(() => ({ removeTenancyMember: mockRemove })),
}));
jest.mock("../../../../hooks/UseAdmin", () => ({ useRemovalImpact: () => mockImpact }));

import { adminTenancy, tenancyMember } from "../../../../fake-data/adminFixtures";
import { RemoveMemberDialog, removalBullets } from "../RemoveMemberDialog";

const IMPACT = { member_since: "2026-09-30T09:41:00+00:00", datasets_in_tenancy: 108, shared_with_user: 1, owned_by_user: 2 };

function renderDialog() {
    const onCancel = jest.fn();
    const onRemoved = jest.fn();
    render(<RemoveMemberDialog tenancy={adminTenancy()} member={tenancyMember()} onCancel={onCancel} onRemoved={onRemoved} />);
    return { onCancel, onRemoved };
}

describe("removalBullets", () => {
    test("says one dataset, not one datasets", () => {
        expect(removalBullets({ ...IMPACT, datasets_in_tenancy: 1, shared_with_user: 0, owned_by_user: 1 })).toEqual([
            "Loses access to the 1 dataset of the tenancy",
            "Still owns 1 dataset of the tenancy",
            "Stays in public",
        ]);
    });
});

describe("RemoveMemberDialog", () => {
    test("lists what changes before the red Remove", () => {
        mockImpact = { data: IMPACT };

        renderDialog();

        expect(screen.getByRole("dialog", { name: "Remove from Data Amazon?" })).toBeTruthy();
        expect(screen.getByText("Luciana Rizzo · member since Sep 30, 2026")).toBeTruthy();
        expect(screen.getByText("Loses access to the 108 datasets of the tenancy")).toBeTruthy();
        expect(screen.getByText("Keeps 1 dataset shared explicitly")).toBeTruthy();
        expect(screen.getByText("Still owns 2 datasets of the tenancy")).toBeTruthy();
        expect(screen.getByText("Stays in public")).toBeTruthy();
        expect(screen.getByRole("button", { name: "Remove" }).className).toContain("bg-danger-700");
    });

    test("leaves out what does not apply", () => {
        mockImpact = { data: { ...IMPACT, shared_with_user: 0, owned_by_user: 0 } };

        renderDialog();

        expect(screen.queryByText(/shared explicitly/)).toBeNull();
        expect(screen.queryByText(/Still owns/)).toBeNull();
        expect(screen.getByText("Stays in public")).toBeTruthy();
    });

    test("waits for the impact before Remove can be pressed", () => {
        mockImpact = {};

        renderDialog();

        expect(screen.getByText("Checking what changes…")).toBeTruthy();
        expect((screen.getByRole("button", { name: "Remove" }) as HTMLButtonElement).disabled).toBe(true);
    });

    test("an impact that could not be checked still lets Remove through", () => {
        mockImpact = { error: { status: 500 } };

        renderDialog();

        expect(screen.getByRole("alert").textContent).toBe("What changes could not be checked. Removing still works.");
        expect((screen.getByRole("button", { name: "Remove" }) as HTMLButtonElement).disabled).toBe(false);
    });

    test("Cancel and the close button close it without removing anyone", () => {
        mockImpact = { data: IMPACT };
        const { onCancel, onRemoved } = renderDialog();

        fireEvent.click(screen.getByRole("button", { name: "Cancel" }));
        fireEvent.click(screen.getByRole("button", { name: "Close dialog" }));

        expect(onCancel).toHaveBeenCalledTimes(2);
        expect(mockRemove).not.toHaveBeenCalled();
        expect(onRemoved).not.toHaveBeenCalled();
    });

    test("removes the member", async () => {
        mockImpact = { data: IMPACT };
        mockRemove.mockResolvedValue(undefined);
        const { onRemoved } = renderDialog();

        fireEvent.click(screen.getByRole("button", { name: "Remove" }));

        await waitFor(() => expect(onRemoved).toHaveBeenCalled());
        expect(mockRemove).toHaveBeenCalledWith("datamap/production/data-amazon", "1b2c3d4e-5f60-4a7b-8c9d-0e1f2a3b4c5d");
    });

    test("a refusal is shown and the dialog stays", async () => {
        mockImpact = { data: IMPACT };
        mockRemove.mockRejectedValue({ response: { status: 404, data: { detail: "member_not_found" } } });
        const { onRemoved } = renderDialog();

        fireEvent.click(screen.getByRole("button", { name: "Remove" }));

        expect(await screen.findByText("This person is no longer a member.")).toBeTruthy();
        expect(screen.getByRole("dialog", { name: "Remove from Data Amazon?" })).toBeTruthy();
        expect((screen.getByRole("button", { name: "Remove" }) as HTMLButtonElement).disabled).toBe(false);
        expect(onRemoved).not.toHaveBeenCalled();
    });

    test("nobody can be removed from public, and it says so", async () => {
        mockImpact = { data: IMPACT };
        mockRemove.mockRejectedValue({ response: { status: 409, data: { detail: "public_tenancy_locked" } } });
        render(<RemoveMemberDialog tenancy={adminTenancy({ path: "datamap/production/public", display_name: "Public", is_default: true })} member={tenancyMember()} onCancel={jest.fn()} onRemoved={jest.fn()} />);

        fireEvent.click(screen.getByRole("button", { name: "Remove" }));

        expect(await screen.findByText("Everyone is in Public; its members can't be changed.")).toBeTruthy();
    });

    test("a double click removes only once, during the call and after it, and the dialog cannot be closed meanwhile", async () => {
        mockImpact = { data: IMPACT };
        let resolve: (value: unknown) => void = () => undefined;
        mockRemove.mockImplementation(() => new Promise((r) => { resolve = r; }));
        const { onRemoved } = renderDialog();

        const remove = screen.getByRole("button", { name: "Remove" });
        fireEvent.click(remove);
        fireEvent.click(remove);
        expect((screen.getByRole("button", { name: "Cancel" }) as HTMLButtonElement).disabled).toBe(true);
        expect((screen.getByRole("button", { name: "Close dialog" }) as HTMLButtonElement).disabled).toBe(true);
        await act(async () => { resolve(undefined); });
        await waitFor(() => expect(onRemoved).toHaveBeenCalledTimes(1));
        fireEvent.click(remove);

        expect((remove as HTMLButtonElement).disabled).toBe(true);
        expect(mockRemove).toHaveBeenCalledTimes(1);
        expect(onRemoved).toHaveBeenCalledTimes(1);
    });
});
