import { useState } from 'react';
import { MaterialSymbol } from 'react-material-symbols';
import 'react-material-symbols/outlined'; // Place in your root app file. There are also `sharp` and `outlined` variants.
import { GetDatasetDetailsVersionFileResponse, GetDatasetDetailsVersionResponse } from "../../../types/BffAPI";

interface Props {
    handleSelectFile?(file: GetDatasetDetailsVersionFileResponse): void;
    datasetVersion: GetDatasetDetailsVersionResponse
}

export default function DatasetFilesList(props: Props) {

    const [selectedFile, setSelectedFile] = useState(props.datasetVersion?.files?.[0].name ?? null);

    /**
     * Extract the file name from a full path file.
     * @param path full path for the file
     * @returns file name
     * @example
     * - /path/to/a/file.txt -> file.txt
     */
    function fileName(path: string): string {
        const tokens = path.split("/");
        return tokens[tokens.length - 1];
    }

    function fileNameResolution(path: string): string {
        const fl = fileName(path);

        // If the path is a folder, also should the folder name.
        // This is temporary for Remote Files Upload mode.
        if (isFolder(path)) {
            const tokens = path.split("/");
            return tokens[tokens.length - 2];
        }

        return fl
    }

    function isFolder(path: string): boolean {
        const fl = fileName(path);
        return fl == "**";
    }

    function handleSelectFile(file: GetDatasetDetailsVersionFileResponse): void {
        setSelectedFile(file.name);
        props.handleSelectFile(file);
    }

    return (
        <ul className="list-none py-2 overflow-x-auto">
            {props.datasetVersion?.files?.map((x, i) => (
                <li className={`${selectedFile === x.name ? "bg-primary-200" : "hover:bg-primary-100"} text-sm text-primary-500 font-light whitespace-nowrap my-1`} key={i} onClick={() => handleSelectFile(x)}>
                    <div className="flex gap-2 items-center py-1 cursor-pointer">
                        {isFolder(x.name) && <MaterialSymbol icon="folder" size={22} grade={-25} weight={200} className="align-middle" />}
                        {!isFolder(x.name) && <MaterialSymbol icon="description" size={22} grade={-25} weight={200} className="align-middle" />}
                        <p className="text-sm py-0 my-0">{fileNameResolution(x.name)}</p>
                    </div>
                </li>
            ))}
        </ul>
    )
}
