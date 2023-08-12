import { useEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { CardItem } from "./CardItem";
import { LoadingAnimation } from "./LoadingAnimation";
import { TabPanel, TabPanelProps } from "./TabPanel";

interface TabPanelDataObject {
  usability: string;
  license: string;
  updateFrequency: string;
}

function ViewMoreOrLessButton(props) {
  return (
    <button
      className="btn-primary-outline whitespace-nowrap rounded-3xl border-0"
      onClick={props.toggleView}
    >
      <svg
        aria-hidden="true"
        className={`${props.expanded ? "-rotate-90" : "rotate-90"
          } w-3 h-3 inline-block mx-1`}
        fill="currentColor"
        viewBox="0 0 20 20"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          fillRule="evenodd"
          d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z"
          clipRule="evenodd"
        ></path>
      </svg>

      {!props.expanded && "View more"}
      {props.expanded && "View less"}
    </button>
  );
}

function ExpansibleDiv(props) {
  const [minHeightExpandable, setMinHeightExpandable] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const ref = useRef(null);

  const minHeight = 300;

  useEffect(() => {
    setMinHeightExpandable(ref.current.clientHeight > minHeight);
  }, []);

  function toggleView() {
    setExpanded(!expanded);
  }

  if (!minHeightExpandable) {
    return <div ref={ref}>{props.children}</div>;
  } else {
    return (
      <div ref={ref}>
        {expanded && props.children}
        {!expanded && (
          <div className={`relative overflow-hidden h-80`}>
            {props.children}
            {/* Box for hide effect at the end of the text clipped */}
            <div className="absolute bottom-0 w-full h-16 flex bg-gradient-to-t from-primary-50 via-primary-50 to-transparent"></div>
          </div>
        )}
        <ViewMoreOrLessButton toggleView={toggleView} expanded={expanded} />
      </div>
    );
  }
}

export function TabPanelData(props: TabPanelProps) {
  const [data, setData] = useState(null as TabPanelDataObject);
  const [isLoading, setLoading] = useState(false);

  const [editingDescription, setEditDescription] = useState(false);

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

  function handleEditDescription(event): void {
    setEditDescription(true);
  }
  function handleCancelEditing(event): void {
    setEditDescription(false);
  }

  return (
    <TabPanel title={props.title}>
      <div className="grid grid-cols-12">
        <div className="col-span-12 pr-4 py-2">
          <div className="flex w-full">

            <div className="w-full">
              <ExpansibleDiv>
                <div>
                  <div className="flex">
                    <h5 className="w-full">About Dataset</h5>
                    <button className={`${editingDescription && "hidden"} btn-primary-outline btn-small`} onClick={handleEditDescription}>Edit</button>
                  </div>
                  {editingDescription
                    ?
                    (
                      <div className="flex flex-col">
                        <textarea className="w-full pr-4">
                          {props.dataset.description}
                        </textarea>

                        <div className="flex flex-row justify-end py-4">
                          <button className="btn-primary-outline btn-small w-fit" onClick={handleCancelEditing}>Cancel</button>
                          <button className="btn-primary btn-small w-fit">Save</button>
                        </div>
                      </div>
                    )
                    :
                    (
                      <article className="prose lg:prose-xl max-w-none small-font-size">
                        <ReactMarkdown
                          children={props.dataset.description}
                          remarkPlugins={[remarkGfm]}
                        />
                      </article>
                    )
                  }
                </div>
              </ExpansibleDiv>
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
