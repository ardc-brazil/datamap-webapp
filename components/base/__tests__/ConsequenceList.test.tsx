/** @jest-environment jsdom */
import { render, screen } from "@testing-library/react";
import { ConsequenceList } from "../ConsequenceList";
import { DialogError } from "../DialogError";

test("each consequence is a list item behind an em dash", () => {
    render(<ConsequenceList items={["DataCite indexes the DOI", "No notification is sent"]} />);

    expect(screen.getAllByRole("listitem").map((item) => item.textContent)).toEqual(["—DataCite indexes the DOI", "—No notification is sent"]);
});

test("a dialog error is an alert, and nothing at all without a message", () => {
    const { container, rerender } = render(<DialogError message={null} />);
    expect(container.innerHTML).toBe("");

    rerender(<DialogError id="add-member-error" message="They are already a member of this tenancy." />);
    const alert = screen.getByRole("alert");
    expect(alert.textContent).toBe("They are already a member of this tenancy.");
    expect(alert.id).toBe("add-member-error");
});
