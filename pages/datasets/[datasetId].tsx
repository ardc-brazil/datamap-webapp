import React from "react";
import Layout from "../../components/Layout";
import { Tabs } from "../../components/DatasetDetails/Tabs";
import { TabPanelData } from "../../components/DatasetDetails/TabPanelData";
import { TabPanelMetadata } from "../../components/DatasetDetails/TabPanelMetadata";

import Search from "../../lib/search";
export default function DatasetDetails(props) {
  return (
    <Layout fluid={true}>
      <div className="">
        <div className="container mx-auto">
          <div className="flex flex-row py-8">
            {/* Title */}
            <div className="basis-10/12">
              <h1 className="font-extrabold">{props.dataset.name}</h1>
              <p className="text-primary-500">{props.dataset.institution}</p>
            </div>
            {/* Actions */}
            <div className="">
              <a
                className="btn-primary whitespace-nowrap"
                href="/OCO2GriddedXCO2_20200727_v2_1605923534.nc"
                download
              >
                Download (1.8 MB)
              </a>
            </div>
          </div>
        </div>
        <div className="container mx-auto">
          <Tabs>
            <TabPanelData title="Data" dataset={props.dataset} />
            <TabPanelMetadata title="Metadata" dataset={props.dataset} />
          </Tabs>
        </div>
      </div>
    </Layout>
  );
}

export async function getServerSideProps({ req, res, query }) {
  const datasetId = query.datasetId as String;

  const search = new Search();
  const dataset = search.findOneBy(datasetId);

  console.log(dataset);

  return {
    props: { dataset }, // will be passed to the page component as props
  };
}
