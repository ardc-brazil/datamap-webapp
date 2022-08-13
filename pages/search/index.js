import React from "react";

import Layout from "../../components/Layout";

function Checkbox(props) {
  return (
    <div className="flex items-center mb-4">
      <div className="flex items-center mr-4">
        <input
          id={props.id}
          type="radio"
          value={props.value}
          name="checkbox-component-"
          className="w-5 h-5 accent-primary-900"
        />
        <label
          for={props.id}
          className="ml-2 text-sm font-medium text-primary-900 dark:text-primary-300 cursor-pointer"
        >
          {props.children}
        </label>
      </div>
    </div>
  );
}

function FilterCriteria(props) {
  return (
    <div className="border-b-2 border-primary-200 mb-4">
      <h4>{props.title}</h4>
      {props.options.map((x) => (
        <Checkbox id={x.id} value={x.value} >{x.text}</Checkbox>
      ))}
    </div>
  );
}
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
      ],
    },
    {
      id: 2,
      title: "Datastreams",
      options: [
        { id: 5, value: 1, text: "Datastreams 1" },
        { id: 6, value: 1, text: "Datastreams 1" },
        { id: 7, value: 1, text: "Datastreams 1" },
        { id: 8, value: 1, text: "Datastreams 1" },
      ],
    },
  ];

  return (
    <Layout fluid={true}>
      <div className="grid grid-cols-12 gap-4">
        <div className="col-span-3 border-r-2 border-primary-200 px-4">
          <h3 className="underline decoration-primary-300">Filter By</h3>

          {filterCriteria.map((criteria) => (
            <FilterCriteria
              key={criteria.id}
              title={criteria.title}
              options={criteria.options}
            ></FilterCriteria>
          ))}
        </div>

        <div className="col-span-9 px-4 ">Resultado de busca</div>
      </div>
    </Layout>
  );
}
