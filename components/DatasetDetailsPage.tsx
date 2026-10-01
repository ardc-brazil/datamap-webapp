import { TabPanelDataCard } from "./DatasetDetails/DataCard/TabPanelDataCard";
import DatasetInstitution from "./DatasetDetails/DatasetInstitution";
import DatasetMoreSettingsButton from "./DatasetDetails/DatasetMoreSettingsButton";
import { TabPanelSettings } from "./DatasetDetails/TabPanelSettings";
import { Tabs } from "./DatasetDetails/Tabs";
import { DownloadDatafilesButton } from "./DownloadDatafilesButton";
import LoggedLayout from "./LoggedLayout";
import { ShareButton } from "./Share/ShareButton";
import { getVersionByName } from "../lib/datasetVersionSelector";
import { totalDatasetVersionFilesSize } from "../lib/file";
import { UserDetailsResponse, canEditDataset } from "../lib/users";
import { GetDatasetDetailsResponse } from "../types/BffAPI";

interface Props {
  // TODO: Map this BFF response to a PageObject to avoid high coupling with the API.
  dataset: GetDatasetDetailsResponse
  user: UserDetailsResponse
  selectedVersionName: string
}

function StatusPill(props: { designState?: string }) {
  if (!props.designState) {
    return null;
  }

  const published = props.designState.toUpperCase() === "PUBLISHED";
  const colors = published
    ? "text-[#14532d] bg-[#dcfce7]"
    : "text-primary-700 bg-primary-200";

  return (
    <span className={`inline-flex px-2.5 py-[3px] rounded-full text-xs leading-[18px] font-semibold ${colors}`}>
      {published ? "Published" : "Draft"}
    </span>
  );
}

export default function DatasetDetailsPage(props: Props) {
  const selectedVersion = getVersionByName(props.selectedVersionName, props.dataset.versions, props.dataset);
  const filesCount = selectedVersion?.files_in?.length ?? 0;
  const authors = props.dataset?.data?.authors
    ?.map(author => author?.name)
    ?.filter(Boolean)
    ?.join(", ");

  return (
    <LoggedLayout>
      <div className="w-full">
        <div className="mx-auto w-full max-w-5xl flex flex-col gap-7">
          <div className="flex flex-col gap-6 md:flex-row md:justify-between md:items-start md:gap-8">
            <div className="flex flex-col gap-2.5 min-w-0">
              <div className="flex items-center gap-2.5">
                <StatusPill designState={selectedVersion?.design_state} />
                {selectedVersion &&
                  <span className="font-mono text-xs text-primary-500">
                    v{selectedVersion.name} · {totalDatasetVersionFilesSize(selectedVersion)} · {filesCount} {filesCount === 1 ? "file" : "files"}
                  </span>
                }
              </div>
              <h1 id="dataset-title" className="m-0 text-[30px] leading-[1.2] font-semibold tracking-tight text-primary-900 [text-wrap:balance]">
                {props.dataset.name}
              </h1>
              <div className="flex flex-wrap items-baseline gap-x-1.5 text-sm leading-5 text-primary-600">
                <DatasetInstitution dataset={props.dataset} user={props.user} />
                {authors &&
                  <span>· {authors}</span>
                }
              </div>
            </div>
            <div className="flex flex-none items-center gap-2">
              {props.dataset.access?.can_share && <ShareButton dataset={props.dataset} />}
              <DownloadDatafilesButton dataset={props.dataset} />
              <DatasetMoreSettingsButton dataset={props.dataset} />
            </div>
          </div>
          <Tabs className="pt-7">
            <TabPanelDataCard
              title="Data card"
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
