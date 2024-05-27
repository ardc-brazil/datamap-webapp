import { useState } from 'react';
import { GetDatasetDetailsResponse, GetDatasetDetailsVersionFilesResponse } from "../../../types/BffAPI";

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
        } as GetDatasetDetailsVersionFilesResponse
      ))
  }

  console.log(props.dataset?.data?.dataFiles);

  // const [dataExplorerCollapsed, setDataExplorerCollapsed] = useState(false);
  const [selectedFile, setSelectedFile] = useState(props.dataset?.data?.dataFiles?.[0].path ?? null);
  const [loadingTable, setLoadingTable] = useState(false);

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
    if (fl == "**") {
      const tokens = path.split("/");
      return tokens[tokens.length - 2];
    }

    return fl
  }

  function handleSelectFile(x: GetDatasetDetailsVersionFilesResponse): void {
    setLoadingTable(true);
    setSelectedFile(x.name);

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
            <span className="text-sm underline">
              Version 1
            </span>
            {" "}
            <span className="text-primary-500 no-underline">(100 MB)</span>
          </div>

          {/* files list */}
          <div className="h-full">
            <ul className="list-none py-2 overflow-x-auto">
              {props.dataset?.current_version?.files?.map((x, i) => (
                <li className={`${selectedFile === x.name ? "bg-primary-200" : "hover:bg-primary-100"} text-sm text-primary-500 font-light whitespace-nowrap my-1`} key={i} onClick={() => handleSelectFile(x)}>
                  <div className="flex gap-2 items-center py-1 cursor-pointer">
                    <img src="/img/icon-file.svg" className="w-4 h-4" />
                    <p className="text-sm py-0 my-0">{fileNameResolution(x.name)}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
          <hr />
          <div className="pt-4">
            <h6 className="font-semibold">Summary</h6>
            <ul className="list-none py-2 overflow-x-auto">
              <li className={`text-sm text-primary-500 font-light whitespace-nowrap my-1`}>
                <div className="flex gap-2 items-center py-1">
                  <img src="/img/icon-folder.svg" className="w-4 h-4" />
                  <p className="text-sm py-0 my-0">{props.dataset?.data?.dataFiles?.length ?? 0} files</p>
                </div>
              </li>
              <li className={`text-sm text-primary-500 font-light whitespace-nowrap my-1`}>
                <div className="flex gap-2 items-center py-1">
                  <img src="/img/icon-columns.svg" className="w-4 h-4" />
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
