import Router from "next/router";
import { useState } from "react";
import { MaterialSymbol } from "react-material-symbols";
import { ROUTE_PAGE_DATASETS_DETAILS, ROUTE_PAGE_DATASETS_VERSION_DETAILS } from "../../../contants/InternalRoutesConstants";
import { GetDatasetDetailsResponse, GetDatasetDetailsVersionResponse } from "../../../types/BffAPI";
import Modal from "../../base/PopupModal";
import NewVersionButton from "../NewVersionButton";
import { isLastVersionForDataset } from "../../../lib/datasetVersionSelector";
import { DatasetVersionSelectorItem } from "./DatasetVersionSelectorItem";

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
      <button
        type="button"
        className="flex items-center gap-1.5 rounded-md border border-primary-300 bg-primary-0 pl-2.5 pr-2 py-[5px] text-[13px] font-medium text-primary-900 hover:bg-primary-100 transition-colors"
        onClick={() => setShowDatasetVersionHistory(true)}
      >
        Version {props.datasetVersion.name}
        <MaterialSymbol icon="expand_more" size={16} grade={-25} weight={400} />
      </button>
      <DatasetVersionSelector
        show={showDatasetVersionHistory}
        onVersionSelected={function (selectedVersionName: string): void {
          throw new Error("Function not implemented.");
        }}
        onClose={() => setShowDatasetVersionHistory(false)}
        availableVersions={props.availableVersions}
        onNewVersionClick={props.onNewVersionClick}
        dataset={props.dataset}
        currentVersion={props.datasetVersion}
      />
    </ >
  )
}

interface DatasetVersionSelectorProps {

  show: Boolean
  availableVersions: GetDatasetDetailsVersionResponse[]
  dataset: GetDatasetDetailsResponse
  currentVersion?: GetDatasetDetailsVersionResponse

  onNewVersionClick(): void
  onClose(): void;
  onVersionSelected(selectedVersionName: string): void
}

function DatasetVersionSelector(props: DatasetVersionSelectorProps) {
  return (

    <Modal
      title="Version history"
      confimButtonText="Close"
      cancelButtonText="Close"
      show={props.show}
      cancel={props.onClose}
      noPaddingContent={true}
      maxWidthClassName="max-w-xl"
    >
      <div data-testid="dataset-version-history-modal-content">

        <div className="flex items-center justify-between gap-4 px-5 py-3 border-b border-primary-200">
          <span className="text-[11px] leading-4 tracking-[0.08em] uppercase font-semibold text-primary-500">
            {props?.availableVersions?.length ?? 0} {props?.availableVersions?.length === 1 ? "version" : "versions"}
          </span>
          <NewVersionButton onClick={props.onNewVersionClick} />
        </div>

        <div className="max-h-80 overflow-y-auto overscroll-contain">
          <ul data-testid="dataset-version-history-modal-list" className="m-0 p-0 list-none">
            {props?.availableVersions
              ?.sort((a, b) => new Date(b?.created_at)?.getTime() - new Date(a?.created_at)?.getTime())
              ?.map((x, i) => {
                return (
                  <VersionSelectorItem
                    key={i}
                    dataset={props.dataset}
                    version={x}
                    selected={!!props.currentVersion && x.id === props.currentVersion.id}
                  />
                )
              })}
          </ul>
        </div>
      </div>

    </Modal>
  )
}

function VersionSelectorItem(props: { dataset: GetDatasetDetailsResponse, version: GetDatasetDetailsVersionResponse, selected: boolean }) {

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
    <DatasetVersionSelectorItem
      dataset={props.dataset}
      version={props.version}
      selected={props.selected}
      onSelectedVersion={onSelectedVersion}
    />
  )
}
