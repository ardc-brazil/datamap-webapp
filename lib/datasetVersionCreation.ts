/**
 * Orchestrates creating a dataset version out of freshly uploaded files.
 *
 * This lives outside the React component on purpose. The publish step must never
 * run when a file failed to upload, and that rule is only worth having if it is
 * covered by tests — which the component itself is not, since Jest only
 * transforms `.ts` in this project.
 */

/** Raised when at least one file did not reach the server. */
export class UploadIncompleteError extends Error {
    readonly failedFiles: string[];

    constructor(failedFiles: string[]) {
        super(`Upload incomplete. These files did not reach the server: ${failedFiles.join(", ")}`);
        this.name = "UploadIncompleteError";
        this.failedFiles = failedFiles;

        // Required for `instanceof` to work once TypeScript downlevels the class.
        Object.setPrototypeOf(this, UploadIncompleteError.prototype);
    }
}

interface UploadOutcome {
    failed?: Array<{ name?: string }>;
}

export interface VersionCreationSteps {
    createDraftVersion(): Promise<{ name: string }>;
    uploadFiles(): Promise<UploadOutcome>;
    publishVersion(versionName: string): Promise<unknown>;
}

/**
 * Creates a draft version, uploads the files into it and publishes it.
 *
 * Throws before publishing if any file failed, so a version is never published
 * without the data it is supposed to carry.
 */
export async function createVersionWithUploads(
    steps: VersionCreationSteps
): Promise<{ versionName: string }> {
    const draftVersion = await steps.createDraftVersion();

    const uploadOutcome = await steps.uploadFiles();
    const failed = uploadOutcome?.failed ?? [];

    if (failed.length > 0) {
        throw new UploadIncompleteError(
            failed.map((file, index) => file?.name ?? `file ${index + 1}`)
        );
    }

    await steps.publishVersion(draftVersion.name);

    return { versionName: draftVersion.name };
}

/**
 * Turns whatever went wrong into something the person on the screen can act on.
 * Never returns an empty string: a blank error box is worse than a vague one.
 */
export function describeVersionCreationError(error: any): string {
    if (error instanceof UploadIncompleteError) {
        return error.message;
    }

    const status = error?.response?.status;
    const detail =
        error?.response?.data?.message ??
        error?.response?.data?.details ??
        error?.message;

    if (status && detail) {
        return `The server rejected the request (${status}): ${detail}`;
    }

    if (status) {
        return `The server rejected the request with status ${status}.`;
    }

    if (detail) {
        return detail;
    }

    return "Something went wrong and the server gave no reason. Please try again.";
}
