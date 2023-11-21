import React from "react";
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
  function onChanged(option) {
    _selected.clear();
    _selected.set(option.id, option);
    onCriteriaChanged(criteria, _selected);
  }

  function onChanged(props, selected) {
    var event = {};
    if (selected) {
      event = {
        selected: selected,
        option: props,
      };
    } else {
      event = {
        selected: selected,
        option: props,
      };
    }

    onCriteriaChanged(criteria, event);
  }

  return criteria.options.map((x) => (
    <RadioButton
      key={x.id}
      id={x.id}
      parentId={criteria.id}
      value={x.value}
      option={x}
      onChanged={onChanged}
    >
      {x.label}
    </RadioButton>
  ));
}

function multiple(criteria, onCriteriaChanged) {
  var event = {
    selected: false,
    option: {},
  };

  function onChanged(props, selected) {
    if (selected) {
      event = {
        selected: true,
        option: props,
      };
    } else {
      event = {
        selected: false,
        option: props,
      };
    }

    onCriteriaChanged(criteria, event);
  }

  return criteria.options.map((x) => (
    <Checkbox
      key={x.id}
      id={x.id}
      // TODO: Criteria ID should be a reference inside Option
      parentId={criteria.id}
      option={x}
      onChanged={onChanged}
    >
      {x.label}
    </Checkbox>
  ));
}

function dateRange(criteria, onCriteriaChanged) {
  function onDateChanged(option, value) {
    const event = {
      selected: value,
      option: option,
    };
    onCriteriaChanged(criteria, event);
  }

  return criteria.options.map((o) => (
    <DateInput key={o.id} option={o} onDateChanged={onDateChanged} />
  ));
}
