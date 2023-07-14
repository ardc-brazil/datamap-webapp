import { useState } from "react";
import LoggedLayout from "../../components/LoggedLayout";
import { randomUUID } from "crypto";
export default function DatasetDetails(props) {
  function getFileUrls(data: any[]) {
    if (data.length > 0) {
      return props.dataset.data[0];
    }

    // default file
    return {
      file_type: ".nc",
      download_path: "/OCO2GriddedXCO2_20200727_v2_1605923534.nc",
      format: "netCDF",
      file_size_gb: "0.1",
    };
  }

  return (
    <LoggedLayout fluid={false}>
      <h2>New Dataset</h2>

      <div className="mb-6">
        <label
          htmlFor="dataset-title"
          className="block mb-2 text-sm font-medium text-gray-900 dark:text-white"
        >
          Dataset title
        </label>
        <input
          type="dataset-title"
          id="dataset-title"
          className="shadow-sm bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500 dark:shadow-sm-light"
          placeholder="Enter dataset title"
        />
      </div>

      <div className="mb-6">
        <label
          htmlFor="path"
          className="block mb-2 text-sm font-medium text-gray-900 dark:text-white"
        >
          Remote files
        </label>
        <p
          id="helper-text-explanation"
          className="mt-2 text-sm text-gray-500 dark:text-gray-400"
        >
          Create a dataset from remote URLs. URLs must point to a file.
        </p>

        <RemoteFilesList />
      </div>

      <button className="btn-primary my-8">Create</button>
    </LoggedLayout>
  );

  function RemoteFilesList(props) {
    const [allRemoteFiles, setAllRemoteFiles] = useState([]);
    const [remoteFilePath, setRemoteFilePath] = useState("");

    function onAddRemoteFile(): void {
      const tokens = remoteFilePath.split("/");
      const fileName = tokens[tokens.length - 1];

      setAllRemoteFiles((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          name: fileName,
          path: remoteFilePath,
        },
      ]);
    }

    function onTextChange(e: React.ChangeEvent<HTMLInputElement>) {
      setRemoteFilePath(e.target.value);
    }

    function onRemoteRemoteFile(fileId: string) {
      console.log(fileId);
      const removed = allRemoteFiles.filter((item) => item.id != fileId);
      console.log(removed);
      setAllRemoteFiles(removed);
    }
    return (
      <div className="mt-4">
        <span className="text-sm">Files: {allRemoteFiles.length}</span>
        {allRemoteFiles.length > 0 && (
          <div className="mb-4">
            {allRemoteFiles.map((file, index) => (
              <RemoteFileItem
                key={index}
                id={file.id}
                name={file.name}
                path={file.path}
                onRemoteRemoteFile={onRemoteRemoteFile}
              />
            ))}
          </div>
        )}

        <div className="flex my-4">
          <label htmlFor="path" className="sr-only">
            Search
          </label>
          <div className="relative w-full">
            <input
              type="text"
              id="path"
              className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5  dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
              placeholder="Informe the path to a file"
              onChange={onTextChange}
            />
          </div>
          <button
            type="submit"
            className="btn-primary ml-4 w-28"
            onClick={onAddRemoteFile}
          >
            <span className="w-full inline-block">Add File</span>
          </button>
        </div>
      </div>
    );
  }

  function RemoteFileItem(props): JSX.Element {
    function onRemove(): void {
      props.onRemoteRemoteFile(props.id);
    }

    return (
      <div className="flex p-4 hover:bg-primary-100 border border-primary-100">
        <div className="w-full">
          <p className="">{props.name}</p>
          <p className="pl-4 text-sm text-primary-500">{props.path}</p>
        </div>

        <button
          className="border border-primary-200 hover:bg-primary-400 hover:text-primary-50 rounded-full ml-4 px-4"
          onClick={onRemove}
        >
          X
        </button>
      </div>
    );
  }
}
