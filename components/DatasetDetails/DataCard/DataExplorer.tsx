import { useSession } from "next-auth/react";
import Router from "next/router";
import { useState } from 'react';
import { MaterialSymbol } from "react-material-symbols";
import { ROUTE_PAGE_DATASETS_DETAILS } from "../../../contants/InternalRoutesConstants";
import { getVersionByName } from "../../../lib/datasetVersionSelector";
import { GetDatasetDetailsResponse, GetDatasetDetailsVersionFileResponse } from "../../../types/BffAPI";
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
    <div>
      <h4>Data Explorer</h4>
      <div className="flex gap-4 p-2 overflow-x-clip">

        {/* TODO: Review the best way to present this information. */}
        {/* <FileDescriptor
          selectedFile={selectedFile}
          loadingTable={loadingTable}
        /> */}

        {/* Data Explorer */}
        {/* <div className={`${dataExplorerCollapsed && "hidden"} flex flex-col min-w-[200px] w-72`}> */}
        {/* <div className={`flex flex-col min-w-[200px] w-72`}> */}
        <div className={`flex flex-col min-w-[200px] w-full`}>
          <div>
            <h6 className="font-semibold">Data explorer</h6>
            <DatasetVersionHandler
              datasetVersion={selectedDatasetVersion}
              availableVersions={props.dataset.versions}
              dataset={props.dataset}
              onNewVersionClick={() => setShowUploadDataModal(true)}
            />
          </div>

          {/* files list */}
          <div className="h-full">
            <DatasetFilesList
              dataset={props.dataset}
              datasetVersion={selectedDatasetVersion}
              handleSelectFile={handleSelectFile}
              itemsPerPage={10} />
          </div>
          <hr />
          <div className="pt-4">
            <h6 className="font-semibold">Summary</h6>
            <ul className="list-none py-2 overflow-x-auto">
              <li className={`text-sm text-primary-500 font-light whitespace-nowrap my-1`}>
                <div className="flex gap-2 items-center py-1">
                  <MaterialSymbol icon="folder" size={22} grade={-25} weight={200} className="align-middle" />
                  <p className="text-sm py-0 my-0">{getVersionByName(props.selectedVersionName, props.dataset.versions, props.dataset)?.files_in?.length ?? 0} files</p>
                </div>
              </li>
              <li className={`text-sm text-primary-500 font-light whitespace-nowrap my-1`}>
                <div className="flex gap-2 items-center py-1">
                  {/* <img src="/img/icon-columns.svg" className="w-4 h-4" /> */}
                  <MaterialSymbol icon="view_column" size={22} grade={-25} weight={200} className="align-middle" />
                  <p className="text-sm py-0 my-0">10 columns</p>
                </div>
              </li>
            </ul>
          </div>
          <hr />
          <div className="pt-4">
            <NewVersionButton onClick={() => setShowUploadDataModal(true)} />
          </div>
        </div>
      </div>
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