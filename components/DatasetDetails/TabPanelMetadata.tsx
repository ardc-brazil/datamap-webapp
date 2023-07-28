import { CardItem } from "./CardItem";
import { TabPanel } from "./TabPanel";

import { TabPanelProps } from "./TabPanel";

export function TabPanelMetadata(props: TabPanelProps) {
  return (
    <TabPanel title={props.title}>
      <h3 className="font-bold">Metadata</h3>

      <div className="flex flex-col divide-y divide-primary-200 gap-8 mt-16">
        <div className="py-4">
          <h4 className="font-semibold py-4">Usage Information</h4>
          <div className="flex gap-28 py-4">
            <CardItem title="LICENSE">{props.dataset.license ?? "-"}</CardItem>
            <CardItem title="VISIBILITY">Public</CardItem>
          </div>
        </div>
        <div>
          <h4 className="font-semibold py-4">Collaborators</h4>
          <ul className="py-4">
            <li>{props.dataset.owner.name}</li>
            <li>{props.dataset.author?.name ?? "-"}</li>
            {props.dataset.contacts?.map((x, i) => (
              <li key={i}>{x.name}</li>
            ))}
          </ul>
        </div>
        <div>
          <h4 className="font-semibold py-4">Coverage</h4>
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
          <h4 className="font-semibold py-4">Provenance</h4>
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
          <h4 className="font-semibold py-4">Additional Authors</h4>
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
          <h4 className="font-semibold py-4">DOI Citation</h4>
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
    </TabPanel>
  );
}
