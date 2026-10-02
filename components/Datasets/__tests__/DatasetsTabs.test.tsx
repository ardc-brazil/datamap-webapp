/** @jest-environment jsdom */
import { describe, expect, test } from '@jest/globals';
import { render, screen } from '@testing-library/react';
import { DatasetsTabs } from "../DatasetsTabs";

describe("DatasetsTabs", () => {
    test("the workspace tab and Shared with me, each with its count", () => {
        render(<DatasetsTabs active="tenancy" tenancyName="Data Amazon" tenancyCount={108} sharedCount={2} />);

        expect(screen.getByRole("link", { name: "Data Amazon 108" }).getAttribute("aria-current")).toBe("page");
        expect(screen.getByRole("link", { name: "Shared with me 2" }).getAttribute("href")).toBe("/app/datasets/shared");
    });

    test("an account with no tenancy has only Shared with me", () => {
        render(<DatasetsTabs active="shared" tenancyName={null} sharedCount={2} />);

        expect(screen.queryByRole("link", { name: /Data Amazon/ })).toBeNull();
        expect(screen.getByRole("link", { name: "Shared with me 2" }).getAttribute("aria-current")).toBe("page");
    });
});
