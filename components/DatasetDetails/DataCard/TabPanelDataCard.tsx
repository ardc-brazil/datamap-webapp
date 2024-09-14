import { useEffect, useState } from "react";
import { licenseMapping } from "../../../lib/licenseMapping";
import { CardItem } from "../CardItem";
import DatasetAuthorsForm from "../DatasetAuthorsForm";
import DatasetColaboratorsForm from "../DatasetColaboratorsForm";
import DatasetLicenseForm from "../DatasetLicenseForm";
import { LoadingAnimation } from "../LoadingAnimation";
import { TabPanel, TabPanelProps } from "../TabPanel";
import DataExplorer from "./DataExplorer";
import { DatasetDescription } from "./DatasetDescription";
import { GetDatasetDetailsDOIResponse, GetDatasetDetailsResponse } from "../../../types/BffAPI";
import DatasetCoverageForm from "../DatasetCoverageForm";
import DatasetProvenance from "../DatasetProvenance";
import DatasetCitation from "../DatasetCitation";
import { isDOIManagementEnabled } from "../../../lib/featureFlags";
import { useSession } from "next-auth/react";


interface TabPanelDataObject {
  usability: string;
  license: string;
  updateFrequency: string;
}

export function TabPanelDataCard(props: TabPanelProps) {
  const { data: session, status } = useSession();
  const [data, setData] = useState(null as TabPanelDataObject);
  const [isLoading, setLoading] = useState(false);
  const [showUsabilityPopup, setShowUsabilityPopup] = useState(false);

  function onDOIGenerationChangeState(state: string, newDOIState: GetDatasetDetailsDOIResponse) {
    props.onDOIGenerationChangeState(state, newDOIState);
  }

  useEffect(() => {
    setLoading(true);
    setTimeout(() => {
      // TODO: Create endpoints to get data quality information.
      if (props.dataset?.data) {
        setData({
          usability: "8.75",
          license: props.dataset.data.license ? licenseMapping[props.dataset.data.license] : "Unknow",
          updateFrequency: "Quarterly",
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

  function handlePointerOver() {
    setShowUsabilityPopup(true);
  }

  function onMouseLeave() {
    setShowUsabilityPopup(false);
  }

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
                <div>
                  <h6 className="font-semibold">
                    Usability &nbsp;
                    <span onMouseEnter={handlePointerOver} onMouseLeave={onMouseLeave} >
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="w-4 inline-block">
                        <path d="M 12 2 C 6.4889971 2 2 6.4889971 2 12 C 2 17.511003 6.4889971 22 12 22 C 17.511003 22 22 17.511003 22 12 C 22 6.4889971 17.511003 2 12 2 z M 12 4 C 16.430123 4 20 7.5698774 20 12 C 20 16.430123 16.430123 20 12 20 C 7.5698774 20 4 16.430123 4 12 C 4 7.5698774 7.5698774 4 12 4 z M 11 7 L 11 9 L 13 9 L 13 7 L 11 7 z M 11 11 L 11 17 L 13 17 L 13 11 L 11 11 z" />
                      </svg>
                    </span>

                    <div className="relative">
                      <div className={`${!showUsabilityPopup && "hidden"} absolute -top-5 -left-64 border border-primary-200 rounded-lg shadow bg-primary-50 p-4 w-64 text-xs`}>
                        <p className="text-xs">
                          This score is calculated by Kaggle.
                        </p>

                        <ul className="font-normal">
                          <li className="font-bold">Completeness · 0%</li>
                          <li className="style-error">Subtitle</li>
                          <li className="style-error"> Tag</li>
                          <li className="style-error"> Description</li>
                          <li className="style-error"> Cover Image</li>

                        </ul>

                        <br />
                        <ul className="font-normal">
                          <li className="font-bold">Credibility · 67%</li>
                          <li className="style-error"> Source/Provenance</li>
                          <li className="style-error"> Public Notebook</li>
                          <li className="style-error"> Update Frequency</li>
                        </ul>

                        <br />
                        <ul className="font-normal">
                          <li className="font-bold">Compatibility · 67%</li>
                          <li className="style-checked"> License</li>
                          <li className="style-error"> File Format</li>
                          <li className="style-error"> File Description</li>
                        </ul>
                      </div>
                    </div>
                  </h6>
                  <p>{data.usability}</p>
                </div>

                <div>
                  <h6 className="font-semibold">License</h6>
                  <p>{data.license}</p>
                </div>

                <div>
                  <h6 className="font-semibold">Expected update frequency</h6>
                  {/* TODO: Update the updateFrequency information
                  Possibilities:
                    - Unspecified
                    - Never
                    - Annually
                    - Quarterly
                    - Monthly
                    - Weekly
                    - Daily
                    - Hourly
                  */}
                  <p>{data.updateFrequency ?? "Never"}</p>
                </div>
              </div>
            </div>

          </div>

          <hr className="my-4" />

          <DataExplorer dataset={props.dataset} />

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

            {isDOIManagementEnabled(session) &&
              <div>
                <h6 className="font-semibold py-4">Citation</h6>
                <DatasetCitation
                  dataset={props.dataset}
                  user={props.user}
                  onDOIGenerationChangeState={onDOIGenerationChangeState}
                />
              </div>
            }
          </div>
        </div>
      </div>
    </TabPanel>
  );
}