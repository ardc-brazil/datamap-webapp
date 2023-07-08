import React, { useState, useEffect } from "react";
import LoggedLayout from "../../components/LoggedLayout";
import { FilterCriteria } from "../../components/Search/FilterCriteria";
import { filterCriteria } from "../../fake-data/filters";

import SearchBar from "../../components/Dataset/SearchBar";

import Search from "../../lib/search";
import { FilterBadges } from "../../components/Search/FilterBadges";
import { ListDataset } from "../../components/Search/ListDataset";
import { EmptySearch } from "../../components/Search/EmptySearch";

import { getAllDatasets } from "../../lib/datasets";

function SearchPage(props) {
  const [filters, setFilters] = useState(filterCriteria);
  const [selectedOptions, setSelectedOptions] = useState([], true);
  const [items, setItems] = useState([]);
  const [textSearch, setTextSearch] = useState("");
  const search = new Search(props.data);

  function searchIdx(queryParams) {
    if (!queryParams || queryParams.length <= 0) {
      setItems(search.getAllData());
    } else {
      setItems(search.searchIndex(queryParams));
    }
  }

  useEffect(() => {
    setFilters(filterCriteria);
    setSelectedOptions(filteredOptionsSelected);
    setItems(search.getAllData());
  }, []);

  useEffect(() => {
    let result = selectedOptions.map((opt) => {
      return opt.option.value;
    });

    if (textSearch) {
      result.push(textSearch);
    }

    searchIdx(result);
  }, [selectedOptions, textSearch]);

  function cleanFilters() {
    return filters.map((f) => {
      f.options.map((o) => {
        o.selected = "";
        return o;
      });

      return f;
    });
  }

  function updatedFilters(criteria, event) {
    return filters.map((f) => {
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
  }

  function onCriteriaChanged(criteria, event) {
    setFilters(updatedFilters(criteria, event));
    setSelectedOptions(filteredOptionsSelected);
  }

  function filteredOptionsSelected() {
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
              selectedOption.option.title = selectedOption.option.selected;
            }
            optionsSelected.push(selectedOption);
          }
        }
      }
    }

    return optionsSelected;
  }

  function onClearFilters() {
    setFilters(cleanFilters);
    setSelectedOptions(filteredOptionsSelected);
  }

  function onClearSearchText() {
    setTextSearch("");
  }

  function onSearchText(text) {
    setTextSearch(text);
  }

  return (
    <LoggedLayout fluid={true} footerPropsMarginTop={false}>
      <div className="flex flex-row gap-4">
        <div className="flex-none border-r min-w-[15rem] max-w-[15rem] border-primary-200 pl-4">
          <p className="py-4">Filter By</p>
          <hr className="border-primary-200" />
          <div className="pt-6 divide-y divide-solid divide-primary-200">
            {filters.map((criteria, index, row) => {
              var border = true;

              if (index + 1 === row.length) {
                border = false;
              }

              return (
                <FilterCriteria
                  key={criteria.id}
                  criteria={criteria}
                  onCriteriaChanged={onCriteriaChanged}
                  border={border}
                ></FilterCriteria>
              );
            })}
          </div>
        </div>

        <div className="col-span-9 basis-full px-4 min-h-screen max-w-screen-lg">
          <div className="mt-12 mb-4">
            <SearchBar onClear={onClearSearchText} onSearch={onSearchText} />
          </div>
          <div className="mb-8 h-12">
            <FilterBadges
              selectedOptions={selectedOptions}
              onClose={onCriteriaChanged}
              onClearFilters={onClearFilters}
            ></FilterBadges>
          </div>
          <div>
            {items.length > 0 ? <ListDataset data={items} /> : <EmptySearch />}
          </div>
        </div>
      </div>
    </LoggedLayout>
  );
}

export async function getServerSideProps(context) {
  // Fetch data from external API
  const data = await getAllDatasets();

  // Pass data to the page via props
  return { props: { data } };
}

export default SearchPage;
