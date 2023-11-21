import React from "react";

import { FilterCriteria } from "./FilterCriteria";
import useSWR from 'swr';
import { fetcher } from "../../lib/fetcher"

function useDatasetCategoryFilters() {
  const { data, error, isLoading } = useSWR("/api/datasets/filters", fetcher);

  return {
    datasetCategoryFilters: data,
    datasetCategoryFiltersIsLoading: isLoading,
    datasetCategoryFiltersIsError: error
  };
}

export function FilterCriteriaList(props) {

  const { datasetCategoryFilters, datasetCategoryFiltersIsLoading, datasetCategoryFiltersIsError } = useDatasetCategoryFilters()

  return (

    <div className="flex-none min-w-[15rem] max-w-[15rem] border-primary-200">
      <p className="pl-4">Filter By</p>
      <hr className="border-primary-200" />
      <div className="pt-6 divide-y divide-solid divide-primary-200">

        {datasetCategoryFiltersIsLoading && <p className="text-sm">Loading dynamic filters</p>}
        {datasetCategoryFiltersIsError && <p className="text-sm">Error to read dynamic filters</p>}
        {datasetCategoryFilters && datasetCategoryFilters.map((criteria, index, row) => {
          var border = true;

          if (index + 1 === row.length) {
            border = false;
          }

          return (
            <FilterCriteria
              key={criteria.id}
              criteria={criteria}
              border={border}
              onCriteriaChanged={props.onCriteriaChanged}
            ></FilterCriteria>
          );
        })}
      </div>
    </div>
  );
}
