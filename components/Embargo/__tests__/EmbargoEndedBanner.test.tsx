/** @jest-environment jsdom */
import { describe, expect, jest, test } from '@jest/globals';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';

const navigateDOIStatus = jest.fn() as any;
const reload = jest.fn();
jest.mock("next/router", () => ({ useRouter: () => ({ reload }) }));
jest.mock("../../../gateways/BFFAPI", () => ({ BFFAPI: jest.fn().mockImplementation(() => ({ navigateDOIStatus })) }));

import { EmbargoEndedBanner } from "../EmbargoEndedBanner";

const dataset: any = {
    id: "d1",
    tenancy: "datamap/production/data-amazon",
    embargo: { until: "2026-12-15T23:59:59+00:00", active: false, metadata_visible: false, note: null },
    current_version: { name: "2", doi: { identifier: "10.5281/datamap.3f9c1e", state: "REGISTERED" } },
};

describe("EmbargoEndedBanner", () => {
    test("the checklist the owner cannot miss", () => {
        render(<EmbargoEndedBanner dataset={dataset} />);

        const banner = screen.getByRole("status");
        expect(banner.textContent).toContain("The embargo ended on Dec 15. One step left to publish.");
        expect(banner.textContent).toContain("Files are available to every member of Data Amazon.");
        expect(banner.textContent).toContain("registered but not findable");
        expect(banner.textContent).toContain("Shown until you do");
    });

    test("making the DOI findable asks first, then promotes it", async () => {
        navigateDOIStatus.mockResolvedValue({});
        render(<EmbargoEndedBanner dataset={dataset} />);

        fireEvent.click(screen.getByRole("button", { name: "Make DOI findable" }));
        fireEvent.click(screen.getByRole("button", { name: "Make it findable" }));

        await waitFor(() => expect(navigateDOIStatus).toHaveBeenCalledWith({ datasetId: "d1", versionName: "2", state: "FINDABLE" }));
    });

    test("a DOI still in draft is to be finished, not created", () => {
        render(<EmbargoEndedBanner dataset={{ ...dataset, current_version: { name: "2", doi: { identifier: "10.5281/datamap.3f9c1e", state: "DRAFT" } } }} />);

        const banner = screen.getByRole("status");
        expect(banner.textContent).toContain("Finish registering the DOI");
        expect(banner.textContent).not.toContain("no DOI to promote");
        expect(screen.queryByRole("button", { name: "Make DOI findable" })).toBeNull();
    });

    test("without a DOI, one is to be created first", () => {
        render(<EmbargoEndedBanner dataset={{ ...dataset, current_version: { name: "2", doi: null } }} />);

        expect(screen.getByRole("status").textContent).toContain("The dataset has no DOI to promote");
    });

    test("it says what members got back, by default read and edit", () => {
        render(<EmbargoEndedBanner dataset={dataset} />);

        expect(screen.getByRole("status").textContent)
            .toContain("Members of Data Amazon can read and edit this dataset again; the people you shared it with keep their access.");
    });

    test("with members read-only, editing stays with the people shared with", () => {
        render(<EmbargoEndedBanner dataset={{ ...dataset, members_can_edit: false }} />);

        const banner = screen.getByRole("status");
        expect(banner.textContent)
            .toContain("Members of Data Amazon can read this dataset; editing stays with the people you shared it with.");
        expect(banner.textContent).not.toContain("can read and edit");
    });
});
