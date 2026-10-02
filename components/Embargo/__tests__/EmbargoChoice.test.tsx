/** @jest-environment jsdom */
import { describe, expect, test } from '@jest/globals';
import { act, fireEvent, render, screen, within } from '@testing-library/react';
import { Form, Formik } from "formik";
import { EmbargoChoice } from "../EmbargoChoice";

function renderChoice(props: { disabled?: boolean, statusLine?: string | null } = {}) {
    render(
        <Formik initialValues={{ embargoMode: "none", embargoUntil: "", embargoNote: "" }} onSubmit={() => undefined}>
            <Form><EmbargoChoice tenancyName="Data Amazon" {...props} /></Form>
        </Formik>
    );
}

function card(radioName: RegExp): HTMLElement {
    return screen.getByRole("radio", { name: radioName }).closest("label")!.parentElement as HTMLElement;
}

async function clickRadio(name: RegExp) {
    await act(async () => {
        screen.getByRole("radio", { name }).click();
    });
}

describe("EmbargoChoice", () => {
    test("open to the workspace by default, and no date asked", () => {
        renderChoice();

        expect((screen.getByRole("radio", { name: /Open to the workspace/ }) as HTMLInputElement).checked).toBe(true);
        expect(screen.getByText("Every member of Data Amazon can read and download the files.")).toBeTruthy();
        expect(screen.queryByLabelText("Embargo ends")).toBeNull();
    });

    test("the two choices stack as full-width cards, not a two-column grid", () => {
        renderChoice();

        const options = card(/Open to the workspace/).parentElement as HTMLElement;
        expect(options.className).not.toMatch(/sm:grid-cols-2/);
        expect(options.className).toMatch(/flex-col/);
    });

    test("under embargo asks for the date, and members don't see it until the author says so", async () => {
        renderChoice();

        await clickRadio(/Under embargo/);

        const date = await screen.findByLabelText("Embargo ends") as HTMLInputElement;
        expect(date.min).not.toBe("");
        expect(date.max).not.toBe("");
        expect(screen.getByText("While embargoed, other members of Data Amazon")).toBeTruthy();
        expect((screen.getByRole("radio", { name: /Don't see it at all/ }) as HTMLInputElement).checked).toBe(true);
    });

    test("the fields render inside the selected card, not a separate box below both cards", async () => {
        renderChoice();

        await clickRadio(/Under embargo/);

        const embargoCard = card(/Under embargo/);
        expect(within(embargoCard).getByLabelText("Embargo ends")).toBeTruthy();
        expect(within(embargoCard).getByText("While embargoed, other members of Data Amazon")).toBeTruthy();
    });

    test("members may be told it exists", async () => {
        renderChoice();

        await clickRadio(/Under embargo/);
        await clickRadio(/See that it exists/);

        expect((await screen.findByRole("radio", { name: /See that it exists/ }) as HTMLInputElement).checked).toBe(true);
        expect((screen.getByRole("radio", { name: /Under embargo/ }) as HTMLInputElement).checked).toBe(true);
    });

    test("once the embargo is locked, the radios are disabled and the status line is shown", () => {
        renderChoice({ disabled: true, statusLine: "Embargo set until Dec 15, 2026; change it in Settings after creation" });

        expect((screen.getByRole("radio", { name: /Open to the workspace/ }) as HTMLInputElement).disabled).toBe(true);
        expect((screen.getByRole("radio", { name: /Under embargo/ }) as HTMLInputElement).disabled).toBe(true);
        expect(screen.getByRole("status").textContent).toBe("Embargo set until Dec 15, 2026; change it in Settings after creation");
    });

    test("a line under the members choice says what they get afterwards, and Change switches it", async () => {
        renderChoice();

        await clickRadio(/Under embargo/);

        expect(screen.getByText("When the embargo ends, members of Data Amazon can read and edit again.")).toBeTruthy();
        fireEvent.click(screen.getByRole("button", { name: "Change what members of Data Amazon can do" }));
        expect(screen.getByText("Members have no access while the embargo lasts. This decides what they get when it ends.")).toBeTruthy();
        await act(async () => {
            fireEvent.click(screen.getByRole("radio", { name: /Read only/ }));
            fireEvent.click(screen.getByRole("button", { name: "Save" }));
        });

        expect(screen.getByText("When the embargo ends, members of Data Amazon can read but not edit.")).toBeTruthy();
        expect(screen.queryByRole("dialog", { name: "What members of Data Amazon can do" })).toBeNull();
    });
});
