import React from "react";

import { FilterCriteria } from "./FilterCriteria";

export function FilterCriteriaList(props) {
  return (

    <div className="flex-none min-w-[15rem] max-w-[15rem] border-primary-200">
      <p className="pl-4">Filter By</p>
      <hr className="border-primary-200" />
      <div className="pt-6 divide-y divide-solid divide-primary-200">
        {props.filters.map((criteria, index, row) => {
          var border = true;

          if (index + 1 === row.length) {
            border = false;
          }

          return (
            <FilterCriteria
              key={criteria.id}
              criteria={criteria}
              border={border}
            ></FilterCriteria>
          );
        })}
      </div>
    </div>
  );
}
