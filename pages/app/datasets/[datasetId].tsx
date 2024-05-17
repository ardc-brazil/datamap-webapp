import { TabPanelDataCard } from "../../../components/DatasetDetails/DataCard/TabPanelDataCard";
import DatasetInstitution from "../../../components/DatasetDetails/DatasetInstitution";
import DatasetMoreSettingsButton from "../../../components/DatasetDetails/DatasetMoreSettingsButton";
import { TabPanelSettings } from "../../../components/DatasetDetails/TabPanelSettings";
import { Tabs } from "../../../components/DatasetDetails/Tabs";
import { DownloadDatafilesButton } from "../../../components/DownloadDatafilesButton";
import LoggedLayout from "../../../components/LoggedLayout";
import { GatekeeperAPI } from "../../../gateways/Gatekeeper";
import { NewContext } from "../../../lib/appLocalContext";
import { canEditDataset } from "../../../lib/users";
import { GetDatasetDetailsResponse } from "../../../types/BffAPI";
import { GetUserDetailsV1Response } from "../../../types/GatekeeperAPI";

interface Props {
  dataset: GetDatasetDetailsResponse,
  user: GetUserDetailsV1Response,
}

export default function DatasetDetailsPage(props: Props) {

  return (
    <LoggedLayout>
      <div className="w-full">
        <div className="container mx-auto">
          <div className="flex flex-row">
            {/* Title */}
            <div className="basis-10/12">
              <h1 className="font-extrabold">{props.dataset.name}</h1>
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
            <TabPanelDataCard title="Data Card" dataset={props.dataset} user={props.user} />
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

function map(dataset: GetDatasetDetailsResponse, user: GetUserDetailsV1Response): Props {
  return {
    dataset: dataset,
    user: user,
  };
}

export async function getServerSideProps({ req, res, query }) {
  const context = await NewContext(req);
  const datasetId = query.datasetId as string;
  const gatekeeperAPI = new GatekeeperAPI()

  const dataset = await gatekeeperAPI.getDatasetBy(context, datasetId);
  const user = await gatekeeperAPI.getUserByUID(context);

  return {
    props: map(dataset, user)
  };
}

DatasetDetailsPage.auth = {
  role: "admin",
  loading: <div>loading...</div>,
};