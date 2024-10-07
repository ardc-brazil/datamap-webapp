import { useSession } from "next-auth/react";
import { useState } from 'react';
import { MaterialSymbol } from "react-material-symbols";
import { isNewVersionEnabled } from "../../../lib/featureFlags";
import { GetDatasetDetailsResponse, GetDatasetDetailsVersionFileResponse } from "../../../types/BffAPI";
import DatasetFilesList from "./DatasetFilesList";
import DatasetVersionHandler from "./DatasetVersionHandler";
import NewVersionDrawer from "./NewVersionDrawer";

export interface Props {
  dataset: GetDatasetDetailsResponse
}

export default function DataExplorer(props: Props) {
  const { data: session, status } = useSession();
  const [loadingTable, setLoadingTable] = useState(false);
  const [showUploadDataModal, setShowUploadDataModal] = useState(false);

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
            <DatasetVersionHandler datasetVersion={props.dataset.current_version} />
          </div>

          {/* files list */}
          <div className="h-full">
            <DatasetFilesList
              dataset={props.dataset}
              datasetVersion={props.dataset.current_version}
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
                  <p className="text-sm py-0 my-0">{props.dataset?.current_version?.files?.length ?? 0} files</p>
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
          {isNewVersionEnabled(session) &&
            <div className="pt-4">
              <NewVersionButton onClick={() => setShowUploadDataModal(true)} />
            </div>
          }
        </div>
      </div>
      <NewVersionDrawer
        dataset={props.dataset}
        datasetVersion={props.dataset.current_version}
        showUploadDataModal={showUploadDataModal}
        onDrawerClose={() => setShowUploadDataModal(false)}
      />
    </div >
  )
}


function NewVersionButton(props) {
  return (
    <button type="button"
      className="w-fit btn btn-primary-outline btn-small whitespace-nowrap rounded-3xl border-0"
      onClick={props.onClick}
    >
      <div className="flex flex-row justify-center items-center">
        <MaterialSymbol
          className="pr-2"
          icon="add"
          size={16}
          grade={-25}
          weight={400} />
        <span>New Version</span>
      </div>
    </button>
  );
}