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
      <label htmlFor={props.optionSelected.id} className="flex items-center gap-2.5 w-full cursor-pointer m-0 py-[5px] font-normal">
        <input
          id={props.optionSelected.id}
          type="checkbox"
          name={`checkbox-component-${props.parentId}`}
          checked={props.checked}
          className="w-4 h-4 p-0 flex-none rounded-[3px] accent-primary-900"
          onChange={toggleSelected}
        />
        <span className="text-sm leading-5 text-primary-700">
          {props.children}
        </span>
      </label>
    </div>
  );
}
