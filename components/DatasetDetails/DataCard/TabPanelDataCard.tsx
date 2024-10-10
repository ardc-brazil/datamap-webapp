import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
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


interface TabPanelDataObject {
  updateFrequency: string;
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
      <div className="min-h-screen grid grid-cols-12">
        <div className="col-span-7">
          <LoadingAnimation />
          <LoadingAnimation />
          <LoadingAnimation />
        </div>
        <div className="col-span-4">
          <LoadingAnimation />
        </div>
      </div>
    );
  }

  if (!data) return <p>No dataset data</p>;

  return (
    <TabPanel title={props.title}>
      <div className="grid grid-cols-12">
        <div className="col-span-12 pr-4 py-2">
          <div className="flex w-full">

            <div className="w-full">
              <DatasetDescription dataset={props.dataset} user={props.user} />
            </div>
            <div className="w-96">
              <div className="col-span-3 flex flex-col gap-2 pl-8">
                {/* TODO: Enable Usability for a dataset */}
                <DatasetUsability dataset={props.dataset} />
                <DatasetLicense dataset={props.dataset} />
                <DatasetFreshness dataset={props.dataset} />
              </div>
            </div>

          </div>

          <hr className="my-4" />

          <DataExplorer dataset={props.dataset} selectedVersionName={props.selectedVersionName} />

          <hr className="my-4" />
          <div className="flex flex-col divide-y divide-primary-200 gap-8 mt-16 mb-16">
            <h4>Metadata</h4>
            <div className="py-4">
              <h6 className="font-semibold py-4">Colaborators</h6>
              <DatasetColaboratorsForm dataset={props.dataset} user={props.user} />
            </div>
            <div className="py-4">
              <h6 className="font-semibold py-4">Authors</h6>
              <DatasetAuthorsForm dataset={props.dataset} user={props.user} />
            </div>

            <div className="py-4">
              <h6 className="font-semibold py-4">License</h6>
              <DatasetLicenseForm dataset={props.dataset} user={props.user} />
            </div>

            <div>
              <h6 className="font-semibold py-4">Coverage</h6>
              <DatasetCoverageForm dataset={props.dataset} user={props.user} />
            </div>
            <div>
              <h6 className="font-semibold py-4">Provenance</h6>
              <DatasetProvenance dataset={props.dataset} user={props.user} />
            </div>
            <div>
              <h6 className="font-semibold py-4">Citation</h6>
              <DatasetCitation
                dataset={props.dataset}
                user={props.user}
                selectedVersionName={props.selectedVersionName}
              />
            </div>
          </div>
        </div>
      </div>
    </TabPanel>
  );
}