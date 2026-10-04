/** @jest-environment jsdom */
import { beforeEach, describe, expect, jest, test } from '@jest/globals';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';

const requestPasswordReset = jest.fn() as any;

jest.mock("../../../gateways/BFFAPI", () => ({
    BFFAPI: jest.fn().mockImplementation(() => ({ requestPasswordReset })),
}));

import { ForgotPasswordForm } from "../ForgotPasswordForm";

async function send(email: string) {
    fireEvent.change(screen.getByLabelText("Email"), { target: { value: email } });
    await act(async () => {
        fireEvent.click(screen.getByRole("button", { name: "Send link" }));
    });
}

beforeEach(() => {
    requestPasswordReset.mockReset();
});

describe("ForgotPasswordForm", () => {
    test("sends the trimmed email and says the same thing whether or not it has an account", async () => {
        requestPasswordReset.mockResolvedValue(undefined);
        render(<ForgotPasswordForm />);

        await send(" ana@usp.br ");

        await waitFor(() => expect(screen.getByRole("status").textContent).toBe("If an account exists for ana@usp.br, we sent a link. It works for one hour."));
        expect(requestPasswordReset).toHaveBeenCalledWith("ana@usp.br");
        expect(screen.queryByLabelText("Email")).toBeNull();
    });

    test("an invalid email is refused before anything is sent", async () => {
        render(<ForgotPasswordForm />);

        await send("ana");

        await waitFor(() => expect(screen.getByText("Enter a valid email address.")).toBeTruthy());
        expect(requestPasswordReset).not.toHaveBeenCalled();
    });

    test("a failure keeps the form and says so", async () => {
        requestPasswordReset.mockRejectedValue(new Error("Network Error"));
        render(<ForgotPasswordForm />);

        await send("ana@usp.br");

        await waitFor(() => expect(screen.getByRole("alert").textContent).toBe("Something went wrong. Please try again."));
        expect(screen.getByLabelText("Email")).toBeTruthy();
    });

    test("leads back to sign in", () => {
        render(<ForgotPasswordForm />);

        expect(screen.getByRole("link", { name: "Back to sign in" }).getAttribute("href")).toBe("/account/login?phase=sign-in&callbackUrl=%2Fapp%2Fhome");
    });
});
