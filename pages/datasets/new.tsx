import React from "react";
import Layout from "../../components/Layout";
import { Tabs } from "../../components/DatasetDetails/Tabs";
import { TabPanelData } from "../../components/DatasetDetails/TabPanelData";
import { TabPanelMetadata } from "../../components/DatasetDetails/TabPanelMetadata";

import { getAllDatasets } from "../../lib/datasets";

import Search from "../../lib/search";
import LoggedLayout from "../../components/LoggedLayout";
import Link from "next/link";
import SearchBar from "../../components/Dataset/SearchBar";
export default function DatasetDetails(props) {
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
    <LoggedLayout fluid={true}>
      <h2>New Dataset</h2>

      <form>
        <div className="mb-6">
          <label
            htmlFor="email"
            className="block mb-2 text-sm font-medium text-gray-900 dark:text-white"
          >
            Dataset title
          </label>
          <input
            type="email"
            id="email"
            className="shadow-sm bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500 dark:shadow-sm-light"
            placeholder="Enter the dataset title"
            required
          />
        </div>

        <div className="mb-6">
          <label
            htmlFor="email"
            className="block mb-2 text-sm font-medium text-gray-900 dark:text-white"
          >
            Subtitle
          </label>
          <input
            type="email"
            id="email"
            className="shadow-sm bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500 dark:shadow-sm-light"
            placeholder="Enter the dataset title"
            required
          />
        </div>

        <button className="btn-primary my-8">Create</button>
      </form>
    </LoggedLayout>
  );
}
