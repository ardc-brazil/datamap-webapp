import { useSession } from "next-auth/react";
import Link from "next/link";
import { ReactNode, useEffect, useState } from "react";
import Moment from "react-moment";
import { ROUTE_PAGE_DATASETS_VERSION_DETAILS, ROUTE_PAGE_NOTEBOOKS } from "../../../contants/InternalRoutesConstants";
import { getVersionByName } from "../../../lib/datasetVersionSelector";
import { formatShortDate } from "../../../lib/embargoDisplay";
import { AccessCard } from "../../Embargo/AccessCard";
import { EmbargoCard } from "../../Embargo/EmbargoCard";
import DatasetAuthorsForm from "../DatasetAuthorsForm";
import DatasetCitation from "../DatasetCitation";
import DatasetColaboratorsForm from "../DatasetColaboratorsForm";
import DatasetCoverageForm from "../DatasetCoverageForm";
import DatasetLicenseForm from "../DatasetLicenseForm";
import DatasetProvenance from "../DatasetProvenance";
import { LoadingAnimation } from "../LoadingAnimation";
import { TabPanel, TabPanelProps } from "../TabPanel";
import DataExplorer from "./DataExplorer";
import { DatasetDescription } from "./DatasetDescription";
import DatasetFreshness from "./DatasetFreshness";
import DatasetLicense from "./DatasetLicense";
import DatasetUsability from "./DatasetUsability";
import { FactRow } from "./FactRow";


interface TabPanelDataObject {
  updateFrequency: string;
}

function SideCardLabel(props: { children: ReactNode }) {
  return (
    <div className="text-[11px] tracking-[0.08em] uppercase font-semibold text-primary-500">
      {props.children}
    </div>
  );
}

function MetadataRow(props: { label: string, children: ReactNode }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-[180px_minmax(0,1fr)] gap-y-1 px-4 py-3.5 border-b border-primary-100 last:border-b-0 text-sm leading-5">
      <span className="text-primary-500">{props.label}</span>
      <div className="min-w-0 text-primary-900">{props.children}</div>
    </div>
  );
}

export function TabPanelDataCard(props: TabPanelProps) {
  const { data: session, status } = useSession();
  const [data, setData] = useState(null as TabPanelDataObject);
  const [isLoading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    setTimeout(() => {
      // TODO: Create endpoints to get data quality information.
      if (props.dataset?.data) {
        setData({
          updateFrequency: "Quarterly"
        });
        setLoading(false);
      }
    }, 500);
  }, [props.dataset]);

  if (isLoading) {
    return (
      <div className="min-h-screen grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_300px] gap-10">
        <div>
          <LoadingAnimation />
          <LoadingAnimation />
          <LoadingAnimation />
        </div>
        <div>
          <LoadingAnimation />
        </div>
      </div>
    );
  }

  if (!data) return <p>No dataset data</p>;

  const selectedVersion = getVersionByName(props.selectedVersionName, props.dataset.versions, props.dataset);
  const sortedVersions = [...(props.dataset.versions ?? [])]
    .sort((a, b) => new Date(b?.created_at)?.getTime() - new Date(a?.created_at)?.getTime());

  return (
    <TabPanel title={props.title}>
      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_300px] gap-10 items-start">
        <div className="flex flex-col gap-10 min-w-0">
          <section>
            <DatasetDescription dataset={props.dataset} user={props.user} />
          </section>

          <section>
            <DataExplorer dataset={props.dataset} selectedVersionName={props.selectedVersionName} />
          </section>

          <section className="flex flex-col gap-3">
            <h2 className="m-0 text-lg leading-7 font-semibold tracking-[-0.01em] text-primary-900">Metadata</h2>
            <div className="border border-primary-200 rounded-lg bg-primary-0">
              <MetadataRow label="Authors">
                <DatasetAuthorsForm dataset={props.dataset} user={props.user} />
              </MetadataRow>
              <MetadataRow label="Collaborators">
                <DatasetColaboratorsForm dataset={props.dataset} user={props.user} />
              </MetadataRow>
              <MetadataRow label="License">
                <DatasetLicenseForm dataset={props.dataset} user={props.user} />
              </MetadataRow>
              <MetadataRow label="Coverage">
                <DatasetCoverageForm dataset={props.dataset} user={props.user} />
              </MetadataRow>
              <MetadataRow label="Provenance">
                <DatasetProvenance dataset={props.dataset} user={props.user} />
              </MetadataRow>
              <MetadataRow label="Citation">
                <div data-testid="dataset-citation">
                  <DatasetCitation
                    dataset={props.dataset}
                    user={props.user}
                    selectedVersionName={props.selectedVersionName}
                  />
                </div>
              </MetadataRow>
            </div>
          </section>
        </div>

        <aside className="flex flex-col gap-4">
          <EmbargoCard dataset={props.dataset} />
          <AccessCard dataset={props.dataset} />
          <div className="border border-primary-200 rounded-lg bg-primary-0 px-4 py-1">
            {selectedVersion?.files_withheld && props.dataset.embargo &&
              <>
                <FactRow label="Files available">{formatShortDate(props.dataset.embargo.until)}</FactRow>
                {props.dataset.owner && <FactRow label="Owner">{props.dataset.owner.name}</FactRow>}
              </>
            }
            {/* TODO: Enable Usability for a dataset */}
            <DatasetUsability dataset={props.dataset} />
            <DatasetLicense dataset={props.dataset} />
            <DatasetFreshness dataset={props.dataset} />
            <FactRow label="Created">
              <Moment date={props.dataset.created_at} format="MMM D, YYYY" />
            </FactRow>
            {selectedVersion?.doi?.identifier &&
              <FactRow label="DOI" testId="fact-doi" valueClassName="font-mono text-xs break-all">
                {selectedVersion.doi.identifier}
              </FactRow>
            }
          </div>

          {sortedVersions.length > 0 &&
            <div className="border border-primary-200 rounded-lg bg-primary-0 p-4 flex flex-col gap-2.5">
              <SideCardLabel>Versions</SideCardLabel>
              <ul className="flex flex-col gap-2.5">
                {sortedVersions.map(version => (
                  <li key={version.id} className="flex justify-between gap-4 text-sm">
                    <Link
                      href={ROUTE_PAGE_DATASETS_VERSION_DETAILS({ id: props.dataset.id, versionName: version.name })}
                      className={`text-sm hover:underline ${version.id === selectedVersion?.id ? "font-semibold text-primary-900" : "font-normal text-primary-700"}`}
                    >
                      Version {version.name}
                    </Link>
                    <span className="text-primary-500">
                      <Moment date={version.created_at} fromNow />
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          }

          <div className="border border-primary-200 rounded-lg bg-primary-0 p-4 flex flex-col gap-2">
            <SideCardLabel>Open in notebook</SideCardLabel>
            <span className="text-[13px] leading-[19px] text-primary-700">
              Explore the files of this dataset from a notebook.
            </span>
            <Link
              href={ROUTE_PAGE_NOTEBOOKS}
              className="mt-1 block text-center rounded-md border border-primary-300 bg-primary-50 px-3 py-2 text-[13px] font-semibold text-primary-900 hover:bg-primary-100 hover:text-primary-900 transition-colors"
            >
              Go to notebooks
            </Link>
          </div>
        </aside>
      </div>
    </TabPanel>
  );
}
