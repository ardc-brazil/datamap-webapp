import {
    Card,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger
} from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { ROUTE_PAGE_DATASETS_SNAPSHOTS_DETAILS } from "@/contants/InternalRoutesConstants"
import { bytesToSize } from "@/lib/file"
import Router from "next/router"
import { useState } from "react"
import { MaterialSymbol } from "react-material-symbols"
import Moment from "react-moment"
import { DatasetSnapshotResponse, DatasetSnapshotResponseVersion } from "../../types/GatekeeperAPI"
import { Button } from "../ui/button"

interface DataExplorerSectionProps {
    dataset: DatasetSnapshotResponse;
}

export function DataExplorerSection({ dataset }: DataExplorerSectionProps) {
    return (
        <div className="space-y-4">
            <h3>Data Explorer</h3>
            <div className="flex gap-4">
                <Card className="w-64 @container/card">
                    <CardHeader>
                        <CardDescription className="flex justify-between items-center">
                            Versions
                        </CardDescription>
                        <CardTitle className="flex justify-between items-center">
                            {dataset?.versions?.length > 0 ? (
                                <VersionSelector
                                    onNewVersionClick={() => { }}
                                    availableVersions={dataset.versions}
                                    dataset={dataset}
                                >
                                    Version {dataset.version_name}
                                </VersionSelector>
                            ) : (
                                <span className="text-3xl font-semibold p-0">
                                    Version {dataset.version_name}
                                </span>
                            )}

                        </CardTitle>
                    </CardHeader>
                    <CardFooter className="flex-col items-start gap-1.5 text-sm">
                        <div className="line-clamp-1 flex gap-2 text-muted-foreground">
                            <a href={dataset.doi_link} className="text-xs p-0 hover:underline">
                                doi: {dataset.doi_identifier}
                            </a>
                        </div>
                        <a href={`${ROUTE_PAGE_DATASETS_SNAPSHOTS_DETAILS({ id: dataset.dataset_id })}`} className="text-xs p-0 hover:underline">
                            Latest dataset version
                        </a>
                    </CardFooter>
                </Card>
                <Card className="w-52 @container/card">
                    <CardHeader>
                        <CardDescription>Files</CardDescription>
                        <CardTitle className="text-3xl font-semibold tabular-nums @[250px]/card:text-3xl">
                            {dataset.files_summary.total_files.toLocaleString()}
                        </CardTitle>
                    </CardHeader>
                    <CardFooter className="flex-col items-start gap-1.5 text-sm">
                        <div className="line-clamp-1 flex gap-2 text-muted-foreground">
                            Total number of files
                        </div>
                    </CardFooter>
                </Card>
                <Card className="w-52 @container/card">
                    <CardHeader>
                        <CardDescription>Storage</CardDescription>
                        <CardTitle className="text-3xl font-semibold tabular-nums @[250px]/card:text-3xl">
                            {bytesToSize(dataset.files_summary.total_size_bytes)}
                        </CardTitle>
                    </CardHeader>
                    <CardFooter className="flex-col items-start gap-1.5 text-sm">
                        <div className="line-clamp-1 flex gap-2 text-muted-foreground">
                            Disk space used
                        </div>
                    </CardFooter>
                </Card>
                <Card className="@container/card min-w-[240px]">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Extension</TableHead>
                                <TableHead className="text-right">Count</TableHead>
                            </TableRow>
                        </TableHeader>
                    </Table>

                    <ScrollArea className="h-[120px] w-full">
                        <Table className="h-[80px]">
                            <TableBody>
                                {dataset.files_summary.extensions_breakdown.sort((a, b) => b.count - a.count && a.extension.localeCompare(b.extension)).map((file, index) => (
                                    <TableRow key={index}>
                                        <TableCell className="font-medium">
                                            <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                                                {file.extension}
                                            </span>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            {file.count.toLocaleString()} files
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </ScrollArea>
                </Card>
            </div>
        </div>
    )
}

interface VersionSelectorProps {
    onNewVersionClick: () => void,
    availableVersions: DatasetSnapshotResponseVersion[],
    dataset: DatasetSnapshotResponse,
    children: React.ReactNode
}
function VersionSelector(props: VersionSelectorProps) {
    const [open, setOpen] = useState(false);

    function isLastVersionForDataset(dataset: DatasetSnapshotResponse, version: DatasetSnapshotResponseVersion) {
        return dataset.version_name === version.name;
    }

    function onSelectedVersion(version: DatasetSnapshotResponseVersion) {
        if (isLastVersionForDataset(props.dataset, version)) {
            Router.push({
                pathname: ROUTE_PAGE_DATASETS_SNAPSHOTS_DETAILS({ id: props.dataset.dataset_id }),
            });
            setOpen(false);

            return;
        }

        Router.push({
            pathname: ROUTE_PAGE_DATASETS_SNAPSHOTS_DETAILS({ id: props.dataset.dataset_id }),
            search: `version=${version.name}`
        });
        setOpen(false);
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="link" className="text-3xl font-semibold p-0">
                    {props.children}
                </Button>
            </DialogTrigger>
            <DialogContent className="max-w-3xl">
                <DialogHeader>
                    <DialogTitle>History</DialogTitle>
                </DialogHeader>
                <ScrollArea className="min-h-[380px] w-full">
                    <div data-testid="dataset-version-history-modal-content">
                        <div className="h-72 flex-col  -mb-4">
                            <ul data-testid="dataset-version-history-modal-list" >
                                {props?.availableVersions
                                    ?.sort((a, b) => new Date(b?.created_at)?.getTime() - new Date(a?.created_at)?.getTime())
                                    ?.map((version, i) => {
                                        return (
                                            <DatasetVersionSelectorItem
                                                key={i}
                                                dataset={props.dataset}
                                                version={version}
                                                onSelectedVersion={() => onSelectedVersion(version)}
                                            />
                                        )
                                    })}
                            </ul>
                        </div>
                    </div>
                </ScrollArea>
                <DialogFooter>
                    <DialogClose asChild>
                        <Button variant="outline">Cancel</Button>
                    </DialogClose>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}

interface DatasetVersionSelectorItemProps {
    dataset: DatasetSnapshotResponse,
    version: DatasetSnapshotResponseVersion
    onSelectedVersion: () => void
}

export function DatasetVersionSelectorItem(props: DatasetVersionSelectorItemProps) {
    function GetUpdateText() {
        if (props.version.name === "1") {
            return (
                <span className="text-xs">
                    Initial release
                </span>
            )
        }

        return (
            <span className="text-xs">
                Updated <Moment date={props.version.created_at} format="YYYY-MM-DD" />
            </span>
        )
    }

    function GetDOIText() {
        if (!props.version?.doi_identifier) {
            return null
        }

        return (
            <>
                <span>·</span>
                <span className="text-xs">
                    doi: {props.version?.doi_identifier}
                </span>
            </>
        );
    }


    return (
        <li
            onClick={props.onSelectedVersion}
            className="h-22 border-b border-b-primary-200 p-4 flex flex-row items-center h-full hover:bg-primary-100 cursor-pointer gap-4">
            <div className="flex items-center justify-center h-14 w-14">
                <MaterialSymbol icon="stacks" size={48} className="px-1" />
            </div>
            <div className="w-full flex flex-col">
                <div className="flex flex-row justify-between">
                    <span className="text-base font-body text-primary-900">Version {props.version.name} </span>
                    <span className="text-xs font-body">
                        <Moment date={props.version.created_at} fromNow></Moment>
                    </span>
                </div>

                <div className="flex flex-row items-center justify-start gap-2">
                    <GetUpdateText />
                    <GetDOIText />
                </div>
            </div>
        </li>
    )
}