import { useState } from 'react';
import { MaterialSymbol } from "react-material-symbols";
import { GetDatasetDetailsResponse, GetDatasetDetailsVersionFileResponse } from "../../../types/BffAPI";
import DatasetFilesList from "./DatasetFilesList";
import DatasetVersionHandler from "./DatasetVersionHandler";

export interface Props {
  dataset: GetDatasetDetailsResponse
}

export default function DataExplorer(props: Props) {

  // TODO: Remove with fake data explorer file details
  // I added this to move the .dataset.data.dataFiles to the .current_version.files
  // if the version is empty. This will be used during the transition from Remove File upload
  // to Update data files to the Datamap platform data storage.
  if (props.dataset?.data?.dataFiles?.length && props.dataset?.current_version?.files?.length <= 0) {
    props.dataset.current_version.files = props.dataset?.data?.dataFiles
      ?.map((item, idx) => (
        {
          id: String(idx),
          name: item.path
        } as GetDatasetDetailsVersionFileResponse
      ))
  }

  // const [dataExplorerCollapsed, setDataExplorerCollapsed] = useState(false);
  const [loadingTable, setLoadingTable] = useState(false);

  function handleSelectFile(file: GetDatasetDetailsVersionFileResponse): void {
    setLoadingTable(true);

    setTimeout(() => {
      setLoadingTable(false);
    }, 1000);
  }

  // function handleCollapseDataExplorer(event): void {
  //   setDataExplorerCollapsed(!dataExplorerCollapsed);
  // }

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
            <DatasetFilesList datasetVersion={props.dataset.current_version} handleSelectFile={handleSelectFile} />
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
        </div>

      </div>
    </div>
  )

}
