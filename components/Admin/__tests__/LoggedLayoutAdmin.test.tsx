/** @jest-environment jsdom */
import { render, screen } from "@testing-library/react";

jest.mock("next/head", () => ({ __esModule: true, default: () => null }));
jest.mock("next/router", () => ({
    __esModule: true,
    default: { replace: jest.fn() },
    useRouter: () => ({ pathname: "/app/admin/requests" }),
}));
jest.mock("next-auth/react", () => ({ useSession: () => ({ data: { user: { name: "Caio Maia", admin: true } } }) }));
jest.mock("../../TenancyStore", () => ({
    useTenancyStore: (selector: (state: unknown) => unknown) => selector({
        isTenancySelected: () => true,
        tenancySelected: "datamap/production/public",
    }),
}));
jest.mock("../../Profile/AvatarButton", () => ({ __esModule: true, default: () => null }));
jest.mock("../../../hooks/UseAdmin", () => ({ useAdminCounts: () => ({ data: { open: 4, join: 2, new: 2, closed: 31 } }) }));
jest.mock("../../../hooks/UseWorkspace", () => ({ useMembersPageTenancy: () => ({ tenancy: null, loading: false }) }));

import LoggedLayout from "../../LoggedLayout";

test("an admin page reads All tenancies in the footer and puts its tabs in the header", () => {
    render(<LoggedLayout tenancyOptional scopeLabel="All tenancies" headerContent={<nav>admin tabs</nav>}><p>page</p></LoggedLayout>);

    expect(screen.getByText("All tenancies")).toBeTruthy();
    expect(screen.queryByText("datamap / production / public")).toBeNull();
    expect(screen.getByText("admin tabs")).toBeTruthy();
});

test("any other page keeps the selected tenancy, and an admin sees the Admin entry", () => {
    render(<LoggedLayout><p>page</p></LoggedLayout>);

    expect(screen.getByText("datamap / production / public")).toBeTruthy();
    expect(screen.getByRole("link", { name: /Admin/ })).toBeTruthy();
    expect(screen.getByLabelText("4 open requests")).toBeTruthy();
});
