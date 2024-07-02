import React, { useState } from "react";
import { Props } from "../../components/types/BaseInterfaces";
import { Tab } from "./Tab";

interface TabsProps extends Props {
  onTabChanged?(tabId: number): void;
  className?: string;
  defaultSelectedIndex?: number;
}
export function Tabs(props: TabsProps) {
  const [tabSelected, setTabSelected] = useState(
    props.defaultSelectedIndex ?? 0
  );

  function onTabSelected(tabId: number) {
    setTabSelected(tabId);
    if (props.onTabChanged) {
      props.onTabChanged(tabId);
    }
  }

  return (
    <div>
      <div className="text-sm font-medium text-center border-b border-primary-300">
        <ul className="flex flex-wrap -mb-px">
          {React.Children.map(props.children, (child: any, index) => {
            return (
              <Tab
                key={index}
                id={index}
                onSelected={onTabSelected}
                active={tabSelected}
              >
                {child?.props.title}
              </Tab>
            );
          })}
        </ul>
      </div>

      {React.Children.count(props.children) <= 1 &&
        <div className={props.className}>{props.children}</div>
      }

      {React.Children.count(props.children) > 1 &&
        <div className={props.className}>{props.children[tabSelected]}</div>
      }
    </div>
  );
}
