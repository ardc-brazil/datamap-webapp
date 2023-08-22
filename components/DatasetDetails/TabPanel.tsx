import { Props } from "../../components/types/BaseInterfaces";
import { UserDetailsResponse } from "../../lib/users";

export interface TabPanelProps extends Props {
  title: String;
  dataset?: any;
  user?: UserDetailsResponse
}
export function TabPanel(props: TabPanelProps) {
  return <div>{props.children}</div>;
}
