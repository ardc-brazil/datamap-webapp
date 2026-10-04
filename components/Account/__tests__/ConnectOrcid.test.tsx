/**
 * @jest-environment jsdom
 */
import { fireEvent, render, screen } from "@testing-library/react";

const mockSignIn = jest.fn();

jest.mock("next-auth/react", () => ({
    signIn: (...args: unknown[]) => mockSignIn(...args),
}));

import { ConnectOrcid } from "../ConnectOrcid";

describe("ConnectOrcid", () => {
    test("starts an ORCID sign-in that comes back to the profile", () => {
        render(<ul><ConnectOrcid accountEmail="ada@usp.br" /></ul>);

        fireEvent.click(screen.getByRole("button", { name: "Connect ORCID" }));

        expect(mockSignIn).toHaveBeenCalledWith("orcid", { callbackUrl: "/app/profile" });
    });

    test("says which email to confirm so the iD lands on this account", () => {
        render(<ul><ConnectOrcid accountEmail="ada@usp.br" /></ul>);

        expect(screen.getByTestId("connect-orcid").textContent).toContain("ada@usp.br");
    });
});
