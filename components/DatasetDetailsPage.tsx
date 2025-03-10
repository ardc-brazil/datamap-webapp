import { TabPanelDataCard } from "./DatasetDetails/DataCard/TabPanelDataCard";
import DatasetInstitution from "./DatasetDetails/DatasetInstitution";
import DatasetMoreSettingsButton from "./DatasetDetails/DatasetMoreSettingsButton";
import { TabPanelSettings } from "./DatasetDetails/TabPanelSettings";
import { Tabs } from "./DatasetDetails/Tabs";
import { DownloadDatafilesButton } from "./DownloadDatafilesButton";
import LoggedLayout from "./LoggedLayout";
import { UserDetailsResponse, canEditDataset } from "../lib/users";
import { GetDatasetDetailsResponse } from "../types/BffAPI";

interface Props {
  // TODO: Map this BFF response to a PageObject to avoid high coupling with the API.
  dataset: GetDatasetDetailsResponse
  user: UserDetailsResponse
  selectedVersionName: string
}

export default function DatasetDetailsPage(props: Props) {
  return (
    <LoggedLayout>
      <div className="w-full">
        <div className="container mx-auto">
          <div className="flex flex-row">
            {/* Title */}
            <div className="basis-10/12">
              <h1 id="dataset-title" className="font-extrabold">{props.dataset.name} </h1>
              <DatasetInstitution dataset={props.dataset} user={props.user} />
            </div>
            {/* Actions */}
            <div>
              <DownloadDatafilesButton dataset={props.dataset} />
            </div>
            <div>
              <DatasetMoreSettingsButton dataset={props.dataset} />
            </div>
          </div>
        </div>
        <div className="container mx-auto">
          <Tabs className="py-4">
            <TabPanelDataCard
              title="Data Card"
              dataset={props.dataset}
              user={props.user}
              selectedVersionName={props.selectedVersionName}
            />
            {/* <TabPanelMetadata title="Metadata" dataset={props.dataset} /> */}
            {/* TODO: Enable discussion tab - Disabled while empty */}
            {/* <TabPanelDiscussion title="Discussions" dataset={props.dataset} /> */}
            {/* <TabPanelDiscussion title="Discussions" dataset={props.dataset} /> */}
            {canEditDataset(props.user) &&
              <TabPanelSettings title="Settings" dataset={props.dataset} user={props.user} />
            }
          </Tabs>
        </div>
      </div>
    </LoggedLayout>
  );
}