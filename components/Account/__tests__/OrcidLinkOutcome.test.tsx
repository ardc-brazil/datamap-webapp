/**
 * @jest-environment jsdom
 */
import { render, screen } from "@testing-library/react";
import { OrcidLinkOutcome } from "../OrcidLinkOutcome";

describe("OrcidLinkOutcome", () => {
    test("an iD that belongs to another account is an alert", () => {
        render(<OrcidLinkOutcome outcome="already_linked" />);

        expect(screen.getByRole("alert").textContent).toBe("This ORCID iD is already linked to another DataMap account.");
    });

    test("a connected iD is a status", () => {
        render(<OrcidLinkOutcome outcome="connected" />);

        expect(screen.getByRole("status").textContent).toBe("Your ORCID iD is connected.");
    });

    test("an unavailable gatekeeper is an alert", () => {
        render(<OrcidLinkOutcome outcome="unavailable" />);

        expect(screen.getByRole("alert").textContent).toBe("ORCID could not be connected. Try again.");
    });

    test.each([undefined, "", "toString", "<b>x</b>", ["connected", "connected"]])("anything else (%p) shows nothing", (outcome) => {
        const { container } = render(<OrcidLinkOutcome outcome={outcome as any} />);

        expect(container.innerHTML).toBe("");
    });
});
