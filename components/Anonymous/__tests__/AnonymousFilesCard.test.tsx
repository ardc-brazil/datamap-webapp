/** @jest-environment jsdom */
import { describe, expect, test } from '@jest/globals';
import { render, screen } from '@testing-library/react';
import { AnonymousFilesCard } from "../AnonymousFilesCard";

describe("AnonymousFilesCard", () => {
    test("counts and kinds, never a file name", () => {
        render(<AnonymousFilesCard version={{
            name: "2", created_at: "2026-09-01T00:00:00Z",
            files_summary: {
                count: 14, total_size_bytes: 2469606195,
                extensions: [
                    { extension: ".nc", count: 9, total_size_bytes: 2254857830 },
                    { extension: null, count: 1, total_size_bytes: 12288 },
                ],
            },
        }} />);

        expect(screen.getByText("14 files · 2.3 GB")).toBeTruthy();
        expect(screen.getByText("Names and downloads not available")).toBeTruthy();
        expect(screen.getByText(".nc")).toBeTruthy();
        expect(screen.getByText("9 · 2.1 GB")).toBeTruthy();
        expect(screen.getByText("no extension")).toBeTruthy();
        expect(screen.getByText("1 · 12.0 KB")).toBeTruthy();
    });
});
