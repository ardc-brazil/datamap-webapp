import React, { useEffect, useState } from "react";
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

export function TabPanelData(props: TabPanelProps) {
  const [data, setData] = useState(null as TabPanelDataObject);
  const [isLoading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    setTimeout(() => {
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
        {/* TODO: Truncate big htmls */}
        <div className="col-span-9 pr-4 py-4">
          <article className="prose lg:prose-xl max-w-none small-font-size">
            <ReactMarkdown children={markdown} remarkPlugins={[remarkGfm]} />
          </article>
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
