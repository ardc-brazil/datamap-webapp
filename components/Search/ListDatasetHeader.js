
export function ListDatasetHeader(props) {
  return (
    <div className="flex justify-between">
      <p><span data-testid="dataset-count-items">{props.itemCount}</span> Results</p>
      <p><small>Requested at: {new Date(props.requestedAt).toLocaleString()}</small></p>
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
