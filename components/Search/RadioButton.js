import React from "react";

export function RadioButton(props) {
  return (
    <div className="flex items-center">
      <label for={props.id} className="w-full cursor-pointer py-2">
        <input
          id={props.id}
          type="radio"
          value={props.value}
          name={`radio-component-${props.parentId}`}
          className="w-5 h-5 accent-primary-900" />
        <span className="ml-2 text-sm font-medium text-primary-900 align-top">
          {props.children}
        </span>
      </label>
    </div>
  );
}
