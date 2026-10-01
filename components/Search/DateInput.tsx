import React from "react";
import { Props } from "../types/BaseInterfaces";
import { FilterOption } from "../types/FilterOption";

interface DateInputProps extends Props {
  option: FilterOption;
  onDateChanged(option: FilterOption, value: string): void;
  value: string;
}

export function DateInput(props: DateInputProps) {
  function onDateChanged(e: React.ChangeEvent<HTMLInputElement>) {
    props.onDateChanged(props.option, e.target.value);
  }

  return (
    <div className="mb-1.5">
      {props.option.text && <span className="block mb-1 text-xs text-primary-500">{props.option.text}</span>}
      <input
        key={props.option.id}
        type="date"
        className="block w-full h-9 px-2.5 py-0 text-sm rounded-md border border-primary-300 bg-primary-0 text-primary-900"
        value={props.value}
        onChange={onDateChanged}
      />
    </div>
  );
}
