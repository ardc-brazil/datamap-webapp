import { TabPanel } from "./DatasetDetails/TabPanel";
import { Tabs } from "./DatasetDetails/Tabs";
import { MaterialSymbol } from "react-material-symbols";
import useComponentVisible from "../hooks/UseComponentVisible";

export function DownloadDatafilesButton(props: any) {

  const { ref, isComponentVisible, setIsComponentVisible } = useComponentVisible(false);

  const slugify = text => text
    .toString()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w-]+/g, '')
    .replace(/--+/g, '-');

  const scpCommand = `scp -r user@ssh.example.com:${slugify(props.dataset.name)} /path/to/local/destination`;

  function handleCopyToClipboard(): void {
    navigator.clipboard.writeText(scpCommand);
  }

  function handleDataFilesButtonClick(event): void {
    setIsComponentVisible(true);
  }

  if (!props.dataset.dataFiles || props.dataset.dataFiles?.length <= 0) {
    // No button if we don't have data files in the dataset.
    return <></>;
  }

  return (
    <div className="relative flex justify-end">
      <button type="button" className="inline-flex items-center gap-2 h-[38px] px-3.5 rounded-md bg-primary-900 text-primary-50 text-sm font-semibold whitespace-nowrap hover:bg-primary-800 transition-colors disabled:opacity-50" onClick={handleDataFilesButtonClick}
        disabled={!props.dataset.dataFiles || props.dataset.dataFiles?.length <= 0}>
        <MaterialSymbol icon="download" size={18} grade={-25} weight={400} />
        Data files
      </button>

      <div ref={ref} className={`${!isComponentVisible && "hidden"} absolute top-12 right-0 z-10 bg-primary-0 w-96 border border-primary-200 shadow-sm rounded-lg pt-3`}>
        <Tabs className="px-4 pb-4" headerClassName="px-4">
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
