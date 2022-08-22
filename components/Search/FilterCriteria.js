import React from "react";
import { Checkbox } from "./CheckboxButton";
import { RadioButton } from "./RadioButton";

export function FilterCriteria(props) {
  
  var content = buildContentFrom(props.criteria);

  return (
    <div className="border-b border-primary-200">
      <div className="mb-4 max-h-56 overflow-y-auto">
        <p className="pb-2 font-bold text-sm">{props.criteria.title}</p>
        {content}
      </div>
    </div>
  );
}
function buildContentFrom(criteria) {
  if (criteria.selection === "date-range") {
    var content = dateRange(criteria);
  } else if (criteria.selection === "multiple") {
    var content = multiple(criteria);
  } else if (criteria.selection === "one") {
    var content = one(criteria);
  }
  return content;
}

function one(criteria) {
  return criteria.options.map((x) => (
    <RadioButton key={x.id} id={x.id} parentId={criteria.id} value={x.value}>
      {x.text}
    </RadioButton>
  ));
}

function multiple(criteria) {
  return criteria.options.map((x) => (
    <Checkbox
      key={x.id}
      id={x.id}
      parentId={criteria.id}
      value={x.value}
    >
      {x.text}
    </Checkbox>
  ));
}

function dateRange(criteria) {
  return (
    <div>
      from
      <input type="date" className="form-input block" />
      to
      <input type="date" className="form-input block" />
    </div>
  );
}
