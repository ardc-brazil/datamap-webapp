import { GetDatasetDetailsResponse, GetDatasetDetailsVersionResponse } from "@/types/BffAPI";
import Moment from "react-moment";


interface DatasetVersionSelectorItemProps {
  dataset: GetDatasetDetailsResponse,
  version: GetDatasetDetailsVersionResponse
  selected?: boolean
  onSelectedVersion: () => void
}

export function DatasetVersionSelectorItem(props: DatasetVersionSelectorItemProps) {
  function GetUpdateText() {
    if (props.version.name === "1") {
      return <span>Initial release</span>
    }

    return (
      <span>
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
        <span aria-hidden="true">·</span>
        <span className="font-mono text-xs break-all">
          doi: {props.version?.doi?.identifier}
        </span>
      </>
    );
  }


  return (
    <li
      onClick={props.onSelectedVersion}
      aria-current={props.selected ? "true" : undefined}
      className={`flex items-start justify-between gap-4 px-5 py-3 border-b border-primary-100 last:border-b-0 cursor-pointer transition-colors ${props.selected ? "bg-secondary-500" : "hover:bg-primary-50"}`}
    >
      <div className="min-w-0 flex flex-col gap-0.5">
        <div className="flex items-center gap-2">
          <span className="text-sm leading-5 font-semibold text-primary-900">Version {props.version.name}</span>
          {props.selected &&
            <span className="inline-flex px-2 py-px rounded-full bg-primary-900 text-primary-50 text-[11px] leading-4 font-semibold">
              Current
            </span>
          }
        </div>
        <div className="flex flex-wrap items-baseline gap-x-1.5 text-[13px] leading-5 text-primary-500">
          <GetUpdateText />
          <GetDOIText />
        </div>
      </div>
      <span className="flex-none text-[13px] leading-5 text-primary-500 whitespace-nowrap">
        <Moment date={props.version.created_at} fromNow></Moment>
      </span>
    </li>
  )
}
