/** @jest-environment jsdom */
import { describe, expect, jest, test } from '@jest/globals';
import { render, screen } from '@testing-library/react';

jest.mock("next-auth/react", () => ({ useSession: () => ({ data: null, status: "authenticated" }) }));
jest.mock("next/router", () => ({ __esModule: true, default: { push: jest.fn(), replace: jest.fn() } }));
jest.mock("../../../gateways/BFFAPI", () => ({ BFFAPI: jest.fn().mockImplementation(() => ({})) }));

import DatasetCitation from "../DatasetCitation";

const user: any = { roles: ["datasets_write"] };
const access = (canEdit: boolean): any => ({
    level: canEdit ? "write" : "read", can_edit: canEdit, can_share: false,
    can_manage_embargo: false, can_extend_embargo: false, can_delete: false,
});
const draftDoi: any = { identifier: "10.82763/dm.2026.001", mode: "AUTO", state: "DRAFT" };

function dataset(canEdit: boolean, doi: any = null): any {
    const version = { id: "v1", name: "1", doi };
    return { id: "d1", tenancy: "datamap/production/data-amazon", versions: [version], current_version: version, access: access(canEdit) };
}

describe("DatasetCitation DOI controls", () => {
    test("someone who can edit is offered to register a DOI", () => {
        render(<DatasetCitation dataset={dataset(true)} user={user} selectedVersionName="1" />);

        expect(screen.getByRole("button", { name: "Register manual DOI" })).toBeTruthy();
        expect(screen.getByRole("button", { name: "Generate DOI automatically" })).toBeTruthy();
    });

    test("a reader sees no DOI controls when there is no DOI", () => {
        render(<DatasetCitation dataset={dataset(false)} user={user} selectedVersionName="1" />);

        expect(screen.queryByRole("button", { name: "Register manual DOI" })).toBeNull();
        expect(screen.queryByRole("button", { name: "Generate DOI automatically" })).toBeNull();
        expect(screen.getByText("This dataset does not have a registered DOI.")).toBeTruthy();
    });

    test("a reader sees the DOI but cannot move or delete it", () => {
        const { container } = render(<DatasetCitation dataset={dataset(false, draftDoi)} user={user} selectedVersionName="1" />);

        expect(screen.getByText("https://doi.org/10.82763/dm.2026.001")).toBeTruthy();
        expect(container.querySelector('[data-testid="doi-status-navigator"]')).toBeNull();
        expect(screen.queryAllByRole("button")).toHaveLength(0);
    });

    test("an editor keeps the state navigation and the delete menu", () => {
        const { container } = render(<DatasetCitation dataset={dataset(true, draftDoi)} user={user} selectedVersionName="1" />);

        expect(container.querySelector('[data-testid="doi-status-navigator"]')).not.toBeNull();
        expect(screen.queryAllByRole("button").length).toBeGreaterThan(0);
    });
});
