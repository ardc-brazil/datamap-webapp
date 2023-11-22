import Link from "next/link";
import { useState } from "react";
import useSWR from 'swr';
import LoggedLayout from "../../../components/LoggedLayout";
import { EmptySearch } from "../../../components/Search/EmptySearch";
import { FilterCriteriaList } from "../../../components/Search/FilterCriteriaList";
import { ListDataset } from "../../../components/Search/ListDataset";
import TextSearchBar from "../../../components/SearchDataset/TextSearchBar";
import { ROUTE_PAGE_DATASETS_NEW } from "../../../contants/InternalRoutesConstants";
import { fetcher, SWRRetry } from "../../../lib/fetcher";

function useDatasetSearch(currentSearchParameters) {

  function buildQueryStringFrom(state: CurrentSearchParameterState) {

    const c = {}

    Object.keys(state.selectedFilters)
      .map(function groupByCriteriaId(key) {

        const currentCriteria = state.selectedFilters[key];

        if (!c[currentCriteria.criteriaId]) {
          c[currentCriteria.criteriaId] = []
        }

        c[currentCriteria.criteriaId].push(currentCriteria.value)
      })
    return new URLSearchParams(c).toString();
  }

  const { data, error, isLoading } = useSWR(`/api/datasets?${buildQueryStringFrom(currentSearchParameters)}`, fetcher, {
    onErrorRetry: SWRRetry
  })

  return {
    datasets: data,
    datasetsIsLoading: isLoading,
    datasetsIsError: error
  };
}

type CurrentSearchParameterState = {
  at: number,
  selectedFilters: { [key: string]: SelectedFilterValue },
};

type SelectedFilterValue = {
  criteriaId: string
  label: string
  value: string
  selection: string
}


export default function ListDatasetPage(props) {

  const [currentSearchParameters, setCurrentSearchParameters] = useState({
    at: Date.now(),
    selectedFilters: {
      full_text: {
        criteriaId: "full_text",
        label: "full_text",
        value: "",
        selection: "full_text",
      }
    }
  } as CurrentSearchParameterState)

  const { datasets, datasetsIsLoading, datasetsIsError } = useDatasetSearch(currentSearchParameters)

  function onTextSearchChanged(text: string) {
    setCurrentSearchParameters({
      at: Date.now(),
      selectedFilters: {
        ...
        currentSearchParameters.selectedFilters,
        full_text: {
          criteriaId: "full_text",
          label: "full_text",
          value: text,
          selection: "full_text",
        }
      }
    });
  }

  function onCriteriaChanged(criteria, selectedOption) {

    // multiple
    if (selectedOption.criteriaSelected.selection === "multiple") {
      if (selectedOption.valueSelected) {
        currentSearchParameters.selectedFilters[selectedOption.optionSelected.id] = {
          criteriaId: selectedOption.criteriaSelected.id,
          label: selectedOption.optionSelected.label,
          value: selectedOption.optionSelected.value,
          selection: selectedOption.criteriaSelected.selection,
        }
      } else {
        delete currentSearchParameters.selectedFilters[selectedOption.optionSelected.id];
      }
    }
    // one
    else if (selectedOption.criteriaSelected.selection === "one") {
      // Only one options is available, then we should use the criteria id instead of option
      // id like in multiple selection.
      currentSearchParameters.selectedFilters[selectedOption.criteriaSelected.id] = {
        criteriaId: selectedOption.criteriaSelected.id,
        label: selectedOption.optionSelected.label,
        value: selectedOption.optionSelected.value,
        selection: selectedOption.criteriaSelected.selection,
      }
    }
    // date
    else if (selectedOption.criteriaSelected.selection === "date-range") {
      if (selectedOption.valueSelected && selectedOption.valueSelected !== '') {
        currentSearchParameters.selectedFilters[selectedOption.optionSelected.id] = {
          criteriaId: selectedOption.criteriaSelected.id,
          label: selectedOption.optionSelected.label,
          value: selectedOption.optionSelected.value,
          selection: selectedOption.criteriaSelected.selection,
        }
      } else {
        delete currentSearchParameters.selectedFilters[selectedOption.optionSelected.id];
      }
    }

    setCurrentSearchParameters({
      ...currentSearchParameters,
      at: Date.now(),
      selectedFilters: currentSearchParameters.selectedFilters
    });
  }

  return (
    <LoggedLayout>
      <div className="container mx-auto">

        <h2>Datasets</h2>
        <p className="text-primary-700">
          Explore, analyze, and share quality data. Learn more about data types,
          creating, and collaborating.
        </p>

        <Link href={ROUTE_PAGE_DATASETS_NEW}>
          <button className="btn-primary mt-2">+ New Dataset</button>
        </Link>

        <div className="mt-8 mb-4 max-w-4xl">
          <TextSearchBar onTextSearchChanged={onTextSearchChanged} />
        </div>

        <div className="border-primary-200 mt-8">
          <div className="flex flex-row gap-4">
            <FilterCriteriaList onCriteriaChanged={onCriteriaChanged} />

            <div className="col-span-9 basis-full px-4 min-h-screen">
              <div>
                {datasetsIsError && <EmptySearch>Error to read datasets</EmptySearch>}
                {datasetsIsLoading && <EmptySearch>Loading datasets...</EmptySearch>}
                {datasets?.size <= 0 && <EmptySearch>No datasets found</EmptySearch>}
                {datasets?.size > 0 && <ListDataset data={datasets.content} requestedAt={currentSearchParameters.at} />}
              </div>
            </div>
          </div>
        </div>
      </div>
    </LoggedLayout >
  );
}

ListDatasetPage.auth = {
  role: "admin",
  loading: <div>loading...</div>,
};