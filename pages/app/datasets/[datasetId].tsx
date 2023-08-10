import { TabPanel } from "../../../components/DatasetDetails/TabPanel";
import { TabPanelData } from "../../../components/DatasetDetails/TabPanelData";
import { TabPanelMetadata } from "../../../components/DatasetDetails/TabPanelMetadata";
import { Tabs } from "../../../components/DatasetDetails/Tabs";
import LoggedLayout from "../../../components/LoggedLayout";
import useComponentVisible from "../../../hooks/UseComponentVisible";
import { getDatasetBy } from "../../../lib/dataset";

export default function DatasetDetailsPage(props) {
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
              <DownloadDatafilesButton dataset={props.dataset} />
            </div>
          </div>
        </div>
        <div className="container mx-auto">
          <Tabs className="py-8">
            <TabPanelData title="Data" dataset={props.dataset} />
            <TabPanelMetadata title="Metadata" dataset={props.dataset} />
          </Tabs>
        </div>
      </div>
    </LoggedLayout>
  );
}

function DownloadDatafilesButton(props: any) {

  const { ref, isComponentVisible, setIsComponentVisible } = useComponentVisible(false);

  const slugify = text =>
    text
      .toString()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .trim()
      .replace(/\s+/g, '-')
      .replace(/[^\w-]+/g, '')
      .replace(/--+/g, '-')

  const scpCommand = `scp -r user@ssh.example.com:${slugify(props.dataset.name)} /path/to/local/destination`

  function handleCopyToClipboard(): void {
    navigator.clipboard.writeText(scpCommand);
  }

  function handleDataFilesButtonClick(event): void {
    setIsComponentVisible(true);
  }

  if (!props.dataset.dataFiles || props.dataset.dataFiles?.length <= 0) {
    // No button if we don't have data files in the dataset.
    return <></>
  }
  
  return (
    <div className="relative w-96 flex justify-end" >
      <button type="button" className="btn-primary whitespace-nowrap" onClick={handleDataFilesButtonClick}
        disabled={!props.dataset.dataFiles || props.dataset.dataFiles?.length <= 0}>
        Data Files &#x290B;
        
      </button>

      <div ref={ref} className={`${!isComponentVisible && "hidden"} absolute top-12 bg-primary-50 w-full border border-primary-200 shadow-sm shadow-primary-300 rounded-md`}>
        <Tabs className="px-4 pb-4">
          <TabPanel title="Remote files">
            <div className="text-left">
              <p className="text-sm">You can copy the dataset folder directly from the server.</p>
              <div className="flex">
                <div className="relative w-full">
                  <input type="search" id="search-dropdown" className="block p-2.5 pr-8 w-full text-xs select-all" placeholder="Search" readOnly value={scpCommand} />
                  <button type="button" className="btn-primary-outline shadow-none mr-0 absolute top-0 right-0 p-2.5 h-full w-fit text-sm font-medium text-white rounded-r-lg rounded-l-none border border-primary-300 focus:ring-0 focus:outline-none hover:bg-primary-100"
                    onClick={handleCopyToClipboard}>
                    <svg version="1.1" id="Layer_1" className="w-5 text-primary-300  fill-primary-600"
                      viewBox="0 0 442 442">
                      <g>
                        <polygon points="291,0 51,0 51,332 121,332 121,80 291,80 	" />
                        <polygon points="306,125 306,195 376,195 	" />
                        <polygon points="276,225 276,110 151,110 151,442 391,442 391,225 	" />
                      </g>
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          </TabPanel>

          <TabPanel title="AWS S3">
            <div className="text-center">
              <h5> Unavaible, <span className="text-primary-400">for while</span>!</h5>
              <p className="text-sm">We are working in this feature yet. But is good to know that you need this.</p>
            </div>
          </TabPanel>
        </Tabs>
      </div>

    </div>
  );
}

export async function getServerSideProps({ req, res, query }) {
  const datasetId = query.datasetId as string;
  const dataset = await getDatasetBy(datasetId);
  return {
    props: { dataset }, // will be passed to the page component as props
  };
}

DatasetDetailsPage.auth = {
  role: "admin",
  loading: <div>loading...</div>,
};