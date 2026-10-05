/**
 * @jest-environment jsdom
 */
import { fireEvent, render, screen, waitFor } from "@testing-library/react";

const mockSignIn = jest.fn();
const mockGetProviders = jest.fn();

jest.mock("next-auth/react", () => ({
    signIn: (...args: unknown[]) => mockSignIn(...args),
    getProviders: () => mockGetProviders(),
}));

import { DevOrcidMockForm } from "../DevOrcidMockForm";

const ORCID = "0000-0001-2345-6789";
const ORCID_PROVIDER = { id: "orcid", name: "Orcid" };
const PASSWORD = { id: "credentials", name: "Email and password" };
const MOCK = { id: "orcid-dev", name: "ORCID (development mock)" };

async function renderRegistered(callbackUrl = "/app/home") {
    render(<DevOrcidMockForm callbackUrl={callbackUrl} />);
    return screen.findByLabelText("ORCID iD");
}

beforeEach(() => {
    mockSignIn.mockResolvedValue(undefined);
    mockGetProviders.mockResolvedValue({ orcid: ORCID_PROVIDER, credentials: PASSWORD, "orcid-dev": MOCK });
});

describe("DevOrcidMockForm", () => {
    test.each`
        case                         | providers
        ${"not registered"}          | ${{ orcid: ORCID_PROVIDER, credentials: PASSWORD }}
        ${"providers not readable"}  | ${null}
    `("shows nothing when the mock is $case", async ({ providers }) => {
        mockGetProviders.mockResolvedValue(providers);

        const { container } = render(<DevOrcidMockForm callbackUrl="/app/home" />);

        await waitFor(() => expect(mockGetProviders).toHaveBeenCalled());
        expect(container.innerHTML).toBe("");
    });

    test("shows nothing when the providers request fails", async () => {
        mockGetProviders.mockRejectedValue(new Error("offline"));

        const { container } = render(<DevOrcidMockForm callbackUrl="/app/home" />);

        await waitFor(() => expect(mockGetProviders).toHaveBeenCalled());
        expect(container.innerHTML).toBe("");
    });

    test("says it is a development-only mock", async () => {
        await renderRegistered();

        expect(screen.getByTestId("dev-orcid-mock").textContent).toContain("ORCID (development mock)");
        expect(screen.getByTestId("dev-orcid-mock").textContent).toContain("Development only");
    });

    test("signs in through the mock as the typed iD, with the name and public email", async () => {
        fireEvent.change(await renderRegistered("/app/datasets/d1"), { target: { value: ` ${ORCID} ` } });
        fireEvent.change(screen.getByLabelText("Name (optional)"), { target: { value: " Ada Lovelace " } });
        fireEvent.change(screen.getByLabelText("Public email (optional)"), { target: { value: "ada.public@example.org" } });
        fireEvent.click(screen.getByRole("button", { name: "Sign in as this iD" }));

        await waitFor(() => expect(mockSignIn).toHaveBeenCalledWith("orcid-dev", {
            orcid: ORCID,
            name: "Ada Lovelace",
            email: "ada.public@example.org",
            callbackUrl: "/app/datasets/d1",
        }));
    });

    test("the name and the public email may be left empty", async () => {
        fireEvent.change(await renderRegistered(), { target: { value: ORCID } });
        fireEvent.click(screen.getByRole("button", { name: "Sign in as this iD" }));

        await waitFor(() => expect(mockSignIn).toHaveBeenCalledWith("orcid-dev", {
            orcid: ORCID, name: "", email: "", callbackUrl: "/app/home",
        }));
    });

    test.each`
        orcid                    | message
        ${""}                    | ${"Enter an ORCID iD."}
        ${"0000-0001-2345-678"}  | ${"Use the form 0000-0000-0000-0000 (the last character may be X)."}
        ${"0000000123456789"}    | ${"Use the form 0000-0000-0000-0000 (the last character may be X)."}
    `("refuses the iD \"$orcid\"", async ({ orcid, message }) => {
        fireEvent.change(await renderRegistered(), { target: { value: orcid } });
        fireEvent.click(screen.getByRole("button", { name: "Sign in as this iD" }));

        expect(await screen.findByText(message)).toBeTruthy();
        expect(mockSignIn).not.toHaveBeenCalled();
    });

    test("refuses a public email that is not an email", async () => {
        fireEvent.change(await renderRegistered(), { target: { value: ORCID } });
        fireEvent.change(screen.getByLabelText("Public email (optional)"), { target: { value: "not-an-email" } });
        fireEvent.click(screen.getByRole("button", { name: "Sign in as this iD" }));

        expect(await screen.findByText("Enter a valid email address.")).toBeTruthy();
        expect(mockSignIn).not.toHaveBeenCalled();
    });
});
