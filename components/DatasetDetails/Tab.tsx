import React from "react";
import { Props } from "../types/BaseInterfaces";

export interface TabProps extends Props {
  id: number;
  active?: number;
  testId?: string;
  onSelected(tabId: number): void;
}

export function Tab(props: TabProps) {
  function onSelected() {
    props.onSelected(props.id);
  }

  function cssForActiveTab(): string {
    if (props.active === props.id) {
      return "border-primary-900 text-primary-900";
    } else {
      return "border-transparent text-primary-500 hover:text-primary-700";
    }
  }

  return (
    <li>
      <button
        type="button"
        data-testid={props.testId}
        className={`inline-block pb-3 border-0 border-b-2 border-solid text-sm font-medium transition-colors ${cssForActiveTab()}`}
        onClick={onSelected}
      >
        {props.children}
      </button>
    </li>
  );
}
