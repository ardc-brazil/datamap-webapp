import React from "react";
import { TabPanel } from "./TabPanel";

import { TabPanelProps } from "./TabPanel";

import { RadioButton } from "../../components/Search/RadioButton";

export function TabPanelMetadata(props: TabPanelProps) {
  return (
    <TabPanel title={props.title}>
      <h3>Metadata</h3>

      <div className="flex flex-col divide-y divide-primary-300 gap-8 mt-16">
        <div className="py-4">
          <h4>Usage Information</h4>
          <div className="flex gap-28 py-4">
            <div>
              <div>LICENSE</div>
              <div>CC BY-SA 4.0</div>
            </div>
            <div>
              <div>VISIBILITY</div>
              <div>Public</div>
            </div>
          </div>
        </div>
        <div>
          <h4>Collaborators</h4>
          <ul className="py-4">
            <li>First Collaborator</li>
            <li>Second Collaborator</li>
          </ul>
        </div>
        <div>
          <h4>Coverage</h4>
          <div className="flex gap-28 py-4">
            <div>
              <div>TEMPORAL COVERAGE START DATE</div>
              <div>-</div>
            </div>
            <div>
              <div>TEMPORAL COVERAGE END DATE</div>
              <div>-</div>
            </div>
            <div>
              <div>GEOSPATIAL COVERAGE</div>
              <div>-</div>
            </div>
          </div>
        </div>
        <div>
          <h4>Provenance</h4>
          <div className="flex gap-28 py-4">
            <div>
              <div>SOURCES</div>
              <div>Universidad de Alcalá</div>
            </div>
          </div>
          <div className="flex gap-28 py-4">
            <div>
              <div>COLLECTION METHODOLOGY</div>
              <div>All the data obtained from a Kinect V2 Depth sensor</div>
            </div>
          </div>
        </div>

        <div>
          <h4>Additional Authors</h4>
          <div className="flex gap-28 py-4">
            <div>
              <div>AUTHOR NAME</div>
              <div>Author Full Name</div>
            </div>
            <div>
              <div>BIO</div>
              <div>-</div>
            </div>
          </div>

          <div className="flex gap-28 py-4">
            <div>
              <div>AUTHOR NAME</div>
              <div>Author Full Name</div>
            </div>
            <div>
              <div>BIO</div>
              <div>-</div>
            </div>
          </div>

          <div className="flex gap-28 py-4">
            <div>
              <div>AUTHOR NAME</div>
              <div>Author Full Name</div>
            </div>
            <div>
              <div>BIO</div>
              <div>-</div>
            </div>
          </div>

          <div className="flex gap-28 py-4">
            <div>
              <div>AUTHOR NAME</div>
              <div>Author Full Name</div>
            </div>
            <div>
              <div>BIO</div>
              <div>-</div>
            </div>
          </div>
        </div>

        <div>
          <h4>DOI Citation</h4>
          <div className="flex gap-28 py-4">
            <div>
              <div>DOI (DIGITAL OBJECT IDENTIFIER)</div>
              <div>10.1145/2783446.2783605</div>
            </div>
          </div>

          <div className="flex gap-28 py-4">
            <div>
              <div>CITATION TYPE</div>
              <div>
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
