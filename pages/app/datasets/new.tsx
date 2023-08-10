import axios from "axios";
import { ErrorMessage, Field, FieldArray, Form, Formik, FormikHelpers } from "formik";
import { useState } from "react";
import LoggedLayout from "../../../components/LoggedLayout";

import Router from "next/router";
import { TabPanel } from "../../../components/DatasetDetails/TabPanel";
import { Tabs } from "../../../components/DatasetDetails/Tabs";
import LayoutFullScreen from "../../../components/LayoutFullScreen";
import Alert from "../../../components/base/Alert";
import CloseButton from "../../../components/base/CloseButton";
import Modal from "../../../components/base/PopupModal";
import { ROUTE_PAGE_DATASETS_DETAILS } from "../../../contants/InternalRoutesConstants";
import { isValidPath } from "../../../lib/paths";

interface FormValues {
  datasetTitle?: string,
  urls?: DatafilePath[]
  remoteFilesCount: number
}

interface DatafilePath {
  url: string,
  confirmed: boolean
}
export default function NewPage(props) {
  const [showModal, setShowModal] = useState(false);
  const [datasetCreateResponse, setDatasetCreateResponse] = useState(null);
  const [showSuccessAlert, setShowSuccessAlert] = useState(false);

  function datasetCreated(datasetResponse: any): void {
    setShowModal(true);
    setShowSuccessAlert(true);
    setDatasetCreateResponse(datasetResponse);
  }

  function viewDataset(): void {
    Router.push(ROUTE_PAGE_DATASETS_DETAILS(datasetCreateResponse));
  }

  const initialValues: FormValues = {
    datasetTitle: '',
    urls: [{ url: '', confirmed: false }],
    remoteFilesCount: 0
  };

  function validatePath(values: FormValues, value: string, index: number, isSubmiting) {

    if (index > 0 && values.urls[index].url == '') {
      return null;
    }

    if (!isValidPath(value)) {
      return 'Invalid path. Pattern: /path/to/the/file.ext'
    }

    return null;
  }

  function addDataFile(item: DatafilePath, push: any, setFieldTouched, index: number) {
    if (isValidPath(item?.url)) {
      item.confirmed = true;
      push({ url: '', confirmed: false } as DatafilePath);
      setFieldTouched(`urls.${index}.url`, true, true);
    }
  }

  function pathName(url: string): string {
    const r = /.*\/(.*)$/g;
    const groups = r.exec(url);
    return groups[1];
  }

  function onAlertClose(): void {
    setShowSuccessAlert(false);
  }

  function handleValidateForm(values: FormValues) {
    const errors = {} as any;
    if (!values.datasetTitle) {
      errors.datasetTitle = "Required";
    }

    const confirmed = values.urls.filter(x => x && x.confirmed);
    if (confirmed.length <= 0) {
      errors.remoteFilesCount = 'You have to informe almost one remote file.';
    }

    return errors;
  }

  function handleSubmitForm(values: FormValues, actions: FormikHelpers<any>) {
    const datasetInfo = values;
    datasetInfo.urls = datasetInfo.urls.filter(x => x.confirmed);

    axios.post("/api/datasets", datasetInfo)
      .then(response => {
        if (response.status == 200) {
          datasetCreated({ name: values.datasetTitle, ...response.data });
          actions.resetForm();
        } else {
          console.log(response);
          alert("Sorry! Error to create a new dataset.");
        }
      })
      .catch(error => {
        console.log(error);
        alert("Sorry! Error to create a new dataset.");
      })
      .finally(() => actions.setSubmitting(false));
  }

  return (
    <LoggedLayout noPadding={false}>
      <Formik
        initialValues={initialValues}
        validate={handleValidateForm}
        onSubmit={handleSubmitForm}
      >
        {({ isSubmitting, values, setFieldTouched }) => (
          <Form>
            <LayoutFullScreen >
              <div className="max-w-2xl h-full">
                <Alert callout="Success" show={showSuccessAlert} closed={onAlertClose}>
                  <p className="font-bold">The dataset '{datasetCreateResponse?.name}' was created with success!</p>
                  <p>Now, you must fill in the maximum of details about the dataset to facilitate the future
                    searches and the data quality of the data platform.</p>
                </Alert>
                <h2 className="font-bold">New Dataset</h2>
                <p>Create a new dataset informing a title and remote data files.</p>
                <p className="text-xs">
                  A dataset refers to a collection of data that is organized and
                  structured for a specific purpose. It can consist of various types of
                  information such as text, numbers, images, audio, or video.
                </p>

                <div className="mt-8">
                  <h6 className=" font-bold">Dataset Identification</h6>
                  <p className="text-xs">
                    Give a unique name for your dataset that will be easy to identify and understand the meaning and possible uses for it.
                  </p>
                  <div className="my-2">
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
                      onKeyDown={e => { e.key === 'Enter' && e.preventDefault() }}
                    />
                    <ErrorMessage
                      name="datasetTitle"
                      component="div"
                      className="text-xs text-error-600"
                    />

                  </div>

                  <h6 className="font-bold">Data files</h6>
                  <p className="text-xs">
                    Your dataset is composed of data files. You have to list all data files that compose your dataset using the options bellow.
                  </p>
                  <div className="my-2">
                    <Tabs>
                      <TabPanel title="Remote files">
                        <label
                          htmlFor="path"
                          className="block mb-2 text-sm font-medium text-gray-900 dark:text-white"
                        >
                          Data files
                        </label>
                        <span
                          id="helper-text-explanation"
                          className="mt-2 text-xs text-gray-500 dark:text-gray-400 font-light"
                        >
                          List the path to the data files from remote URLs. The pattern must be <pre className="inline-block">/path/to/the/file.ext</pre>.
                        </span>

                        <FieldArray name="urls">
                          {({ remove, push }) => {
                            return (
                              <div>
                                {values.urls.length > 0 &&
                                  values.urls.map((item: DatafilePath, index: number) => {

                                    if (item?.confirmed) {
                                      if (item && item?.url) {
                                        return (
                                          <div key={index} className="flex items-center hover:bg-primary-100 px-4 border border-primary-100">
                                            <div className="w-full">
                                              <span>{pathName(item?.url)}</span>
                                              <br />
                                              <span className="text-sm text-primary-500">{item?.url}</span>
                                            </div>
                                            <CloseButton onClick={() => {
                                              remove(index);
                                              setFieldTouched(`urls.${index}.url`, true, true)
                                            }} />
                                          </div>
                                        );
                                      }
                                    } else {

                                      return (
                                        <div key={index} className="flex mt-4 justify-center items-start">
                                          <div className="w-full">
                                            <Field
                                              name={`urls.${index}.url`}
                                              type="text"
                                              className="items-center justify-center"
                                              placeholder="Informe the path to a file"
                                              validate={(value) => {
                                                return validatePath(values, value, index, isSubmitting);
                                              }}
                                              onKeyPress={e => {
                                                if (e.which === 13) {
                                                  addDataFile(item, push, setFieldTouched, index);
                                                  e.preventDefault();
                                                }
                                              }}
                                            />

                                            <ErrorMessage
                                              name={`urls.${index}.url`}
                                              component="div"
                                              className="text-xs text-error-600"
                                            />
                                            <ErrorMessage
                                              name='remoteFilesCount'
                                              component="div"
                                              className="text-xs text-error-600"
                                            />
                                          </div>
                                          <button
                                            type="button"
                                            className="btn-primary btn-small mx-2 h-8 mt-1"
                                            onClick={() => {
                                              addDataFile(item, push, setFieldTouched, index);
                                            }}
                                          >
                                            <span className="whitespace-nowrap">Add File</span>
                                          </button>
                                        </div>
                                      );
                                    }
                                  })
                                }
                              </div>
                            );
                          }}
                        </FieldArray>
                      </TabPanel>
                      <TabPanel title="AWS S3">
                        <div className="text-center">
                          <h4> Unavaible, <span className="text-primary-400">for while</span>!</h4>
                          <p>We are working in this feature yet. But is good to know that you need this.</p>
                        </div>
                      </TabPanel>
                    </Tabs>
                  </div>
                </div>
              </div>

              <div className="w-full h-24 border-t border-primary-200 ">
                <div className="container mx-auto max-w-3xl flex justify-end">
                  <button type="submit"
                    className="btn-primary mt-4"
                    disabled={isSubmitting}
                  >
                    Create Dataset
                  </button>
                </div>
              </div>

            </LayoutFullScreen>
          </Form>
        )}
      </Formik>

      <Modal
        title="Create new Dataset"
        show={showModal}
        confimButtonText="View Dataset"
        cancel={() => setShowModal(false)}
        confim={viewDataset}
      >
        <div>
          <p className="font-bold">The dataset '{datasetCreateResponse?.name}' was created with success!</p>
          <p>Now, you must fill in the maximum of details about the dataset to facilitate the future
            searches and the data quality of the data platform.</p>
        </div>
      </Modal>
    </LoggedLayout >
  );
}

NewPage.auth = {
  role: "admin",
  loading: <div>loading...</div>,
};