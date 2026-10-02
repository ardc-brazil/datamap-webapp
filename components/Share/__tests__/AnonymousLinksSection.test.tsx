/** @jest-environment jsdom */
import { beforeEach, describe, expect, jest, test } from '@jest/globals';
import { fireEvent, render, screen } from '@testing-library/react';
import { AnonymousLinksSection } from "../AnonymousLinksSection";

const links: any = [
    { id: "r1", label: "JGR Atmospheres, round 1", token_hint: "9f2c…a71e", created_at: "2026-09-14T10:00:00+00:00", revoked_at: null, views: { count: 12, first_at: "2026-09-16T10:00:00+00:00", last_at: "2026-09-30T10:00:00+00:00" } },
    { id: "r2", label: "AGU Fall Meeting abstract", token_hint: "b04d…c3e8", created_at: "2026-09-26T10:00:00+00:00", revoked_at: null, views: { count: 0, first_at: null, last_at: null } },
    { id: "r3", label: "Old", token_hint: null, created_at: "2026-09-01T10:00:00+00:00", revoked_at: "2026-09-02T10:00:00+00:00", views: { count: 1, first_at: null, last_at: null } },
];

beforeEach(() => {
    jest.useFakeTimers({ now: new Date("2026-10-01T10:00:00Z") });
});

describe("AnonymousLinksSection", () => {
    test("each link shows its label, a hint of its URL, its use and its views", () => {
        render(<AnonymousLinksSection links={links} onNew={jest.fn()} onRevoke={jest.fn()} />);

        expect(screen.getByText("JGR Atmospheres, round 1")).toBeTruthy();
        expect(screen.getByText("/anonymous/9f2c…a71e")).toBeTruthy();
        expect(screen.getByText("Created Sep 14 · first opened Sep 16 · last opened yesterday")).toBeTruthy();
        expect(screen.getByText("Created Sep 26 · not opened yet")).toBeTruthy();
        expect(screen.getByLabelText("12 views")).toBeTruthy();
        expect(screen.queryByText("Old")).toBeNull();
    });

    test("states what an anonymous link is", () => {
        render(<AnonymousLinksSection links={[]} onNew={jest.fn()} onRevoke={jest.fn()} />);

        expect(screen.getByText("Metadata only, authors redacted · anyone with the link, no account · works until the dataset is published · the full URL is shown once, at creation")).toBeTruthy();
    });

    test("new and revoke", () => {
        const onNew = jest.fn();
        const onRevoke = jest.fn();
        render(<AnonymousLinksSection links={links} onNew={onNew} onRevoke={onRevoke} />);

        fireEvent.click(screen.getByRole("button", { name: "New anonymous link" }));
        fireEvent.click(screen.getByRole("button", { name: "Revoke JGR Atmospheres, round 1" }));

        expect(onNew).toHaveBeenCalled();
        expect(onRevoke).toHaveBeenCalledWith("r1");
    });
});
