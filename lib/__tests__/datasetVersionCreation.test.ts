import { describe, expect, test } from '@jest/globals';
import { UploadIncompleteError, createVersionWithUploads, describeVersionCreationError } from "../datasetVersionCreation";

function recordingSteps(overrides: any = {}) {
    const calls: string[] = [];

    const steps = {
        calls,
        createDraftVersion: async () => {
            calls.push("createDraftVersion");
            return { name: "2" };
        },
        uploadFiles: async () => {
            calls.push("uploadFiles");
            return { failed: [], successful: [] };
        },
        publishVersion: async (versionName: string) => {
            calls.push(`publishVersion:${versionName}`);
        },
        ...overrides,
    };

    return steps;
}

describe("createVersionWithUploads", () => {

    test("publishes the version when every file uploads", async () => {
        const steps = recordingSteps();

        const result = await createVersionWithUploads(steps);

        expect(result.versionName).toBe("2");
        expect(steps.calls).toEqual(["createDraftVersion", "uploadFiles", "publishVersion:2"]);
    });

    test("does not publish the version when a file failed to upload", async () => {
        const steps = recordingSteps({
            uploadFiles: async () => ({
                failed: [{ name: "temperatura_2025.csv" }, { name: "umidade_2025.csv" }],
                successful: [{ name: "ok.csv" }],
            }),
        });

        await expect(createVersionWithUploads(steps)).rejects.toBeInstanceOf(UploadIncompleteError);

        expect(steps.calls).not.toContain("publishVersion:2");
    });

    test("names the files that failed so the person knows what to retry", async () => {
        const steps = recordingSteps({
            uploadFiles: async () => ({
                failed: [{ name: "temperatura_2025.csv" }],
                successful: [],
            }),
        });

        await expect(createVersionWithUploads(steps)).rejects.toThrow("temperatura_2025.csv");
    });

    test("does not upload when the draft version cannot be created", async () => {
        const steps = recordingSteps({
            createDraftVersion: async () => { throw new Error("boom"); },
        });

        await expect(createVersionWithUploads(steps)).rejects.toThrow("boom");

        expect(steps.calls).not.toContain("uploadFiles");
    });
});

describe("describeVersionCreationError", () => {

    test("reports which files failed when the upload was incomplete", () => {
        const error = new UploadIncompleteError(["a.csv", "b.csv"]);

        const message = describeVersionCreationError(error);

        expect(message).toContain("a.csv");
        expect(message).toContain("b.csv");
    });

    test("surfaces the reason the backend gave", () => {
        const error = { response: { status: 404, data: { message: "no_draft_version_to_receive_upload" } } };

        const message = describeVersionCreationError(error);

        expect(message).toContain("no_draft_version_to_receive_upload");
    });

    test("falls back to the status code when the backend gave no message", () => {
        const error = { response: { status: 401, data: {} } };

        const message = describeVersionCreationError(error);

        expect(message).toContain("401");
    });

    test("never returns an empty message", () => {
        expect(describeVersionCreationError(undefined).length).toBeGreaterThan(0);
    });
});
