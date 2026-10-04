/** @jest-environment jsdom */
import { beforeEach, describe, expect, jest, test } from '@jest/globals';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';

const signIn = jest.fn() as any;
const push = jest.fn() as any;

jest.mock("next-auth/react", () => ({ signIn: (...args: unknown[]) => signIn(...args) }));
jest.mock("next/router", () => ({ __esModule: true, default: { push: (...args: unknown[]) => push(...args) } }));

import { SignInForm } from "../SignInForm";

function fill(email: string, password: string) {
    fireEvent.change(screen.getByLabelText("Email"), { target: { value: email } });
    fireEvent.change(screen.getByLabelText("Password"), { target: { value: password } });
}

async function submit() {
    await act(async () => {
        fireEvent.click(screen.getByRole("button", { name: "Sign in" }));
    });
}

beforeEach(() => {
    signIn.mockReset();
    push.mockReset();
});

describe("SignInForm", () => {
    test("signs in with the trimmed email and goes to the callback", async () => {
        signIn.mockResolvedValue({ ok: true, error: null, status: 200, url: "http://localhost:3000/app/datasets" });
        render(<SignInForm callbackUrl="/app/datasets" />);
        fill(" ana@usp.br ", "a long password");

        await submit();

        await waitFor(() => expect(signIn).toHaveBeenCalledWith("credentials", {
            email: "ana@usp.br", password: "a long password", redirect: false, callbackUrl: "/app/datasets",
        }));
        expect(push).toHaveBeenCalledWith("http://localhost:3000/app/datasets");
    });

    test("a refused password says so, and stays", async () => {
        signIn.mockResolvedValue({ ok: false, error: "CredentialsSignin", status: 401, url: null });
        render(<SignInForm callbackUrl="/" />);
        fill("ana@usp.br", "wrong password");

        await submit();

        await waitFor(() => expect(screen.getByRole("alert").textContent).toBe("Invalid email or password."));
        expect(push).not.toHaveBeenCalled();
    });

    test("a sign-in that failed for another reason does not blame the password", async () => {
        signIn.mockResolvedValue({ ok: false, error: "sign_in_unavailable", status: 401, url: null });
        render(<SignInForm callbackUrl="/" />);
        fill("ana@usp.br", "a long password");

        await submit();

        await waitFor(() => expect(screen.getByRole("alert").textContent).toBe("Something went wrong. Please try again."));
    });

    test("empty fields are explained and nothing is sent", async () => {
        render(<SignInForm callbackUrl="/" />);

        await submit();

        await waitFor(() => expect(screen.getByText("Enter your email address.")).toBeTruthy());
        expect(screen.getByText("Enter your password.")).toBeTruthy();
        expect(signIn).not.toHaveBeenCalled();
    });

    test("a rejected signIn call shows the generic message and does not navigate", async () => {
        signIn.mockRejectedValue(new Error("network error"));
        render(<SignInForm callbackUrl="/" />);
        fill("ana@usp.br", "a long password");

        await submit();

        await waitFor(() => expect(screen.getByRole("alert").textContent).toBe("Something went wrong. Please try again."));
        expect(push).not.toHaveBeenCalled();
    });

    test("offers the way back into an account whose password is forgotten", () => {
        render(<SignInForm callbackUrl="/" />);

        expect(screen.getByRole("link", { name: "Forgot password?" }).getAttribute("href")).toBe("/account/forgot-password");
    });
});
