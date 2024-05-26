import Router from "next/router";
import useSWR from 'swr';
import { ROUTE_PAGE_ERROR } from "../../contants/InternalRoutesConstants";
import { fetcher } from "../../lib/fetcher";
import { FilterCriteria } from "./FilterCriteria";

function useDatasetCategoryFilters() {

  const { data, error, isLoading } = useSWR("/api/datasets/filters", fetcher);

  return {
    datasetCategoryFilters: data,
    datasetCategoryFiltersIsLoading: isLoading,
    datasetCategoryFiltersError: error
  };
}

export function FilterCriteriaList(props) {

  const { datasetCategoryFilters, datasetCategoryFiltersIsLoading, datasetCategoryFiltersError: datasetCategoryFiltersError } = useDatasetCategoryFilters()

  if (datasetCategoryFiltersError?.status == 401) {
    Router.push(ROUTE_PAGE_ERROR(datasetCategoryFiltersError));
  }

  return (

    <div className="flex-none min-w-[15rem] max-w-[15rem] border-primary-200">
      <p className="pl-4">Filter By</p>
      <hr className="border-primary-200" />
      <div className="pt-6 divide-y divide-solid divide-primary-200">

        {datasetCategoryFiltersIsLoading && <p className="text-sm">Loading dynamic filters</p>}
        {datasetCategoryFiltersError && <p className="text-sm">Error to read dynamic filters</p>}
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
              lastSearchParameterDeselected={props.lastSearchParameterDeselected}
            ></FilterCriteria>
          );
        })}
      </div>
    </div>
  );
}
