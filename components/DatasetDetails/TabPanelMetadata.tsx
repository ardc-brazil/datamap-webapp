import React from "react";
import { TabPanel } from "./TabPanel";

import { TabPanelProps } from "./TabPanel";

function CardItem(props) {
  return (
    <div>
      <div className="text-primary-400 font-bold text-sm uppercase">
        {props.title}
      </div>
      <div>{props.children}</div>
    </div>
  );
}

export function TabPanelMetadata(props: TabPanelProps) {
  return (
    <TabPanel title={props.title}>
      <h3 className="font-bold">Metadata</h3>

      <div className="flex flex-col divide-y divide-primary-300 gap-8 mt-16">
        <div className="py-4">
          <h4 className="font-semibold py-4">Usage Information</h4>
          <div className="flex gap-28 py-4">
            <CardItem title="LICENSE">CC BY-SA 4.0</CardItem>
            <CardItem title="VISIBILITY">Public</CardItem>
          </div>
        </div>
        <div>
          <h4 className="font-semibold py-4">Collaborators</h4>
          <ul className="py-4">
            <li>First Collaborator</li>
            <li>Second Collaborator</li>
          </ul>
        </div>
        <div>
          <h4 className="font-semibold py-4">Coverage</h4>
          <div className="flex gap-28 py-4">
            <CardItem title="TEMPORAL COVERAGE START DATE">-</CardItem>
            <CardItem title="TEMPORAL COVERAGE END DATE">-</CardItem>
            <CardItem title="GEOSPATIAL COVERAGE">-</CardItem>
          </div>
        </div>
        <div>
          <h4 className="font-semibold py-4">Provenance</h4>
          <div className="flex gap-28 py-4">
            <CardItem title="SOURCES">Universidad de Alcalá</CardItem>
          </div>
          <div className="flex gap-28 py-4">
            <CardItem title="Collection methodology">
              All the data obtained from a Kinect V2 Depth sensor
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
              10.1145/2783446.2783605
            </CardItem>
          </div>

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
                  <legend className="text-sm">Personalia:</legend>
                  <p className="text-primary-600">
                    Garza, K., Goble, C., Brooke, J., & Jay, C. (2015). Framing
                    the community data system interface. In Proceedings of the
                    2015 British HCI Conference. British HCI 2015: 2015 British
                    Human Computer Interaction Conference. ACM.
                    https://doi.org/10.1145/2783446.2783605
                  </p>
                </fieldset>
              </div>
            </div>
          </div>
        </div>
      </div>
    </TabPanel>
  );
}
