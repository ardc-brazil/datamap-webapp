import { useState } from 'react';
import { TabPanel } from "../TabPanel";
import { Tabs } from "../Tabs";
import FileDescriptor from "./FileDescriptor";

export default function DataExplorer(props) {

  // TODO: Remove with fake data explorer file details
  if (!props.dataset?.dataFiles?.length) {
    props.dataset.dataFiles = [
      { path: "/path/to/a/file1.csv" },
      { path: "/path/to/a/file2.csv" }
    ]
  }

  // const [dataExplorerCollapsed, setDataExplorerCollapsed] = useState(false);
  const [selectedFile, setSelectedFile] = useState(props.dataset?.dataFiles?.[0].path ?? null);
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

  function handleSelectFile(x: any): void {
    setLoadingTable(true);
    setSelectedFile(x.path);

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
              {props.dataset.dataFiles?.map((x, i) => (
                <li className={`${selectedFile === x.path ? "bg-primary-200" : "hover:bg-primary-100"} text-sm text-primary-500 font-light whitespace-nowrap my-1`} key={i} onClick={() => handleSelectFile(x)}>
                  <div className="flex gap-2 items-center py-1 cursor-pointer">
                    <img src="/img/icon-file.svg" className="w-4 h-4" />
                    <p className="text-sm py-0 my-0">{fileName(x.path)}</p>
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
                  <p className="text-sm py-0 my-0">{props.dataset?.dataFiles?.length ?? 0} files</p>
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
