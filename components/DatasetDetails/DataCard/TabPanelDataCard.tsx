import { useEffect, useState } from "react";

import { CardItem } from "../CardItem";
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



  useEffect(() => {
    setLoading(true);
    setTimeout(() => {
      // TODO: Create endpoints to get data quality information.
      setData({
        usability: "8.75",
        license: "CC BY-SA 4.0",
        updateFrequency: "Quarterly",
      });

      setLoading(false);
    }, 1000);
  }, []);

  if (isLoading)
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
  if (!data) return <p>No dataset data</p>;


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
                  <h6 className="font-semibold">Usability</h6>
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
              <h6 className="font-semibold py-4">Usage Information</h6>
              <div className="flex gap-28 py-4">
                <CardItem title="LICENSE">{props.dataset.license ?? "-"}</CardItem>
                <CardItem title="VISIBILITY">Public</CardItem>
              </div>
            </div>
            <div>
              <h6 className="font-semibold py-4">Collaborators</h6>
              <ul className="py-4">
                <li>{props.dataset.owner?.name}</li>
                <li>{props.dataset.author?.name ?? "-"}</li>
                {props.dataset.contacts?.map((x, i) => (
                  <li key={i}>{x.name}</li>
                ))}
              </ul>
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