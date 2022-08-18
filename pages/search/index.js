import React from "react";

import Layout from "../../components/Layout";
import { FilterCriteria } from "../../components/Search/FilterCriteria";

export default function SearchPage() {
  const filterCriteria = [
    {
      id: 1,
      title: "Category",
      options: [
        { id: 1, value: 1, text: "Category 1" },
        { id: 2, value: 1, text: "Category 1" },
        { id: 3, value: 1, text: "Category 1" },
        { id: 4, value: 1, text: "Category 1" },
        { id: 5, value: 1, text: "Category 1" },
        { id: 6, value: 1, text: "Category 1" },
        { id: 7, value: 1, text: "Category 1" },
        { id: 8, value: 1, text: "Category 1" },
        { id: 9, value: 1, text: "Category 1" },
        { id: 10, value: 1, text: "Category 1" },
        { id: 11, value: 1, text: "Category 1" },
        { id: 12, value: 1, text: "Category 1" },
        { id: 13, value: 1, text: "Category 1" },
        { id: 14, value: 1, text: "Category 1" },
        { id: 15, value: 1, text: "Category 1" },
        { id: 16, value: 1, text: "Category 1" },
        { id: 17, value: 1, text: "Category 1" },
        { id: 18, value: 1, text: "Category 1" },
        { id: 19, value: 1, text: "Category 1" },
        { id: 20, value: 1, text: "Category 1" },
      ],
    },
    {
      id: 2,
      title: "Datastreams",
      options: [
        { id: 21, value: 1, text: "Datastreams 1" },
        { id: 22, value: 1, text: "Datastreams 1" },
        { id: 23, value: 1, text: "Datastreams 1" },
        { id: 24, value: 1, text: "Datastreams 1" },
      ],
    },
    {
      id: 2,
      title: "Datastreams",
      options: [
        { id: 21, value: 1, text: "Datastreams 1" },
        { id: 22, value: 1, text: "Datastreams 1" },
        { id: 23, value: 1, text: "Datastreams 1" },
        { id: 24, value: 1, text: "Datastreams 1" },
      ],
    },
    {
      id: 2,
      title: "Datastreams",
      options: [
        { id: 21, value: 1, text: "Datastreams 1" },
        { id: 22, value: 1, text: "Datastreams 1" },
        { id: 23, value: 1, text: "Datastreams 1" },
        { id: 24, value: 1, text: "Datastreams 1" },
      ],
    },
  ];

  return (
    <Layout fluid={true}>
      <div className="grid grid-cols-12 gap-4">
        <div className="col-span-3 border-r min-w-[15rem] max-w-[15rem] border-primary-200 pl-4">
          <p className="py-4">Filter By</p>
          <hr className="border-primary-200" />
          <div className="pt-6">
            {filterCriteria.map((criteria) => (
              <div className="border-b border-primary-200">
                <FilterCriteria
                  key={criteria.id}
                  title={criteria.title}
                  options={criteria.options}
                ></FilterCriteria>
              </div>
            ))}
          </div>
        </div>

        <div className="col-span-9 px-4 ">Resultado de busca</div>
      </div>
    </Layout>
  );
}
