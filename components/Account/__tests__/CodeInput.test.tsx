/** @jest-environment jsdom */
import { describe, expect, jest, test } from '@jest/globals';
import { fireEvent, render, screen } from '@testing-library/react';
import { useState } from "react";
import { CodeInput } from "../CodeInput";

function Harness(props: { initial?: string, onComplete?: (code: string) => void, disabled?: boolean, invalid?: boolean, describedBy?: string, autoFocusKey?: number }) {
    const [value, setValue] = useState(props.initial ?? "");
    return (
        <>
            <CodeInput value={value} onChange={setValue} onComplete={props.onComplete ?? (() => undefined)} disabled={props.disabled} invalid={props.invalid} describedBy={props.describedBy} autoFocusKey={props.autoFocusKey} />
            <output data-testid="value">{value}</output>
        </>
    );
}

function box(n: number): HTMLInputElement {
    return screen.getByLabelText(`Digit ${n} of 6`) as HTMLInputElement;
}

function typed(): string {
    return screen.getByTestId("value").textContent ?? "";
}

describe("CodeInput", () => {
    test("shows six boxes, each labelled", () => {
        render(<Harness />);

        for (let n = 1; n <= 6; n++) {
            expect(box(n)).toBeTruthy();
        }
        expect(screen.getAllByRole("textbox")).toHaveLength(6);
    });

    test("asks for the numeric keyboard, and lets the first box take a code from the OS", () => {
        render(<Harness />);

        expect(box(1).getAttribute("inputmode")).toBe("numeric");
        expect(box(6).getAttribute("inputmode")).toBe("numeric");
        expect(box(1).getAttribute("autocomplete")).toBe("one-time-code");
        expect(box(2).getAttribute("autocomplete")).toBe("off");
    });

    test("typing a digit fills the box and moves to the next one", () => {
        render(<Harness />);
        box(1).focus();

        fireEvent.change(box(1), { target: { value: "4" } });

        expect(typed()).toBe("4");
        expect(box(1).value).toBe("4");
        expect(document.activeElement).toBe(box(2));
    });

    test("a letter is ignored", () => {
        render(<Harness />);
        box(1).focus();

        fireEvent.change(box(1), { target: { value: "a" } });

        expect(typed()).toBe("");
        expect(box(1).value).toBe("");
        expect(document.activeElement).toBe(box(1));
    });

    test("typing over a filled box replaces its digit", () => {
        render(<Harness initial="123" />);

        fireEvent.change(box(2), { target: { value: "27" } });

        expect(typed()).toBe("173");
        expect(document.activeElement).toBe(box(3));
    });

    test("the sixth digit completes the code", () => {
        const onComplete = jest.fn();
        render(<Harness initial="12345" onComplete={onComplete} />);

        fireEvent.change(box(6), { target: { value: "6" } });

        expect(onComplete).toHaveBeenCalledWith("123456");
        expect(onComplete).toHaveBeenCalledTimes(1);
    });

    test("fewer than six digits do not complete it", () => {
        const onComplete = jest.fn();
        render(<Harness initial="1234" onComplete={onComplete} />);

        fireEvent.change(box(5), { target: { value: "5" } });

        expect(onComplete).not.toHaveBeenCalled();
    });

    test("Backspace on a filled box clears it and stays", () => {
        render(<Harness initial="123" />);
        box(3).focus();

        fireEvent.keyDown(box(3), { key: "Backspace" });

        expect(typed()).toBe("12");
        expect(document.activeElement).toBe(box(3));
    });

    test("Backspace on an empty box moves back", () => {
        render(<Harness initial="12" />);
        box(3).focus();

        fireEvent.keyDown(box(3), { key: "Backspace" });

        expect(typed()).toBe("12");
        expect(document.activeElement).toBe(box(2));
    });

    test("Backspace on the first box stays there", () => {
        render(<Harness />);
        box(1).focus();

        fireEvent.keyDown(box(1), { key: "Backspace" });

        expect(document.activeElement).toBe(box(1));
    });

    test("the arrow keys move between boxes", () => {
        render(<Harness initial="1234" />);
        box(2).focus();

        fireEvent.keyDown(box(2), { key: "ArrowRight" });
        expect(document.activeElement).toBe(box(3));

        fireEvent.keyDown(box(3), { key: "ArrowLeft" });
        fireEvent.keyDown(box(2), { key: "ArrowLeft" });
        expect(document.activeElement).toBe(box(1));
    });

    test("an empty box past the first empty one sends the focus back to it", () => {
        render(<Harness initial="12" />);

        box(5).focus();

        expect(document.activeElement).toBe(box(3));
    });

    test("pasting a code fills all six, whatever box it lands in", () => {
        const onComplete = jest.fn();
        render(<Harness onComplete={onComplete} />);
        box(1).focus();

        fireEvent.paste(box(1), { clipboardData: { getData: () => "123 456" } });

        expect(typed()).toBe("123456");
        for (let n = 1; n <= 6; n++) {
            expect(box(n).value).toBe(String(n));
        }
        expect(onComplete).toHaveBeenCalledWith("123456");
    });

    test("a pasted code is cut to six digits, and its non-digits are dropped", () => {
        render(<Harness initial="9" />);

        fireEvent.paste(box(1), { clipboardData: { getData: () => "Your code: 98-76-54-32" } });

        expect(typed()).toBe("987654");
    });

    test("a paste with no digits changes nothing", () => {
        render(<Harness initial="12" />);

        fireEvent.paste(box(1), { clipboardData: { getData: () => "hello" } });

        expect(typed()).toBe("12");
    });

    test("several digits typed at once, as the OS fills a code, are spread over the boxes", () => {
        const onComplete = jest.fn();
        render(<Harness onComplete={onComplete} />);

        fireEvent.change(box(1), { target: { value: "654321" } });

        expect(typed()).toBe("654321");
        expect(onComplete).toHaveBeenCalledWith("654321");
    });

    test("disabled disables every box", () => {
        render(<Harness disabled />);

        for (let n = 1; n <= 6; n++) {
            expect(box(n).disabled).toBe(true);
        }
    });

    test("invalid marks every box for assistive technology and in colour", () => {
        render(<Harness invalid />);

        expect(box(1).getAttribute("aria-invalid")).toBe("true");
        expect(box(1).className).toContain("border-error-500");
    });

    test("valid boxes carry no invalid mark", () => {
        render(<Harness />);

        expect(box(1).getAttribute("aria-invalid")).toBeNull();
        expect(box(1).className).not.toContain("border-error-500");
    });

    test("describedBy is wired onto the group, for a caller that has an error to announce", () => {
        render(<Harness describedBy="code-error" />);

        expect(screen.getByRole("group").getAttribute("aria-describedby")).toBe("code-error");
    });

    test("no describedBy means no aria-describedby, as before", () => {
        render(<Harness />);

        expect(screen.getByRole("group").getAttribute("aria-describedby")).toBeNull();
    });

    test("ArrowLeft on the first box keeps the focus there", () => {
        render(<Harness initial="1234" />);
        box(1).focus();

        fireEvent.keyDown(box(1), { key: "ArrowLeft" });

        expect(document.activeElement).toBe(box(1));
    });

    test("ArrowRight on the last box keeps the focus there", () => {
        render(<Harness initial="123456" />);
        box(6).focus();

        fireEvent.keyDown(box(6), { key: "ArrowRight" });

        expect(document.activeElement).toBe(box(6));
    });

    test("changing autoFocusKey moves the focus to the first box", () => {
        const { rerender } = render(<Harness initial="123456" autoFocusKey={0} />);
        box(6).focus();

        rerender(<Harness initial="" autoFocusKey={1} />);

        expect(document.activeElement).toBe(box(1));
    });

    test("no autoFocusKey means focus is left wherever it was", () => {
        render(<Harness initial="123456" />);
        box(6).focus();

        expect(document.activeElement).toBe(box(6));
    });
});
