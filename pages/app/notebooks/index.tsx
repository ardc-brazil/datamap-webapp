import { MaterialSymbol } from "react-material-symbols";
import LoggedLayout from "../../../components/LoggedLayout";

export default function ListNotebooksPage() {
  return (
    <LoggedLayout>
      <div className="w-full max-w-5xl mx-auto">
        <div className="flex flex-wrap justify-between items-end gap-6">
          <div>
            <h2 className="m-0">Notebooks</h2>
            <p className="mt-2 mb-0 text-[15px] leading-[23px] text-primary-600">
              Explore and run machine learning code using Notebooks.
            </p>
          </div>
          <button className="btn-primary m-0 flex-none" disabled>+ New notebook</button>
        </div>

        <div className="mt-8 flex flex-col items-center gap-3 rounded-lg border border-dashed border-primary-300 bg-primary-0 px-6 py-16 text-center">
          <MaterialSymbol icon="code" size={32} weight={300} grade={-25} className="text-primary-400" />
          <h5 className="m-0">Notebooks are coming soon</h5>
          <p className="m-0 max-w-md text-sm text-primary-600">
            We are still working on this feature. Thanks for your interest — it helps us know you need it.
          </p>
        </div>
      </div>
    </LoggedLayout>
  );
}

ListNotebooksPage.auth = {
  role: "admin",
  loading: <div>loading...</div>,
};
