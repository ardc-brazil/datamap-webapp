import { useSession } from "next-auth/react";
import Router from "next/router";
import { useState } from 'react';
import { MaterialSymbol } from "react-material-symbols";
import { ROUTE_PAGE_DATASETS_DETAILS } from "../../../contants/InternalRoutesConstants";
import { getVersionByName } from "../../../lib/datasetVersionSelector";
import { bytesToSize, totalDatasetVersionFilesSize } from "../../../lib/file";
import { GetDatasetDetailsResponse, GetDatasetDetailsVersionFileResponse } from "../../../types/BffAPI";
import { FilesWithheldNotice } from "../../Embargo/FilesWithheldNotice";
import NewVersionButton from "../NewVersionButton";
import DatasetFilesList from "./DatasetFilesList";
import DatasetVersionHandler from "./DatasetVersionHandler";
import NewVersionDrawer from "./NewVersionDrawer";

export interface Props {
  dataset: GetDatasetDetailsResponse
  selectedVersionName?: string
}

export default function DataExplorer(props: Props) {
  const { data: session, status } = useSession();
  const [loadingTable, setLoadingTable] = useState(false);
  const [showUploadDataModal, setShowUploadDataModal] = useState(false);
  const [selectedDatasetVersion, setSelectedDatasetVersion] = useState(getVersionByName(props.selectedVersionName, props.dataset.versions, props.dataset))


  function handleSelectFile(file: GetDatasetDetailsVersionFileResponse): void {
    setLoadingTable(true);

    setTimeout(() => {
      setLoadingTable(false);
    }, 1000);
  }

  return (
    <div className="flex flex-col gap-3">

      {/* TODO: Review the best way to present this information. */}
      {/* <FileDescriptor
        selectedFile={selectedFile}
        loadingTable={loadingTable}
      /> */}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="m-0 text-lg leading-7 font-semibold tracking-[-0.01em] text-primary-900">Files</h2>
        <div className="flex flex-wrap items-center gap-4 text-[13px] text-primary-600">
          <DatasetVersionHandler
            datasetVersion={selectedDatasetVersion}
            availableVersions={props.dataset.versions}
            dataset={props.dataset}
            onNewVersionClick={() => setShowUploadDataModal(true)}
          />
          <span className="flex items-center gap-1.5">
            <MaterialSymbol icon="folder" size={16} grade={-25} weight={200} />
            {selectedDatasetVersion?.files_withheld
              ? <>{selectedDatasetVersion.files_summary?.count ?? 0} files · {bytesToSize(selectedDatasetVersion.files_summary?.total_size_bytes ?? 0)}</>
              : <>{getVersionByName(props.selectedVersionName, props.dataset.versions, props.dataset)?.files_in?.length ?? 0} files · {totalDatasetVersionFilesSize(selectedDatasetVersion)}</>
            }
          </span>
          {props.dataset.access?.can_edit !== false && <NewVersionButton onClick={() => setShowUploadDataModal(true)} />}
        </div>
      </div>

      {selectedDatasetVersion?.files_withheld
        ? <FilesWithheldNotice dataset={props.dataset} version={selectedDatasetVersion} />
        : <>
          <DatasetFilesList
            dataset={props.dataset}
            datasetVersion={selectedDatasetVersion}
            handleSelectFile={handleSelectFile}
            itemsPerPage={10} />
          {props.dataset.embargo?.active &&
            <p className="m-0 mt-2 text-[13px] text-primary-500">Download links expire after 1 hour while embargoed.</p>
          }
        </>
      }
      <NewVersionDrawer
        dataset={props.dataset}
        datasetVersion={selectedDatasetVersion}
        showUploadDataModal={showUploadDataModal}
        onDrawerClose={(newVersionCreated) => {
          setShowUploadDataModal(false)

          if (newVersionCreated) {
            Router.push({
              pathname: ROUTE_PAGE_DATASETS_DETAILS({ id: props.dataset.id }),
            });
          }

        }}
      />
    </div >
  )
}