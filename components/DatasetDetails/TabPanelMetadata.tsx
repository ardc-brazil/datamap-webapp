import React from "react";
import { TabPanel } from "./TabPanel";

import { TabPanelProps } from "./TabPanel";

export function TabPanelMetadata(props: TabPanelProps) {
  return <TabPanel title={props.title}>Metadata tabpanel</TabPanel>;
}
