import axios from "axios";
import Link from "next/link";
import { useEffect, useState } from "react";
import LoggedLayout from "../../../components/LoggedLayout";
import { EmptySearch } from "../../../components/Search/EmptySearch";
import { FilterCriteriaList } from "../../../components/Search/FilterCriteriaList";
import { ListDataset } from "../../../components/Search/ListDataset";
import { ROUTE_PAGE_DATASETS_NEW } from "../../../contants/InternalRoutesConstants";
import { filterCriteria } from "../../../fake-data/filters";
import { NewContext } from "../../../lib/appLocalContext";
import { getAllDataset } from "../../../lib/dataset";

export default function ListDatasetPage(props) {
  const [filters, setFilters] = useState(filterCriteria);
  const [items, setItems] = useState([]);
  const [loadingDatasetsMessage, setLoadingDatasetsMessage] = useState("Loading datasets...");

  useEffect(() => {
    setFilters(filterCriteria);
    axios.get("/api/datasets")
      .then(response => {
        try {
          if (response.status == 200) {
            setItems(response.data?.content);
            if (items.length <= 0) {
              setLoadingDatasetsMessage("No datasets found");
            }
          } else {
            console.log(response);
            setLoadingDatasetsMessage("Error to read datasets");
          }
        } catch (error) {
          console.log(error);
          setLoadingDatasetsMessage("Error to read datasets");
        }
      })
      .catch(error => {
        console.log(error);
        setLoadingDatasetsMessage("Error to read datasets");
      });

  }, []);

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
          <form>
            <label
              htmlFor="default-search"
              className="mb-2 text-sm font-medium text-gray-900 sr-only dark:text-white"
            >
              Search
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                <svg
                  className="w-4 h-4 text-gray-500 dark:text-gray-400"
                  aria-hidden="true"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                >
                  <path
                    stroke="currentColor"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="m19 19-4-4m0-7A7 7 0 1 1 1 8a7 7 0 0 1 14 0Z"
                  />
                </svg>
              </div>
              <input
                type="search"
                id="default-search"
                className="block w-full p-4 pl-10 text-sm text-gray-900 border border-gray-300 rounded-lg bg-gray-50 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                placeholder="Search dataset"
                required
              />
              <button
                type="submit"
                className="text-white absolute right-2.5 bottom-2.5 bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium rounded-lg text-sm px-4 py-2 dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800"
              >
                Search
              </button>
            </div>
          </form>
        </div>

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
      </div>
    </LoggedLayout>
  );
}

export async function getServerSideProps(context) {

  // Fetch data frm external API
  const data = await getAllDataset(await NewContext(context.req));

  // Pass data to the page via props
  return { props: { data } };
}

ListDatasetPage.auth = {
  role: "admin",
  loading: <div>loading...</div>,
};