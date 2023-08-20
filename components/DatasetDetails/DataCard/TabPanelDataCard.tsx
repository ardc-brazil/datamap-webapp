import { useEffect, useState } from "react";
import { licenseMapping } from "../../../lib/licenseMapping";
import { CardItem } from "../CardItem";
import DatasetAuthorsForm from "../DatasetAuthorsForm";
import DatasetColaboratorsForm from "../DatasetColaboratorsForm";
import DatasetLicenseForm from "../DatasetLicenseForm";
import { LoadingAnimation } from "../LoadingAnimation";
import { TabPanel, TabPanelProps } from "../TabPanel";
import { DatasetDescription } from "./DatasetDescription";


interface TabPanelDataObject {
  usability: string;
  license: string;
  updateFrequency: string;
}

export function TabPanelDataCard(props: TabPanelProps) {
  const [data, setData] = useState(null as TabPanelDataObject);
  const [isLoading, setLoading] = useState(false);
  const [showUsabilityPopup, setShowUsabilityPopup] = useState(false);

  useEffect(() => {
    setLoading(true);
    setTimeout(() => {
      // TODO: Create endpoints to get data quality information.
      setData({
        usability: "8.75",
        license: props.dataset.license ? licenseMapping[props.dataset.license] : "Unknow",
        updateFrequency: "Quarterly",
      });

      setLoading(false);
    }, 1000);
  }, []);

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
    console.log("ok");
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
              <DatasetDescription dataset={props.dataset} />
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
                  <p>{data.updateFrequency}</p>
                </div>
              </div>
            </div>

          </div>

          {props.dataset.dataFiles && props.dataset.dataFiles.length > 0 && (
            <>
              <hr className="my-4" />
              <div className="mt-4">
                <h5>Data Explorer</h5>
                <ul className="list-disc list-inside py-4">
                  {props.dataset.dataFiles?.map((x, i) => (
                    <li className="pl-4" key={i}>
                      <a href={x.path} download>{x.path}</a>
                    </li>
                  ))}
                </ul>
              </div>
            </>
          )}

          <hr className="my-4" />
          <div className="flex flex-col divide-y divide-primary-200 gap-8 mt-16">
            <h5>Metadata</h5>
            <div className="py-4">
              <h6 className="font-semibold py-4">Colaborators</h6>
              <DatasetColaboratorsForm dataset={props.dataset} />
            </div>
            <div className="py-4">
              <h6 className="font-semibold py-4">Authors</h6>
              <DatasetAuthorsForm dataset={props.dataset} />
            </div>

            <div className="py-4">
              <h6 className="font-semibold py-4">License</h6>
              <DatasetLicenseForm dataset={props.dataset} />
            </div>
            <div className="py-4">
              <h6 className="font-semibold py-4">Usage Information</h6>
              <div className="flex gap-28 py-4">
                <CardItem title="VISIBILITY">Public</CardItem>
              </div>
            </div>
            <div>
              <h6 className="font-semibold py-4">Coverage</h6>
              <div className="flex gap-28 py-4">
                <CardItem title="TEMPORAL COVERAGE START DATE">
                  {props.dataset.start_date}
                </CardItem>
                <CardItem title="TEMPORAL COVERAGE END DATE">
                  {props.dataset.end_date}
                </CardItem>
                <CardItem title="GEOSPATIAL COVERAGE">
                  {props.dataset.location && props.dataset.location.location && (
                    <span>{props.dataset.location.location}</span>
                  )}
                  {props.dataset.location && props.dataset.location.latitude && (
                    <div>
                      <p>Latitude: {props.dataset.location.latitude}</p>
                      <p>Longitude: {props.dataset.location.longitude}</p>
                    </div>
                  )}
                  {!props.dataset.location && <span>-</span>}
                </CardItem>
              </div>
            </div>
            <div>
              <h6 className="font-semibold py-4">Provenance</h6>
              <div className="flex gap-28 py-4">
                <CardItem title="SOURCES">{props.dataset.institution}</CardItem>
              </div>
              <div className="flex gap-28 py-4">
                <CardItem title="Collection methodology">
                  {props.dataset.source_instrument} - {props.dataset.source}
                </CardItem>
              </div>
            </div>

            <div>
              <h6 className="font-semibold py-4">Additional Authors</h6>
              <div className="flex gap-28 py-4">
                <CardItem title="AUTHOR NAME">Author Full Name</CardItem>
                <CardItem title="BIO">-</CardItem>
              </div>
              <div className="flex gap-28 py-4">
                <CardItem title="AUTHOR NAME">Author Full Name</CardItem>
                <CardItem title="BIO">-</CardItem>
              </div>
              <div className="flex gap-28 py-4">
                <CardItem title="AUTHOR NAME">Author Full Name</CardItem>
                <CardItem title="BIO">-</CardItem>
              </div>
              <div className="flex gap-28 py-4">
                <CardItem title="AUTHOR NAME">Author Full Name</CardItem>
                <CardItem title="BIO">-</CardItem>
              </div>
            </div>

            <div>
              <h6 className="font-semibold py-4">DOI Citation</h6>
              <div className="flex gap-28 py-4">
                <CardItem title="DOI (DIGITAL OBJECT IDENTIFIER)">
                  {props.dataset.citation && (
                    <a href={props.dataset.citation.doi} target="_blank">
                      {props.dataset.citation.doi}
                    </a>
                  )}
                  {!props.dataset.citation && <span>-</span>}
                </CardItem>
              </div>
              {props.dataset.references && (
                <div className="flex gap-28 py-4">
                  <div>
                    <CardItem title="CITATION TYPE">
                      <label
                        htmlFor="apa"
                        className="w-full cursor-pointer py-2 mx-2"
                      >
                        <input
                          id="apa"
                          type="radio"
                          value="citation-type"
                          name="citation-type"
                          checked
                          className="w-5 h-5 accent-primary-900"
                        />
                        <span className="ml-2 text-sm font-medium text-primary-900 align-top">
                          APA
                        </span>
                      </label>
                      <label
                        htmlFor="apa"
                        className="w-full cursor-pointer py-2 mx-2"
                      >
                        <input
                          id="apa"
                          type="radio"
                          value="citation-type"
                          name="citation-type"
                          className="w-5 h-5 accent-primary-900"
                        />
                        <span className="ml-2 text-sm font-medium text-primary-900 align-top">
                          BibTeX
                        </span>
                      </label>
                    </CardItem>

                    <div className="my-4">
                      <fieldset className="border border-solid border-primary-300 p-3">
                        <legend className="text-sm">Citation:</legend>
                        <p className="text-primary-600">
                          {props.dataset.references}
                        </p>
                      </fieldset>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </TabPanel>
  );
}