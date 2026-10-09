/** @jest-environment jsdom */
import { beforeEach, describe, expect, jest, test } from '@jest/globals';
import { fireEvent, render, screen } from '@testing-library/react';

const push = jest.fn() as any;
let session: any;
let mockMembersTenancy: unknown = null;
let mockTenancies: unknown;

jest.mock("next-auth/react", () => ({
    useSession: () => ({ data: session, status: "authenticated" }),
    signOut: jest.fn(),
}));
jest.mock("next/router", () => ({ __esModule: true, default: { push: (...args: unknown[]) => push(...args) } }));
jest.mock("../../TenancyStore", () => ({
    useTenancyStore: (selector: (state: unknown) => unknown) => selector({ tenancySelected: "datamap/production/public" }),
}));
jest.mock("../../../hooks/UseWorkspace", () => ({
    useMembersPageTenancy: () => ({ tenancy: mockMembersTenancy, loading: false }),
}));
jest.mock("../../../hooks/UseTenancies", () => ({
    useMyTenancies: () => ({ data: mockTenancies }),
}));
jest.mock("../../../gateways/BFFAPI", () => ({ BFFAPI: jest.fn().mockImplementation(() => ({})) }));
jest.mock("swr", () => ({ __esModule: true, default: jest.fn(), mutate: jest.fn() }));

import AvatarButton from "../AvatarButton";

const PUBLIC = { path: "datamap/production/public", display_name: "Public", is_default: true, is_legacy: false };
const AMAZON = { path: "datamap/production/data-amazon", display_name: "Data Amazon", is_default: false, is_legacy: false };

function openMenu() {
    fireEvent.click(screen.getByRole("button", { name: "Account menu" }));
}

beforeEach(() => {
    push.mockReset();
    session = { user: { name: "Fernanda Lima", email: "fernanda@inpe.br", image: null, tenancies: ["datamap/production/public"] } };
    mockMembersTenancy = null;
    mockTenancies = [PUBLIC];
});

describe("AvatarButton", () => {
    test("with one tenancy there is nothing to switch to, and access can be requested", () => {
        render(<AvatarButton />);
        openMenu();

        expect(screen.queryByRole("menuitem", { name: /Switch tenancy/ })).toBeNull();
        expect(screen.getByRole("menuitem", { name: /Request access to a tenancy/ })).toBeTruthy();
    });

    test("Guia do usuário opens the manual", () => {
        render(<AvatarButton />);
        openMenu();

        fireEvent.click(screen.getByRole("menuitem", { name: /Guia do usuário/ }));

        expect(push).toHaveBeenCalledWith("/manual");
    });

    test("with more than one, Switch tenancy opens the selector", () => {
        mockTenancies = [PUBLIC, AMAZON];
        render(<AvatarButton />);
        openMenu();

        fireEvent.click(screen.getByRole("menuitem", { name: /Switch tenancy/ }));

        expect(push).toHaveBeenCalledWith("/app/tenancy");
    });

    test("the count comes from the user's enabled tenancies, not the session", () => {
        session.user.tenancies = [PUBLIC.path, AMAZON.path];
        mockTenancies = [PUBLIC];
        render(<AvatarButton />);
        openMenu();

        expect(screen.queryByRole("menuitem", { name: /Switch tenancy/ })).toBeNull();
    });

    test("while the tenancies load there is no Switch tenancy", () => {
        session.user.tenancies = [PUBLIC.path, AMAZON.path];
        mockTenancies = undefined;
        render(<AvatarButton />);
        openMenu();

        expect(screen.queryByRole("menuitem", { name: /Switch tenancy/ })).toBeNull();
    });

    test("Request access to a tenancy opens the form", () => {
        render(<AvatarButton />);
        openMenu();

        fireEvent.click(screen.getByRole("menuitem", { name: /Request access to a tenancy/ }));

        expect(screen.getByRole("dialog", { name: "Request access" })).toBeTruthy();
    });

    test("a tenancy open to members gets a Members item", () => {
        mockMembersTenancy = { path: "datamap/production/data-amazon", display_name: "Data Amazon", is_default: false, is_legacy: false };
        render(<AvatarButton />);
        openMenu();

        expect(screen.getByRole("menuitem", { name: /Members/ })).toBeTruthy();
    });

    test("Public, legacy, or no tenancy at all has no Members item", () => {
        render(<AvatarButton />);
        openMenu();

        expect(screen.queryByRole("menuitem", { name: /Members/ })).toBeNull();
    });

    test("Members pushes the Members page", () => {
        mockMembersTenancy = { path: "datamap/production/data-amazon", display_name: "Data Amazon", is_default: false, is_legacy: false };
        render(<AvatarButton />);
        openMenu();

        fireEvent.click(screen.getByRole("menuitem", { name: /Members/ }));

        expect(push).toHaveBeenCalledWith("/app/members");
    });
});
