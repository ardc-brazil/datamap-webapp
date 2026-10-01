import Link from "next/link";
import Moment from "react-moment";
import { EmbargoBadge } from "../Embargo/EmbargoBadge";
import { ROUTE_PAGE_DATASETS } from "../../contants/InternalRoutesConstants";
import { bytesToSize } from "../../lib/file";
import { GetMinimalDatasetsDetasetDetailsResponse } from "../../types/BffAPI";

const DESIGN_STATE_STYLES: Record<string, string> = {
  PUBLISHED: "text-[#14532d] bg-[#dcfce7]",
};

function DesignStatePill(props: { state: string }) {
  const style = DESIGN_STATE_STYLES[props.state?.toUpperCase()] ?? "text-primary-700 bg-primary-200";
  return (
    <span className={`inline-flex items-center px-2.5 py-[3px] text-xs leading-[18px] font-semibold rounded-full capitalize ${style}`}>
      {props.state?.toLowerCase()}
    </span>
  );
}


interface Props {
  dataset: GetMinimalDatasetsDetasetDetailsResponse
}

// @ts-check
export default function ListItem(props: Props) {
  return (
    <Link href={`${ROUTE_PAGE_DATASETS}/${props.dataset.id}`}>
      <div className="grid grid-cols-[minmax(0,1fr)_auto] gap-6 border-b border-primary-200 hover:bg-primary-100/60 cursor-pointer py-5 px-2 -mx-2 rounded-sm">
        <div className="flex flex-col gap-1.5 min-w-0">
          <span className="text-base leading-6 font-semibold text-primary-900">{(props.dataset?.name == "" ? null : props.dataset?.name) ?? "No title"}</span>
          <span className="text-[13px] leading-[18px] text-primary-600">
            {props.dataset?.data?.authors?.length > 0
              ? props.dataset.data.authors.map(x => x.name).join(", ")
              : "No author"
            }
          </span>
          <span className="mt-1 text-[13px] leading-5 text-primary-700">{
            props.dataset?.data?.description?.length > 300
              ? props.dataset.data?.description.substring(0, 300) + "..."
              : ((props.dataset?.data?.description == "" ? null : props.dataset?.data?.description) ?? "No description")
          }</span>
          <span className="mt-1.5 font-mono text-xs leading-[18px] text-primary-500">
            <Moment date={props.dataset.created_at} fromNow></Moment>
            <span className="px-1.5">·</span>
            <span>{bytesToSize(props.dataset.current_version.files_size_in_bytes)}</span>
          </span>
        </div>
        <div className="self-start">
          {props.dataset.embargo?.active
            ? <EmbargoBadge embargo={props.dataset.embargo} compact />
            : <DesignStatePill state={props.dataset.current_version.design_state} />}
        </div>
      </div>
    </Link>
  );
}
