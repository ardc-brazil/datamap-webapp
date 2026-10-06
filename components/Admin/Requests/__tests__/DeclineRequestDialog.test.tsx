/** @jest-environment jsdom */
import { describe, expect, jest, test } from "@jest/globals";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";

const mockDecline = jest.fn() as any;

jest.mock("../../../../gateways/BFFAPI", () => ({
    BFFAPI: jest.fn().mockImplementation(() => ({ declineTenancyRequest: mockDecline })),
}));

import { adminRequest, newTenancyRequest } from "../../../../fake-data/adminFixtures";
import { DeclineRequestDialog } from "../DeclineRequestDialog";

function renderDialog(request = adminRequest()) {
    const onCancel = jest.fn();
    const onDeclined = jest.fn();
    render(<DeclineRequestDialog request={request} onCancel={onCancel} onDeclined={onDeclined} />);
    return { onCancel, onDeclined };
}

describe("DeclineRequestDialog", () => {
    test("asks to decline a join, with an optional message and what it means", () => {
        renderDialog();

        expect(screen.getByRole("dialog", { name: "Decline request?" })).toBeTruthy();
        expect(screen.getByText("Fernanda Lima · join Data Amazon")).toBeTruthy();
        const message = screen.getByLabelText(/Message to Fernanda/) as HTMLTextAreaElement;
        expect(message.placeholder).toBe("Ask a member of the tenancy to invite you from its Members page");
        expect(screen.getByText("optional")).toBeTruthy();
        expect(screen.getByText("Stays in public · can request again")).toBeTruthy();
    });

    test("names a new tenancy by what the user asked for", () => {
        renderDialog(newTenancyRequest());

        expect(screen.getByText("Kenji Tanaka · new tenancy Cerrado Flux")).toBeTruthy();
    });

    test("declines without a message", async () => {
        mockDecline.mockResolvedValue({});
        const { onDeclined } = renderDialog();

        fireEvent.click(screen.getByRole("button", { name: "Decline" }));

        await waitFor(() => expect(onDeclined).toHaveBeenCalled());
        expect(mockDecline).toHaveBeenCalledWith("7a9b5d5e-fa6d-4c18-9a51-2b1e2c3d4e5f", undefined);
    });

    test("sends the message trimmed", async () => {
        mockDecline.mockResolvedValue({});
        const { onDeclined } = renderDialog();

        fireEvent.change(screen.getByLabelText(/Message to Fernanda/), { target: { value: "  Ask Luciana Rizzo to invite you.  " } });
        fireEvent.click(screen.getByRole("button", { name: "Decline" }));

        await waitFor(() => expect(onDeclined).toHaveBeenCalled());
        expect(mockDecline).toHaveBeenCalledWith("7a9b5d5e-fa6d-4c18-9a51-2b1e2c3d4e5f", "Ask Luciana Rizzo to invite you.");
    });

    test("says so when another admin decided first, and stays open", async () => {
        mockDecline.mockRejectedValue({ response: { status: 409, data: { detail: "request_not_pending" } } });
        const { onDeclined } = renderDialog();

        fireEvent.click(screen.getByRole("button", { name: "Decline" }));

        expect(await screen.findByText("Another administrator already decided this request.")).toBeTruthy();
        expect(onDeclined).not.toHaveBeenCalled();
    });

    test("a message over 1000 characters is caught before the server", async () => {
        renderDialog();

        fireEvent.change(screen.getByLabelText(/Message to Fernanda/), { target: { value: "x".repeat(1001) } });
        fireEvent.click(screen.getByRole("button", { name: "Decline" }));

        expect(await screen.findByText("Keep the message to 1000 characters.")).toBeTruthy();
        expect(mockDecline).not.toHaveBeenCalled();
    });

    test("Cancel declines nothing", () => {
        const { onCancel } = renderDialog();

        fireEvent.click(screen.getByRole("button", { name: "Cancel" }));

        expect(onCancel).toHaveBeenCalled();
        expect(mockDecline).not.toHaveBeenCalled();
    });
});
