import Link from "next/link";
import { useState } from "react";
import useSWR from 'swr';
import LoggedLayout from "../../../components/LoggedLayout";
import { EmptySearch } from "../../../components/Search/EmptySearch";
import { ListDataset } from "../../../components/Search/ListDataset";
import TextSearchBar from "../../../components/SearchDataset/TextSearchBar";
import { ROUTE_PAGE_DATASETS_NEW } from "../../../contants/InternalRoutesConstants";
import { filterCriteria } from "../../../fake-data/filters";
import { NewContext } from "../../../lib/appLocalContext";
import { getAllDataset } from "../../../lib/dataset";
import { fetcher } from "../../../lib/fetcher";

function useDatasetSearch(fullText) {
  const { data, error, isLoading } = useSWR(`/api/datasets?full_text=${fullText}`, fetcher)

  return {
    datasets: data,
    datasetsIsLoading: isLoading,
    datasetsIsError: error
  };
}

export default function ListDatasetPage(props) {
  const [filters, setFilters] = useState(filterCriteria);
  const [textSearch, setTextSearch] = useState({ text: "", at: Date.now() })
  const { datasets, datasetsIsLoading, datasetsIsError } = useDatasetSearch(textSearch.text)

  function onTextSearchChanged(text) {
    setTextSearch({ text: text, at: Date.now() });
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

        {/* TODO: Categories filte are disabled until we fix it
        <div className="border-primary-200 mt-8">
          <div className="flex flex-row gap-4">
            <FilterCriteriaList filters={filters} />
            <div className="col-span-9 basis-full px-4 min-h-screen max-w-screen-lg">
              <div>
                {items?.length > 0 ? <ListDataset data={items} /> : <EmptySearch>{loadingDatasetsMessage}</EmptySearch>}
              </div>
            </div>
          </div>
        </div>
      */}

        <div className="border-primary-200 mt-8">
          <div className="flex flex-row">
            {datasetsIsError && <EmptySearch>Error to read datasets</EmptySearch>}
            {datasetsIsLoading && <EmptySearch>Loading datasets...</EmptySearch>}
            {datasets?.size <= 0 && <EmptySearch>No datasets found</EmptySearch>}
            {datasets?.size > 0 && <ListDataset data={datasets.content} requestedAt={textSearch.at} />}
          </div>
        </div>
      </div>
    </LoggedLayout>
  );

}

export async function getServerSideProps(context) {

  // Fetch data frm external API
  const data = await getAllDataset(await NewContext(context.req), context.req.url);

  // Pass data to the page via props
  return { props: { data } };
}

ListDatasetPage.auth = {
  role: "admin",
  loading: <div>loading...</div>,
};