import React from "react";

type Props = {
  children?: React.ReactNode;
  option: Option;
  parentId: number;
  onChanged?: Function;
};

type Option = {
  id: string;
  value: string;
  selected: boolean;
};

export function Checkbox(props: Props) {
  function toggleSelected(e: React.ChangeEvent<HTMLInputElement>) {
    props.onChanged(props.option, e.target.checked);
  }

  return (
    <div className="flex items-center">
      <label htmlFor={props.option.id} className="w-full cursor-pointer py-2">
        <input
          id={props.option.id}
          type="checkbox"
          value={props.option.value}
          name={`checkbox-component-${props.parentId}`}
          checked={props.option.selected}
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
