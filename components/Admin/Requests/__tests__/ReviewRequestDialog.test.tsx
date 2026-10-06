/** @jest-environment jsdom */
import { describe, expect, jest, test, beforeEach } from "@jest/globals";
import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";

const mockApprove = jest.fn() as any;
let mockDetail: { data?: unknown, error?: unknown } = {};
let mockTenancies: unknown[] = [];

jest.mock("../../../../gateways/BFFAPI", () => ({
    BFFAPI: jest.fn().mockImplementation(() => ({ approveTenancyRequest: mockApprove })),
}));
jest.mock("../../../../hooks/UseAdmin", () => ({
    useAdminRequest: () => mockDetail,
    useAdminTenancies: () => ({ data: mockTenancies }),
}));

import { ADMIN_TENANCIES, ATTO, DATA_AMAZON, PUBLIC_TENANCY, adminRequestDetail, adminTenancy, newTenancyRequest } from "../../../../fake-data/adminFixtures";
import { ReviewRequestDialog } from "../ReviewRequestDialog";

const NOW = new Date("2026-10-04T12:00:00Z");
const REQUEST_ID = "7a9b5d5e-fa6d-4c18-9a51-2b1e2c3d4e5f";

function renderDialog() {
    const onClose = jest.fn();
    const onApproved = jest.fn();
    const onDecline = jest.fn();
    render(<ReviewRequestDialog requestId={REQUEST_ID} now={NOW} onClose={onClose} onApproved={onApproved} onDecline={onDecline} />);
    return { onClose, onApproved, onDecline };
}

function newRequestDetail(verified: boolean, requestedName?: string) {
    const request = newTenancyRequest(requestedName ? { requested_name: requestedName } : {});
    return adminRequestDetail({ ...request, requester: { ...request.requester, email_verified: verified }, suggested_tenancy_members: null });
}

beforeEach(() => {
    mockDetail = { data: adminRequestDetail() };
    mockTenancies = ADMIN_TENANCIES;
});

describe("ReviewRequestDialog", () => {
    test("says the request is loading", () => {
        mockDetail = {};

        renderDialog();

        expect(screen.getByText("Loading request…")).toBeTruthy();
        expect(screen.queryByRole("button", { name: "Approve" })).toBeNull();
    });

    test("says when the request no longer exists", () => {
        mockDetail = { error: { status: 404, detail: "request_not_found" } };

        renderDialog();

        expect(screen.getByText("This request no longer exists.")).toBeTruthy();
    });

    test("a join opens on the suggested tenancy", () => {
        renderDialog();

        expect(screen.getByRole("dialog", { name: "Join Data Amazon" })).toBeTruthy();
        expect(screen.getByText("Fernanda Lima · fernanda.lima@inpe.br · requested 6 days ago")).toBeTruthy();
        expect((screen.getByLabelText("Tenancy") as HTMLSelectElement).value).toBe(DATA_AMAZON.path);
        expect(screen.getByText("datamap/production/data-amazon · 14 members")).toBeTruthy();
        expect(screen.getByText("“Postdoc in Luciana Rizzo's group, GoAmazon SMPS data”")).toBeTruthy();
        expect(screen.getByText(PUBLIC_TENANCY.path)).toBeTruthy();
        expect(screen.getByText("Fernanda is emailed either way.")).toBeTruthy();
        expect(screen.getByRole("button", { name: "Join existing" }).getAttribute("aria-pressed")).toBe("true");
    });

    test("the picker offers only production tenancies the requester can join", () => {
        renderDialog();

        const options = Array.from((screen.getByLabelText("Tenancy") as HTMLSelectElement).options).map((option) => option.value);
        expect(options).toEqual(["", ATTO.path, DATA_AMAZON.path]);
    });

    test("a disabled tenancy is not offered", () => {
        mockTenancies = [...ADMIN_TENANCIES, adminTenancy({ path: "datamap/production/old-campaign", display_name: "Old campaign", is_enabled: false })];

        renderDialog();

        const options = Array.from((screen.getByLabelText("Tenancy") as HTMLSelectElement).options).map((option) => option.value);
        expect(options).toEqual(["", ATTO.path, DATA_AMAZON.path]);
    });

    test("approving a join sends the chosen tenancy", async () => {
        mockApprove.mockResolvedValue({});
        const { onApproved } = renderDialog();

        fireEvent.change(screen.getByLabelText("Tenancy"), { target: { value: ATTO.path } });
        expect(screen.getByRole("dialog", { name: "Join ATTO" })).toBeTruthy();
        fireEvent.click(screen.getByRole("button", { name: "Approve" }));

        await waitFor(() => expect(onApproved).toHaveBeenCalled());
        expect(mockApprove).toHaveBeenCalledWith(REQUEST_ID, { tenancy: ATTO.path });
    });

    test("a double click approves only once, during the call and after it", async () => {
        let resolve: (value: unknown) => void = () => undefined;
        mockApprove.mockImplementation(() => new Promise((r) => { resolve = r; }));
        const { onApproved } = renderDialog();

        const approve = screen.getByRole("button", { name: "Approve" });
        fireEvent.click(approve);
        fireEvent.click(approve);
        await waitFor(() => expect(mockApprove).toHaveBeenCalled());
        await act(async () => { resolve({}); });
        await waitFor(() => expect(onApproved).toHaveBeenCalledTimes(1));
        fireEvent.click(approve);

        await waitFor(() => expect((approve as HTMLButtonElement).disabled).toBe(true));
        expect(mockApprove).toHaveBeenCalledTimes(1);
        expect(onApproved).toHaveBeenCalledTimes(1);
    });

    test("a new-tenancy request opens on New tenancy, prefilled, and creates it", async () => {
        mockDetail = { data: newRequestDetail(true) };
        mockApprove.mockResolvedValue({});
        const { onApproved } = renderDialog();

        expect(screen.getByRole("dialog", { name: "New tenancy: Cerrado Flux" })).toBeTruthy();
        expect(screen.getByText("Kenji Tanaka · k.tanaka@nagoya-u.ac.jp · requested yesterday")).toBeTruthy();
        expect((screen.getByLabelText("Display name") as HTMLInputElement).value).toBe("Cerrado Flux");
        expect((screen.getByLabelText("Namespace") as HTMLInputElement).value).toBe("cerrado-flux");
        expect(screen.getByText("datamap/production/cerrado-flux · requester becomes a member")).toBeTruthy();

        fireEvent.click(screen.getByRole("button", { name: "Create and approve" }));

        await waitFor(() => expect(onApproved).toHaveBeenCalled());
        expect(mockApprove).toHaveBeenCalledWith("8b0c6e6f-0b7e-4d29-8b62-3c2f3d4e5f60", { newTenancy: { displayName: "Cerrado Flux", namespace: "cerrado-flux" } });
    });

    test("the suggested namespace drops accents", () => {
        mockDetail = { data: newRequestDetail(true, "João Ciência") };

        renderDialog();

        expect((screen.getByLabelText("Namespace") as HTMLInputElement).value).toBe("joao-ciencia");
        expect(screen.getByText("datamap/production/joao-ciencia · requester becomes a member")).toBeTruthy();
    });

    test("an unverified requester cannot get a new tenancy", () => {
        mockDetail = { data: newRequestDetail(false) };

        renderDialog();

        expect(screen.getByText("Email not verified. A new tenancy can't be created for an unverified account.")).toBeTruthy();
        expect((screen.getByRole("button", { name: "Create and approve" }) as HTMLButtonElement).disabled).toBe(true);
    });

    test("an invalid namespace is caught before the server", async () => {
        mockDetail = { data: newRequestDetail(true) };
        renderDialog();

        fireEvent.change(screen.getByLabelText("Namespace"), { target: { value: "public" } });
        fireEvent.click(screen.getByRole("button", { name: "Create and approve" }));

        expect(await screen.findByText("Use 2 to 63 lower-case letters, digits or hyphens, and not “public”.")).toBeTruthy();
        expect(mockApprove).not.toHaveBeenCalled();
    });

    test("spaces around the namespace are not sent", async () => {
        mockDetail = { data: newRequestDetail(true) };
        mockApprove.mockResolvedValue({});
        const { onApproved } = renderDialog();

        fireEvent.change(screen.getByLabelText("Namespace"), { target: { value: " cerrado " } });
        fireEvent.click(screen.getByRole("button", { name: "Create and approve" }));

        await waitFor(() => expect(onApproved).toHaveBeenCalled());
        expect(mockApprove).toHaveBeenCalledWith("8b0c6e6f-0b7e-4d29-8b62-3c2f3d4e5f60", { newTenancy: { displayName: "Cerrado Flux", namespace: "cerrado" } });
    });

    test("a refusal from the server is shown in the dialog", async () => {
        mockDetail = { data: newRequestDetail(true) };
        mockApprove.mockRejectedValue({ response: { status: 409, data: { detail: "display_name_taken" } } });
        const { onApproved } = renderDialog();

        fireEvent.click(screen.getByRole("button", { name: "Create and approve" }));

        expect(await screen.findByText("Another tenancy already has this display name.")).toBeTruthy();
        expect(onApproved).not.toHaveBeenCalled();
    });

    test("a namespace the server refuses is explained", async () => {
        mockDetail = { data: newRequestDetail(true) };
        mockApprove.mockRejectedValue({ response: { status: 409, data: { detail: "tenancy_exists" } } });
        renderDialog();

        fireEvent.click(screen.getByRole("button", { name: "Create and approve" }));

        expect(await screen.findByText("A tenancy with this namespace already exists.")).toBeTruthy();
        expect((screen.getByRole("button", { name: "Create and approve" }) as HTMLButtonElement).disabled).toBe(false);
    });

    test("an account that is gone cannot be approved, and Decline… stays", async () => {
        mockApprove.mockRejectedValue({ response: { status: 404, data: { detail: "no_account" } } });
        const { onApproved, onDecline } = renderDialog();

        fireEvent.click(screen.getByRole("button", { name: "Approve" }));

        expect(await screen.findByText("This account is disabled or no longer exists, so it cannot be approved. Decline the request instead.")).toBeTruthy();
        expect((screen.getByRole("button", { name: "Approve" }) as HTMLButtonElement).disabled).toBe(true);
        expect(onApproved).not.toHaveBeenCalled();
        fireEvent.click(screen.getByRole("button", { name: "Decline…" }));
        expect(onDecline).toHaveBeenCalledWith(expect.objectContaining({ id: REQUEST_ID }));
    });

    test("Decline… hands the request to the decline prompt", () => {
        const { onDecline } = renderDialog();

        fireEvent.click(screen.getByRole("button", { name: "Decline…" }));

        expect(onDecline).toHaveBeenCalledWith(expect.objectContaining({ id: REQUEST_ID }));
    });

    test("a request decided elsewhere says so and cannot be approved again", () => {
        mockDetail = { data: adminRequestDetail({ status: "declined", decided_by: { id: "a1", name: "André Maia" }, decided_at: "2026-10-01T10:00:00+00:00" }) };

        renderDialog();

        expect(screen.getByText("This request was already declined by André Maia on Oct 1, 2026.")).toBeTruthy();
        expect(screen.queryByRole("button", { name: "Approve" })).toBeNull();
    });

    test("someone already in every tenancy has nothing to join", () => {
        mockDetail = { data: adminRequestDetail({ requester_tenancies: [PUBLIC_TENANCY, ATTO, DATA_AMAZON] }) };

        renderDialog();

        expect(screen.getByText("This account is already in every tenancy it could join.")).toBeTruthy();
        expect((screen.getByRole("button", { name: "Approve" }) as HTMLButtonElement).disabled).toBe(true);
    });
});
