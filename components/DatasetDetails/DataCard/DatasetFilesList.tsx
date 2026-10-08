import { useEffect, useState } from 'react';
import { MaterialSymbol } from 'react-material-symbols';
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
    const [currentFilesList, setCurrentFilesList] = useState(props.datasetVersion?.files_in)
    const [nameFilter, setNameFilter] = useState("")
    const [page, setPage] = useState(1);

    // TODO: file select is not useful without a file descriptor
    // const [selectedFile, setSelectedFile] = useState(props.datasetVersion?.files?.[0]?.name ?? null);
    // function handleSelectFile(file: GetDatasetDetailsVersionFileResponse): void {
    //     setSelectedFile(file.name);
    //     props.handleSelectFile(file);
    // }

    useEffect(() => {
        setCurrentFilesList(props.datasetVersion?.files_in)
        onTextSearchChange(nameFilter)
    }, [props.datasetVersion?.files_in])


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
            setCurrentFilesList(props.datasetVersion.files_in)
        } else {
            const filtered = props.datasetVersion.files_in.filter(x => x.name.includes(filterText))
            setCurrentFilesList(filtered)
        }
        setPage(1)
    }

    function shouldPaginate() {
        return props.datasetVersion?.files_in?.length > itemsPerPage;
    }

    const gridColumns = "grid grid-cols-[minmax(0,1fr)_100px_40px] items-center gap-2";

    return (
        <div data-testid="dataset-files" className="flex flex-col gap-3">
            {shouldPaginate() &&
                <div className="w-full">
                    <input
                        name="nameFilter"
                        id="nameFilter"
                        type="text"
                        placeholder="Filter by name"
                        className="h-9 py-0 px-3 bg-primary-0 rounded-md"
                        value={nameFilter}
                        onChange={(e) => onTextSearchChange(e.target.value)} />
                </div>
            }
            <div className="border border-primary-200 rounded-lg bg-primary-0 overflow-hidden">
                <div className="overflow-x-auto">
                    <div className="min-w-[420px]">
                        <div className={`${gridColumns} px-4 py-2 text-[11px] tracking-[0.08em] uppercase font-semibold text-primary-500 border-b border-primary-200 bg-primary-50`}>
                            <span>Name</span>
                            <span className="text-right">Size</span>
                            <span></span>
                        </div>
                        <ul className="list-none m-0 p-0">
                            {getPage().map((file, i) => (
                                <li data-testid="dataset-file-row" className={`${gridColumns} h-11 px-4 border-b border-primary-100 last:border-b-0 text-sm hover:bg-primary-50`} key={i}>
                                    <FileListRowItem
                                        dataset={props.dataset}
                                        datasetVersion={props.datasetVersion}
                                        file={file}
                                        onFileRemoved={props.onFileRemoved}
                                    />
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>
                {getPage().length <= 0 &&
                    <div className="p-8 text-center">
                        <div className="text-sm font-semibold text-primary-900">No Results Found</div>
                        <p className="text-xs text-primary-500 my-1">It looks like there are no files matching your search criteria.</p>
                        <p className="text-xs text-primary-500 my-1">Try adjusting or clearing your filters to view more results.</p>
                        <button
                            className="btn-primary-outline btn-small mt-3"
                            onClick={() => {
                                setNameFilter("");
                                filterFiles("")
                            }}>
                            Clear Filters
                        </button>
                    </div>
                }
                {shouldPaginate() &&
                    <div className="flex justify-between items-center gap-4 px-4 py-2.5 border-t border-primary-200 text-[13px] text-primary-500">
                        <span>
                            Total files: {props?.datasetVersion?.files_in?.length}
                        </span>
                        <div className="flex items-center gap-1">
                            <button
                                className="h-8 px-2 rounded-md whitespace-nowrap text-[13px] font-medium text-primary-900 flex flex-row items-center gap-1 hover:bg-primary-100 disabled:text-primary-400 disabled:hover:bg-transparent"
                                onClick={() => setPage(page - 1)}
                                disabled={page <= 1}>
                                <MaterialSymbol icon="chevron_left" size={18} grade={-25} weight={400} />
                                <span>Previous</span>
                            </button>
                            <button
                                className="h-8 px-2 rounded-md whitespace-nowrap text-[13px] font-medium text-primary-900 flex flex-row items-center gap-1 hover:bg-primary-100 disabled:text-primary-400 disabled:hover:bg-transparent"
                                onClick={() => setPage(page + 1)}
                                disabled={page >= getMaxPageNumber()}>
                                <span>Next</span>
                                <MaterialSymbol icon="chevron_right" size={18} grade={-25} weight={400} />
                            </button>
                        </div>
                    </div>
                }
            </div>
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
        <>
            <span className="flex items-center gap-2.5 min-w-0">
                <FileIcon file={props.file} />
                <span className="font-mono text-[13px] text-primary-900 truncate" title={fileNameResolution(props.file.name)}>
                    {fileNameResolution(props.file.name)}
                </span>
            </span>
            <span className="font-mono text-xs text-primary-500 text-right whitespace-nowrap">
                {bytesToSize(props.file.size_bytes)}
            </span>
            <span className="flex justify-end text-primary-500">
                <DownloadFileButton
                    dataset={props.dataset}
                    datasetVersion={props.datasetVersion}
                    file={props.file}
                    show={!props.onFileRemoved} />
                <RemoveFileButton file={props.file} onFileRemoved={props.onFileRemoved} />
            </span>
        </>
    )

}

function FileIcon(props: { file: GetDatasetDetailsVersionFileResponse }) {
    if (isFolder(props.file.name)) {
        return <MaterialSymbol icon="folder" size={20} grade={-25} weight={200} className="flex-none text-primary-500" />
    }

    return <MaterialSymbol icon="description" size={20} grade={-25} weight={200} className="flex-none text-primary-500" />
}

function RemoveFileButton(props) {

    if (!props.onFileRemoved) {
        return null;
    }

    return (
        <button
            type="button"
            className="flex items-center text-primary-400 hover:text-primary-900 transition-colors"
            onClick={() => props.onFileRemoved(props.file)}
        >
            <MaterialSymbol icon="close" grade={-25} size={18} weight={400} />
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
            <button type="button" className="flex items-center text-primary-500">
                <MaterialSymbol icon="progress_activity" size={20} grade={-25} weight={400}
                    className="align-middle animate-spin"
                />
            </button>
        );
    }


    return (
        <button type="button" data-testid="file-download" className="flex items-center text-primary-500 hover:text-primary-900 transition-colors" onClick={onDownloadRequest} aria-label="Download file">
            <MaterialSymbol icon="download" grade={-25} size={20} weight={400} />
        </button>
    );
}
