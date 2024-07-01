import Link from "next/link";
import { ROUTE_PAGE_DATASETS } from "../../contants/InternalRoutesConstants";
import 'react-material-symbols/outlined'; // Place in your root app file. There are also `sharp` and `outlined` variants.
import { MaterialSymbol } from "react-material-symbols";

// @ts-check
export function ListItem(props) {
  function getTotalFileSize(data) {
    let totalGB = 0;

    // TODO: Use a library like moment.js but for units.
    data?.forEach((d) => {
      if (d.file_size_gb) totalGB += parseFloat(d.file_size_gb);
    });

    return totalGB + "GB";
  }

  return (
    <Link href={`${ROUTE_PAGE_DATASETS}/${props.data.id}`}>
      <div className="flex border-b border-primary-200 hover:bg-primary-100 cursor-pointer py-6">
        <div className="px-4 place-self-center">
          <MaterialSymbol icon="database" size={84} grade={-25} weight={400} className="align-middle" color="#e5e7eb" fill />
        </div>
        <div className="border-secondary-900">
          <p className="font-bold text-lg">{(props.data?.name == "" ? null : props.data?.name) ?? "No title"}</p>
          <p>
            {props.data?.author && props.data?.author?.name != "" ? (
              <span>by {props.data.author.name}</span>
            ) : (
              "No author"
            )}
          </p>

          <div className="py-3 text-primary-500">
            <span>1mo ago</span>
            <span className="px-2">•</span>
            <span>{getTotalFileSize(props.data.dataFiles)}</span>
          </div>
          <p className="text-primary-700">{
            props.data?.description?.length > 300
              ? props.data.description.substring(0, 300) + "..."
              : ((props.data?.description == "" ? null : props.data.description) ?? "No description")
          }</p>
        </div>
      </div>
    </Link>
  );
}
