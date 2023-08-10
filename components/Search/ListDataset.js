import { ListDatasetHeader } from "./ListDatasetHeader";
import { ListItem } from "./ListItem";

export function ListDataset(props) {
  const itemCount = props.data.length;
  return (
    <div className="flex flex-col mr-4">
      <ListDatasetHeader itemCount={itemCount} />
      <div className="border-t border-primary-200">
        {props.data.map((element, index) => (
          <ListItem key={index} data={element} />
        ))}
      </div>
      {/* <div className="py-8">
        <ListDatasetPageNavigator />
      </div> */}
    </div>
  );
}
