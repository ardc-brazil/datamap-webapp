import React from "react";
import { Props } from "../../components/types/BaseInterfaces";

export interface TabPanelProps extends Props {
  title: String;
  dataset?: any;
}
export function TabPanel(props: TabPanelProps) {
  return <div>{props.children}</div>;
}
