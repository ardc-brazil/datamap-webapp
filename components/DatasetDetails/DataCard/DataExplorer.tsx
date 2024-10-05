import Uppy from "@uppy/core";
import { useSession } from "next-auth/react";
import { useEffect, useState } from 'react';
import { MaterialSymbol } from "react-material-symbols";
import { BFFAPI } from "../../../gateways/BFFAPI";
import { isNewVersionEnabled } from "../../../lib/featureFlags";
import { FileUploadAuthTokenRequest, FileUploadAuthTokenResponse, GetDatasetDetailsResponse, GetDatasetDetailsVersionFileResponse, GetDatasetDetailsVersionResponse } from "../../../types/BffAPI";
import UppyUploader from "../../base/UppyUploader";
import DatasetFilesList from "./DatasetFilesList";
import DatasetVersionHandler from "./DatasetVersionHandler";

export interface Props {
  dataset: GetDatasetDetailsResponse
}

export default function DataExplorer(props: Props) {
  const bffGateway = new BFFAPI();
  const { data: session, status } = useSession();
  const [stagingDatasetVersion, setStagingDatasetVersion] = useState(props.dataset.current_version);


  // TODO: Remove with fake data explorer file details
  // I added this to move the .dataset.data.dataFiles to the .current_version.files
  // if the version is empty. This will be used during the transition from Remove File upload
  // to Update data files to the Datamap platform data storage.
  // FIX: This code was commented because now datafiles come from version. This must be fixed.
  // if (props.dataset?.data?.dataFiles?.length && props.dataset?.current_version?.files?.length <= 0) {
  //   props.dataset.current_version.files = props.dataset?.data?.dataFiles
  //     ?.map((item, idx) => (
  //       {
  //         id: String(idx),
  //         name: item.path
  //       } as GetDatasetDetailsVersionFileResponse
  //     ))
  // }

  // const [dataExplorerCollapsed, setDataExplorerCollapsed] = useState(false);
  const [loadingTable, setLoadingTable] = useState(false);
  const [showUploadDataModal, setShowUploadDataModal] = useState(false);
  const [uppyReference, setUppyReference] = useState(null as Uppy);
  const [uploadAuth, setUploadAuth] = useState({} as FileUploadAuthTokenResponse)

  function getToken() {
    const request = { file: { id: props.dataset.id } } as FileUploadAuthTokenRequest;
    bffGateway.createUploadFileAuthToken(request)
      .then(fileUploadAuthTokenResponse => {
        setUploadAuth(fileUploadAuthTokenResponse);
      })
  }


  function handleSelectFile(file: GetDatasetDetailsVersionFileResponse): void {
    setLoadingTable(true);

    setTimeout(() => {
      setLoadingTable(false);
    }, 1000);
  }

  // function handleCollapseDataExplorer(event): void {
  //   setDataExplorerCollapsed(!dataExplorerCollapsed);
  // }

  function onUppyStateCreated(uppy: Uppy) {
    setUppyReference(uppy);
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
              handleSelectFile={handleSelectFile} />
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

              <NewVersionButton onClick={() => {
                setShowUploadDataModal(true)
                setStagingDatasetVersion(props.dataset.current_version)
              }
              } />
            </div>
          }
        </div>
      </div>

      <Drawer
        title="Upload Data"
        show={showUploadDataModal}
        onClose={() => {
          setShowUploadDataModal(false)
        }}
        onClearAll={() => {
          uppyReference.cancelAll()
        }}
        onCreate={() => {
          console.log("uploading");
          console.log("stagingDatasetVersion", stagingDatasetVersion)
          console.log("uppyReference", uppyReference);

          // TODO: Enable file upload
          // We need to create a new DatasetVersion before start 
          // uploading files to make sure that tusd will associate it with 
          // this new version
          // uppyReference.upload()

          // TODO: Publish version after upload everything
          // ---- how to avoid sync issues in webhooks?
          // If we publish after upload, and we have webhook delay,
          // the webhook will create a new version on draft staging
          // for last files
        }}
      >
        <div>
          {stagingDatasetVersion?.files?.length > 0 &&
            <>
              <h2 className="py-2 text-primary-500 font-semibold text-xs uppercase border-b border-b-primary-200">
                Previously uploaded
              </h2>
              <DatasetFilesList
                datasetVersion={stagingDatasetVersion}
                handleSelectFile={handleSelectFile}
                onFileRemoved={(x) =>
                  setStagingDatasetVersion(
                    {
                      ...setStagingDatasetVersion,
                      files: stagingDatasetVersion.files.filter(y => y.id != x.id)
                    } as GetDatasetDetailsVersionResponse
                  )
                }
              />
            </>
          }

          <h2 className="py-2 text-primary-500 font-semibold text-xs uppercase">
            New uploads
          </h2>
          <div className="" >
            <UppyUploader
              datasetId={props.dataset.id}
              userId={uploadAuth?.user?.id}
              // TODO: Check if the token is working
              userToken={uploadAuth?.token?.jwt}
              onUppyStateCreated={onUppyStateCreated} />
          </div>
        </div>
      </Drawer>

    </div >
  )
}

// TODO: Move it to other file
function Drawer(props) {

  useEffect(() => {
    document.body.style.overflow = props?.show ? 'hidden' : '';
  }, [props.show]);


  if (!props?.show) {
    return null;
  }

  return <div className="relative z-[1005] overscroll-none" aria-labelledby="slide-over-title" role="dialog" aria-modal="true">
    <div className="fixed inset-0 bg-primary-700 bg-opacity-75 transition-opacity" aria-hidden="true"></div>
    <div className="fixed inset-0 overflow-hidden">
      <div className="absolute inset-0 overflow-hidden">
        <div className="pointer-events-none fixed inset-y-0 right-0 flex max-w-full pl-10">
          <div className="pointer-events-auto relative w-screen max-w-screen-md ">
            {/* Drawer */}
            <div className="flex h-full flex-col overflow-y-scroll overscroll-none bg-primary-50 shadow-xl">

              {/* Header */}
              <div className="fixed top-0 flex-1 w-full h-16 z-[1005] px-4 py-6 sm:px-6  bg-primary-50 overflow-clip">
                <div className="flex flex-row space-x-2">
                  <button type="button" className="flex justify-center items-center" onClick={props.onClose}>
                    <MaterialSymbol icon="close" grade={-25} size={22} weight={400} />
                  </button>
                  <h6 className="font-semibold" id="slide-over-title">{props.title}</h6>
                </div>
              </div>
              {/* Content */}
              <div className="relative shrink-0 mt-16 mb-16 px-4 sm:px-6 scroll overflow-y-clip overscroll-contain pb-16">
                {props.children}
              </div>

              {/* Footer */}
              <div className="fixed bottom-0 bg-primary-50 h-16 border-t z-[1005] border-t-primary-200 overscroll-none overflow-clip w-screen max-w-screen-md">
                <div className="flex justify-end items-center bg-primary-50 h-full px-4 space-x-2">
                  <button className="btn btn-primary-outline" onClick={props.onClearAll}>Clear all</button>
                  <button className="btn btn-primary" onClick={props.onCreate}>Create</button>
                </div>

              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>;
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