import { ActionItems } from "./ActionItems";
import { DatasetSnapshotResponse } from "../../types/GatekeeperAPI";

interface HeaderProps {
    dataset: DatasetSnapshotResponse;
}

export function Header({ dataset }: HeaderProps) {
    return (
        <div className="flex flex-col">
            <div className="flex gap-4">
                <h1 id="dataset-title" className="font-extrabold w-full leading-[1.2]">
                    {dataset.name}
                </h1>
                <ActionItems dataset_id={dataset.dataset_id} />
            </div>
            <p className="text-primary-500">{dataset.data.institution}</p>
        </div>
    )
}