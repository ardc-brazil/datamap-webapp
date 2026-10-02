import { describe, expect, test } from '@jest/globals';
import { APIError } from "../../types/APIError";
import { EmbargoStepError, finishDatasetCreation } from "../datasetCreation";

function recordingSteps(overrides: any = {}) {
    const calls: string[] = [];

    const steps = {
        calls,
        embargoAlreadySet: false,
        setEmbargo: async () => { calls.push("setEmbargo"); },
        onEmbargoSet: () => { calls.push("onEmbargoSet"); },
        uploadFiles: async () => { calls.push("uploadFiles"); },
        updateDataset: async () => { calls.push("updateDataset"); },
        publishVersion: async () => { calls.push("publishVersion"); },
        ...overrides,
    };

    return steps;
}

function apiError(httpCode: 400 | 500, code?: string): APIError {
    return new APIError("APIError", httpCode, "refused", true, code ? [{ code }] : undefined);
}

describe("finishDatasetCreation", () => {

    test("sets the embargo before uploading, then updates and publishes", async () => {
        const steps = recordingSteps();

        await finishDatasetCreation(steps);

        expect(steps.calls).toEqual(["setEmbargo", "onEmbargoSet", "uploadFiles", "updateDataset", "publishVersion"]);
    });

    test("skips the embargo when none was chosen", async () => {
        const steps = recordingSteps({ setEmbargo: null });

        await finishDatasetCreation(steps);

        expect(steps.calls).toEqual(["uploadFiles", "updateDataset", "publishVersion"]);
    });

    test("a retry after a later failure resumes at the upload, without setting the embargo again", async () => {
        const steps = recordingSteps({ embargoAlreadySet: true });

        await finishDatasetCreation(steps);

        expect(steps.calls).toEqual(["uploadFiles", "updateDataset", "publishVersion"]);
    });

    test("an embargo the server already holds counts as set", async () => {
        const steps = recordingSteps({
            setEmbargo: async () => { throw apiError(400, "embargo_already_active"); },
        });

        await finishDatasetCreation(steps);

        expect(steps.calls).toEqual(["onEmbargoSet", "uploadFiles", "updateDataset", "publishVersion"]);
    });

    test("an embargo refusal stops before the upload and is raised as an embargo error", async () => {
        const refusal = apiError(400, "embargo_too_long");
        const steps = recordingSteps({
            setEmbargo: async () => { throw refusal; },
        });

        const outcome = finishDatasetCreation(steps);

        await expect(outcome).rejects.toBeInstanceOf(EmbargoStepError);
        await expect(outcome).rejects.toMatchObject({ apiError: refusal });
        expect(steps.calls).toEqual([]);
    });

    test("a failure after the embargo is not an embargo error", async () => {
        const steps = recordingSteps({
            uploadFiles: async () => { throw apiError(500); },
        });

        await expect(finishDatasetCreation(steps)).rejects.not.toBeInstanceOf(EmbargoStepError);
        expect(steps.calls).toEqual(["setEmbargo", "onEmbargoSet"]);
    });
});
