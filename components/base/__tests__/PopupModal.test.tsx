/** @jest-environment jsdom */
import { describe, expect, jest, test } from "@jest/globals";
import { fireEvent, render, screen } from "@testing-library/react";
import PopupModal from "../PopupModal";

describe("PopupModal", () => {
    test("without the new props it keeps today's frame, labels and colours", () => {
        render(<PopupModal show title="Delete version" confimButtonText="Delete" confim={jest.fn()} cancel={jest.fn()} destructive><p>body</p></PopupModal>);

        const dialog = screen.getByRole("dialog", { name: "Delete version" });
        expect(dialog.querySelector(".rounded-lg.max-w-lg")).toBeTruthy();
        expect(dialog.querySelector(".rounded-xl")).toBeNull();
        expect(screen.getAllByRole("button", { name: "Close" })).toHaveLength(2);
        const confirm = screen.getByRole("button", { name: "Delete" });
        expect(confirm.className).toContain("bg-error-600");
        expect(confirm.className).toContain("disabled:opacity-50");
    });

    test("renders nothing unless shown", () => {
        render(<PopupModal title="Hidden" confimButtonText="OK" cancel={jest.fn()}>body</PopupModal>);

        expect(screen.queryByRole("dialog")).toBeNull();
    });

    test("two dialogs on one page are each named by their own title", () => {
        render(<>
            <PopupModal show title="First" cancel={jest.fn()}>a</PopupModal>
            <PopupModal show title="Second" cancel={jest.fn()}>b</PopupModal>
        </>);

        expect(screen.getByRole("dialog", { name: "First" })).toBeTruthy();
        expect(screen.getByRole("dialog", { name: "Second" })).toBeTruthy();
    });

    test("the xl variant is rounded-xl and greys a disabled confirm", () => {
        render(<PopupModal show variant="xl" title="Create" confimButtonText="Create" confim={jest.fn()} confirmDisabled cancel={jest.fn()}>body</PopupModal>);

        expect(screen.getByRole("dialog").querySelector(".rounded-xl")).toBeTruthy();
        expect(screen.getByRole("button", { name: "Create" }).className).toContain("disabled:bg-primary-200");
    });

    test("danger makes the confirm red", () => {
        render(<PopupModal show danger title="Remove?" confimButtonText="Remove" confim={jest.fn()} cancel={jest.fn()}>body</PopupModal>);

        expect(screen.getByRole("button", { name: "Remove" }).className).toContain("bg-danger-700");
    });

    test("a subtitle sits under the title", () => {
        render(<PopupModal show title="Join ATTO" subtitle="Fernanda Lima · requested 6 days ago" cancel={jest.fn()}>body</PopupModal>);

        expect(screen.getByText("Fernanda Lima · requested 6 days ago")).toBeTruthy();
    });

    test("the footer link calls its handler", () => {
        const onDecline = jest.fn();
        render(<PopupModal show title="Join ATTO" footerLink={{ label: "Decline…", onClick: onDecline }} cancel={jest.fn()}>body</PopupModal>);

        fireEvent.click(screen.getByRole("button", { name: "Decline…" }));

        expect(onDecline).toHaveBeenCalledTimes(1);
    });

    test("the ✕ can carry its own label", () => {
        const cancel = jest.fn();
        render(<PopupModal show title="Join ATTO" closeAriaLabel="Close dialog" cancel={cancel}>body</PopupModal>);

        fireEvent.click(screen.getByRole("button", { name: "Close dialog" }));

        expect(cancel).toHaveBeenCalledTimes(1);
    });

    test("the width can be set", () => {
        render(<PopupModal show title="Narrow" maxWidthClassName="max-w-[440px]" cancel={jest.fn()}>body</PopupModal>);

        expect(screen.getByRole("dialog").querySelector(".max-w-\\[440px\\]")).toBeTruthy();
    });
});
