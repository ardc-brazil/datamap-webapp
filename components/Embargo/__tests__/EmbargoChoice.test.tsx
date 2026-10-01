/** @jest-environment jsdom */
import { describe, expect, test } from '@jest/globals';
import { fireEvent, render, screen } from '@testing-library/react';
import { Form, Formik } from "formik";
import { EmbargoChoice } from "../EmbargoChoice";

function renderChoice() {
    render(
        <Formik initialValues={{ embargoMode: "none", embargoUntil: "", embargoNote: "" }} onSubmit={() => undefined}>
            <Form><EmbargoChoice tenancyName="Data Amazon" /></Form>
        </Formik>
    );
}

describe("EmbargoChoice", () => {
    test("open to the workspace by default, and no date asked", () => {
        renderChoice();

        expect((screen.getByRole("radio", { name: /Open to the workspace/ }) as HTMLInputElement).checked).toBe(true);
        expect(screen.getByText("Every member of Data Amazon can read and download the files.")).toBeTruthy();
        expect(screen.queryByLabelText("Embargo ends")).toBeNull();
    });

    test("under embargo asks for the date, and members don't see it until the author says so", () => {
        renderChoice();

        fireEvent.click(screen.getByRole("radio", { name: /Under embargo/ }));

        const date = screen.getByLabelText("Embargo ends") as HTMLInputElement;
        expect(date.min).not.toBe("");
        expect(date.max).not.toBe("");
        expect(screen.getByText("While embargoed, other members of Data Amazon")).toBeTruthy();
        expect((screen.getByRole("radio", { name: /Don't see it at all/ }) as HTMLInputElement).checked).toBe(true);
    });

    test("members may be told it exists", () => {
        renderChoice();

        fireEvent.click(screen.getByRole("radio", { name: /Under embargo/ }));
        fireEvent.click(screen.getByRole("radio", { name: /See that it exists/ }));

        expect((screen.getByRole("radio", { name: /See that it exists/ }) as HTMLInputElement).checked).toBe(true);
        expect((screen.getByRole("radio", { name: /Under embargo/ }) as HTMLInputElement).checked).toBe(true);
    });
});
