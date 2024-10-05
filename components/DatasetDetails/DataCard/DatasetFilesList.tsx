import { useEffect, useState } from 'react';
import { MaterialSymbol } from 'react-material-symbols';
import 'react-material-symbols/outlined'; // Place in your root app file. There are also `sharp` and `outlined` variants.
import { BFFAPI } from "../../../gateways/BFFAPI";
import { bytesToSize, fileNameResolution, isFolder } from "../../../lib/file";
import { FileDownloadLinkRequest, FileDownloadLinkResponse, GetDatasetDetailsResponse, GetDatasetDetailsVersionFileResponse, GetDatasetDetailsVersionResponse } from "../../../types/BffAPI";

interface Props {
    itemsPerPage: number;
    dataset: GetDatasetDetailsResponse,
    datasetVersion: GetDatasetDetailsVersionResponse
    handleSelectFile?(file: GetDatasetDetailsVersionFileResponse): void;
    onFileRemoved?(file: GetDatasetDetailsVersionFileResponse): void;
}

export default function DatasetFilesList(props: Props) {

    const itemsPerPage = props.itemsPerPage;
    const [currentFilesList, setCurrentFilesList] = useState(props.datasetVersion?.files)
    const [nameFilter, setNameFilter] = useState("")
    const [page, setPage] = useState(1);

    // TODO: file select is not useful without a file descriptor
    // const [selectedFile, setSelectedFile] = useState(props.datasetVersion?.files?.[0]?.name ?? null);
    // function handleSelectFile(file: GetDatasetDetailsVersionFileResponse): void {
    //     setSelectedFile(file.name);
    //     props.handleSelectFile(file);
    // }

    useEffect(() => {
        setCurrentFilesList(props.datasetVersion?.files)
        onTextSearchChange(nameFilter)
    }, [props.datasetVersion?.files])


    function getMaxPageNumber() {
        return currentFilesList?.length / itemsPerPage;
    }


    function getPage() {
        const fullList = currentFilesList?.sort((a, b) => {
            return a.name.localeCompare(b.name)
        })

        const result = fullList.slice((page * itemsPerPage) - itemsPerPage, (page * itemsPerPage))
        return result;
    }

    function onTextSearchChange(filterText: string) {
        filterFiles(filterText)
    }

    function filterFiles(filterText: string) {
        setNameFilter(filterText)
        if (filterText == "") {
            setCurrentFilesList(props.datasetVersion.files)
        } else {
            const filtered = props.datasetVersion.files.filter(x => x.name.includes(filterText))
            setCurrentFilesList(filtered)
        }
        setPage(1)
    }

    function shouldPaginate() {
        return props.datasetVersion?.files?.length > itemsPerPage;
    }

    return (
        <div>
            {shouldPaginate() &&
                <div className="w-full pt-4">
                    <input
                        name="nameFilter"
                        id="nameFilter"
                        type="text"
                        placeholder="Filter by name"
                        value={nameFilter}
                        onChange={(e) => onTextSearchChange(e.target.value)} />
                </div>
            }
            <ul className="list-none py-2 overflow-x-auto">
                {getPage().map((file, i) => (
                    <li className="hover:bg-primary-100 text-sm text-primary-500 font-light whitespace-nowrap my-1" key={i}>
                        <FileListRowItem
                            dataset={props.dataset}
                            datasetVersion={props.datasetVersion}
                            file={file}
                            onFileRemoved={props.onFileRemoved}
                        />
                    </li>
                ))}
                {getPage().length <= 0 &&
                    <li className="border border-primary-200 bg-primary-100 p-8 text-center rounded">
                        <h6>No Results Found</h6>
                        <p className="text-xs">It looks like there are no files matching your search criteria.</p>
                        <p className="text-xs">Try adjusting or clearing your filters to view more results.</p>
                        <button
                            className="btn-primary-outline btn-small"
                            onClick={() => {
                                setNameFilter("");
                                filterFiles("")
                            }}>
                            Clear Filters
                        </button>
                    </li>
                }
                {shouldPaginate() &&
                    <li>
                        <div className="flex justify-end items-center space-x-4">
                            <span className="text-xs">
                                Total files: {props?.datasetVersion?.files?.length}
                            </span>
                            <button
                                className="h-8 w-24 p-2 btn whitespace-nowrap text-xs align-middle flex flex-row justify-center items-center space-x-2 hover:border hover:border-primary-200 disabled:text-primary-400 disabled:hover:border-0"
                                onClick={() => setPage(page - 1)}
                                disabled={page <= 1}>
                                <MaterialSymbol icon="chevron_left" size={22} grade={-25} weight={200} />
                                <span>Previous</span>
                            </button>
                            <button
                                className="h-8 w-24 p-2 btn whitespace-nowrap text-xs align-middle flex flex-row justify-center items-center space-x-2 hover:border hover:border-primary-200 disabled:text-primary-400 disabled:hover:border-0"
                                onClick={() => setPage(page + 1)}
                                disabled={page >= getMaxPageNumber()}>
                                <span>Next</span>
                                <MaterialSymbol icon="chevron_right" size={22} grade={-25} weight={200} />
                            </button>
                        </div>
                    </li>
                }
            </ul>
        </div>
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
                file={props.file}
                show={!props.onFileRemoved} />
            <RemoveFileButton file={props.file} onFileRemoved={props.onFileRemoved} />
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
        <button
            onClick={() => props.onFileRemoved(props.file)}
        >
            <MaterialSymbol icon="close" grade={-25} size={22} weight={400} />
        </button>
    )
}

interface DownloadFileButtonProps {
    dataset: GetDatasetDetailsResponse,
    datasetVersion: GetDatasetDetailsVersionResponse,
    file: GetDatasetDetailsVersionFileResponse,
    show?: boolean
}

function DownloadFileButton(props: DownloadFileButtonProps) {
    const bffGateway = new BFFAPI();
    const [downloading, setDownloading] = useState(false)

    async function DownloadFile(fileName: string, urlLink: string) {
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

    if (!props.show) {
        return null;
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
