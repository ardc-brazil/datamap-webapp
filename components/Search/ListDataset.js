import React from "react";
import { ListItem } from "./ListItem";
import { ListDatasetHeader } from "./ListDatasetHeader";
import { ListDatasetPageNavigator } from "./ListDatasetPageNavigator";

export function ListDataset(data) {
  const itemCount = data.data.length;
  return (
    <div className="flex flex-col mr-4">
      <ListDatasetHeader itemCount={itemCount} />
      <div className="border-t border-primary-200">
        {data.data.map((element, index) => (
          <ListItem key={index} data={element} />
        ))}
      </div>
      {/* <div className="py-8">
        <ListDatasetPageNavigator />
      </div> */}
    </div>
  );
}
