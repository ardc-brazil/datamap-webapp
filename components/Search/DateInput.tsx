import React from "react";
import { Props } from "../types/BaseInterfaces";
import { FilterOption } from "../types/FilterOption";

interface DateInputProps extends Props {
  option: FilterOption;
  onDateChanged(option: FilterOption, value: string): void;
  date: string;
}

export function DateInput(props: DateInputProps) {
  function onDateChanged(e: React.ChangeEvent<HTMLInputElement>) {
    props.onDateChanged(props.option, e.target.value);
  }

  return (
    <div>
      <span>{props.option.text}</span>
      <input
        key={props.option.id}
        type="date"
        className="form-input block"
        value={props.date}
        onChange={onDateChanged}
      />
    </div>
  );
}
