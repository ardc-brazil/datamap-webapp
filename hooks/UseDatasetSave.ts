import { useState } from "react";
import { messageForApiError } from "../contants/EmbargoConstants";
import { BFFAPI } from "../gateways/BFFAPI";
import { httpErrorHandler } from "../lib/rpc";
import { GetDatasetDetailsResponse, UpdateDatasetRequest } from "../types/BffAPI";
import { DatasetInfo } from "../types/GatekeeperAPI";

export interface DatasetChanges {
    name?: string
    data?: Partial<DatasetInfo>
}

export function datasetSaveErrorMessage(error: unknown): string {
    return messageForApiError(httpErrorHandler(error));
}

export function useDatasetSave(dataset: GetDatasetDetailsResponse) {
    const [bffGateway] = useState(() => new BFFAPI());
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    async function save(changes: DatasetChanges): Promise<boolean> {
        const name = changes.name ?? dataset.name;
        const data = { ...dataset.data, ...changes.data };
        setSaving(true);
        setError(null);
        try {
            await bffGateway.updateDataset({
                id: dataset.id,
                name,
                data,
                tenancy: dataset.tenancy,
                is_enabled: dataset.is_enabled,
            } as UpdateDatasetRequest);
            dataset.name = name;
            Object.assign(dataset.data, changes.data);
            return true;
        } catch (e) {
            setError(datasetSaveErrorMessage(e));
            return false;
        } finally {
            setSaving(false);
        }
    }

    return { save, saving, error, clearError: () => setError(null) };
}
