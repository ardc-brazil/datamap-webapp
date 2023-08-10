import React, { useEffect, useState, useRef } from "react";
import { TabPanel, TabPanelProps } from "./TabPanel";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { markdown } from "../../fake-data/lorem-ipsum-mk";

interface TabPanelDataObject {
  usability: string;
  license: string;
  updateFrequency: string;
}

function LoadingAnimation() {
  return (
    <div role="status" className="space-y-2.5 animate-pulse max-w-lg mb-8">
      <div className="flex items-center space-x-2 w-full">
        <div className="h-2.5 bg-primary-200 rounded-full dark:bg-primary-700 w-32"></div>
        <div className="h-2.5 bg-primary-300 rounded-full dark:bg-primary-600 w-24"></div>
        <div className="h-2.5 bg-primary-300 rounded-full dark:bg-primary-600 w-full"></div>
      </div>
      <div className="flex items-center w-full space-x-2 max-w-[480px]">
        <div className="h-2.5 bg-primary-200 rounded-full dark:bg-primary-700 w-full"></div>
        <div className="h-2.5 bg-primary-300 rounded-full dark:bg-primary-600 w-full"></div>
        <div className="h-2.5 bg-primary-300 rounded-full dark:bg-primary-600 w-24"></div>
      </div>
      <div className="flex items-center w-full space-x-2 max-w-[400px]">
        <div className="h-2.5 bg-primary-300 rounded-full dark:bg-primary-600 w-full"></div>
        <div className="h-2.5 bg-primary-200 rounded-full dark:bg-primary-700 w-80"></div>
        <div className="h-2.5 bg-primary-300 rounded-full dark:bg-primary-600 w-full"></div>
      </div>
      <div className="flex items-center w-full space-x-2 max-w-[480px]">
        <div className="h-2.5 bg-primary-200 rounded-full dark:bg-primary-700 w-full"></div>
        <div className="h-2.5 bg-primary-300 rounded-full dark:bg-primary-600 w-full"></div>
        <div className="h-2.5 bg-primary-300 rounded-full dark:bg-primary-600 w-24"></div>
      </div>
      <div className="flex items-center w-full space-x-2 max-w-[440px]">
        <div className="h-2.5 bg-primary-300 rounded-full dark:bg-primary-600 w-32"></div>
        <div className="h-2.5 bg-primary-300 rounded-full dark:bg-primary-600 w-24"></div>
        <div className="h-2.5 bg-primary-200 rounded-full dark:bg-primary-700 w-full"></div>
      </div>
      <div className="flex items-center w-full space-x-2 max-w-[360px]">
        <div className="h-2.5 bg-primary-300 rounded-full dark:bg-primary-600 w-full"></div>
        <div className="h-2.5 bg-primary-200 rounded-full dark:bg-primary-700 w-80"></div>
        <div className="h-2.5 bg-primary-300 rounded-full dark:bg-primary-600 w-full"></div>
      </div>
      <span className="sr-only">Loading...</span>
    </div>
  );
}

function ViewMoreOrLessButton(props) {
  return (
    <button
      className="btn-primary-outline whitespace-nowrap rounded-3xl border-0"
      onClick={props.toggleView}
    >
      <svg
        aria-hidden="true"
        className={`${
          props.expanded ? "-rotate-90" : "rotate-90"
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
        <div className="col-span-9 pr-4 py-4">
          <ExpansibleDiv>
            <article className="prose lg:prose-xl max-w-none small-font-size">
              <ReactMarkdown
                children={props.dataset.description}
                remarkPlugins={[remarkGfm]}
              />
            </article>
          </ExpansibleDiv>

          {props.dataset.dataFiles && props.dataset.dataFiles.length > 0 && (
            <div className="mt-4">
              <h5 className="font-bold">Data Explorer</h5>
              <ul className="list-disc list-inside py-4">
                {props.dataset.dataFiles?.map((x, i) => (
                  <li className="pl-4" key={i}>
                    <a href={x.path} download>{x.path}</a>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
        <div className="col-span-3 flex flex-col gap-8 pl-8">
          <div>
            <h5 className="font-bold">Usability</h5>
            <p>{data.usability}</p>
          </div>

          <div>
            <h5 className="font-bold">License</h5>
            <p>{data.license}</p>
          </div>

          <div>
            <h5 className="font-bold">Expected update frequency</h5>
            <p>{data.updateFrequency}</p>
          </div>
        </div>
      </div>
    </TabPanel>
  );
}
