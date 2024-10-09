import Router from "next/router";
import { useState } from "react";
import { MaterialSymbol } from "react-material-symbols";
import Moment from "react-moment";
import { ROUTE_PAGE_DATASETS_DETAILS, ROUTE_PAGE_DATASETS_VERSION_DETAILS } from "../../../contants/InternalRoutesConstants";
import { totalDatasetVersionFilesSize } from "../../../lib/file";
import { GetDatasetDetailsResponse, GetDatasetDetailsVersionResponse } from "../../../types/BffAPI";
import Modal from "../../base/PopupModal";
import NewVersionButton from "../NewVersionButton";
import { version } from "os";
import { isLastVersionForDataset } from "../../../lib/datasetVersionSelector";

interface Props {
  onNewVersionClick(): void
  dataset: GetDatasetDetailsResponse
  datasetVersion: GetDatasetDetailsVersionResponse
  // TODO: Call API to get all available version.
  // In the future, we'll remove the list of versions from the dataset get details request
  availableVersions: GetDatasetDetailsVersionResponse[]
}

export default function DatasetVersionHandler(props: Props) {
  const [showDatasetVersionHistory, setShowDatasetVersionHistory] = useState(false);

  return (
    <>
      <button onClick={() => setShowDatasetVersionHistory(true)}>
        <span className="text-sm underline cursor-pointer">
          Version {props.datasetVersion.name}
        </span>
      </button>
      {" "}
      <span className="text-primary-500 no-underline">({totalDatasetVersionFilesSize(props.datasetVersion)})</span>
      <DatasetVersionSelector
        show={showDatasetVersionHistory}
        onVersionSelected={function (selectedVersionName: string): void {
          throw new Error("Function not implemented.");
        }}
        onClose={() => setShowDatasetVersionHistory(false)}
        availableVersions={props.availableVersions}
        onNewVersionClick={props.onNewVersionClick}
        dataset={props.dataset}
      />
    </ >
  )
}

interface DatasetVersionSelectorProps {

  show: Boolean
  availableVersions: GetDatasetDetailsVersionResponse[]
  dataset: GetDatasetDetailsResponse

  onNewVersionClick(): void
  onClose(): void;
  onVersionSelected(selectedVersionName: string): void
}

function DatasetVersionSelector(props: DatasetVersionSelectorProps) {
  return (

    <Modal
      title="History"
      confimButtonText="Close"
      cancelButtonText="Cancel"
      show={props.show}
      cancel={props.onClose}
      noPaddingContent={true}
    >
      <div>

        <div className="pb-4 px-6">
          <NewVersionButton onClick={props.onNewVersionClick} />
        </div>
        <hr />

        <div className="h-72 w-screen max-w-3xl flex-col overflow-y-scroll overscroll-none px-6 -mb-4">
          <ul >
            {props?.availableVersions
              ?.sort((a, b) => new Date(b?.created_at)?.getTime() - new Date(a?.created_at)?.getTime())
              ?.map((x, i) => {
                return (

                  <VersionSelectorItem key={i} dataset={props.dataset} version={x} />
                )
              })}
          </ul>
        </div>
      </div>

    </Modal>
  )
}

function VersionSelectorItem(props: { dataset: GetDatasetDetailsResponse, version: GetDatasetDetailsVersionResponse }) {

  function GetUpdateText() {
    if (props.version.name === "1") {
      return (
        <span className="text-xs">
          Initial release
        </span>
      )
    }

    return (
      <span className="text-xs">
        Updated <Moment date={props.version.updated_at} format="YYYY-MM-DD" />
      </span>
    )
  }

  function GetDOIText() {
    if (!props.version?.doi) {
      return null
    }

    return (
      <>
        <span>·</span>
        <span className="text-xs">
          doi: {props.version?.doi?.identifier}
        </span>
      </>
    );
  }

  function onSelectedVersion() {
    if (isLastVersionForDataset(props.dataset, props.version)) {
      Router.push({
        pathname: ROUTE_PAGE_DATASETS_DETAILS({ id: props.dataset.id }),
      });
    }

    Router.push({
      pathname: ROUTE_PAGE_DATASETS_VERSION_DETAILS({ id: props.dataset.id, versionName: props.version.name }),
    });
  }

  return (
    <li
      onClick={onSelectedVersion}
      className="h-22 border-b border-b-primary-200 p-4 flex flex-row items-center h-full hover:bg-primary-100 cursor-pointer gap-4">
      <div className="flex items-center justify-center h-14 w-14">
        <MaterialSymbol icon="stacks" size={48} className="px-1" />
      </div>
      <div className="w-full flex flex-col">
        <div className="flex flex-row justify-between">
          <span className="text-base font-body text-primary-900">Version {props.version.name} </span>
          <span className="text-xs font-body">
            <Moment date={props.version.created_at} fromNow></Moment>
          </span>
        </div>

        <div className="flex flex-row items-center justify-start gap-2">
          <GetUpdateText />
          <GetDOIText />
        </div>
      </div>
    </li>
  )
}
