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

export default function ListNotebooksPage(props) {
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

        <h2>Notebooks</h2>
        <p className="text-primary-700">
          Explore and run machine learning code using Notebooks.
        </p>

        <Link href={ROUTE_PAGE_DATASETS_NEW}>
          <button className="btn-primary mt-2" disabled>+ New Notebook</button>
        </Link>

        <hr className="my-8" />

        <div className="text-center">
          <h4> Unavaible, <span className="text-primary-400">for while</span>!</h4>
          <p>We are working in this feature yet. But is good to know that you need this.</p>
        </div>

      </div>
    </LoggedLayout>
  );
}

ListNotebooksPage.auth = {
  role: "admin",
  loading: <div>loading...</div>,
};