import { GetDatasetDetailsDOIResponseRegisterMode, GetDatasetDetailsDOIResponseState, GetDatasetDetailsResponse } from "../types/BffAPI";

export type ManualDoiGate = "ends_embargo" | "owner_only" | "blocks_future_embargo";

export function isFilesWithheld(dataset: GetDatasetDetailsResponse): boolean {
    return dataset?.current_version?.files_withheld === true;
}

export function shouldShowEmbargoEndedBanner(dataset: GetDatasetDetailsResponse): boolean {
    return dataset?.access?.level === "owner"
        && !!dataset.embargo
        && !dataset.embargo.active
        && dataset.current_version?.doi?.state !== GetDatasetDetailsDOIResponseState.FINDABLE;
}

export function canSeeSettings(dataset: GetDatasetDetailsResponse, canEdit: boolean): boolean {
    return canEdit
        || dataset?.access?.can_extend_embargo === true
        || dataset?.access?.can_manage_embargo === true;
}

export function manualDoiGate(dataset: GetDatasetDetailsResponse): ManualDoiGate {
    if (dataset?.embargo?.active) {
        return dataset.access?.can_manage_embargo ? "ends_embargo" : "owner_only";
    }
    return "blocks_future_embargo";
}

export function hasManualDoi(dataset: GetDatasetDetailsResponse): boolean {
    return (dataset?.versions ?? []).some((version) => version?.doi?.mode === GetDatasetDetailsDOIResponseRegisterMode.MANUAL);
}
