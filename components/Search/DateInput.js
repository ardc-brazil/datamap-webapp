import React from "react";

export function DateInput(props) {
  function onDateChanged(e) {
    props.onDateChanged(props.option, e.target.value);
  }

  return (
    <div>
      <span>{props.option.text}</span>
      <input
        key={props.option.id}
        type="date"
        className="form-input block"
        value={props.option.selected}
        onChange={onDateChanged} />
    </div>
  );
}
