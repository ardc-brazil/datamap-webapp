import { useEffect, useState } from "react";
import { TabPanelDataCard } from "../../../components/DatasetDetails/DataCard/TabPanelDataCard";
import DatasetInstitution from "../../../components/DatasetDetails/DatasetInstitution";
import DatasetMoreSettingsButton from "../../../components/DatasetDetails/DatasetMoreSettingsButton";
import { TabPanelSettings } from "../../../components/DatasetDetails/TabPanelSettings";
import { Tabs } from "../../../components/DatasetDetails/Tabs";
import { DownloadDatafilesButton } from "../../../components/DownloadDatafilesButton";
import LoggedLayout from "../../../components/LoggedLayout";
import { NewContext } from "../../../lib/appLocalContext";
import { getDatasetBy } from "../../../lib/dataset";
import { UserDetailsResponse, canEditDataset, getUserByUID } from "../../../lib/users";
import { GetDatasetDetailsDOIResponse, GetDatasetDetailsResponse } from "../../../types/BffAPI";

interface Props {
  // TODO: Map this BFF response to a PageObject to avoid high coupling with the API.
  dataset: GetDatasetDetailsResponse
  user: UserDetailsResponse
}

export default function DatasetDetailsPage(props: Props) {

  const [dataset, setDataset] = useState({} as GetDatasetDetailsResponse)

  useEffect(() => {
    setDataset(props.dataset)
  })

  function onDOIGenerationChangeState(state: string, newDOIState: GetDatasetDetailsDOIResponse) {
    // TODO: Maybe this is not necessary. After update the dataset, the SWR should update the property locally, but I have to update the current status.
    setDataset(
      {
        ...dataset,
        current_version: {
          ...dataset.current_version,
          doi: newDOIState
        }
      }
    )
  }

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
            <TabPanelDataCard
              title="Data Card"
              dataset={dataset}
              user={props.user}
              onDOIGenerationChangeState={onDOIGenerationChangeState}
            />
            {/* <TabPanelMetadata title="Metadata" dataset={props.dataset} /> */}
            {/* TODO: Enable discussion tab - Disabled while empty */}
            {/* <TabPanelDiscussion title="Discussions" dataset={props.dataset} /> */}
            {/* <TabPanelDiscussion title="Discussions" dataset={props.dataset} /> */}
            {canEditDataset(props.user) &&
              <TabPanelSettings title="Settings" dataset={dataset} user={props.user} />
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
    props: {
      dataset,
      user
    }
  };
}

DatasetDetailsPage.auth = {
  role: "admin",
  loading: <div>loading...</div>,
};