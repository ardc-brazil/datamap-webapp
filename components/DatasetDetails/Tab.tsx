import React from "react";
import { Props } from "../types/BaseInterfaces";

export interface TabProps extends Props {
  id: number;
  active?: number;
  onSelected(tabId: number): void;
}

export function Tab(props: TabProps) {
  function onSelected() {
    props.onSelected(props.id);
  }

  function cssForActiveTab(): string {
    if (props.active === props.id) {
      return "border-b-2 border-primary-800 text-primary-900";
    } else {
      return "text-primary-500 hover:text-primary-600";
    }
  }

  return (
    <li className="mr-2">
      <a
        href="#"
        className={`inline-block p-4 rounded-t-lg border-0 ${cssForActiveTab()}`}
        onClick={onSelected}
      >
        {props.children}
      </a>
    </li>
  );
}
