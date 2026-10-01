/** @jest-environment jsdom */
import { describe, expect, jest, test } from '@jest/globals';
import { fireEvent, render, screen } from '@testing-library/react';

import DatasetVersionHandler from "../DatasetVersionHandler";

const dataset: any = { id: "d1", current_version: { id: "v1", name: "2" } };
const version: any = { id: "v1", name: "2", created_at: "2026-09-01T00:00:00+00:00", updated_at: "2026-09-01T00:00:00+00:00" };

function open() {
    fireEvent.click(screen.getByRole("button", { name: /Version 2/ }));
}

describe("DatasetVersionHandler", () => {
    test("a read collaborator sees no New version control in the version history", () => {
        render(
            <DatasetVersionHandler
                dataset={dataset}
                datasetVersion={version}
                availableVersions={[version]}
                onNewVersionClick={jest.fn()}
                canEdit={false}
            />
        );
        open();

        expect(screen.queryByRole("button", { name: /New version/ })).toBeNull();
    });

    test("someone who can edit sees the New version control", () => {
        render(
            <DatasetVersionHandler
                dataset={dataset}
                datasetVersion={version}
                availableVersions={[version]}
                onNewVersionClick={jest.fn()}
                canEdit={true}
            />
        );
        open();

        expect(screen.getByRole("button", { name: /New version/ })).toBeTruthy();
    });
});
