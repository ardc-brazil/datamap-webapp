import { APIError } from "../types/APIError";
import { formatShortDate } from "./embargoDisplay";

export class EmbargoStepError extends Error {
    readonly apiError: unknown;

    constructor(apiError: unknown) {
        super("The embargo could not be set.");
        this.name = "EmbargoStepError";
        this.apiError = apiError;

        Object.setPrototypeOf(this, EmbargoStepError.prototype);
    }
}

export interface DatasetCreationSteps {
    setEmbargo: (() => Promise<unknown>) | null;
    embargoAlreadySet: boolean;
    onEmbargoSet(): void;
    uploadFiles(): Promise<unknown>;
    updateDataset(): Promise<unknown>;
    publishVersion(): Promise<unknown>;
}

function isAlreadyActive(error: unknown): boolean {
    return (error as APIError)?.errors?.[0]?.code === "embargo_already_active";
}

export interface EmbargoLock {
    locked: boolean;
    statusLine: string | null;
}

export function embargoLockFor(embargoSetUntil: string | null): EmbargoLock {
    if (!embargoSetUntil) {
        return { locked: false, statusLine: null };
    }
    return {
        locked: true,
        statusLine: `Embargo set until ${formatShortDate(embargoSetUntil)}; change it in Settings after creation`,
    };
}

export async function finishDatasetCreation(steps: DatasetCreationSteps): Promise<void> {
    if (steps.setEmbargo && !steps.embargoAlreadySet) {
        try {
            await steps.setEmbargo();
        } catch (error) {
            if (!isAlreadyActive(error)) {
                throw new EmbargoStepError(error);
            }
        }
        steps.onEmbargoSet();
    }

    await steps.uploadFiles();
    await steps.updateDataset();
    await steps.publishVersion();
}
