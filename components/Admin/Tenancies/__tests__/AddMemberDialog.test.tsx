/** @jest-environment jsdom */
import { beforeEach, describe, expect, jest, test } from "@jest/globals";
import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";

const mockAdd = jest.fn() as any;
const mockSearches: string[] = [];
const mockDebounces: number[] = [];
let mockHits: { data?: unknown, error?: unknown } = {};

jest.mock("../../../../gateways/BFFAPI", () => ({
    BFFAPI: jest.fn().mockImplementation(() => ({ addTenancyMember: mockAdd })),
}));
jest.mock("../../../../hooks/UseDebouncedValue", () => ({
    useDebouncedValue: (value: unknown, delayMs: number) => {
        mockDebounces.push(delayMs);
        return value;
    },
}));
jest.mock("../../../../hooks/UseAdmin", () => ({
    useAdminUserSearch: (q: string) => {
        mockSearches.push(q);
        return mockHits;
    },
}));

import { adminTenancy } from "../../../../fake-data/adminFixtures";
import { AddMemberDialog } from "../AddMemberDialog";

const FERNANDA = { id: "0c1d2e3f-4a5b-4c6d-8e7f-9a0b1c2d3e4f", name: "Fernanda Lima", email: "fernanda.lima@inpe.br" };
const FELIPE = { id: "5e6f7a8b-9c0d-4e1f-8a2b-3c4d5e6f7a8b", name: "Felipe Nogueira", email: null };

function renderDialog() {
    const onCancel = jest.fn();
    const onAdded = jest.fn();
    render(<AddMemberDialog tenancy={adminTenancy()} onCancel={onCancel} onAdded={onAdded} />);
    return { onCancel, onAdded };
}

function search(value: string) {
    fireEvent.change(screen.getByPlaceholderText("Name, email or ORCID"), { target: { value } });
}

function pickFernanda() {
    search("fer");
    fireEvent.click(screen.getByRole("radio", { name: /Fernanda Lima/ }));
}

beforeEach(() => {
    mockSearches.length = 0;
    mockDebounces.length = 0;
    mockHits = {};
});

describe("AddMemberDialog", () => {
    test("asks for at least two characters, and Add waits for a pick", () => {
        renderDialog();

        expect(screen.getByRole("dialog", { name: "Add to Data Amazon" })).toBeTruthy();
        expect(screen.getByText("Type at least 2 characters of a name, email or ORCID iD.")).toBeTruthy();
        expect((screen.getByRole("button", { name: "Add" }) as HTMLButtonElement).disabled).toBe(true);
        expect(screen.queryByLabelText(/role/i)).toBeNull();
    });

    test("the search is debounced", () => {
        renderDialog();

        expect(mockDebounces[mockDebounces.length - 1]).toBe(300);
    });

    test("finds people, shows their email, says who is emailed, and adds the one picked", async () => {
        mockHits = { data: [FERNANDA, FELIPE] };
        mockAdd.mockResolvedValue({ id: FERNANDA.id });
        const { onAdded } = renderDialog();

        search(" fer ");
        expect(screen.getByText("fernanda.lima@inpe.br")).toBeTruthy();
        expect(screen.getByText("No email")).toBeTruthy();
        fireEvent.click(screen.getByRole("radio", { name: /Fernanda Lima/ }));

        expect(mockSearches[mockSearches.length - 1]).toBe("fer");
        expect(screen.getByText("Fernanda is emailed.")).toBeTruthy();
        fireEvent.click(screen.getByRole("button", { name: "Add" }));

        await waitFor(() => expect(onAdded).toHaveBeenCalled());
        expect(mockAdd).toHaveBeenCalledWith("datamap/production/data-amazon", FERNANDA.id);
    });

    test("a new search drops the pick", () => {
        mockHits = { data: [FERNANDA] };
        renderDialog();

        pickFernanda();
        search("fern");

        expect(screen.queryByText("Fernanda is emailed.")).toBeNull();
        expect((screen.getByRole("button", { name: "Add" }) as HTMLButtonElement).disabled).toBe(true);
    });

    test("says when nobody matches", () => {
        mockHits = { data: [] };
        renderDialog();

        search("zzz");

        expect(screen.getByText("No account matches “zzz”.")).toBeTruthy();
    });

    test("says when the search failed", () => {
        mockHits = { error: { status: 500 } };
        renderDialog();

        search("fer");

        expect(screen.getByText("People could not be searched.")).toBeTruthy();
    });

    test("someone already in the tenancy is reported on the pick, which stays", async () => {
        mockHits = { data: [FERNANDA] };
        mockAdd.mockRejectedValue({ response: { status: 409, data: { detail: "already_member" } } });
        const { onAdded } = renderDialog();

        pickFernanda();
        fireEvent.click(screen.getByRole("button", { name: "Add" }));

        const error = await screen.findByText("They are already a member of this tenancy.");
        const radio = screen.getByRole("radio", { name: /Fernanda Lima/ }) as HTMLInputElement;
        expect(radio.checked).toBe(true);
        expect(radio.getAttribute("aria-describedby")).toBe(error.id);
        expect(radio.getAttribute("aria-invalid")).toBe("true");
        expect((screen.getByPlaceholderText("Name, email or ORCID") as HTMLInputElement).value).toBe("fer");
        expect(onAdded).not.toHaveBeenCalled();
    });

    test("public cannot be changed, and says so", async () => {
        mockHits = { data: [FERNANDA] };
        mockAdd.mockRejectedValue({ response: { status: 409, data: { detail: "public_tenancy_locked" } } });
        renderDialog();

        pickFernanda();
        fireEvent.click(screen.getByRole("button", { name: "Add" }));

        expect(await screen.findByText("Everyone is in Public; its members can't be changed.")).toBeTruthy();
    });

    test("a double click adds only once, during the call and after it", async () => {
        mockHits = { data: [FERNANDA] };
        let resolve: (value: unknown) => void = () => undefined;
        mockAdd.mockImplementation(() => new Promise((r) => { resolve = r; }));
        const { onAdded } = renderDialog();

        pickFernanda();
        const add = screen.getByRole("button", { name: "Add" });
        fireEvent.click(add);
        fireEvent.click(add);
        await waitFor(() => expect(mockAdd).toHaveBeenCalled());
        await act(async () => { resolve({ id: FERNANDA.id }); });
        await waitFor(() => expect(onAdded).toHaveBeenCalledTimes(1));
        fireEvent.click(add);

        await waitFor(() => expect((add as HTMLButtonElement).disabled).toBe(true));
        expect(mockAdd).toHaveBeenCalledTimes(1);
        expect(onAdded).toHaveBeenCalledTimes(1);
    });
});
