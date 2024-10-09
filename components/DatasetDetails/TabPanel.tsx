import { Props } from "../../components/types/BaseInterfaces";
import { UserDetailsResponse } from "../../lib/users";
import { GetDatasetDetailsResponse } from "../../types/BffAPI";

export interface TabPanelProps extends Props {
  title: String;
  dataset?: GetDatasetDetailsResponse;
  user?: UserDetailsResponse
  selectedVersionName?: string
}
export function TabPanel(props: TabPanelProps) {
  return <div>{props.children}</div>;
}
