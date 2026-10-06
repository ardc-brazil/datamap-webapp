/** @jest-environment jsdom */
import { describe, expect, test } from '@jest/globals';
import { act, render, screen } from '@testing-library/react';
import { Form, Formik } from "formik";
import { EmbargoChoice } from "../EmbargoChoice";

function renderChoice(isPublic: boolean) {
    render(
        <Formik initialValues={{ embargoMode: "none", embargoUntil: "", embargoNote: "", membersCanEdit: false }} onSubmit={() => undefined}>
            <Form><EmbargoChoice tenancyName={isPublic ? "Public" : "Data Amazon"} isPublic={isPublic} /></Form>
        </Formik>
    );
}

async function underEmbargo() {
    await act(async () => {
        screen.getByRole("radio", { name: /Under embargo/ }).click();
    });
}

describe("EmbargoChoice in Public", () => {
    test("open means every account reads it and only the people shared with edit", () => {
        renderChoice(true);

        expect(screen.getByText("Visible to every DataMap account; only you and people you share with can edit")).toBeTruthy();
        expect(screen.queryByText("Every member of Public can read and download the files.")).toBeNull();
    });

    test("under embargo there is no members toggle, and afterwards members read only", async () => {
        renderChoice(true);

        await underEmbargo();

        expect(screen.getByText("When the embargo ends, members of Public can read but not edit.")).toBeTruthy();
        expect(screen.queryByRole("button", { name: "Change what members of Public can do" })).toBeNull();
    });

    test("in another tenancy a new dataset starts read-only for members, and the toggle stays", async () => {
        renderChoice(false);

        await underEmbargo();

        expect(screen.getByText("When the embargo ends, members of Data Amazon can read but not edit.")).toBeTruthy();
        expect(screen.getByRole("button", { name: "Change what members of Data Amazon can do" })).toBeTruthy();
    });
});
