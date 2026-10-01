import React from "react";

export function RadioButton(props) {
  function onChange(e) {
    props.onChanged(props.option, e.target.value);
  }
  return (
    <div className="flex items-center">
      <label htmlFor={props.id} className="flex items-center gap-2.5 w-full cursor-pointer m-0 py-[5px] font-normal">
        <input
          id={props.id}
          type="radio"
          value={props.value}
          name={`radio-component-${props.parentId}`}
          checked={props.checked}
          className="w-4 h-4 p-0 flex-none accent-primary-900"
          onChange={onChange}
        />
        <span className="text-sm leading-5 text-primary-700">
          {props.children}
        </span>
      </label>
    </div>
  );
}
