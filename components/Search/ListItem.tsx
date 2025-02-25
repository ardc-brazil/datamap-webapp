import Link from "next/link";
import { MaterialSymbol } from "react-material-symbols";
import Moment from "react-moment";
import { ROUTE_PAGE_DATASETS } from "../../contants/InternalRoutesConstants";
import { bytesToSize } from "../../lib/file";
import { GetMinimalDatasetsDetasetDetailsResponse } from "../../types/BffAPI";
import { Badge } from "./Badge";


interface Props {
  dataset: GetMinimalDatasetsDetasetDetailsResponse
}

// @ts-check
export default function ListItem(props: Props) {
  return (
    <Link href={`${ROUTE_PAGE_DATASETS}/${props.dataset.id}`}>
      <div className="flex border-b border-primary-200 hover:bg-primary-100 cursor-pointer py-6">
        <div className="px-4 place-self-center">
          <MaterialSymbol icon="database" size={84} grade={-25} weight={400} className="align-middle" color="#e5e7eb" fill />
        </div>
        <div className="border-secondary-900 w-full">
          <p className="font-bold text-lg">{(props.dataset?.name == "" ? null : props.dataset?.name) ?? "No title"}</p>
          <p className="text-xs">
            {props.dataset?.data?.authors?.length > 0
              ? (<span>by {props.dataset.data.authors.map(x => x.name).join(", ")}</span>)
              : ("No author")
            }
          </p>

          <div className="py-3 text-primary-500 text-sm">
            <Moment date={props.dataset.created_at} fromNow></Moment>
            <span className="px-2">•</span>
            <span>{bytesToSize(props.dataset.current_version.files_size_in_bytes)}</span>
          </div>
          <p className="text-primary-700 text-xs">{
            props.dataset?.data?.description?.length > 300
              ? props.dataset.data?.description.substring(0, 300) + "..."
              : ((props.dataset?.data?.description == "" ? null : props.dataset?.data?.description) ?? "No description")
          }</p>
        </div>
        <div className="place-self-start">
          <Badge>{props.dataset.current_version.design_state}</Badge>
        </div>
      </div>
    </Link>
  );
}
