import React from "react";

export function DateInput(props) {
  function onDateChanged(e) {
    props.onDateChanged(props.option, e);
  }

  return (
    <div>
      <span>{props.option.text}</span>
      <input
        key={props.option.id}
        type="date"
        className="form-input block"
        onChange={onDateChanged} />
    </div>
  );
}
