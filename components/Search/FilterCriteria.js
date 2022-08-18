import React from "react";
import { RadioButton } from "./RadioButton";

export function FilterCriteria(props) {
  return (
    <div className="mb-4 max-h-56 overflow-y-auto">
      <p className="pb-2 font-bold text-sm">{props.title}</p>
      {props.options.map((x) => (
        <RadioButton id={x.id} parentId={props.id} value={x.value}>
          {x.text}
        </RadioButton>
      ))}
    </div>
  );
}
