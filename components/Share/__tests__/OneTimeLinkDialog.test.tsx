/** @jest-environment jsdom */
import { afterEach, describe, expect, jest, test } from '@jest/globals';
import { fireEvent, render, screen } from '@testing-library/react';
import { OneTimeLinkDialog } from "../OneTimeLinkDialog";

const LINK = "https://datamap.pcs.usp.br/anonymous/tok";

afterEach(() => {
    delete (navigator as any).clipboard;
});

describe("OneTimeLinkDialog", () => {
    test("with a clipboard, Copy copies and says so", async () => {
        const writeText = (jest.fn() as any).mockResolvedValue(undefined);
        Object.defineProperty(navigator, "clipboard", { value: { writeText }, configurable: true });
        render(<OneTimeLinkDialog link={LINK} kind="anonymous" onDone={jest.fn()} />);

        fireEvent.click(screen.getByRole("button", { name: "Copy" }));

        expect(await screen.findByText("Copied")).toBeTruthy();
        expect(writeText).toHaveBeenCalledWith(LINK);
    });

    test("without a clipboard, the link is selected and the user is asked to copy it, not told it was copied", async () => {
        render(<OneTimeLinkDialog link={LINK} kind="anonymous" onDone={jest.fn()} />);

        fireEvent.click(screen.getByRole("button", { name: "Copy" }));

        expect(await screen.findByText("Copy the link above")).toBeTruthy();
        expect(screen.queryByText("Copied")).toBeNull();
        const input = screen.getByLabelText("Link") as HTMLInputElement;
        expect(input.selectionStart).toBe(0);
        expect(input.selectionEnd).toBe(LINK.length);
    });

    test("when the browser refuses the clipboard write, falls through to the same manual selection", async () => {
        const writeText = (jest.fn() as any).mockRejectedValue(new Error("refused"));
        Object.defineProperty(navigator, "clipboard", { value: { writeText }, configurable: true });
        render(<OneTimeLinkDialog link={LINK} kind="anonymous" onDone={jest.fn()} />);

        fireEvent.click(screen.getByRole("button", { name: "Copy" }));

        expect(await screen.findByText("Copy the link above")).toBeTruthy();
        expect(screen.queryByText("Copied")).toBeNull();
        const input = screen.getByLabelText("Link") as HTMLInputElement;
        expect(input.selectionStart).toBe(0);
        expect(input.selectionEnd).toBe(LINK.length);
    });
});
