import React from "react";
import { Badge } from "./Badge";
import { CurrentSearchParameterState, SelectedFilterValue } from "../types/FilterOption";

interface Props {
  currentSearchParameterState: CurrentSearchParameterState
  onClose(selectedFilter: SelectedFilterValue): void
  onClearFilters?(): void
}

export function FilterBadges(props: Props) {
  function onClose(selectedFilter) {
    props.onClose(selectedFilter)
  }

  // FIX: Bug in the clear all event reception
  // function onClearFilters() {
  //   props.onClearFilters();
  // }

  return (
    <>
      {Object.keys(props?.currentSearchParameterState?.selectedFilters)?.map(key => {
        const current = props?.currentSearchParameterState?.selectedFilters[key]
        // Full text is ignored by the badge filters
        if (key === "full_text") {
          return;
        }

        return <Badge
          key={current.id}
          selectedFilter={current}
          onClose={onClose}>
          {current.criteriaId}:{current.value}
        </Badge>
      })}

      {/* FIX: Bug in the clear all event reception */}
      {/* {Object.keys(props?.currentSearchParameterState?.selectedFilters)?.length > 1 && (
        <button
          className="border border-primary-400 rounded-full px-4 py-0 text-lg hover:border-primary-800"
          onClick={onClearFilters}
        >
          Clean Filters
        </button>
      )} */}
    </>
  );
}
