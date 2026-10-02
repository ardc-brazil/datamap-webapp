/** @jest-environment jsdom */
import { describe, expect, test } from '@jest/globals';
import { render, screen } from '@testing-library/react';
import { FilesWithheldNotice } from "../FilesWithheldNotice";

const dataset: any = {
    tenancy: "datamap/production/data-amazon",
    owner: { id: "o", name: "Luciana Rizzo" },
    embargo: { until: "2026-12-15T23:59:59+00:00", active: true, metadata_visible: true, note: null },
};

describe("FilesWithheldNotice", () => {
    test("count, size, date and whom to ask", () => {
        render(<FilesWithheldNotice dataset={dataset} version={{ files_withheld: true, files_summary: { count: 14, total_size_bytes: 2469606195 } } as any} />);

        const notice = screen.getByTestId("files-withheld");
        expect(notice.textContent).toContain("14 files · 2.3 GB, under embargo");
        expect(notice.textContent).toContain("File names and downloads become available to Data Amazon members on Dec 15, 2026.");
        expect(notice.textContent).toContain("You can cite the dataset now.");
        expect(notice.textContent).toContain("Need it earlier? Ask the owner, Luciana Rizzo, to share it with you.");
    });

    test("nothing when the files are visible", () => {
        render(<FilesWithheldNotice dataset={dataset} version={{ files_withheld: false } as any} />);

        expect(screen.queryByTestId("files-withheld")).toBeNull();
    });
});
