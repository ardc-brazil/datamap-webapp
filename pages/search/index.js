import React, { useState, useEffect } from "react";
import Layout from "../../components/Layout";
import { FilterCriteria } from "../../components/Search/FilterCriteria";
import { Badge } from "../../components/Search/Badge";
import { filterCriteria } from "../../fake-data/filters";

import Link from "next/link";
import SearchBar from "../../components/Dataset/SearchBar";

import elasticlunr from "elasticlunr";
import metadata from "../../public/data/data.json";

// @ts-check

function ListItem(item) {
  return (
    <Link href="/datasets/data-set-id">
      <a>
        <div className="border-b border-primary-200 grid grid-cols-12 hover:bg-primary-100 cursor-pointer py-6">
          <div className="grid place-items-center">
            <div>
              <svg
                className="w-16 h-16 text-primary-200 dark:text-primary-600"
                xmlns="http://www.w3.org/2000/svg"
                aria-hidden="true"
                fill="currentColor"
                viewBox="0 0 640 512"
              >
                <path d="M480 80C480 35.82 515.8 0 560 0C604.2 0 640 35.82 640 80C640 124.2 604.2 160 560 160C515.8 160 480 124.2 480 80zM0 456.1C0 445.6 2.964 435.3 8.551 426.4L225.3 81.01C231.9 70.42 243.5 64 256 64C268.5 64 280.1 70.42 286.8 81.01L412.7 281.7L460.9 202.7C464.1 196.1 472.2 192 480 192C487.8 192 495 196.1 499.1 202.7L631.1 419.1C636.9 428.6 640 439.7 640 450.9C640 484.6 612.6 512 578.9 512H55.91C25.03 512 .0006 486.1 .0006 456.1L0 456.1z" />
              </svg>
            </div>
          </div>
          <div className="col-span-10">
            <p className="font-bold text-lg">{item.data.name}</p>
            <p>
               { 
                item.data.author ? 
                  <span>by {item.data.author.name}</span>
                  : ""
                }
            </p>

            <p>
              <span>1mo ago</span>
              <span className="px-2">•</span>
              <span>
                { getTotalFileSize(item.data.data) }
              </span>
            </p>
            <p>
              {item.data.description}
            </p>
          </div>
        </div>
      </a>
    </Link>
  );
}

function getTotalFileSize(data) {
  let totalGB = 0;

  data.forEach((d) => {
    if (d.file_size_gb)
      totalGB += parseFloat(d.file_size_gb)
  })

  return totalGB + "GB"
}

function ListDatasetHeader() {
  return (
    <div className="flex justify-between gap-2">
      <p>61,708 Results</p>
      <div>
        <label htmlFor="sortbySelector">
          <span className=" px-2 ">Sort by:</span>
          <select
            id="sortbySelector"
            name="sortbySelector"
            className="form-select py-0 border-0 focus:border-0 focus:ring-0 bg-primary-50"
          >
            <option value="relevancy" defaultValue>
              Relevância
            </option>
            <option value="date">Data</option>
          </select>
        </label>
      </div>
    </div>
  );
}

function PageNavigatorNumbersArray(props) {
  return (
    <div className="inline-flex rounded-md shadow-sm" role="group">
      {Array.from({ length: props.pages }, (pageNumber, index) => {
        if (index == 0) {
          return (
            <button
              key={index}
              type="button"
              className="btn-primary-outline border-r-0 rounded-l"
            >
              {index + 1}
            </button>
          );
        } else if (index == props.pages - 1) {
          return (
            <button
              key={index}
              type="button"
              className="btn-primary-outline rounded-r"
            >
              {index + 1}
            </button>
          );
        } else {
          return (
            <button
              key={index}
              type="button"
              className="btn-primary-outline border-r-0"
            >
              {index + 1}
            </button>
          );
        }
      })}
      {/* {Arrays.from({ length: 20 }, (pageNumber, index) => {
       
      })} */}
    </div>
  );
}

function ListDatasetPageNavigator() {
  return (
    <div className="flex justify-center gap-6">
      <button className="btn-primary-outline flex-none rotate-180">
        <svg
          aria-hidden="true"
          className="w-5 h-5"
          fill="currentColor"
          viewBox="0 0 20 20"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            fillRule="evenodd"
            d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z"
            clipRule="evenodd"
          ></path>
        </svg>
      </button>
      <PageNavigatorNumbersArray pages={10} />

      <button className="btn-primary-outline flex-none">
        <svg
          aria-hidden="true"
          className="w-5 h-5"
          fill="currentColor"
          viewBox="0 0 20 20"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            fillRule="evenodd"
            d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z"
            clipRule="evenodd"
          ></path>
        </svg>
      </button>
    </div>
  );
}

function ListDataset(data) {
  return (
    <div className="flex flex-col gap-y-4 mr-4">
      <ListDatasetHeader />
      <div className="border-t border-primary-200">
        {
          data.data.map((element, index) => {
            return <ListItem key={index} data={element} />
          })
        }
      </div>
      <ListDatasetPageNavigator />
    </div>
  );
}

function FilterBadges(props) {
  function onClose(e) {
    props.onClose(e.criteria, { selected: "", option: e.option });
  }

  function onClearFilters() {
    props.onClearFilters();
  }

  return (
    <div className="py-4">
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
          className="border border-primary-400 rounded-full px-4 py-1 text-lg hover:border-primary-800"
          onClick={onClearFilters}
        >
          Limpar Filtros
        </button>
      )}
    </div>
  );
}

export default function SearchPage() {
  const [filters, setFilters] = useState(filterCriteria);
  const [selectedOptions, setSelectedOptions] = useState([], true);
  const [items, setItems] = useState([]);

  useEffect(() => {
    setFilters(filterCriteria);
    setSelectedOptions(filteredOptionsSelected);
    setItems(metadata);
  }, []);

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

  function onClearSearchText() {}

  function onSearchText(text) {
    setItems(searchIndex(text));
  }

  function createSearchIndex(data) {
    const index = elasticlunr(function() {
      this.addField("name");
      this.addField("database");
      this.addField("source_instrument");
      this.addField("category");
      this.addField("level");
      this.addField("data_type");
      // this.addField("");
      this.setRef("id");
    });

    data.forEach((doc) => {
      index.addDoc(doc);
    })

    return index;
  }

  function searchIndex(query) {
    const index = createSearchIndex(metadata);

    const results = [];
    
    index.search(query).map(({ ref, score }) => {
      results.push(index.documentStore.getDoc(ref));
    });

    return results;
  }

  return (
    <Layout fluid={true} footerPropsMarginTop={false}>
      <div className="flex flex-row gap-4">
        <div className="flex-none border-r min-w-[15rem] max-w-[15rem] border-primary-200 pl-4">
          <p className="py-4">Filter By</p>
          <hr className="border-primary-200" />
          <div className="pt-6 divide-y divide-solid divide-primary-300">
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

        <div className="col-span-9 px-4">
          <FilterBadges
            selectedOptions={selectedOptions}
            onClose={onCriteriaChanged}
            onClearFilters={onClearFilters}
          ></FilterBadges>

          <SearchBar onClear={onClearSearchText} onSearch={onSearchText} />

          <ListDataset data={items} />
        </div>
      </div>
    </Layout>
  );
}
