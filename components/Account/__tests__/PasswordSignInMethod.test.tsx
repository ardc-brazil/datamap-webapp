/** @jest-environment jsdom */
import { beforeEach, describe, expect, jest, test } from '@jest/globals';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';

const requestPasswordReset = jest.fn() as any;
const changePassword = jest.fn() as any;

jest.mock("../../../gateways/BFFAPI", () => ({
    BFFAPI: jest.fn().mockImplementation(() => ({ requestPasswordReset, changePassword })),
}));

import { PasswordSignInMethod } from "../PasswordSignInMethod";

const withPassword = { email: "ana@usp.br", has_password: true, email_verified_at: "2026-10-03T10:00:00Z" };
const withoutPassword = { email: "ana@usp.br", has_password: false, email_verified_at: "2026-10-03T10:00:00Z" };
const unconfirmed = { email: "0000-0002@fake.mail.com", has_password: false, email_verified_at: null };

function renderRow(user: typeof withPassword | typeof unconfirmed) {
    return render(<ul><PasswordSignInMethod user={user} /></ul>);
}

beforeEach(() => {
    requestPasswordReset.mockReset();
    changePassword.mockReset();
});

describe("PasswordSignInMethod", () => {
    test("an account with a password can change it in a dialog", () => {
        renderRow(withPassword);

        fireEvent.click(screen.getByRole("button", { name: "Change password" }));

        expect(screen.getByRole("dialog")).toBeTruthy();
        expect(screen.getByLabelText("Current password")).toBeTruthy();
    });

    test("a changed password closes the dialog and says so", async () => {
        changePassword.mockResolvedValue(undefined);
        renderRow(withPassword);
        fireEvent.click(screen.getByRole("button", { name: "Change password" }));
        fireEvent.change(screen.getByLabelText("Current password"), { target: { value: "the old password" } });
        fireEvent.change(screen.getByLabelText("New password"), { target: { value: "the new password" } });

        await act(async () => {
            fireEvent.click(screen.getAllByRole("button", { name: "Change password" })[1]);
        });

        await waitFor(() => expect(screen.getByRole("status").textContent).toBe("Password changed."));
        expect(screen.queryByRole("dialog")).toBeNull();
    });

    test("an account without one is sent the link to set it", async () => {
        requestPasswordReset.mockResolvedValue(undefined);
        renderRow(withoutPassword);

        await act(async () => {
            fireEvent.click(screen.getByRole("button", { name: "Set a password" }));
        });

        expect(requestPasswordReset).toHaveBeenCalledWith("ana@usp.br");
        expect(screen.getByRole("status").textContent).toBe("We sent a link to ana@usp.br.");
        expect((screen.getByRole("button", { name: "Set a password" }) as HTMLButtonElement).disabled).toBe(true);
    });

    test("an unconfirmed email is offered no link the gatekeeper would not send, and no promise either", () => {
        renderRow(unconfirmed);

        expect(screen.queryByRole("button", { name: "Set a password" })).toBeNull();
        expect(screen.getByText("Not set")).toBeTruthy();
        expect(screen.queryByText(/once your email is confirmed/)).toBeNull();
    });
});
