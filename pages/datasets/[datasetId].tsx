import { TabPanelData } from "../../components/DatasetDetails/TabPanelData";
import { TabPanelMetadata } from "../../components/DatasetDetails/TabPanelMetadata";
import { Tabs } from "../../components/DatasetDetails/Tabs";

import { getAllDatasets } from "../../lib/datasets";

import LoggedLayout from "../../components/LoggedLayout";
import Search from "../../lib/search";

export default function DatasetDetailsPage(props) {
  function getFileUrls(data: any[]) {
    if (data.length > 0) {
      return props.dataset.data[0];
    }

    // default file
    return {
      file_type: ".nc",
      download_path: "/OCO2GriddedXCO2_20200727_v2_1605923534.nc",
      format: "netCDF",
      file_size_gb: "0.1",
    };
  }

  return (
    <LoggedLayout>
      <div className="w-full">
        <div className="container mx-auto">
          <div className="flex flex-row">
            {/* Title */}
            <div className="basis-10/12">
              <h1 className="font-extrabold">{props.dataset.name}</h1>
              <p className="text-primary-500">{props.dataset.institution}</p>
            </div>
            {/* Actions */}
            <div className="">
              <a
                className="btn-primary whitespace-nowrap"
                href={getFileUrls(props.dataset.data).download_path}
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
    </LoggedLayout>
  );
}

export async function getServerSideProps({ req, res, query }) {
  const datasetId = query.datasetId as String;

  const data = await getAllDatasets();

  const search = new Search(data);
  const dataset = search.findOneBy(datasetId);

  return {
    props: { dataset }, // will be passed to the page component as props
  };
}

DatasetDetailsPage.auth = {
  role: "admin",
  loading: <div>loading...</div>,
};