import React, { useState } from "react";
import Layout from "../../components/Layout";
import { FilterCriteria } from "../../components/Search/FilterCriteria";
import { Badge } from "../../components/Search/Badge";

export default function SearchPage() {
  var idGenerator = 1;
  const filterCriteria = [
    {
      id: idGenerator++,
      title: "Date range",
      selection: "date-range",
      options: [
        {
          id: idGenerator++,
          value: new Date(),
          text: "From",
          selected: null,
        },
        {
          id: idGenerator++,
          value: new Date(),
          text: "To",
          selected: null,
        },
      ],
    },
    {
      id: idGenerator++,
      title: "Category",
      selection: "multiple",
      options: [
        {
          id: idGenerator++,
          value: 1,
          text: `Category ${idGenerator}`,
          selected: true,
        },
        {
          id: idGenerator++,
          value: 1,
          text: `Category ${idGenerator}`,
          selected: true,
        },
        {
          id: idGenerator++,
          value: 1,
          text: `Category ${idGenerator}`,
          selected: true,
        },
        {
          id: idGenerator++,
          value: 1,
          text: `Category ${idGenerator}`,
          selected: false,
        },
        {
          id: idGenerator++,
          value: 1,
          text: `Category ${idGenerator}`,
          selected: false,
        },
        {
          id: idGenerator++,
          value: 1,
          text: `Category ${idGenerator}`,
          selected: false,
        },
        {
          id: idGenerator++,
          value: 1,
          text: `Category ${idGenerator}`,
          selected: false,
        },
        {
          id: idGenerator++,
          value: 1,
          text: `Category ${idGenerator}`,
          selected: false,
        },
        {
          id: idGenerator++,
          value: 1,
          text: `Category ${idGenerator}`,
          selected: false,
        },
        {
          id: idGenerator++,
          value: 1,
          text: `Category ${idGenerator}`,
          selected: false,
        },
        {
          id: idGenerator++,
          value: 1,
          text: `Category ${idGenerator}`,
          selected: false,
        },
        {
          id: idGenerator++,
          value: 1,
          text: `Category ${idGenerator}`,
          selected: false,
        },
        {
          id: idGenerator++,
          value: 1,
          text: `Category ${idGenerator}`,
          selected: false,
        },
        {
          id: idGenerator++,
          value: 1,
          text: `Category ${idGenerator}`,
          selected: false,
        },
        {
          id: idGenerator++,
          value: 1,
          text: `Category ${idGenerator}`,
          selected: false,
        },
        {
          id: idGenerator++,
          value: 1,
          text: `Category ${idGenerator}`,
          selected: false,
        },
        {
          id: idGenerator++,
          value: 1,
          text: `Category ${idGenerator}`,
          selected: false,
        },
        {
          id: idGenerator++,
          value: 1,
          text: `Category ${idGenerator}`,
          selected: false,
        },
        {
          id: idGenerator++,
          value: 1,
          text: `Category ${idGenerator}`,
          selected: false,
        },
        {
          id: idGenerator++,
          value: 1,
          text: `Category ${idGenerator}`,
          selected: false,
        },
      ],
    },
    {
      id: idGenerator++,
      title: "Radio",
      selection: "one",
      options: [
        { id: idGenerator++, value: 1, text: "Radio 1", selected: 0 },
        { id: idGenerator++, value: 2, text: "Radio 2", selected: 0 },
        { id: idGenerator++, value: 3, text: "Radio 3", selected: 0 },
        { id: idGenerator++, value: 4, text: "Radio 4", selected: 0 },
      ],
    },
    {
      id: idGenerator++,
      title: "Datastreams",
      selection: "one",
      options: [
        { id: idGenerator++, value: 1, text: "Datastreams 1" },
        { id: idGenerator++, value: 2, text: "Datastreams 2" },
        { id: idGenerator++, value: 3, text: "Datastreams 3" },
        { id: idGenerator++, value: 4, text: "Datastreams 4" },
      ],
    },
    {
      id: idGenerator++,
      title: "Datastreams",
      selection: "multiple",
      options: [
        { id: idGenerator++, value: 1, text: `Datastreams ${idGenerator}` },
        { id: idGenerator++, value: 1, text: `Datastreams ${idGenerator}` },
        { id: idGenerator++, value: 1, text: `Datastreams ${idGenerator}` },
        { id: idGenerator++, value: 1, text: `Datastreams ${idGenerator}` },
      ],
    },
  ];

  const [filters, setFilters] = useState(filterCriteria);
  const [selectedOptions, setSelectedOptions] = useState([], true);

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
    var OptionsSelected = [];
    for (const c of filters) {
      if (c.options) {
        for (const o of c.options) {
          if (o.selected) {
            OptionsSelected.push({
              criteria: c,
              option: o,
            });
          }
        }
      }
    }

    return OptionsSelected;
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
