import React from "react";

export function Checkbox(props) {
  return (
    <div className="flex items-center">
      <label htmlFor={props.id} className="w-full cursor-pointer py-2">
        <input
          id={props.id}
          type="checkbox"
          value={props.value}
          name={`checkbox-component-${props.parentId}`}
          className="w-5 h-5 accent-primary-900" />
        <span className="ml-2 text-sm font-medium text-primary-900 align-top">
          {props.children}
        </span>
      </label>
    </div>
  );
}
