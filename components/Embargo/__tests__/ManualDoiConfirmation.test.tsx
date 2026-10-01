/** @jest-environment jsdom */
import { describe, expect, jest, test } from '@jest/globals';
import { fireEvent, render, screen } from '@testing-library/react';
import { ManualDoiConfirmation } from "../ManualDoiConfirmation";

const base = { identifier: "10.1029/2026JD041877", tenancyName: "Data Amazon", show: true };

describe("ManualDoiConfirmation", () => {
    test("under embargo, the owner is told what ends and confirms it", () => {
        const onConfirm = jest.fn();
        render(<ManualDoiConfirmation {...base} gate="ends_embargo" onConfirm={onConfirm} onCancel={jest.fn()} />);

        expect(screen.getByText("External DOI ends the embargo")).toBeTruthy();
        expect(screen.getByText("10.1029/2026JD041877 · minted outside DataMap")).toBeTruthy();
        for (const line of ["Embargo ends · can't be undone", "Files open to Data Amazon members now", "Public page published, with authors", "Anonymous links redirect to it"]) {
            expect(screen.getByText(line)).toBeTruthy();
        }
        expect(screen.getByText("To keep the embargo, generate the DOI with DataMap instead.")).toBeTruthy();
        fireEvent.click(screen.getByRole("button", { name: "End embargo and register DOI" }));

        expect(onConfirm).toHaveBeenCalled();
    });

    test("under embargo, anyone else gets an explanation and nothing to confirm", () => {
        render(<ManualDoiConfirmation {...base} gate="owner_only" onConfirm={jest.fn()} onCancel={jest.fn()} />);

        expect(screen.getByText(/Only the owner of this dataset can end its embargo/)).toBeTruthy();
        expect(screen.queryByRole("button", { name: "End embargo and register DOI" })).toBeNull();
        expect(screen.queryByRole("button", { name: "Register DOI" })).toBeNull();
    });

    test("without an embargo, the user learns it can no longer be embargoed, and may set one first", () => {
        const onConfirm = jest.fn();
        const onSetEmbargo = jest.fn();
        render(<ManualDoiConfirmation {...base} gate="blocks_future_embargo" onConfirm={onConfirm} onCancel={jest.fn()} onSetEmbargo={onSetEmbargo} />);

        expect(screen.getByText("Register external DOI?")).toBeTruthy();
        expect(screen.getByText("After this, the dataset can no longer be put under embargo.")).toBeTruthy();
        fireEvent.click(screen.getByRole("button", { name: "Set an embargo first" }));
        expect(onSetEmbargo).toHaveBeenCalled();

        fireEvent.click(screen.getByRole("button", { name: "Register DOI" }));
        expect(onConfirm).toHaveBeenCalled();
    });

    test("someone who may not set an embargo just cancels", () => {
        const onCancel = jest.fn();
        render(<ManualDoiConfirmation {...base} gate="blocks_future_embargo" onConfirm={jest.fn()} onCancel={onCancel} />);

        expect(screen.queryByRole("button", { name: "Set an embargo first" })).toBeNull();
        fireEvent.click(screen.getByRole("button", { name: "Cancel" }));
        expect(onCancel).toHaveBeenCalled();
    });

    test("cancel sends nothing", () => {
        const onConfirm = jest.fn();
        const onCancel = jest.fn();
        render(<ManualDoiConfirmation {...base} gate="ends_embargo" onConfirm={onConfirm} onCancel={onCancel} />);

        fireEvent.click(screen.getByRole("button", { name: "Cancel" }));

        expect(onCancel).toHaveBeenCalled();
        expect(onConfirm).not.toHaveBeenCalled();
    });

    test("while the request is sending, the confirm button is disabled", () => {
        render(<ManualDoiConfirmation {...base} gate="ends_embargo" onConfirm={jest.fn()} onCancel={jest.fn()} sending />);

        const button = screen.getByRole("button", { name: "End embargo and register DOI" }) as HTMLButtonElement;
        expect(button.disabled).toBe(true);
    });
});
