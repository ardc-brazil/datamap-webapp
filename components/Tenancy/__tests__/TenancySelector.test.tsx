/** @jest-environment jsdom */
import { beforeEach, describe, expect, jest, test } from '@jest/globals';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';

const update = jest.fn() as any;
const replace = jest.fn() as any;
const push = jest.fn() as any;
const setTenancySelected = jest.fn() as any;
let session: any;
let tenancies: any;
let tenanciesError: any;
let selected = "";
let invitations: any;
const invitationsMutate = jest.fn() as any;
const acceptTenancyInvitation = jest.fn() as any;
const revalidateMyTenancies = jest.fn() as any;

jest.mock("next-auth/react", () => ({ useSession: () => ({ data: session, status: "authenticated", update }) }));
jest.mock("next/router", () => ({
    __esModule: true,
    default: {
        replace: (...args: unknown[]) => replace(...args),
        push: (...args: unknown[]) => push(...args),
        reload: jest.fn(),
    },
}));
jest.mock("../../TenancyStore", () => ({
    useTenancyStore: (selector: (state: unknown) => unknown) => selector({ tenancySelected: selected, setTenancySelected }),
}));
jest.mock("../../../hooks/UseTenancies", () => ({
    useMyTenancies: () => ({ data: tenancies, error: tenanciesError }),
    useLatestTenancyRequest: () => ({ state: null, mutate: jest.fn() }),
    useTenancyInvitations: () => ({ data: invitations, mutate: invitationsMutate }),
    revalidateMyTenancies: () => revalidateMyTenancies(),
}));
jest.mock("../../../gateways/BFFAPI", () => ({ BFFAPI: jest.fn().mockImplementation(() => ({ acceptTenancyInvitation })) }));
jest.mock("swr", () => ({ __esModule: true, default: jest.fn(), mutate: jest.fn() }));
jest.mock("../../../lib/telemetryClient", () => ({ trackUiEvent: jest.fn() }));

import { TenancySelector } from "../TenancySelector";

const PUBLIC = { path: "datamap/production/public", display_name: "Public", is_default: true, is_legacy: false };
const AMAZON = { path: "datamap/production/data-amazon", display_name: "Data Amazon", is_default: false, is_legacy: false };

beforeEach(() => {
    update.mockReset();
    replace.mockReset();
    push.mockReset();
    setTenancySelected.mockReset();
    selected = "";
    tenanciesError = undefined;
    invitations = [];
    invitationsMutate.mockReset();
    acceptTenancyInvitation.mockReset();
    revalidateMyTenancies.mockReset().mockResolvedValue(undefined);
    session = { user: { name: "Fernanda Lima", tenancies: [PUBLIC.path, AMAZON.path] } };
});

describe("TenancySelector", () => {
    test("while the tenancies are loading, nothing is decided yet", () => {
        tenancies = undefined;
        render(<TenancySelector />);

        expect(screen.getByText("Loading your tenancies…")).toBeTruthy();
        expect(setTenancySelected).not.toHaveBeenCalled();
        expect(update).not.toHaveBeenCalled();
    });

    test("a failure to load shows an alert and never redirects", () => {
        tenancies = undefined;
        tenanciesError = { status: 500 };
        render(<TenancySelector />);

        expect(screen.getByRole("alert").textContent).toBe("Your tenancies could not be loaded. Reload the page to try again.");
        expect(replace).not.toHaveBeenCalled();
        expect(setTenancySelected).not.toHaveBeenCalled();
    });

    test("a new array with the same tenancies does not call update() again", () => {
        tenancies = [PUBLIC, AMAZON];
        const { rerender } = render(<TenancySelector />);
        expect(update).not.toHaveBeenCalled();

        tenancies = [PUBLIC, AMAZON];
        rerender(<TenancySelector />);

        expect(update).not.toHaveBeenCalled();
    });

    test("with exactly one tenancy it is selected and the home opens, with no list", async () => {
        tenancies = [PUBLIC];
        session.user.tenancies = [PUBLIC.path];
        render(<TenancySelector />);

        await waitFor(() => expect(replace).toHaveBeenCalledWith("/app/home"));
        expect(setTenancySelected).toHaveBeenCalledWith(PUBLIC.path);
        expect(screen.queryByText("Choose the tenancy you want to work in.")).toBeNull();
    });

    test("with more than one, each tenancy is a row with its name and path, Public with the public icon", () => {
        tenancies = [PUBLIC, AMAZON];
        render(<TenancySelector />);

        expect(screen.getByRole("heading", { name: "Welcome, Fernanda" })).toBeTruthy();
        expect(screen.getByText("Choose the tenancy you want to work in.")).toBeTruthy();
        const publicRow = screen.getByRole("button", { name: /Public/ });
        expect(publicRow.textContent).toContain("datamap / production / public");
        expect(publicRow.querySelector("[data-icon]")?.getAttribute("data-icon")).toBe("public");
        expect(screen.getByRole("button", { name: /Data Amazon/ })).toBeTruthy();
    });

    test("picking a row selects it and opens the home", () => {
        tenancies = [PUBLIC, AMAZON];
        render(<TenancySelector />);

        fireEvent.click(screen.getByRole("button", { name: /Data Amazon/ }));

        expect(setTenancySelected).toHaveBeenCalledWith(AMAZON.path);
        expect(push).toHaveBeenCalledWith("/app/home");
    });

    test("with none, the page says so and offers to request access", () => {
        tenancies = [];
        session.user.tenancies = [];
        render(<TenancySelector />);

        expect(screen.getByText("You're not in any tenancy")).toBeTruthy();
        expect(screen.getByRole("button", { name: "Request access" })).toBeTruthy();
    });

    test("with none, pending invitations are shown above the empty state", () => {
        tenancies = [];
        session.user.tenancies = [];
        invitations = [{ id: "ti1", tenancy: AMAZON, invited_by: { id: "o", name: "Luciana Rizzo" }, datasets: 108, created_at: "2026-10-04T09:50:00+00:00" }];
        render(<TenancySelector />);

        const card = screen.getByText("Luciana Rizzo invited you to Data Amazon");
        const empty = screen.getByText("You're not in any tenancy");
        expect(card.compareDocumentPosition(empty) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    });

    test("with none, accepting an invitation refreshes the session, selects the tenancy and opens the home", async () => {
        tenancies = [];
        session.user.tenancies = [];
        invitations = [{ id: "ti1", tenancy: AMAZON, invited_by: { id: "o", name: "Luciana Rizzo" }, datasets: 108, created_at: "2026-10-04T09:50:00+00:00" }];
        acceptTenancyInvitation.mockResolvedValue({ tenancy: AMAZON });
        update.mockResolvedValue(undefined);
        render(<TenancySelector />);

        fireEvent.click(screen.getByRole("button", { name: "Accept" }));

        await waitFor(() => expect(push).toHaveBeenCalledWith("/app/home"));
        expect(acceptTenancyInvitation).toHaveBeenCalledWith("ti1");
        expect(update).toHaveBeenCalled();
        expect(revalidateMyTenancies).toHaveBeenCalled();
        expect(setTenancySelected).toHaveBeenCalledWith(AMAZON.path);
    });

    test("a session whose tenancies differ from the gatekeeper's is refreshed", () => {
        tenancies = [PUBLIC, AMAZON];
        session.user.tenancies = [PUBLIC.path];
        render(<TenancySelector />);

        expect(update).toHaveBeenCalledTimes(1);
    });

    test("a session that agrees is not refreshed", () => {
        tenancies = [PUBLIC, AMAZON];
        render(<TenancySelector />);

        expect(update).not.toHaveBeenCalled();
    });

    test("a selected tenancy the user no longer has is cleared", () => {
        tenancies = [PUBLIC, AMAZON];
        selected = "datamap/production/cerrado-flux";
        render(<TenancySelector />);

        expect(setTenancySelected).toHaveBeenCalledWith("");
    });

    test("the footer opens the request form", () => {
        tenancies = [PUBLIC, AMAZON];
        render(<TenancySelector />);

        fireEvent.click(screen.getByRole("button", { name: "+ Request access to another tenancy" }));

        expect(screen.getByRole("dialog", { name: "Request access" })).toBeTruthy();
    });
});
