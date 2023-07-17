import { useState } from "react";
import LoggedLayout from "../../components/LoggedLayout";
import { ErrorMessage, Field, Form, Formik } from "formik";

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
    <LoggedLayout fluid={true} className="p-10">
      <div className="mb-6">
        <h2>New Dataset</h2>
        <p>Create a new dataset informing a title and remote data files.</p>
        <p className="text-xs">
          A dataset refers to a collection of data that is organized and
          structured for a specific purpose. It can consist of various types of
          information such as text, numbers, images, audio, or video.
        </p>
      </div>

      {/* <div className="mb-6">
        <label
          htmlFor="dataset-title"
          className="block mb-2 text-sm font-medium text-gray-900 dark:text-white"
        >
          Dataset title
        </label>
        <input
          type="dataset-title"
          id="dataset-title"
          placeholder="Enter dataset title"
        />
      </div> */}

      <div className="max-w-4xl">
        <Formik
          initialValues={{ datasetTitle: "" }}
          validate={(values) => {
            const errors = {};
            if (!values.datasetTitle) {
              errors.datasetTitle = "Required";
            }

            return errors;
          }}
          onSubmit={(values, { setSubmitting }) => {
            setTimeout(() => {
              alert(JSON.stringify(values, null, 2));
              setSubmitting(false);
            }, 400);
          }}
        >
          {({ isSubmitting }) => (
            <Form>
              <div className="p-2 my-2">
                <label
                  htmlFor="datasetTitle"
                  className="block mb-2 text-sm font-medium text-gray-900 dark:text-white"
                >
                  Dataset title
                </label>

                <Field
                  type="text"
                  id="datasetTitle"
                  name="datasetTitle"
                  placeholder="Enter dataset title"
                />
                <ErrorMessage
                  name="datasetTitle"
                  component="div"
                  className="text-xs text-error-600"
                />
              </div>

              <div className="p-2 my-2">
                <label
                  htmlFor="path"
                  className="block mb-2 text-sm font-medium text-gray-900 dark:text-white"
                >
                  Remote files
                </label>
                <p
                  id="helper-text-explanation"
                  className="mt-2 text-xs text-gray-500 dark:text-gray-400"
                >
                  Create a dataset from remote URLs. URLs must point to a file.
                </p>

                <RemoteFilesList />
              </div>

              <div className="relative w-full">
                <button
                  className="btn-primary my-8 absolute right-0"
                  disabled={isSubmitting}
                >
                  Create
                </button>
              </div>
            </Form>
          )}
        </Formik>
      </div>
    </LoggedLayout>
  );

  function RemoteFilesList(props) {
    const [allRemoteFiles, setAllRemoteFiles] = useState([
      {
        id: crypto.randomUUID(),
        name: "file1",
        path: "/a/b/c/file1",
      },
    ]);
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

    function onInputEnterSearch(e: React.KeyboardEvent) {
      if (e.key === "Enter") {
        onAddRemoteFile();
      }
    }

    function onRemoteRemoteFile(fileId: string) {
      console.log(fileId);
      const removed = allRemoteFiles.filter((item) => item.id != fileId);
      console.log(removed);
      setAllRemoteFiles(removed);
    }
    return (
      <div className="mt-4">
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
        {/* <span className="text-sm">Files: {allRemoteFiles.length}</span> */}

        <div className="flex my-4">
          <div className="relative w-full">
            <input
              type="text"
              id="path"
              className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-primary-500 focus:border-primary-500 block w-full p-2.5  dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-primary-500 dark:focus:border-primary-500"
              placeholder="Informe the path to a file"
              onChange={onTextChange}
              onKeyDown={onInputEnterSearch}
            />
          </div>
          <button
            type="button"
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
      <div className="flex hover:bg-primary-100 px-4 border border-primary-100">
        <div className="w-full">
          <span>{props.name}</span>
          <br />
          <span className="text-sm text-primary-500">{props.path}</span>
        </div>
        <button
          className="btn-primary-outline border rounded-full w-8 h-8 text-center py-0 px-0 mt-2"
          onClick={onRemove}
        >
          <span className="text-primary-500 hover:text-primary-900">X</span>
        </button>
      </div>
    );
  }
}
