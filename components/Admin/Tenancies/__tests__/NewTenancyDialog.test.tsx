/** @jest-environment jsdom */
import { describe, expect, jest, test } from "@jest/globals";
import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";

const mockCreate = jest.fn() as any;

jest.mock("../../../../gateways/BFFAPI", () => ({
    BFFAPI: jest.fn().mockImplementation(() => ({ createTenancy: mockCreate })),
}));

import { NewTenancyDialog } from "../NewTenancyDialog";

const NAMESPACE_ERROR = "Use 2 to 63 lower-case letters, digits or hyphens, and not “public” or “members”.";

function renderDialog() {
    const onCancel = jest.fn();
    const onCreated = jest.fn();
    render(<NewTenancyDialog onCancel={onCancel} onCreated={onCreated} />);
    return { onCancel, onCreated };
}

function value(label: string) {
    return (screen.getByLabelText(label) as HTMLInputElement).value;
}

describe("NewTenancyDialog", () => {
    test("the namespace follows the display name, and the path is previewed", async () => {
        renderDialog();

        expect(screen.getByRole("dialog", { name: "New tenancy" })).toBeTruthy();
        expect(screen.queryByLabelText("Environment")).toBeNull();
        fireEvent.change(screen.getByLabelText("Display name"), { target: { value: "Cerrado Flux" } });

        await waitFor(() => expect(value("Namespace")).toBe("cerrado-flux"));
        expect(screen.getByText("datamap/production/cerrado-flux")).toBeTruthy();
    });

    test("a namespace typed by hand stays when the display name changes", async () => {
        renderDialog();

        fireEvent.change(screen.getByLabelText("Namespace"), { target: { value: "cflux" } });
        fireEvent.change(screen.getByLabelText("Display name"), { target: { value: "Cerrado Flux" } });

        await waitFor(() => expect(value("Display name")).toBe("Cerrado Flux"));
        expect(value("Namespace")).toBe("cflux");
    });

    test("Create sends the trimmed name and hands back the tenancy", async () => {
        const created = { path: "datamap/production/cerrado-flux", display_name: "Cerrado Flux" };
        mockCreate.mockResolvedValue(created);
        const { onCreated } = renderDialog();

        fireEvent.change(screen.getByLabelText("Display name"), { target: { value: "  Cerrado Flux " } });
        await waitFor(() => expect(value("Namespace")).toBe("cerrado-flux"));
        fireEvent.click(screen.getByRole("button", { name: "Create" }));

        await waitFor(() => expect(onCreated).toHaveBeenCalledWith(created));
        expect(mockCreate).toHaveBeenCalledWith({ displayName: "Cerrado Flux", namespace: "cerrado-flux" });
    });

    test.each(["Public", "Members"])("%s is not a namespace, and the error is tied to the field", async (name) => {
        renderDialog();

        fireEvent.change(screen.getByLabelText("Display name"), { target: { value: name } });
        fireEvent.click(screen.getByRole("button", { name: "Create" }));

        const error = await screen.findByText(NAMESPACE_ERROR);
        const namespace = screen.getByLabelText("Namespace");
        expect(namespace.getAttribute("aria-describedby")).toBe(error.id);
        expect(namespace.getAttribute("aria-invalid")).toBe("true");
        expect(mockCreate).not.toHaveBeenCalled();
    });

    test("an empty display name is refused on its field", async () => {
        renderDialog();

        fireEvent.click(screen.getByRole("button", { name: "Create" }));

        const error = await screen.findByText("Use a display name of 1 to 64 characters.");
        const displayName = screen.getByLabelText("Display name");
        expect(displayName.getAttribute("aria-describedby")).toBe(error.id);
        expect(displayName.getAttribute("aria-invalid")).toBe("true");
        expect(mockCreate).not.toHaveBeenCalled();
    });

    test("an existing namespace is reported on the namespace, and what was typed stays", async () => {
        mockCreate.mockRejectedValue({ response: { status: 409, data: { detail: "tenancy_exists" } } });
        const { onCreated } = renderDialog();

        fireEvent.change(screen.getByLabelText("Display name"), { target: { value: "ATTO" } });
        await waitFor(() => expect(value("Namespace")).toBe("atto"));
        fireEvent.click(screen.getByRole("button", { name: "Create" }));

        const error = await screen.findByText("A tenancy with this namespace already exists.");
        expect(screen.getByLabelText("Namespace").getAttribute("aria-describedby")).toBe(error.id);
        expect(screen.getByLabelText("Namespace").getAttribute("aria-invalid")).toBe("true");
        expect(screen.getByRole("dialog", { name: "New tenancy" })).toBeTruthy();
        expect(value("Display name")).toBe("ATTO");
        expect(value("Namespace")).toBe("atto");
        expect(onCreated).not.toHaveBeenCalled();
    });

    test("a display name already taken is reported on the display name", async () => {
        mockCreate.mockRejectedValue({ response: { status: 409, data: { detail: "display_name_taken" } } });
        renderDialog();

        fireEvent.change(screen.getByLabelText("Display name"), { target: { value: "ATTO" } });
        await waitFor(() => expect(value("Namespace")).toBe("atto"));
        fireEvent.click(screen.getByRole("button", { name: "Create" }));

        const error = await screen.findByText("Another tenancy already has this display name.");
        expect(screen.getByLabelText("Display name").getAttribute("aria-describedby")).toBe(error.id);
        expect(screen.getByLabelText("Display name").getAttribute("aria-invalid")).toBe("true");
        expect(screen.getByLabelText("Namespace").getAttribute("aria-invalid")).toBeNull();
    });

    test("a namespace the gatekeeper refuses is reported on the namespace", async () => {
        mockCreate.mockRejectedValue({ response: { status: 400, data: { detail: "namespace_invalid" } } });
        renderDialog();

        fireEvent.change(screen.getByLabelText("Display name"), { target: { value: "ATTO" } });
        await waitFor(() => expect(value("Namespace")).toBe("atto"));
        fireEvent.click(screen.getByRole("button", { name: "Create" }));

        const error = await screen.findByText(NAMESPACE_ERROR);
        expect(screen.getByLabelText("Namespace").getAttribute("aria-describedby")).toBe(error.id);
    });

    test("any other failure is shown and the dialog stays", async () => {
        mockCreate.mockRejectedValue({});
        const { onCreated } = renderDialog();

        fireEvent.change(screen.getByLabelText("Display name"), { target: { value: "ATTO" } });
        await waitFor(() => expect(value("Namespace")).toBe("atto"));
        fireEvent.click(screen.getByRole("button", { name: "Create" }));

        expect((await screen.findByRole("alert")).textContent).toBe("Something went wrong. Please try again.");
        expect(value("Display name")).toBe("ATTO");
        expect(onCreated).not.toHaveBeenCalled();
    });

    test("a double click creates only once, during the call and after it", async () => {
        let resolve: (value: unknown) => void = () => undefined;
        mockCreate.mockImplementation(() => new Promise((r) => { resolve = r; }));
        const { onCreated } = renderDialog();

        fireEvent.change(screen.getByLabelText("Display name"), { target: { value: "ATTO" } });
        await waitFor(() => expect(value("Namespace")).toBe("atto"));
        const create = screen.getByRole("button", { name: "Create" });
        fireEvent.click(create);
        fireEvent.click(create);
        await waitFor(() => expect(mockCreate).toHaveBeenCalled());
        await act(async () => { resolve({ path: "datamap/production/atto" }); });
        await waitFor(() => expect(onCreated).toHaveBeenCalledTimes(1));
        fireEvent.click(create);

        await waitFor(() => expect((create as HTMLButtonElement).disabled).toBe(true));
        expect(mockCreate).toHaveBeenCalledTimes(1);
        expect(onCreated).toHaveBeenCalledTimes(1);
    });
});
