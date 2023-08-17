import { TabPanelDataCard } from "../../../components/DatasetDetails/DataCard/TabPanelDataCard";
import DatasetInstitution from "../../../components/DatasetDetails/DatasetInstitution";
import { TabPanelSettings } from "../../../components/DatasetDetails/TabPanelSettings";
import { Tabs } from "../../../components/DatasetDetails/Tabs";
import { DownloadDatafilesButton } from "../../../components/DownloadDatafilesButton";
import LoggedLayout from "../../../components/LoggedLayout";
import { NewContext } from "../../../lib/appLocalContext";
import { getDatasetBy } from "../../../lib/dataset";

export default function DatasetDetailsPage(props) {
  return (
    <LoggedLayout>
      <div className="w-full">
        <div className="container mx-auto">
          <div className="flex flex-row">
            {/* Title */}
            <div className="basis-10/12">
              <h1 className="font-extrabold">{props.dataset.name}</h1>
              <DatasetInstitution dataset={props.dataset} />
            </div>
            {/* Actions */}
            <div className="">
              <DownloadDatafilesButton dataset={props.dataset} />
            </div>
          </div>
        </div>
        <div className="container mx-auto">
          <Tabs className="py-4">
            <TabPanelDataCard title="Data Card" dataset={props.dataset} />
            {/* <TabPanelMetadata title="Metadata" dataset={props.dataset} /> */}
            {/* TODO: Enable discussion tab - Disabled while empty */}
            {/* <TabPanelDiscussion title="Discussions" dataset={props.dataset} /> */}
            {/* <TabPanelDiscussion title="Discussions" dataset={props.dataset} /> */}
            <TabPanelSettings title="Settings" dataset={props.dataset} />
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
  return {
    props: { dataset }, // will be passed to the page component as props
  };
}

DatasetDetailsPage.auth = {
  role: "admin",
  loading: <div>loading...</div>,
};