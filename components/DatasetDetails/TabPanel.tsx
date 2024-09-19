import { Props } from "../../components/types/BaseInterfaces";
import { UserDetailsResponse } from "../../lib/users";
import { GetDatasetDetailsDOIResponse, GetDatasetDetailsResponse } from "../../types/BffAPI";

export interface TabPanelProps extends Props {
  onDOIGenerationChangeState?(state: string, newDOIState: GetDatasetDetailsDOIResponse): unknown;
  title: String;
  dataset?: GetDatasetDetailsResponse;
  user?: UserDetailsResponse
}
export function TabPanel(props: TabPanelProps) {
  return <div>{props.children}</div>;
}
