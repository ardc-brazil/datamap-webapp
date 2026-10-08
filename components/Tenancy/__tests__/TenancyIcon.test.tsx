/** @jest-environment jsdom */
import { describe, expect, test } from '@jest/globals';
import { render } from '@testing-library/react';
import { TenancyIcon } from "../TenancyIcon";

describe("TenancyIcon", () => {
    test("the default tenancy shows the public icon", () => {
        const { container } = render(<TenancyIcon tenancy={{ is_default: true }} />);

        expect(container.querySelector("[data-icon]")?.getAttribute("data-icon")).toBe("public");
        expect(container.textContent).toBe("public");
    });

    test("any other tenancy, or none given, shows the tenancy icon", () => {
        const { container } = render(<><TenancyIcon tenancy={{ is_default: false }} /><TenancyIcon /></>);

        const icons = Array.from(container.querySelectorAll("[data-icon]")).map((icon) => icon.getAttribute("data-icon"));
        expect(icons).toEqual(["tenancy", "tenancy"]);
    });

    test("a pending tenancy has a dashed outline", () => {
        const { container } = render(<TenancyIcon pending />);

        const icon = container.querySelector("[data-icon]") as HTMLElement;
        expect(icon.getAttribute("data-pending")).toBe("true");
        expect(icon.className).toContain("border-dashed");
    });
});
