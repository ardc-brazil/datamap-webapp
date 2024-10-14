import { GetMinimalDatasetsDetasetDetailsResponse } from "../../types/BffAPI";
import { ListDatasetHeader } from "./ListDatasetHeader";
import ListItem from "./ListItem";

interface Props {
  data: GetMinimalDatasetsDetasetDetailsResponse[]
  requestedAt: number
}

export function ListDataset(props: Props) {
  const itemCount = props.data?.length;
  return (
    <div id="listDataset" className="flex flex-col mr-4 w-full">
      <ListDatasetHeader itemCount={itemCount} requestedAt={props?.requestedAt} />
      <div className="border-t border-primary-200">
        {props.data.map((element, index) => (
          <ListItem key={index} dataset={element} />
        ))}
      </div>
      {/* <div className="py-8">
        <ListDatasetPageNavigator />
      </div> */}
    </div>
  );
}
