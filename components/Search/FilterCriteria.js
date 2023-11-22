import React, { useState } from "react";
import { Checkbox } from "./CheckboxButton";
import { DateInput } from "./DateInput";
import { RadioButton } from "./RadioButton";

export function FilterCriteria(props) {
  var content = buildContentFrom(props.criteria, props.onCriteriaChanged, props.lastSearchParameterDeselected);

  return (
    <div className="grid grid-cols-1 py-2">
      <div className="mb-2 max-h-56 overflow-y-auto">
        <p className="pb-2 font-bold text-sm">{props.criteria.title}</p>
        {content}
      </div>
    </div>
  );
}

function buildContentFrom(criteria, onCriteriaChanged, lastSearchParameterDeselected) {
  if (criteria.selection === "date-range") {
    var content = dateRange(criteria, onCriteriaChanged, lastSearchParameterDeselected);
  } else if (criteria.selection === "multiple") {
    var content = multiple(criteria, onCriteriaChanged, lastSearchParameterDeselected);
  } else if (criteria.selection === "one") {
    var content = one(criteria, onCriteriaChanged, lastSearchParameterDeselected);
  }
  return content;
}

function one(criteria, onCriteriaChanged, lastSearchParameterDeselected) {
  const [selectedOption, setSelectedOption] = useState("")

  // Remove current selection is changed outside
  if (selectedOption === lastSearchParameterDeselected?.value) {
    setSelectedOption("")
  }

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

function multiple(criteria, onCriteriaChanged, lastSearchParameterDeselected) {

  return criteria.options.map((x) => {
    const [selectedOption, setSelectedOption] = useState(false)

    
    // Remove current selection is changed outside
    if (x.id == lastSearchParameterDeselected?.id && selectedOption === lastSearchParameterDeselected?.value) {
      setSelectedOption(false)
    }

    function onOptionChanged(optionSelected, valueSelected) {
      setSelectedOption(optionSelected.value);
      onCriteriaChanged(criteria, {
        valueSelected: valueSelected,
        optionSelected: optionSelected,
        criteriaSelected: criteria,
      });
    }

    return <Checkbox
      key={x.id}
      id={x.id}
      parentId={criteria.id}
      optionSelected={x}
      checked={selectedOption}
      onChanged={onOptionChanged}
    >
      {x.label}
    </Checkbox>
  });
}

function dateRange(criteria, onCriteriaChanged, lastSearchParameterDeselected) {
  return criteria.options.map((o) => {
    const [selectedOption, setSelectedOption] = useState("")

    // Remove current selection is changed outside
    if (o.id == lastSearchParameterDeselected?.id && selectedOption === lastSearchParameterDeselected?.value) {
      setSelectedOption("")
    }

    function onOptionChanged(optionSelected, valueSelected) {
      setSelectedOption(valueSelected)
      optionSelected.value = valueSelected

      onCriteriaChanged(criteria, {
        valueSelected: valueSelected,
        optionSelected: optionSelected,
        criteriaSelected: criteria,
      });
    }

    return (
      <DateInput key={o.id} option={o} onDateChanged={onOptionChanged} value={selectedOption} />
    )
  });
}
