/** @jest-environment jsdom */
import { describe, expect, jest, test } from "@jest/globals";
import { fireEvent, render, screen } from "@testing-library/react";
import { AdminDialog } from "../AdminDialog";

describe("AdminDialog", () => {
    test("is a dialog named by its title, with the subtitle under it", () => {
        render(<AdminDialog title="Decline request?" subtitle="Fernanda Lima · join Data Amazon" widthClassName="max-w-[440px]" onClose={jest.fn()}><p>body</p></AdminDialog>);

        expect(screen.getByRole("dialog", { name: "Decline request?" })).toBeTruthy();
        expect(screen.getByText("Fernanda Lima · join Data Amazon")).toBeTruthy();
        expect(screen.getByText("body")).toBeTruthy();
    });

    test("the primary action, Cancel and the ✕ each do their job", () => {
        const onClose = jest.fn();
        const onApprove = jest.fn();
        render(<AdminDialog title="Join ATTO" widthClassName="max-w-[560px]" onClose={onClose} primary={{ label: "Approve", onClick: onApprove }} />);

        fireEvent.click(screen.getByRole("button", { name: "Approve" }));
        fireEvent.click(screen.getByRole("button", { name: "Cancel" }));
        fireEvent.click(screen.getByRole("button", { name: "Close dialog" }));

        expect(onApprove).toHaveBeenCalledTimes(1);
        expect(onClose).toHaveBeenCalledTimes(2);
    });

    test("Cancel and the ✕ can be disabled", () => {
        const onClose = jest.fn();
        render(<AdminDialog title="Join ATTO" widthClassName="max-w-[560px]" onClose={onClose} cancelDisabled primary={{ label: "Approve", onClick: jest.fn() }} />);

        fireEvent.click(screen.getByRole("button", { name: "Cancel" }));
        fireEvent.click(screen.getByRole("button", { name: "Close dialog" }));

        expect((screen.getByRole("button", { name: "Cancel" }) as HTMLButtonElement).disabled).toBe(true);
        expect((screen.getByRole("button", { name: "Close dialog" }) as HTMLButtonElement).disabled).toBe(true);
        expect(onClose).not.toHaveBeenCalled();
    });

    test("a disabled primary action cannot be pressed and looks grey", () => {
        const onCreate = jest.fn();
        render(<AdminDialog title="New tenancy: Cerrado Flux" widthClassName="max-w-[560px]" onClose={jest.fn()} primary={{ label: "Create and approve", onClick: onCreate, disabled: true }} />);
        const button = screen.getByRole("button", { name: "Create and approve" }) as HTMLButtonElement;

        fireEvent.click(button);

        expect(button.disabled).toBe(true);
        expect(button.className).toContain("disabled:bg-primary-200");
        expect(onCreate).not.toHaveBeenCalled();
    });

    test("a destructive action is red", () => {
        render(<AdminDialog title="Remove from ATTO?" widthClassName="max-w-[440px]" onClose={jest.fn()} primary={{ label: "Remove", onClick: jest.fn(), destructive: true }} />);

        expect(screen.getByRole("button", { name: "Remove" }).className).toContain("bg-danger-700");
    });

    test("the footer link sits next to Cancel", () => {
        const onDecline = jest.fn();
        render(<AdminDialog title="Join ATTO" widthClassName="max-w-[560px]" onClose={jest.fn()} secondaryLink={{ label: "Decline…", onClick: onDecline }} primary={{ label: "Approve", onClick: jest.fn() }} />);

        fireEvent.click(screen.getByRole("button", { name: "Decline…" }));

        expect(onDecline).toHaveBeenCalled();
    });

    test("without a primary action the footer only closes", () => {
        render(<AdminDialog title="Review request" widthClassName="max-w-[560px]" onClose={jest.fn()} />);

        expect(screen.getByRole("button", { name: "Close" })).toBeTruthy();
        expect(screen.queryByRole("button", { name: "Cancel" })).toBeNull();
    });
});
