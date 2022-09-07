import React, { useState, useEffect } from "react";
import Layout from "../../components/Layout";
import { FilterCriteria } from "../../components/Search/FilterCriteria";
import { Badge } from "../../components/Search/Badge";
import { filterCriteria } from "../fake-data/filters";

// @ts-check

export default function SearchPage() {
  var idGenerator = 1;

  const [filters, setFilters] = useState(filterCriteria);
  const [selectedOptions, setSelectedOptions] = useState([], true);

  useEffect(() => {
    setFilters(filterCriteria);
    setSelectedOptions(filterOptionsSelected);
  }, []);

  function updateFilters(criteria, event) {
    var updatedFilters = filters.map((f) => {
      if (f.id == criteria.id) {
        if (f.selection == "multiple") {
          f.options.map((o) => {
            if (o.id == event.option.id) {
              o.selected = event.selected;
            }

            return o;
          });
        } else if (f.selection == "one") {
          f.options.map((o) => (o.selected = 0));
          f.options.map((o) => {
            if (o.id == event.option.id) {
              o.selected = event.selected;
            }

            return o;
          });
        } else if (f.selection == "date-range") {
          f.options.map((o) => {
            if (o.id == event.option.id) {
              o.selected = event.selected;
            }
            return o;
          });
        }
      }

      return f;
    });

    return updatedFilters;
  }

  function onCriteriaChanged(criteria, event) {
    setFilters(updateFilters(criteria, event));
    setSelectedOptions(filterOptionsSelected);
  }

  function filterOptionsSelected() {
    var optionsSelected = [];
    for (const c of filters) {
      if (c.options) {
        for (const o of c.options) {
          if (o.selected) {
            const selectedOption = {
              criteria: c,
              option: o,
            };

            if (c.selection == "date-range") {
              // FIX: Workaround to use the same struct form date-range.
              // Convert to typescript and work with interfaces to make this clear.
              selectedOption.option.text = selectedOption.option.selected;
            }
            optionsSelected.push(selectedOption);
          }
        }
      }
    }

    return optionsSelected;
  }

  function onClose(e) {
    onCriteriaChanged(e.criteria, { selected: false, option: e.option });
  }

  return (
    <Layout fluid={true}>
      <div className="grid grid-cols-12 gap-4">
        <div className="col-span-3 border-r min-w-[15rem] max-w-[15rem] border-primary-200 pl-4">
          <p className="py-4">Filter By</p>
          <hr className="border-primary-200" />
          <div className="pt-6">
            {filters.map((criteria) => (
              <FilterCriteria
                key={criteria.id}
                criteria={criteria}
                onCriteriaChanged={onCriteriaChanged}
              ></FilterCriteria>
            ))}
          </div>
        </div>

        <div className="col-span-9 px-4">
          {selectedOptions.map((selectedOpt) => (
            <Badge
              key={selectedOpt.option.id}
              onClose={onClose}
              option={selectedOpt}
            >
              {selectedOpt.option.text}
            </Badge>
          ))}
        </div>
      </div>
    </Layout>
  );
}
