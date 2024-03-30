import { TabPanelDataCard } from "../../../components/DatasetDetails/DataCard/TabPanelDataCard";
import DatasetInstitution from "../../../components/DatasetDetails/DatasetInstitution";
import DatasetMoreSettingsButton from "../../../components/DatasetDetails/DatasetMoreSettingsButton";
import { TabPanelSettings } from "../../../components/DatasetDetails/TabPanelSettings";
import { Tabs } from "../../../components/DatasetDetails/Tabs";
import { DownloadDatafilesButton } from "../../../components/DownloadDatafilesButton";
import LoggedLayout from "../../../components/LoggedLayout";
import { NewContext } from "../../../lib/appLocalContext";
import { getDatasetBy } from "../../../lib/dataset";
import { canEditDataset, getUserByUID } from "../../../lib/users";

export default function DatasetDetailsPage(props) {

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

export async function getServerSideProps({ req, res, query }) {
  const context = await NewContext(req);
  const datasetId = query.datasetId as string;
  const dataset = await getDatasetBy(context, datasetId);
  const user = await getUserByUID(context);

  return {
    props: { dataset, user }, // will be passed to the page component as props
  };
}

DatasetDetailsPage.auth = {
  role: "admin",
  loading: <div>loading...</div>,
};