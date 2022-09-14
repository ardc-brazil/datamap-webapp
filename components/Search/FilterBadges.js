import React from "react";
import { Badge } from "../../components/Search/Badge";

export function FilterBadges(props) {
  function onClose(e) {
    props.onClose(e.criteria, { selected: "", option: e.option });
  }

  function onClearFilters() {
    props.onClearFilters();
  }

  return (
    <>
      {props.selectedOptions.map((selectedOpt) => (
        <Badge
          key={selectedOpt.option.id}
          onClose={onClose}
          option={selectedOpt}
        >
          {selectedOpt.option.title
            ? selectedOpt.option.title
            : selectedOpt.option.text}
        </Badge>
      ))}

      {props.selectedOptions.length > 1 && (
        <button
          className="border border-primary-400 rounded-full px-4 py-0 text-lg hover:border-primary-800"
          onClick={onClearFilters}
        >
          Clean Filters
        </button>
      )}
    </>
  );
}
