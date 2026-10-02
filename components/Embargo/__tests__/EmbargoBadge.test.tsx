/** @jest-environment jsdom */
import { describe, expect, test } from '@jest/globals';
import { render, screen } from '@testing-library/react';
import { EmbargoBadge } from "../EmbargoBadge";

const active = { until: "2026-12-15T23:59:59+00:00", active: true, metadata_visible: false, note: null };

describe("EmbargoBadge", () => {
    test("on the dataset page it carries the full date", () => {
        render(<EmbargoBadge embargo={active} />);

        expect(screen.getByTestId("embargo-badge").textContent).toContain("Embargoed until Dec 15, 2026");
    });

    test("in a list it drops the year", () => {
        render(<EmbargoBadge embargo={active} compact />);

        expect(screen.getByTestId("embargo-badge").textContent).toContain("Embargoed until Dec 15");
        expect(screen.getByTestId("embargo-badge").textContent).not.toContain("2026");
    });

    test("it is amber, the colour that means under embargo", () => {
        render(<EmbargoBadge embargo={active} />);

        expect(screen.getByTestId("embargo-badge").className).toContain("bg-embargo-100");
        expect(screen.getByTestId("embargo-badge").className).toContain("text-embargo-800");
    });

    test("nothing once the embargo is over, or without one", () => {
        const { rerender } = render(<EmbargoBadge embargo={{ ...active, active: false }} />);
        expect(screen.queryByTestId("embargo-badge")).toBeNull();

        rerender(<EmbargoBadge embargo={null} />);
        expect(screen.queryByTestId("embargo-badge")).toBeNull();
    });
});
