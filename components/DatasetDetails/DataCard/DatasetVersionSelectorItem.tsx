import { GetDatasetDetailsResponse, GetDatasetDetailsVersionResponse } from "@/types/BffAPI";
import { MaterialSymbol } from "react-material-symbols";
import Moment from "react-moment";


interface DatasetVersionSelectorItemProps {
  dataset: GetDatasetDetailsResponse,
  version: GetDatasetDetailsVersionResponse
  onSelectedVersion: () => void
}

export function DatasetVersionSelectorItem(props: DatasetVersionSelectorItemProps) {
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


  return (
    <li
      onClick={props.onSelectedVersion}
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
