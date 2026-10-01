
export function ListDatasetHeader(props) {
  return (
    <div className="flex justify-between items-baseline pb-3 text-[13px] text-primary-500">
      <span><span data-testid="dataset-count-items" className="font-semibold text-primary-900">{props.itemCount}</span> results</span>
      <span>Requested at {new Date(props.requestedAt).toLocaleString()}</span>
      {/* <div>
        <label htmlFor="sortbySelector">
          <span className=" px-2 ">Sort by:</span>
          <select
            id="sortbySelector"
            name="sortbySelector"
            className="form-select py-0 border-0 focus:border-0 focus:ring-0 bg-primary-50"
          >
            <option value="relevancy" defaultValue>
              Relevance
            </option>
            <option value="date">Date</option>
          </select>
        </label>
      </div> */}
    </div>
  );
}
