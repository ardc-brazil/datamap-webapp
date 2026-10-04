/** @jest-environment jsdom */
import { beforeEach, describe, expect, jest, test } from '@jest/globals';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';

const changePassword = jest.fn() as any;

jest.mock("../../../gateways/BFFAPI", () => ({
    BFFAPI: jest.fn().mockImplementation(() => ({ changePassword })),
}));

import { ChangePasswordDialog } from "../ChangePasswordDialog";

async function change(current: string, next: string) {
    fireEvent.change(screen.getByLabelText("Current password"), { target: { value: current } });
    fireEvent.change(screen.getByLabelText("New password"), { target: { value: next } });
    await act(async () => {
        fireEvent.click(screen.getByRole("button", { name: "Change password" }));
    });
}

beforeEach(() => {
    changePassword.mockReset();
});

describe("ChangePasswordDialog", () => {
    test("sends the current and the new password, then reports the change", async () => {
        changePassword.mockResolvedValue(undefined);
        const onChanged = jest.fn();
        render(<ChangePasswordDialog show onClose={jest.fn()} onChanged={onChanged} />);

        await change("the old password", "the new password");

        await waitFor(() => expect(onChanged).toHaveBeenCalledTimes(1));
        expect(changePassword).toHaveBeenCalledWith("the old password", "the new password");
    });

    test("a wrong current password says so and keeps the dialog", async () => {
        changePassword.mockRejectedValue({ response: { status: 401, data: { detail: "invalid_credentials" } } });
        const onChanged = jest.fn();
        render(<ChangePasswordDialog show onClose={jest.fn()} onChanged={onChanged} />);

        await change("wrong password", "the new password");

        await waitFor(() => expect(screen.getByRole("alert").textContent).toBe("The current password is incorrect, or the account is temporarily locked after too many attempts."));
        expect(onChanged).not.toHaveBeenCalled();
    });

    test("a short new password is refused before anything is sent", async () => {
        render(<ChangePasswordDialog show onClose={jest.fn()} onChanged={jest.fn()} />);

        await change("the old password", "short");

        await waitFor(() => expect(screen.getByText("Use 10 to 128 characters.")).toBeTruthy());
        expect(changePassword).not.toHaveBeenCalled();
    });

    test("Cancel closes without sending", () => {
        const onClose = jest.fn();
        render(<ChangePasswordDialog show onClose={onClose} onChanged={jest.fn()} />);

        fireEvent.click(screen.getByRole("button", { name: "Cancel" }));

        expect(onClose).toHaveBeenCalledTimes(1);
        expect(changePassword).not.toHaveBeenCalled();
    });
});
