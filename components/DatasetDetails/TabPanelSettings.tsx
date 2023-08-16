import { TabPanel } from "./TabPanel";

import { TabPanelProps } from "./TabPanel";

export function TabPanelSettings(props: TabPanelProps) {
  return (
    <TabPanel title={props.title}>
      <h5>Settings</h5>

      <h6> Unavaible, <span className="text-primary-400">for while</span>!</h6>
      <p className="text-sm">We are working in this feature yet. But is good to know that you need this.</p>


    </TabPanel>
  );
}
