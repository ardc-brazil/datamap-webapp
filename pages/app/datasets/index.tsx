import Link from "next/link";
import { useRouter } from 'next/router';
import { useState } from "react";
import useSWR from 'swr';
import LoggedLayout from "../../../components/LoggedLayout";
import { EmptySearch } from "../../../components/Search/EmptySearch";
import { FilterBadges } from "../../../components/Search/FilterBadges";
import { FilterCriteriaList } from "../../../components/Search/FilterCriteriaList";
import { ListDataset } from "../../../components/Search/ListDataset";
import TextSearchBar from "../../../components/Search/TextSearchBar";
import Alert from "../../../components/base/Alert";
import { CurrentSearchParameterState, SelectedFilterValue } from "../../../components/types/FilterOption";
import { ROUTE_PAGE_DATASETS, ROUTE_PAGE_DATASETS_NEW, ROUTE_PAGE_ERROR } from "../../../contants/InternalRoutesConstants";
import { SWRRetry, fetcher } from "../../../lib/fetcher";
import { GetDatasetsResponse } from "../../../types/BffAPI";

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

  const { data, error, isLoading } = useSWR(`/api/datasets?minimal=true&${buildQueryStringFrom(currentSearchParameters)}`, fetcher, {
    onErrorRetry: SWRRetry,
  })

  return {
    datasets: data as GetDatasetsResponse,
    datasetsIsLoading: isLoading,
    datasetsError: error
  };
}

export default function ListDatasetPage() {

  const router = useRouter();

  const emptyCurrentSearchParameters = {
    at: Date.now(),
    selectedFilters: {
      full_text: {
        id: "full_text",
        criteriaId: "full_text",
        label: "full_text",
        value: "",
        selection: "full_text",
      }
    }
  } as CurrentSearchParameterState

  const [currentSearchParameters, setCurrentSearchParameters] = useState(emptyCurrentSearchParameters)
  const [lastSearchParameterDeselected, setLastSearchParameterDeselected] = useState(null as SelectedFilterValue)
  const { datasets, datasetsIsLoading, datasetsError } = useDatasetSearch(currentSearchParameters)

  if (datasetsError?.status == 401) {
    router.push(ROUTE_PAGE_ERROR(datasetsError));
  }

  function onTextSearchChanged(text: string) {
    setCurrentSearchParameters({
      at: Date.now(),
      selectedFilters: {
        ...
        currentSearchParameters.selectedFilters,
        full_text: {
          id: "full_text",
          criteriaId: "full_text",
          label: "full_text",
          value: text,
          selection: "full_text",
        }
      }
    });
  }

  function onCriteriaChanged(criteria, selectedOption) {
    setLastSearchParameterDeselected(null)

    // multiple
    if (selectedOption.criteriaSelected.selection === "multiple") {
      if (selectedOption.valueSelected) {
        currentSearchParameters.selectedFilters[selectedOption.optionSelected.id] = {
          id: selectedOption.optionSelected.id,
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
        id: selectedOption.criteriaSelected.id,
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
          id: selectedOption.optionSelected.id,
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

  function onBadgesClose(selectedFilter: SelectedFilterValue): void {
    // Update state to notify last selected filters removed to all components that depends on filters.
    setLastSearchParameterDeselected(selectedFilter)

    // Update current search parameters for update the dataset list
    delete currentSearchParameters.selectedFilters[selectedFilter.id];
    setCurrentSearchParameters({
      ...currentSearchParameters,
      at: Date.now(),
      selectedFilters: currentSearchParameters.selectedFilters
    });
  }

  // FIX: Clear all badges has a bug to update the currentSearchParameters from FilterCriteriaList
  // Only lastSearchParameterDeselected state is tracked. To implement ClearAll, the lastSearchParameterDeselected
  // should be an array.
  // function onBadgesClearAll() {
  //   // Reset current paramenters to initial state.
  //   setCurrentSearchParameters({
  //     ...emptyCurrentSearchParameters,
  //     at: Date.now(),
  //     selectedFilters: {
  //       full_text: currentSearchParameters.selectedFilters.full_text
  //     }
  //   });
  // }

  function onAlertClose() {
    router.push(ROUTE_PAGE_DATASETS);
  }

  return (
    <LoggedLayout>
      <div className="container mx-auto">
        <Alert callout="Dataset deleted" show={router?.query?.deleteDatasetName as unknown as boolean} closed={onAlertClose}>
          <p>The dataset <b>'{router?.query?.deleteDatasetName}'</b> was deleted with success!</p>
        </Alert>

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
          <FilterBadges
            currentSearchParameterState={currentSearchParameters}
            onClose={onBadgesClose} />
        </div>

        <div className="border-primary-200 mt-8">
          <div className="flex flex-row gap-4">
            <FilterCriteriaList onCriteriaChanged={onCriteriaChanged} lastSearchParameterDeselected={lastSearchParameterDeselected} />
            <div className="col-span-9 basis-full px-4 min-h-screen">
              <div>
                {datasetsError && <EmptySearch>Error to read datasets</EmptySearch>}
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
