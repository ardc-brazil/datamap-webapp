/** @jest-environment jsdom */
import { describe, expect, jest, test } from '@jest/globals';
import { fireEvent, render, screen } from '@testing-library/react';
import { MembersAccessDialog } from "../MembersAccessDialog";

function renderDialog(overrides: any = {}) {
    const onSave = jest.fn();
    const onCancel = jest.fn();
    render(<MembersAccessDialog show tenancyName="Data Amazon" membersCanEdit embargoActive={false} onCancel={onCancel} onSave={onSave} {...overrides} />);
    return { onSave, onCancel };
}

describe("MembersAccessDialog", () => {
    test("offers the two choices, the current one selected", () => {
        renderDialog();

        expect(screen.getByRole("dialog", { name: "What members of Data Amazon can do" })).toBeTruthy();
        expect((screen.getByRole("radio", { name: /Read and edit/ }) as HTMLInputElement).checked).toBe(true);
        expect(screen.getByText("Their workspace role decides, as on any dataset of Data Amazon.")).toBeTruthy();
        expect(screen.getByText("They read and download. Editing, uploads and new versions stay with you and the people you share it with as Can write.")).toBeTruthy();
    });

    test("saves the choice", () => {
        const { onSave } = renderDialog();

        fireEvent.click(screen.getByRole("radio", { name: /Read only/ }));
        fireEvent.click(screen.getByRole("button", { name: "Save" }));

        expect(onSave).toHaveBeenCalledWith(false);
    });

    test("cancel saves nothing", () => {
        const { onSave, onCancel } = renderDialog();

        fireEvent.click(screen.getByRole("radio", { name: /Read only/ }));
        fireEvent.click(screen.getByRole("button", { name: "Cancel" }));

        expect(onCancel).toHaveBeenCalled();
        expect(onSave).not.toHaveBeenCalled();
    });

    test("during an embargo it says the choice is for afterwards", () => {
        renderDialog({ embargoActive: true, membersCanEdit: false });

        expect((screen.getByRole("radio", { name: /Read only/ }) as HTMLInputElement).checked).toBe(true);
        expect(screen.getByText("Members have no access while the embargo lasts. This decides what they get when it ends.")).toBeTruthy();
    });

    test("an error is shown, and Save waits while busy", () => {
        renderDialog({ busy: true, error: "You are not allowed to do this on this dataset." });

        expect(screen.getByRole("alert").textContent).toBe("You are not allowed to do this on this dataset.");
        expect((screen.getByRole("button", { name: "Save" }) as HTMLButtonElement).disabled).toBe(true);
    });

    test("nothing is rendered when hidden", () => {
        renderDialog({ show: false });

        expect(screen.queryByRole("dialog")).toBeNull();
    });
});
