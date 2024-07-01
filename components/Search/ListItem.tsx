import Link from "next/link";
import { MaterialSymbol } from "react-material-symbols";
import 'react-material-symbols/outlined'; // Place in your root app file. There are also `sharp` and `outlined` variants.
import Moment from "react-moment";
import { ROUTE_PAGE_DATASETS } from "../../contants/InternalRoutesConstants";
import { totalDatasetVersionFilesSize } from "../../lib/fileSize";
import { GetDatasetsDetasetDetailsResponse } from "../../types/BffAPI";


interface Props {
  dataset: GetDatasetsDetasetDetailsResponse
}

// @ts-check
export function ListItem(props: Props) {
  return (
    <Link href={`${ROUTE_PAGE_DATASETS}/${props.dataset.id}`}>
      <div className="flex border-b border-primary-200 hover:bg-primary-100 cursor-pointer py-6">
        <div className="px-4 place-self-center">
          <MaterialSymbol icon="database" size={84} grade={-25} weight={400} className="align-middle" color="#e5e7eb" fill />
        </div>
        <div className="border-secondary-900">
          <p className="font-bold text-lg">{(props.dataset?.name == "" ? null : props.dataset?.name) ?? "No title"}</p>
          <p>
            {props.dataset?.data.author && props.dataset?.data.author?.name != "" ? (
              <span>by {props.dataset.data.author.name}</span>
            ) : (
              "No author"
            )}
          </p>

          <div className="py-3 text-primary-500">
            <Moment date={props.dataset.created_at} fromNow></Moment>
            <span className="px-2">•</span>
            <span>{totalDatasetVersionFilesSize(props.dataset.current_version)}</span>
          </div>
          <p className="text-primary-700">{
            props.dataset?.data?.description?.length > 300
              ? props.dataset.data?.description.substring(0, 300) + "..."
              : ((props.dataset?.data?.description == "" ? null : props.dataset?.data?.description) ?? "No description")
          }</p>
        </div>
      </div>
    </Link>
  );
}
