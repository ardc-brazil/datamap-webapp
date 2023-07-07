import React from "react";

export function ListDatasetHeader(itemCount) {
  return (
    <div className="flex justify-between gap-2">
      <p>{itemCount.itemCount} Results</p>
      <div>
        <label htmlFor="sortbySelector">
          {/* <span className=" px-2 ">Sort by:</span> */}
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
      </div>
    </div>
  );
}
