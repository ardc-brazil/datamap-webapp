/** @jest-environment jsdom */
import { beforeEach, describe, expect, jest, test } from "@jest/globals";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";

const mockWithdraw = jest.fn() as any;
const mockSetSize = jest.fn();
const mockMutate = jest.fn() as any;
const mockRevalidateTenancies = jest.fn();
const mockPaths: unknown[] = [];
let mockMembers: { data?: unknown, error?: unknown };

jest.mock("../../../../gateways/BFFAPI", () => ({
    BFFAPI: jest.fn().mockImplementation(() => ({ withdrawTenancyInvitationAsAdmin: mockWithdraw })),
}));
jest.mock("../../../../hooks/UseAdmin", () => ({
    useTenancyMembers: (path: unknown) => {
        mockPaths.push(path);
        return { ...mockMembers, size: 1, setSize: mockSetSize, mutate: mockMutate, isValidating: false };
    },
    revalidateAdminTenancies: () => mockRevalidateTenancies(),
}));
jest.mock("../AddMemberDialog", () => {
    const React = require("react");
    return {
        AddMemberDialog: (props: any) => React.createElement("div", null,
            `adding to ${props.tenancy.display_name}`,
            React.createElement("button", { onClick: props.onAdded }, "stub added")),
    };
});
jest.mock("../RemoveMemberDialog", () => {
    const React = require("react");
    return { RemoveMemberDialog: (props: any) => React.createElement("div", null, `removing ${props.member.name}`) };
});

import { ADMIN_TENANCIES, adminTenancy, tenancyInvitation, tenancyMember } from "../../../../fake-data/adminFixtures";
import { TenancyMembersPanel } from "../TenancyMembersPanel";

function membersPage(items: unknown[], total = items.length, invitations: unknown[] = []) {
    return [{ members: { items, total_count: total, limit: 50, offset: 0 }, invitations }];
}

beforeEach(() => {
    mockPaths.length = 0;
    mockMutate.mockResolvedValue(undefined);
    mockMembers = {
        data: membersPage(
            [tenancyMember(), tenancyMember({ id: "m2", name: "Marcia Yamasoe", email: "marcia@usp.br", invited_by: { id: "l1", name: "Luciana Rizzo" } })],
            2,
            [tenancyInvitation()],
        ),
    };
});

describe("TenancyMembersPanel", () => {
    test("public has no member list, only how many accounts are in it", () => {
        render(<TenancyMembersPanel tenancy={ADMIN_TENANCIES[0]} />);

        expect(screen.getByText("Everyone · 47 accounts")).toBeTruthy();
        expect(screen.queryByText("+ Add")).toBeNull();
        expect(mockPaths).toEqual([null]);
    });

    test("says the members are loading", () => {
        mockMembers = {};

        render(<TenancyMembersPanel tenancy={adminTenancy()} />);

        expect(screen.getByText("Loading members…")).toBeTruthy();
        expect(mockPaths).toEqual(["datamap/production/data-amazon"]);
    });

    test("says when the members could not load, and retries", () => {
        mockMembers = { error: { status: 500 } };

        render(<TenancyMembersPanel tenancy={adminTenancy()} />);
        fireEvent.click(screen.getByRole("button", { name: "Try again" }));

        expect(screen.getByText("Members could not be loaded.")).toBeTruthy();
        expect(mockMutate).toHaveBeenCalled();
    });

    test("a failed refresh keeps the loaded members and shows the alert below them", () => {
        mockMembers = { ...mockMembers, error: { status: 500 } };

        render(<TenancyMembersPanel tenancy={adminTenancy()} />);
        const alert = screen.getByRole("alert");
        fireEvent.click(screen.getByRole("button", { name: "Try again" }));

        expect(screen.getByText("Members · 2")).toBeTruthy();
        expect(screen.getByText("Marcia Yamasoe")).toBeTruthy();
        expect(screen.getByText("Rafael Souza")).toBeTruthy();
        expect(alert.textContent).toContain("Members could not be loaded.");
        expect(screen.getByRole("list").compareDocumentPosition(alert) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
        expect(mockMutate).toHaveBeenCalled();
    });

    test("an empty tenancy", () => {
        mockMembers = { data: membersPage([], 0) };

        render(<TenancyMembersPanel tenancy={adminTenancy({ members: 0 })} />);

        expect(screen.getByText("No members yet.")).toBeTruthy();
        expect(screen.getByText("Members · 0")).toBeTruthy();
    });

    test("members with their email, who invited them, and the pending invitations", () => {
        render(<TenancyMembersPanel tenancy={adminTenancy()} />);

        expect(screen.getByText("Members · 2")).toBeTruthy();
        expect(screen.getByText("luciana.rizzo@usp.br")).toBeTruthy();
        expect(screen.getByText("invited by Luciana Rizzo")).toBeTruthy();
        expect(screen.getByRole("button", { name: "Remove Marcia Yamasoe" })).toBeTruthy();
        expect(screen.getByText("Rafael Souza")).toBeTruthy();
        expect(screen.getByText("rafael.souza@usp.br")).toBeTruthy();
        expect(screen.getByText("invited by Luciana Rizzo Oct 2 · not accepted yet")).toBeTruthy();
        expect(screen.queryByText(/Show \d+ more/)).toBeNull();
    });

    test("a legacy tenancy is read-only", () => {
        mockMembers = { data: membersPage([tenancyMember()], 1) };

        render(<TenancyMembersPanel tenancy={ADMIN_TENANCIES[3]} />);

        expect(screen.getByText("Luciana Rizzo")).toBeTruthy();
        expect(screen.queryByText("+ Add")).toBeNull();
        expect(screen.queryByRole("button", { name: /^Remove/ })).toBeNull();
    });

    test("more than 50 members load 50 more at a time", () => {
        mockMembers = { data: membersPage(Array.from({ length: 50 }, (_, i) => tenancyMember({ id: `m${i}`, name: `Member ${i}` })), 120) };

        render(<TenancyMembersPanel tenancy={adminTenancy({ members: 120 })} />);
        fireEvent.click(screen.getByRole("button", { name: "Show 50 more" }));

        expect(mockSetSize).toHaveBeenCalledWith(2);
    });

    test("Withdraw takes the invitation back and refreshes the list", async () => {
        mockWithdraw.mockResolvedValue(undefined);

        render(<TenancyMembersPanel tenancy={adminTenancy()} />);
        fireEvent.click(screen.getByRole("button", { name: "Withdraw" }));

        await waitFor(() => expect(mockMutate).toHaveBeenCalled());
        expect(mockWithdraw).toHaveBeenCalledWith("2c3d4e5f-6a7b-4c8d-9e0f-1a2b3c4d5e6f");
    });

    test("an invitation answered or closed meanwhile says so and leaves the list", async () => {
        mockMutate.mockClear();
        mockWithdraw.mockRejectedValue({ response: { status: 404, data: { detail: "invitation_not_found" } } });

        render(<TenancyMembersPanel tenancy={adminTenancy()} />);
        fireEvent.click(screen.getByRole("button", { name: "Withdraw" }));

        expect(await screen.findByText("This invitation was already answered or withdrawn.")).toBeTruthy();
        expect(mockMutate).toHaveBeenCalled();
    });

    test("+ Add and remove open their dialogs; a change refreshes members and the tenancy list", () => {
        render(<TenancyMembersPanel tenancy={adminTenancy()} />);

        fireEvent.click(screen.getByRole("button", { name: "Remove Luciana Rizzo" }));
        expect(screen.getByText("removing Luciana Rizzo")).toBeTruthy();

        fireEvent.click(screen.getByRole("button", { name: "+ Add" }));
        expect(screen.getByText("adding to Data Amazon")).toBeTruthy();
        fireEvent.click(screen.getByRole("button", { name: "stub added" }));

        expect(mockMutate).toHaveBeenCalled();
        expect(mockRevalidateTenancies).toHaveBeenCalled();
        expect(screen.queryByText("adding to Data Amazon")).toBeNull();
    });
});
