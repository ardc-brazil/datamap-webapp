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
  const { data, error, isLoading } = useSWR(`/api/datasets?full_text=${currentSearchParameters.textSearch}`, fetcher, {
    onErrorRetry: SWRRetry
  })

  // console.log(currentSearchParameters.criterias);

  return {
    datasets: data,
    datasetsIsLoading: isLoading,
    datasetsIsError: error
  };
}

type CurrentSearchParameterState = {
  at: number,
  textSearch: string,
  criteriasSelected: object,
};


export default function ListDatasetPage(props) {

  // const premap = {}
  const [currentSearchParameters, setCurrentSearchParameters] = useState({
    at: Date.now(),
    textSearch: "",
    criteriasSelected: {},
  } as CurrentSearchParameterState)

  const { datasets, datasetsIsLoading, datasetsIsError } = useDatasetSearch(currentSearchParameters)

  function onTextSearchChanged(text: string) {
    setCurrentSearchParameters({
      ...currentSearchParameters,
      at: Date.now(),
      textSearch: text,
    });
  }

  function onCriteriaChanged(criteria, selectedOption) {

    // multiple
    if (selectedOption.criteriaSelected.selection === "multiple") {
      console.log(selectedOption.criteriaSelected.selection)
      if (selectedOption.valueSelected) {
        currentSearchParameters.criteriasSelected[selectedOption.optionSelected.id] = {
          label: selectedOption.optionSelected.label,
          value: selectedOption.optionSelected.value,
          selection: selectedOption.criteriaSelected.selection,
        }
      } else {
        delete currentSearchParameters.criteriasSelected[selectedOption.optionSelected.id];
      }
    }
    // one
    else if (selectedOption.criteriaSelected.selection === "one") {
      console.log(selectedOption.criteriaSelected.selection)

      // Only one options is available, then we should use the criteria id instead of option
      // id like in multiple selection.
      currentSearchParameters.criteriasSelected[selectedOption.criteriaSelected.id] = {
        label: selectedOption.optionSelected.label,
        value: selectedOption.optionSelected.value,
        selection: selectedOption.criteriaSelected.selection,
      }
    }
    // date
    else if (selectedOption.criteriaSelected.selection === "date-range") {
      console.log(selectedOption.criteriaSelected.selection)

      if (selectedOption.valueSelected && selectedOption.valueSelected !== '') {
        currentSearchParameters.criteriasSelected[selectedOption.optionSelected.id] = {
          label: selectedOption.optionSelected.label,
          value: selectedOption.optionSelected.value,
          selection: selectedOption.criteriaSelected.selection,
        }
      } else {
        delete currentSearchParameters.criteriasSelected[selectedOption.optionSelected.id];
      }
    }

    setCurrentSearchParameters({
      ...currentSearchParameters,
      at: Date.now(),
      criteriasSelected: currentSearchParameters.criteriasSelected
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