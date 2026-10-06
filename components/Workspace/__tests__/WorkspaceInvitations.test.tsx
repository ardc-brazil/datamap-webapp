/** @jest-environment jsdom */
import { beforeEach, describe, expect, jest, test } from '@jest/globals';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';

const withdrawWorkspaceInvitation = jest.fn() as any;
const mutate = jest.fn() as any;
let invitations: any;

jest.mock("../../../gateways/BFFAPI", () => ({
    BFFAPI: jest.fn().mockImplementation(() => ({ withdrawWorkspaceInvitation })),
}));
jest.mock("../../../hooks/UseWorkspace", () => ({
    useWorkspaceInvitations: () => ({ data: invitations, mutate }),
}));

import { WorkspaceInvitations } from "../WorkspaceInvitations";

const AMAZON = { path: "datamap/production/data-amazon", display_name: "Data Amazon", is_default: false, is_legacy: false };

beforeEach(() => {
    withdrawWorkspaceInvitation.mockReset();
    mutate.mockReset().mockResolvedValue(undefined);
    invitations = [
        { id: "ti1", user: { id: "u5", name: "Rafael Souza" }, invited_by: { id: "u1", name: "Luciana Rizzo" }, created_at: "2026-10-02T10:00:00+00:00", can_withdraw: true },
        { id: "ti2", user: { id: "u6", name: "Marta Silva" }, invited_by: { id: "u2", name: "Alan Calheiros" }, created_at: "2026-10-03T10:00:00+00:00", can_withdraw: false },
    ];
});

describe("WorkspaceInvitations", () => {
    test("each pending invitation says who invited and when, with a dashed icon", () => {
        const { container } = render(<WorkspaceInvitations tenancy={AMAZON} />);

        expect(screen.getByText("Pending invitations")).toBeTruthy();
        expect(screen.getByText("Rafael Souza")).toBeTruthy();
        expect(screen.getByText("invited by Luciana Rizzo Oct 2 · not accepted yet")).toBeTruthy();
        expect(screen.getByText("invited by Alan Calheiros Oct 3 · not accepted yet")).toBeTruthy();
        expect(container.querySelectorAll("span.border-dashed")).toHaveLength(2);
    });

    test("only the inviter can withdraw", () => {
        render(<WorkspaceInvitations tenancy={AMAZON} />);

        expect(screen.getAllByRole("button", { name: /Withdraw the invitation/ })).toHaveLength(1);
        expect(screen.getByRole("button", { name: "Withdraw the invitation of Rafael Souza" })).toBeTruthy();
    });

    test("Withdraw takes the invitation back and refreshes the list", async () => {
        withdrawWorkspaceInvitation.mockResolvedValue(undefined);
        render(<WorkspaceInvitations tenancy={AMAZON} />);

        fireEvent.click(screen.getByRole("button", { name: "Withdraw the invitation of Rafael Souza" }));

        await waitFor(() => expect(mutate).toHaveBeenCalled());
        expect(withdrawWorkspaceInvitation).toHaveBeenCalledWith("datamap/production/data-amazon", "ti1");
    });

    test("an invitation closed meanwhile says so and leaves the list", async () => {
        withdrawWorkspaceInvitation.mockRejectedValue({ response: { status: 404, data: { detail: "invitation_not_found" } } });
        render(<WorkspaceInvitations tenancy={AMAZON} />);

        fireEvent.click(screen.getByRole("button", { name: "Withdraw the invitation of Rafael Souza" }));

        await waitFor(() => expect(screen.getByRole("alert").textContent).toBe("This invitation is no longer open. It may have been withdrawn."));
        expect(mutate).toHaveBeenCalled();
    });

    test("a 403 forbidden is shown too", async () => {
        withdrawWorkspaceInvitation.mockRejectedValue({ response: { status: 403, data: { detail: "forbidden" } } });
        render(<WorkspaceInvitations tenancy={AMAZON} />);

        fireEvent.click(screen.getByRole("button", { name: "Withdraw the invitation of Rafael Souza" }));

        await waitFor(() => expect(screen.getByRole("alert").textContent).toBe("Only the member who sent an invitation can withdraw it."));
        expect(mutate).not.toHaveBeenCalled();
    });

    test("a double click withdraws only once", async () => {
        let resolveCall: () => void;
        withdrawWorkspaceInvitation.mockReturnValue(new Promise<void>((resolve) => { resolveCall = resolve; }));
        render(<WorkspaceInvitations tenancy={AMAZON} />);

        const button = screen.getByRole("button", { name: "Withdraw the invitation of Rafael Souza" });
        fireEvent.click(button);
        fireEvent.click(button);

        expect(withdrawWorkspaceInvitation).toHaveBeenCalledTimes(1);
        resolveCall!();
        await waitFor(() => expect(mutate).toHaveBeenCalled());
    });

    test("two rows failing at once keep their own messages", async () => {
        invitations = invitations.map((row: any) => ({ ...row, can_withdraw: true }));
        withdrawWorkspaceInvitation.mockImplementation(async (_tenancy: string, id: string) => {
            throw { response: { status: id === "ti1" ? 403 : 404, data: { detail: id === "ti1" ? "forbidden" : "invitation_not_found" } } };
        });
        render(<WorkspaceInvitations tenancy={AMAZON} />);

        fireEvent.click(screen.getByRole("button", { name: "Withdraw the invitation of Rafael Souza" }));
        fireEvent.click(screen.getByRole("button", { name: "Withdraw the invitation of Marta Silva" }));

        await waitFor(() => expect(screen.getAllByRole("alert")).toHaveLength(2));
        const rafael = screen.getByText("Rafael Souza").closest("li") as HTMLElement;
        const marta = screen.getByText("Marta Silva").closest("li") as HTMLElement;
        expect(within(rafael).getByRole("alert").textContent).toBe("Only the member who sent an invitation can withdraw it.");
        expect(within(marta).getByRole("alert").textContent).toBe("This invitation is no longer open. It may have been withdrawn.");
    });

    test("nothing pending, nothing shown", () => {
        invitations = [];
        const { container } = render(<WorkspaceInvitations tenancy={AMAZON} />);

        expect(container.innerHTML).toBe("");
    });
});
