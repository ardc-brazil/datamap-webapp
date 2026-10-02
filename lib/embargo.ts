import { AccessHistoryResponse, DatasetEmbargo, EmbargoModeRequest, EmbargoNoteRequest, EmbargoStatusResponse, ExtendEmbargoRequest, SetEmbargoRequest } from "../types/GatekeeperAPI";
import { AppLocalContext } from "./appLocalContext";
import axiosInstance, { buildHeaders } from "./rpc";

export async function setEmbargo(context: AppLocalContext, datasetId: string, request: SetEmbargoRequest): Promise<DatasetEmbargo> {
    const response = await axiosInstance.put(`/datasets/${datasetId}/embargo`, request, buildHeaders(context));
    return response.data as DatasetEmbargo;
}

export async function extendEmbargo(context: AppLocalContext, datasetId: string, request: ExtendEmbargoRequest): Promise<DatasetEmbargo> {
    const response = await axiosInstance.post(`/datasets/${datasetId}/embargo/extend`, request, buildHeaders(context));
    return response.data as DatasetEmbargo;
}

export async function endEmbargo(context: AppLocalContext, datasetId: string): Promise<DatasetEmbargo> {
    const response = await axiosInstance.post(`/datasets/${datasetId}/embargo/end`, {}, buildHeaders(context));
    return response.data as DatasetEmbargo;
}

export async function setEmbargoMode(context: AppLocalContext, datasetId: string, request: EmbargoModeRequest): Promise<DatasetEmbargo> {
    const response = await axiosInstance.put(`/datasets/${datasetId}/embargo/mode`, request, buildHeaders(context));
    return response.data as DatasetEmbargo;
}

export async function getEmbargoStatus(datasetId: string, versionName?: string): Promise<EmbargoStatusResponse> {
    const url = `/datasets/${encodeURIComponent(datasetId)}/embargo-status`;
    const response = versionName
        ? await axiosInstance.get(url, { params: { version: versionName } })
        : await axiosInstance.get(url);
    return response.data as EmbargoStatusResponse;
}

export async function setEmbargoNote(context: AppLocalContext, datasetId: string, request: EmbargoNoteRequest): Promise<DatasetEmbargo> {
    const response = await axiosInstance.put(`/datasets/${datasetId}/embargo/note`, request, buildHeaders(context));
    return response.data as DatasetEmbargo;
}

export async function getAccessEvents(context: AppLocalContext, datasetId: string): Promise<AccessHistoryResponse> {
    const response = await axiosInstance.get(`/datasets/${datasetId}/access-events`, buildHeaders(context));
    return response.data as AccessHistoryResponse;
}
