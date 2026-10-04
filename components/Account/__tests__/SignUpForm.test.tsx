/** @jest-environment jsdom */
import { beforeEach, describe, expect, jest, test } from '@jest/globals';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';

const signIn = jest.fn() as any;
const push = jest.fn() as any;
const signUp = jest.fn() as any;
const confirmSignUp = jest.fn() as any;
const resendChallenge = jest.fn() as any;

jest.mock("next-auth/react", () => ({ signIn: (...args: unknown[]) => signIn(...args) }));
jest.mock("next/router", () => ({ __esModule: true, default: { push: (...args: unknown[]) => push(...args) } }));
jest.mock("../../../gateways/BFFAPI", () => ({
    BFFAPI: jest.fn().mockImplementation(() => ({ signUp, confirmSignUp, resendChallenge })),
}));

import { SignUpForm } from "../SignUpForm";

function fill(name: string, email: string, password: string) {
    fireEvent.change(screen.getByLabelText("Name"), { target: { value: name } });
    fireEvent.change(screen.getByLabelText("Email"), { target: { value: email } });
    fireEvent.change(screen.getByLabelText("Password"), { target: { value: password } });
}

async function createAccount() {
    await act(async () => {
        fireEvent.click(screen.getByRole("button", { name: "Create account" }));
    });
}

async function typeCode(code: string) {
    await act(async () => {
        fireEvent.paste(screen.getByLabelText("Digit 1 of 6"), { clipboardData: { getData: () => code } });
    });
}

beforeEach(() => {
    for (const mock of [signIn, push, signUp, confirmSignUp, resendChallenge]) {
        mock.mockReset();
    }
    signUp.mockResolvedValue({ challengeId: "c1" });
});

describe("SignUpForm", () => {
    test("a password shorter than ten characters is refused before anything is sent", async () => {
        render(<SignUpForm callbackUrl="/" />);
        fill("Ana", "ana@usp.br", "short");

        await createAccount();

        await waitFor(() => expect(screen.getByText("Use 10 to 128 characters.")).toBeTruthy());
        expect(signUp).not.toHaveBeenCalled();
    });

    test("a password longer than 128 characters is refused too", async () => {
        render(<SignUpForm callbackUrl="/" />);
        fill("Ana", "ana@usp.br", "x".repeat(129));

        await createAccount();

        await waitFor(() => expect(screen.getByText("Use 10 to 128 characters.")).toBeTruthy());
        expect(signUp).not.toHaveBeenCalled();
    });

    test("a name and a valid email are required", async () => {
        render(<SignUpForm callbackUrl="/" />);
        fill("   ", "not-an-email", "a long password");

        await createAccount();

        await waitFor(() => expect(screen.getByText("Enter your name.")).toBeTruthy());
        expect(screen.getByText("Enter a valid email address.")).toBeTruthy();
        expect(signUp).not.toHaveBeenCalled();
    });

    test("the details are sent trimmed, then the same tab asks for the code", async () => {
        render(<SignUpForm callbackUrl="/" />);
        fill(" Ana ", " ana@usp.br ", "a long password");

        await createAccount();

        await waitFor(() => expect(screen.getByLabelText("Digit 1 of 6")).toBeTruthy());
        expect(signUp).toHaveBeenCalledWith({ name: "Ana", email: "ana@usp.br", password: "a long password" });
        expect(screen.getByText("ana@usp.br")).toBeTruthy();
    });

    test("the code step also explains an existing account gets a reset link instead", async () => {
        render(<SignUpForm callbackUrl="/" />);
        fill("Ana", "ana@usp.br", "a long password");

        await createAccount();

        await waitFor(() => expect(screen.getByLabelText("Digit 1 of 6")).toBeTruthy());
        expect(screen.getByText("If ana@usp.br already has a password account, we sent a password-reset link to it instead of a code.")).toBeTruthy();
    });

    test("a confirmed code signs in with the same email and password, then goes to the callback", async () => {
        confirmSignUp.mockResolvedValue(undefined);
        signIn.mockResolvedValue({ ok: true, error: null, status: 200, url: "http://localhost:3000/app/home" });
        render(<SignUpForm callbackUrl="/app/home" />);
        fill("Ana", "ana@usp.br", "a long password");
        await createAccount();
        await waitFor(() => expect(screen.getByLabelText("Digit 1 of 6")).toBeTruthy());

        await typeCode("123456");

        await waitFor(() => expect(push).toHaveBeenCalledWith("http://localhost:3000/app/home"));
        expect(confirmSignUp).toHaveBeenCalledWith("c1", "123456");
        expect(signIn).toHaveBeenCalledWith("credentials", {
            email: "ana@usp.br", password: "a long password", redirect: false, callbackUrl: "/app/home",
        });
    });

    test("a wrong code is explained and nobody is signed in", async () => {
        confirmSignUp.mockRejectedValue({ response: { status: 400, data: { detail: "code_invalid" } } });
        render(<SignUpForm callbackUrl="/" />);
        fill("Ana", "ana@usp.br", "a long password");
        await createAccount();
        await waitFor(() => expect(screen.getByLabelText("Digit 1 of 6")).toBeTruthy());

        await typeCode("000000");

        await waitFor(() => expect(screen.getByRole("alert").textContent).toBe("Invalid code."));
        expect(signIn).not.toHaveBeenCalled();
    });

    test("a code confirmed for an email that belongs to another account says so", async () => {
        confirmSignUp.mockRejectedValue({ response: { status: 409, data: { detail: "email_belongs_to_another_account" } } });
        render(<SignUpForm callbackUrl="/" />);
        fill("Ana", "ana@usp.br", "a long password");
        await createAccount();
        await waitFor(() => expect(screen.getByLabelText("Digit 1 of 6")).toBeTruthy());

        await typeCode("123456");

        await waitFor(() => expect(screen.getByRole("alert").textContent).toBe("This email belongs to another DataMap account. Contact the DataMap team."));
        expect(signIn).not.toHaveBeenCalled();
    });

    test("a sign-in that fails right after a confirmed code is explained and nobody is pushed anywhere", async () => {
        confirmSignUp.mockResolvedValue(undefined);
        signIn.mockRejectedValue(new Error("network error"));
        render(<SignUpForm callbackUrl="/" />);
        fill("Ana", "ana@usp.br", "a long password");
        await createAccount();
        await waitFor(() => expect(screen.getByLabelText("Digit 1 of 6")).toBeTruthy());

        await typeCode("123456");

        await waitFor(() => expect(screen.getByRole("alert").textContent).toBe("Something went wrong. Please try again."));
        expect(push).not.toHaveBeenCalled();
    });

    test("resending asks the gatekeeper for the same challenge", async () => {
        jest.useFakeTimers();
        try {
            resendChallenge.mockResolvedValue(undefined);
            render(<SignUpForm callbackUrl="/" />);
            fill("Ana", "ana@usp.br", "a long password");
            await createAccount();
            await waitFor(() => expect(screen.getByLabelText("Digit 1 of 6")).toBeTruthy());
            act(() => { jest.advanceTimersByTime(90_000); });

            await act(async () => {
                fireEvent.click(screen.getByRole("button", { name: "Resend code" }));
            });

            expect(resendChallenge).toHaveBeenCalledWith("c1");
        } finally {
            jest.useRealTimers();
        }
    });

    test("another email goes back to the details, keeping them", async () => {
        render(<SignUpForm callbackUrl="/" />);
        fill("Ana", "ana@usp.br", "a long password");
        await createAccount();
        await waitFor(() => expect(screen.getByLabelText("Digit 1 of 6")).toBeTruthy());

        fireEvent.click(screen.getByRole("button", { name: "Use a different email" }));

        expect((screen.getByLabelText("Name") as HTMLInputElement).value).toBe("Ana");
        expect((screen.getByLabelText("Email") as HTMLInputElement).value).toBe("ana@usp.br");
        expect((screen.getByLabelText("Password") as HTMLInputElement).value).toBe("");
    });

    test("a refused sign-up stays on the details and says why", async () => {
        signUp.mockRejectedValue({ response: { status: 400, data: { detail: "something_new" } } });
        render(<SignUpForm callbackUrl="/" />);
        fill("Ana", "ana@usp.br", "a long password");

        await createAccount();

        await waitFor(() => expect(screen.getByRole("alert").textContent).toBe("Something went wrong. Please try again."));
        expect(screen.queryByLabelText("Digit 1 of 6")).toBeNull();
    });
});
