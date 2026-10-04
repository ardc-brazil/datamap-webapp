/** @jest-environment jsdom */
import { beforeEach, describe, expect, jest, test } from '@jest/globals';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';

const confirmPasswordReset = jest.fn() as any;
const replace = jest.fn();

jest.mock("../../../gateways/BFFAPI", () => ({
    BFFAPI: jest.fn().mockImplementation(() => ({ confirmPasswordReset })),
}));

jest.mock("next/router", () => ({ __esModule: true, default: { replace: (...args: unknown[]) => replace(...args) } }));

import { ResetPasswordForm } from "../ResetPasswordForm";

async function choose(password: string, confirmation: string) {
    fireEvent.change(screen.getByLabelText("New password"), { target: { value: password } });
    fireEvent.change(screen.getByLabelText("Confirm new password"), { target: { value: confirmation } });
    await act(async () => {
        fireEvent.click(screen.getByRole("button", { name: "Change password" }));
    });
}

beforeEach(() => {
    confirmPasswordReset.mockReset();
    replace.mockReset();
});

describe("ResetPasswordForm", () => {
    test("sets the new password with the token from the link, then leads to sign in", async () => {
        confirmPasswordReset.mockResolvedValue(undefined);
        render(<ResetPasswordForm token="tok" />);

        await choose("a new long password", "a new long password");

        await waitFor(() => expect(screen.getByText("Your password was changed")).toBeTruthy());
        expect(confirmPasswordReset).toHaveBeenCalledWith("tok", "a new long password");
        expect(screen.getByRole("link", { name: "Sign in" }).getAttribute("href")).toBe("/account/login?phase=sign-in&callbackUrl=%2Fapp%2Fhome");
    });

    test("replaces the URL so the token does not stay in history, keeping the success message", async () => {
        confirmPasswordReset.mockResolvedValue(undefined);
        render(<ResetPasswordForm token="tok" />);

        await choose("a new long password", "a new long password");

        await waitFor(() => expect(replace).toHaveBeenCalledWith("/account/reset-password/used", undefined, { shallow: true }));
        expect(screen.getByText("Your password was changed")).toBeTruthy();
    });

    test("two different passwords are refused before anything is sent", async () => {
        render(<ResetPasswordForm token="tok" />);

        await choose("a new long password", "another long password");

        await waitFor(() => expect(screen.getByText("The passwords do not match.")).toBeTruthy());
        expect(confirmPasswordReset).not.toHaveBeenCalled();
    });

    test("a short password is refused before anything is sent", async () => {
        render(<ResetPasswordForm token="tok" />);

        await choose("short", "short");

        await waitFor(() => expect(screen.getByText("Use 10 to 128 characters.")).toBeTruthy());
        expect(confirmPasswordReset).not.toHaveBeenCalled();
    });

    test("a dead link says so and offers a new one", async () => {
        confirmPasswordReset.mockRejectedValue({ response: { status: 400, data: { detail: "token_invalid" } } });
        render(<ResetPasswordForm token="old" />);

        await choose("a new long password", "a new long password");

        await waitFor(() => expect(screen.getByRole("alert").textContent).toContain("This link is invalid or has expired."));
        expect(screen.getByRole("link", { name: "Ask for a new link" }).getAttribute("href")).toBe("/account/forgot-password");
    });
});
