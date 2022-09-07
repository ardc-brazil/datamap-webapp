import React, { useState } from "react";
import Layout from "../../components/Layout";
import { FilterCriteria } from "../../components/Search/FilterCriteria";
import { Badge } from "../../components/Search/Badge";
import { setOriginalNode } from "typescript";

export default function SearchPage() {
  var idGenerator = 1;
  const filterCriteria = [
    {
      id: idGenerator++,
      title: "Date range",
      selection: "date-range",
    },
    {
      id: idGenerator++,
      title: "Category",
      selection: "multiple",
      options: [
        { id: idGenerator++, value: 1, text: `Category ${idGenerator}` },
        { id: idGenerator++, value: 1, text: `Category ${idGenerator}` },
        { id: idGenerator++, value: 1, text: `Category ${idGenerator}` },
        { id: idGenerator++, value: 1, text: `Category ${idGenerator}` },
        { id: idGenerator++, value: 1, text: `Category ${idGenerator}` },
        { id: idGenerator++, value: 1, text: `Category ${idGenerator}` },
        { id: idGenerator++, value: 1, text: `Category ${idGenerator}` },
        { id: idGenerator++, value: 1, text: `Category ${idGenerator}` },
        { id: idGenerator++, value: 1, text: `Category ${idGenerator}` },
        { id: idGenerator++, value: 1, text: `Category ${idGenerator}` },
        { id: idGenerator++, value: 1, text: `Category ${idGenerator}` },
        { id: idGenerator++, value: 1, text: `Category ${idGenerator}` },
        { id: idGenerator++, value: 1, text: `Category ${idGenerator}` },
        { id: idGenerator++, value: 1, text: `Category ${idGenerator}` },
        { id: idGenerator++, value: 1, text: `Category ${idGenerator}` },
        { id: idGenerator++, value: 1, text: `Category ${idGenerator}` },
        { id: idGenerator++, value: 1, text: `Category ${idGenerator}` },
        { id: idGenerator++, value: 1, text: `Category ${idGenerator}` },
        { id: idGenerator++, value: 1, text: `Category ${idGenerator}` },
        { id: idGenerator++, value: 1, text: `Category ${idGenerator}` },
      ],
    },
    {
      id: idGenerator++,
      title: "Radio",
      selection: "one",
      options: [
        { id: idGenerator++, value: 1, text: "Radio 1" },
        { id: idGenerator++, value: 1, text: "Radio 2" },
        { id: idGenerator++, value: 1, text: "Radio 3" },
        { id: idGenerator++, value: 1, text: "Radio 4" },
      ],
    },
    {
      id: idGenerator++,
      title: "Datastreams",
      selection: "one",
      options: [
        { id: idGenerator++, value: 1, text: "Datastreams 1" },
        { id: idGenerator++, value: 1, text: "Datastreams 1" },
        { id: idGenerator++, value: 1, text: "Datastreams 1" },
        { id: idGenerator++, value: 1, text: "Datastreams 1" },
      ],
    },
    {
      id: idGenerator++,
      title: "Datastreams",
      selection: "multiple",
      options: [
        { id: idGenerator++, value: 1, text: "Datastreams 1" },
        { id: idGenerator++, value: 1, text: "Datastreams 1" },
        { id: idGenerator++, value: 1, text: "Datastreams 1" },
        { id: idGenerator++, value: 1, text: "Datastreams 1" },
      ],
    },
  ];

  function onCriteriaChanged(criteria, event) {
    if (event.selected) {
      setSelectedOptions([...selectedOptions, event.option]);
    } else {
      onClose(event.option);
    }
  }

  const [selectedOptions, setSelectedOptions] = useState([], true);

  function onClose(e) {
    setSelectedOptions(selectedOptions.filter((x) => x.id !== e.id));
  }

  return (
    <Layout fluid={true}>
      <div className="grid grid-cols-12 gap-4">
        <div className="col-span-3 border-r min-w-[15rem] max-w-[15rem] border-primary-200 pl-4">
          <p className="py-4">Filter By</p>
          <hr className="border-primary-200" />
          <div className="pt-6">
            {filterCriteria.map((criteria) => (
              <FilterCriteria
                key={criteria.id}
                criteria={criteria}
                onCriteriaChanged={onCriteriaChanged}
              ></FilterCriteria>
            ))}
          </div>
        </div>

        <div className="col-span-9 px-4">
          {selectedOptions.map((option) => (
            <Badge key={option.id} onClose={onClose} option={option}>
              {option.text}
            </Badge>
          ))}
        </div>
      </div>
    </Layout>
  );
}
