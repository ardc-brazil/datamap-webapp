import React from "react";

type Props = {
  children?: React.ReactNode;
  optionSelected: Option;
  parentId: number;
  onChanged?: Function;
  checked: boolean;
};

type Option = {
  id: string;
  value: string;
  selected: boolean;
};

export function Checkbox(props: Props) {
  function toggleSelected(e: React.ChangeEvent<HTMLInputElement>) {
    props.onChanged(props.optionSelected, e.target.checked);
  }

  return (
    <div className="flex items-center">
      <label htmlFor={props.optionSelected.id} className="w-full cursor-pointer py-2">
        <input
          id={props.optionSelected.id}
          type="checkbox"
          name={`checkbox-component-${props.parentId}`}
          checked={props.checked}
          className="w-5 h-5 accent-primary-900"
          onChange={toggleSelected}
        />
        <span className="ml-2 text-sm font-medium text-primary-900 align-top">
          {props.children}
        </span>
      </label>
    </div>
  );
}
