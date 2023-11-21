import React, { useState } from "react";
import { Checkbox } from "./CheckboxButton";
import { DateInput } from "./DateInput";
import { RadioButton } from "./RadioButton";

export function FilterCriteria(props) {
  var content = buildContentFrom(props.criteria, props.onCriteriaChanged);

  return (
    <div className="grid grid-cols-1 py-2">
      <div className="mb-2 max-h-56 overflow-y-auto">
        <p className="pb-2 font-bold text-sm">{props.criteria.title}</p>
        {content}
      </div>
    </div>
  );
}

function buildContentFrom(criteria, onCriteriaChanged) {
  if (criteria.selection === "date-range") {
    var content = dateRange(criteria, onCriteriaChanged);
  } else if (criteria.selection === "multiple") {
    var content = multiple(criteria, onCriteriaChanged);
  } else if (criteria.selection === "one") {
    var content = one(criteria, onCriteriaChanged);
  }
  return content;
}

function one(criteria, onCriteriaChanged) {
  const [selectedOption, setSelectedOption] = useState("")

  function onOptionChanged(optionSelected, valueSelected) {

    setSelectedOption(valueSelected)

    onCriteriaChanged(criteria, {
      valueSelected: valueSelected,
      optionSelected: optionSelected,
      criteriaSelected: criteria,
    });
  }

  return criteria.options.map((x) => (
    <RadioButton
      key={x.id}
      id={x.id}
      parentId={criteria.id}
      value={x.value}
      option={x}
      onChanged={onOptionChanged}
      checked={selectedOption === x.value}
    >
      {x.label}
    </RadioButton>
  ));
}

function multiple(criteria, onCriteriaChanged) {
  function onOptionChanged(optionSelected, valueSelected) {
    onCriteriaChanged(criteria, {
      valueSelected: valueSelected,
      optionSelected: optionSelected,
      criteriaSelected: criteria,
    });
  }

  return criteria.options.map((x) => (
    <Checkbox
      key={x.id}
      id={x.id}
      parentId={criteria.id}
      option={x}
      checked={x.option?.selected}
      onChanged={onOptionChanged}
    >
      {x.label}
    </Checkbox>
  ));
}

function dateRange(criteria, onCriteriaChanged) {
  const [date, setDate] = useState("")

  function onOptionChanged(optionSelected, valueSelected) {
    setDate(valueSelected)

    onCriteriaChanged(criteria, {
      valueSelected: valueSelected,
      optionSelected: optionSelected,
      criteriaSelected: criteria,
    });
  }

  return criteria.options.map((o) => (
    <DateInput key={o.id} option={o} onDateChanged={onOptionChanged} value={date} />
  ));
}
