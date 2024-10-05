import { useState } from 'react';
import { MaterialSymbol } from 'react-material-symbols';
import 'react-material-symbols/outlined'; // Place in your root app file. There are also `sharp` and `outlined` variants.
import { bytesToSize, fileNameResolution, isFolder } from "../../../lib/file";
import { FileDownloadLinkRequest, FileDownloadLinkResponse, GetDatasetDetailsResponse, GetDatasetDetailsVersionFileResponse, GetDatasetDetailsVersionResponse } from "../../../types/BffAPI";
import { BFFAPI } from "../../../gateways/BFFAPI";

interface Props {
    dataset: GetDatasetDetailsResponse,
    datasetVersion: GetDatasetDetailsVersionResponse
    handleSelectFile?(file: GetDatasetDetailsVersionFileResponse): void;
    onFileRemoved?(file: GetDatasetDetailsVersionFileResponse): void;
}

export default function DatasetFilesList(props: Props) {

    const [selectedFile, setSelectedFile] = useState(props.datasetVersion?.files?.[0]?.name ?? null);

    function handleSelectFile(file: GetDatasetDetailsVersionFileResponse): void {
        setSelectedFile(file.name);
        props.handleSelectFile(file);
    }

    return (
        <ul className="list-none py-2 overflow-x-auto">
            {props.datasetVersion?.files?.map((file, i) => (
                <li className={`${selectedFile === file.name ? "bg-primary-200" : "hover:bg-primary-100"} text-sm text-primary-500 font-light whitespace-nowrap my-1`} key={i}
                    onClick={() => handleSelectFile(file)}>
                    <FileListRowItem
                        dataset={props.dataset}
                        datasetVersion={props.datasetVersion}
                        file={file}
                        onFileRemoved={props.onFileRemoved}
                    />
                </li>
            ))}
        </ul>
    )
}

interface FileListRowItemProps {
    dataset: GetDatasetDetailsResponse,
    datasetVersion: GetDatasetDetailsVersionResponse,
    file: GetDatasetDetailsVersionFileResponse,
    onFileRemoved?(file: GetDatasetDetailsVersionFileResponse): void;
}

function FileListRowItem(props: FileListRowItemProps) {
    return (
        <div className="flex gap-2 items-center py-1 cursor-pointer">
            <FileIcon file={props.file} />
            <p className="w-full text-sm py-0 my-0">
                {fileNameResolution(props.file.name)}
            </p>
            <p className="text-sm py-0 pr-2 my-0" >
                {bytesToSize(props.file.size_bytes)}
            </p>
            <DownloadFileButton
                dataset={props.dataset}
                datasetVersion={props.datasetVersion}
                file={props.file} />
            <RemoveFileButton onFileRemoved={props.onFileRemoved} />
        </div>
    )

}

function FileIcon(props: { file: GetDatasetDetailsVersionFileResponse }) {
    if (isFolder(props.file.name)) {
        return <MaterialSymbol icon="folder" size={22} grade={-25} weight={200} className="align-middle" />
    }

    return <MaterialSymbol icon="description" size={22} grade={-25} weight={200} className="align-middle" />
}

function RemoveFileButton(props) {

    if (!props.onFileRemoved) {
        return null;
    }

    return (
        <button onClick={() => props.onFileRemoved(props.file)}>
            <MaterialSymbol icon="close" grade={-25} size={22} weight={400} />
        </button>
    )
}

interface DownloadFileButtonProps {
    dataset: GetDatasetDetailsResponse,
    datasetVersion: GetDatasetDetailsVersionResponse,
    file: GetDatasetDetailsVersionFileResponse,
}

function DownloadFileButton(props: DownloadFileButtonProps) {
    const bffGateway = new BFFAPI();
    const [downloading, setDownloading] = useState(false)

    async function DownloadFile(fileName: string, urlLink: string) {
        console.log("url", urlLink)

        const response = await fetch(urlLink);
        if (response.status !== 200) {
            console.log("Error fetching image");
            return;
        }
        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = fileName;
        a.click();
        a.remove();
    }

    function onDownloadRequest() {
        setDownloading(true)
        const request = {
            datasetId: props.dataset.id,
            versionName: props.datasetVersion.name,
            fileId: props.file.id
        } as FileDownloadLinkRequest;

        bffGateway.generateTemporaryFileDownloadLink(request)
            .then((res: FileDownloadLinkResponse) => {
                DownloadFile(props.file.name, res.url)
            })
            .catch(apiError => {
                //TODO: implement error handler
                console.log(apiError);
            })
            .finally(() => setDownloading(false));


    }

    if (downloading) {
        return (
            <button>
                <MaterialSymbol icon="progress_activity" size={24} grade={-25} weight={400}
                    className="align-middle animate-spin"
                />
            </button>
        );
    }


    return (
        <button onClick={onDownloadRequest}>
            <MaterialSymbol icon="file_download" grade={-25} size={24} weight={400} />
        </button>
    );
}
