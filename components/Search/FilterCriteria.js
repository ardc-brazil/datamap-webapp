import React from "react";
import { Checkbox } from "./CheckboxButton";
import { RadioButton } from "./RadioButton";

export function FilterCriteria(props) {
  var content = buildContentFrom(props.criteria, props.onCriteriaChanged);

  return (
    <div className="border-b border-primary-200">
      <div className="mb-4 max-h-56 overflow-y-auto">
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
  var _selected = new Map();

  function onChange(option) {
    _selected.clear();
    _selected.set(option.id, option);
    onCriteriaChanged(criteria, _selected);
  }

  return criteria.options.map((x) => (
    <RadioButton
      key={x.id}
      id={x.id}
      parentId={criteria.id}
      value={x.value}
      onChange={onChange}
    >
      {x.text}
    </RadioButton>
  ));
}

function multiple(criteria, onCriteriaChanged) {
  var _selected = new Map();
  var event = {
    selected: false,
    option: {}
  };

  function onChanged(props, selected) {
    if (selected) {
      _selected.set(props.id, props);
      event = {
        selected: true,
        option: props
      }
    } else {
      _selected.delete(props.id);
      event = {
        selected: false,
        option: props
      }
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
      {x.text}
    </Checkbox>
  ));
}

function dateRange(criteria, onCriteriaChanged) {
  var _selected = new Map();

  function onStartDateChanged(e) {
    _selected.set("start-date", e.target.value);
    onCriteriaChanged(criteria, _selected);
  }
  function onEndDateChanged(e) {
    _selected.set("end-date", e.target.value);
    onCriteriaChanged(criteria, _selected);
  }
  return (
    <div>
      from
      <input
        type="date"
        className="form-input block"
        onChange={onStartDateChanged}
      />
      to
      <input
        type="date"
        className="form-input block"
        onChange={onEndDateChanged}
      />
    </div>
  );
}
