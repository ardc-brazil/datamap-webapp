import { GetDatasetDetailsResponse, GetDatasetDetailsVersionResponse } from "../types/BffAPI";


export function getVersionByName(selectedVersionName: string, versions: GetDatasetDetailsVersionResponse[], dataset: GetDatasetDetailsResponse): GetDatasetDetailsVersionResponse {
    if (!selectedVersionName) {
        return dataset.current_version;
    }

    return versions.find(x => x.name === selectedVersionName);
}

export function isLastVersionForDataset(dataset: GetDatasetDetailsResponse, version: GetDatasetDetailsVersionResponse) {
    return dataset.current_version.id == version.id
}