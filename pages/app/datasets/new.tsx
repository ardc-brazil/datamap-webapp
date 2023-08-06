import { useState } from "react";
import LoggedLayout from "../../../components/LoggedLayout";
import { ErrorMessage, Field, Form, Formik } from "formik";
import { v4 as uuidv4 } from "uuid";
import axios from "axios";

import Modal from "../../../components/base/PopupModal";
import Router from "next/router";
import { ROUTE_PAGE_DATASETS, ROUTE_PAGE_DATASETS_DETAILS } from "../../../contants/InternalRoutesConstants";

export default function NewPage(props) {
  const [showModal, setShowModal] = useState(false);
  const [datasetCreateResponse, setDatasetCreateResponse] = useState(null);

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

  function datasetCreated(datasetResponse: any): void {
    setShowModal(true);
    setDatasetCreateResponse(datasetResponse);
  }

  function viewDataset(): void {
    Router.push(ROUTE_PAGE_DATASETS_DETAILS(datasetCreateResponse));
  }

  return (
    <LoggedLayout noPadding={false}>
      <div className="max-w-3xl">
        <h2>New Dataset</h2>
        <p>Create a new dataset informing a title and remote data files.</p>
        <p className="text-xs ">
          A dataset refers to a collection of data that is organized and
          structured for a specific purpose. It can consist of various types of
          information such as text, numbers, images, audio, or video.
        </p>

        <div>
          <Formik
            initialValues={{ datasetTitle: '' }}
            validate={values => {
              const errors = {} as any;
              console.log("alidate");
              if (!values.datasetTitle) {
                errors.datasetTitle = "Required";
              }

              return errors;
            }}
            onSubmit={(values, { setSubmitting }) => {
              axios.post("/api/datasets", values)
                .then(response => {
                  datasetCreated({ name: values.datasetTitle, ...response.data });
                })
                .catch(error => {
                  console.log(error);
                  alert("error");
                })
                .finally(() => setSubmitting(false));

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
                    className="invalid:border-error-500"
                  />
                  <ErrorMessage
                    name="datasetTitle"
                    component="div"
                    className="text-xs text-error-600"
                  />
                </div>

                <hr />
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
                    Create a dataset from remote URLs. URLs must point to a
                    file.
                  </p>

                  <RemoteFilesList />
                </div>

                <hr />
                <div className="flex justify-end items-center w-full">
                  <button type="submit"
                    className="btn-primary btn-lg mt-4"
                    disabled={isSubmitting}
                  >
                    Create
                  </button>
                </div>
              </Form>
            )}
          </Formik>
        </div>
      </div>

      <Modal
        title="Create new Dataset"
        show={showModal}
        confimButtonText="View Dataset"
        cancel={() => setShowModal(false)}
        confim={viewDataset}
      >
        <p className="font-bold">The dataset '{datasetCreateResponse?.name}' was created with success!</p>
        <p>Now, you must fill in the maximum of details about the dataset to facilitate the future
          searches and the data quality of the data platform.</p>
      </Modal>

    </LoggedLayout>
  );

  function RemoteFilesList(props) {
    const [allRemoteFiles, setAllRemoteFiles] = useState([
      {
        id: uuidv4(),
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
          id: uuidv4(),
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

        <div className="flex items-center my-4">
          <div className="relative w-full">
            <input
              type="text"
              id="path"
              placeholder="Informe the path to a file"
              onChange={onTextChange}
              onKeyDown={onInputEnterSearch}
            />
          </div>
          <button
            type="button"
            className="btn-primary ml-4 w-28 rounded-2xl"
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
      <div className="flex items-center hover:bg-primary-100 px-4 border border-primary-100">
        <div className="w-full">
          <span>{props.name}</span>
          <br />
          <span className="text-sm text-primary-500">{props.path}</span>
        </div>
        <button
          className="btn-primary-outline border rounded-full w-8 h-8 text-center py-0 px-0"
          onClick={onRemove}
        >
          <div className="text-primary-500 hover:text-primary-900">
            <svg className="w-7 h-3" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 14 14">
              <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="m1 1 6 6m0 0 6 6M7 7l6-6M7 7l-6 6" />
            </svg>
          </div>
        </button>
      </div>
    );
  }
}

NewPage.auth = {
  role: "admin",
  loading: <div>loading...</div>,
};