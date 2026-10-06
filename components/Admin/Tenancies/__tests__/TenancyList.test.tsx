/** @jest-environment jsdom */
import { describe, expect, jest, test } from "@jest/globals";
import { fireEvent, render, screen } from "@testing-library/react";
import { ADMIN_TENANCIES } from "../../../../fake-data/adminFixtures";
import { TenancyList } from "../TenancyList";

function rowFor(path: string) {
    return screen.getByRole("button", { name: new RegExp(path.replace(/\//g, "\\/")) });
}

describe("TenancyList", () => {
    test("public first, production next, then the legacy group", () => {
        render(<TenancyList tenancies={ADMIN_TENANCIES} selectedPath={null} onSelect={jest.fn()} />);

        const rows = screen.getAllByRole("listitem").map((item) => item.textContent ?? "");
        expect(rows[0]).toContain("datamap/production/public");
        expect(rows[1]).toContain("datamap/production/atto");
        expect(rows[2]).toContain("datamap/production/data-amazon");
        expect(rows[3]).toBe("Legacy · staging");
        expect(rows[4]).toContain("datamap/staging/data-amazon");
        expect(screen.queryByText("production")).toBeNull();
    });

    test("each row shows members and datasets; public is locked, the others open", () => {
        render(<TenancyList tenancies={ADMIN_TENANCIES} selectedPath={null} onSelect={jest.fn()} />);

        const amazon = rowFor("datamap/production/data-amazon");
        expect(amazon.textContent).toContain("14members");
        expect(amazon.textContent).toContain("108datasets");
        expect(amazon.textContent).toContain("chevron_right");
        const publicRow = rowFor("datamap/production/public");
        expect(publicRow.textContent).toContain("lock");
        expect(publicRow.textContent).not.toContain("chevron_right");
    });

    test("a click selects; the selected row is marked", () => {
        const onSelect = jest.fn();
        render(<TenancyList tenancies={ADMIN_TENANCIES} selectedPath="datamap/production/atto" onSelect={onSelect} />);

        expect(rowFor("datamap/production/atto").getAttribute("aria-current")).toBe("true");
        fireEvent.click(rowFor("datamap/production/data-amazon"));
        expect(onSelect).toHaveBeenCalledWith("datamap/production/data-amazon");
    });
});
