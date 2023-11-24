import Link from "next/link";
import LoggedLayout from "../../../components/LoggedLayout";
import { ROUTE_PAGE_DATASETS_NEW } from "../../../contants/InternalRoutesConstants";

export default function ListNotebooksPage() {
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