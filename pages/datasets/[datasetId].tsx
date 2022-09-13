import React from "react";
import Layout from "../../components/Layout";
import { Tabs } from "../../components/DatasetDetails/Tabs";
import { TabPanelData } from "../../components/DatasetDetails/TabPanelData";
import { TabPanelMetadata } from "../../components/DatasetDetails/TabPanelMetadata";

export default function DatasetDetails() {
  return (
    <Layout fluid={true}>
      <div className="">
        <div className="container mx-auto">
          <div className="flex flex-row py-8">
            {/* Title */}
            <div className="basis-10/12">
              <h1>Fullname for a Dataset</h1>
              <p className="text-primary-500">
                This is a subtitle it has to be between 20 and 80 characters
                long.
              </p>
            </div>
            {/* Actions */}
            <div className="">
              <button className="btn-primary">Download (300 MB)</button>
            </div>
          </div>
        </div>
        <div className="container mx-auto">
          <Tabs>
            <TabPanelData title="Data" />
            <TabPanelMetadata title="Metadata" />
          </Tabs>
        </div>
      </div>
    </Layout>
  );
}
