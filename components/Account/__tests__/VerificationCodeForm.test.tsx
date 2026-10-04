/** @jest-environment jsdom */
import { afterEach, describe, expect, jest, test } from '@jest/globals';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { VerificationCodeForm } from "../VerificationCodeForm";

function refused(detail: string) {
    return { response: { status: 400, data: { detail } } };
}

function typeCode(code: string) {
    fireEvent.paste(screen.getByLabelText("Digit 1 of 6"), { clipboardData: { getData: () => code } });
}

afterEach(() => {
    jest.useRealTimers();
});

describe("VerificationCodeForm", () => {
    test("says where the code went and that it can take a minute", () => {
        const { container } = render(<VerificationCodeForm email="ana@usp.br" onSubmit={jest.fn<() => Promise<void>>()} onResend={jest.fn<() => Promise<void>>()} />);

        expect(screen.getByText("ana@usp.br")).toBeTruthy();
        expect(container.textContent).toContain("We sent a 6-digit code to ana@usp.br. It can take up to a minute to arrive and expires in 15 minutes.");
    });

    test("submits as soon as the sixth digit is in", async () => {
        const onSubmit = jest.fn<(code: string) => Promise<void>>().mockResolvedValue(undefined);
        render(<VerificationCodeForm email="ana@usp.br" onSubmit={onSubmit} onResend={jest.fn<() => Promise<void>>()} />);

        await act(async () => typeCode("123456"));

        expect(onSubmit).toHaveBeenCalledWith("123456");
        expect(onSubmit).toHaveBeenCalledTimes(1);
    });

    test("a double-fired onComplete for the same code submits only once", async () => {
        const onSubmit = jest.fn<(code: string) => Promise<void>>().mockResolvedValue(undefined);
        render(<VerificationCodeForm email="ana@usp.br" onSubmit={onSubmit} onResend={jest.fn<() => Promise<void>>()} />);

        await act(async () => {
            typeCode("123456");
            typeCode("123456");
        });

        expect(onSubmit).toHaveBeenCalledTimes(1);
    });

    test("Confirm sends the code in the boxes again", async () => {
        const onSubmit = jest.fn<(code: string) => Promise<void>>().mockResolvedValue(undefined);
        render(<VerificationCodeForm email="ana@usp.br" onSubmit={onSubmit} onResend={jest.fn<() => Promise<void>>()} />);
        await act(async () => typeCode("123456"));

        await act(async () => fireEvent.click(screen.getByRole("button", { name: "Confirm" })));

        expect(onSubmit).toHaveBeenCalledTimes(2);
        expect(onSubmit).toHaveBeenLastCalledWith("123456");
    });

    test("Confirm waits for six digits", () => {
        render(<VerificationCodeForm email="ana@usp.br" onSubmit={jest.fn<() => Promise<void>>()} onResend={jest.fn<() => Promise<void>>()} />);

        typeCode("123");

        expect((screen.getByRole("button", { name: "Confirm" }) as HTMLButtonElement).disabled).toBe(true);
    });

    test.each`
        detail                      | message
        ${"code_invalid"}           | ${"Invalid code."}
        ${"code_expired"}           | ${"Code expired, request a new one."}
        ${"code_attempts_exceeded"} | ${"Too many attempts. Request a new code."}
    `("explains $detail and clears the boxes", async ({ detail, message }) => {
        const onSubmit = jest.fn<(code: string) => Promise<void>>().mockRejectedValue(refused(detail as string));
        render(<VerificationCodeForm email="ana@usp.br" onSubmit={onSubmit} onResend={jest.fn<() => Promise<void>>()} />);

        await act(async () => typeCode("123456"));

        expect(screen.getByRole("alert").textContent).toBe(message);
        expect((screen.getByLabelText("Digit 1 of 6") as HTMLInputElement).value).toBe("");
        expect(screen.getByLabelText("Digit 1 of 6").getAttribute("aria-invalid")).toBe("true");
    });

    test("returns focus to the first box after a failed submit, for keyboard users", async () => {
        const onSubmit = jest.fn<(code: string) => Promise<void>>().mockRejectedValue(refused("code_invalid"));
        render(<VerificationCodeForm email="ana@usp.br" onSubmit={onSubmit} onResend={jest.fn<() => Promise<void>>()} />);

        await act(async () => typeCode("123456"));

        expect(document.activeElement).toBe(screen.getByLabelText("Digit 1 of 6"));
    });

    test("cannot resend until the countdown ends", () => {
        jest.useFakeTimers();
        render(<VerificationCodeForm email="ana@usp.br" onSubmit={jest.fn<() => Promise<void>>()} onResend={jest.fn<() => Promise<void>>()} />);

        const button = screen.getByRole("button", { name: "Resend code in 90s" }) as HTMLButtonElement;
        expect(button.disabled).toBe(true);

        act(() => { jest.advanceTimersByTime(89_000); });
        expect(screen.getByRole("button", { name: "Resend code in 1s" })).toBeTruthy();

        act(() => { jest.advanceTimersByTime(1_000); });
        expect((screen.getByRole("button", { name: "Resend code" }) as HTMLButtonElement).disabled).toBe(false);
    });

    test("resending says so and starts the countdown again", async () => {
        jest.useFakeTimers();
        const onResend = jest.fn<() => Promise<void>>().mockResolvedValue(undefined);
        render(<VerificationCodeForm email="ana@usp.br" onSubmit={jest.fn<() => Promise<void>>()} onResend={onResend} />);
        act(() => { jest.advanceTimersByTime(90_000); });

        await act(async () => fireEvent.click(screen.getByRole("button", { name: "Resend code" })));

        expect(onResend).toHaveBeenCalledTimes(1);
        expect(screen.getByRole("status").textContent).toBe("We sent a new code to ana@usp.br.");
        expect(screen.getByRole("button", { name: "Resend code in 90s" })).toBeTruthy();
    });

    test("a refused resend is explained", async () => {
        jest.useFakeTimers();
        const onResend = jest.fn<() => Promise<void>>().mockRejectedValue({ response: { status: 429, data: { detail: "resend_too_soon" } } });
        render(<VerificationCodeForm email="ana@usp.br" onSubmit={jest.fn<() => Promise<void>>()} onResend={onResend} />);
        act(() => { jest.advanceTimersByTime(90_000); });

        await act(async () => fireEvent.click(screen.getByRole("button", { name: "Resend code" })));

        await waitFor(() => expect(screen.getByRole("alert").textContent).toBe("Wait a moment before asking for another code."));
    });

    test("a refused resend leaves the resend button enabled and reading 'Resend code'", async () => {
        jest.useFakeTimers();
        const onResend = jest.fn<() => Promise<void>>().mockRejectedValue({ response: { status: 429, data: { detail: "resend_too_soon" } } });
        render(<VerificationCodeForm email="ana@usp.br" onSubmit={jest.fn<() => Promise<void>>()} onResend={onResend} />);
        act(() => { jest.advanceTimersByTime(90_000); });

        await act(async () => fireEvent.click(screen.getByRole("button", { name: "Resend code" })));

        const button = await waitFor(() => screen.getByRole("button", { name: "Resend code" }) as HTMLButtonElement);
        expect(button.disabled).toBe(false);
    });

    test("a rejection with no response shows the generic message", async () => {
        const onSubmit = jest.fn<(code: string) => Promise<void>>().mockRejectedValue(new Error("Network Error"));
        render(<VerificationCodeForm email="ana@usp.br" onSubmit={onSubmit} onResend={jest.fn<() => Promise<void>>()} />);

        await act(async () => typeCode("123456"));

        expect(screen.getByRole("alert").textContent).toBe("Something went wrong. Please try again.");
    });

    test("unmounting during the countdown leaves no timer running", () => {
        jest.useFakeTimers();
        const { unmount } = render(<VerificationCodeForm email="ana@usp.br" onSubmit={jest.fn<() => Promise<void>>()} onResend={jest.fn<() => Promise<void>>()} />);

        unmount();

        expect(jest.getTimerCount()).toBe(0);
    });

    test("the error is announced to the code boxes only while it is shown", async () => {
        const onSubmit = jest.fn<(code: string) => Promise<void>>().mockRejectedValue(refused("code_invalid"));
        render(<VerificationCodeForm email="ana@usp.br" onSubmit={onSubmit} onResend={jest.fn<() => Promise<void>>()} />);

        expect(screen.getByRole("group").getAttribute("aria-describedby")).toBeNull();

        await act(async () => typeCode("123456"));

        const alert = screen.getByRole("alert");
        expect(alert.id).toBeTruthy();
        expect(screen.getByRole("group").getAttribute("aria-describedby")).toBe(alert.id);
    });
});
