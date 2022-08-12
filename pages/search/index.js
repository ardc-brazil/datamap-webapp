import React from "react";

import Layout from "../../components/Layout";

function Checkbox() {
  return (
    <div class="flex items-center mb-4">
      <input
        id="default-checkbox"
        type="checkbox"
        value=""
        class="w-4 h-4 text-blue-600 bg-gray-100 rounded-lg border-gray-300 focus:ring-blue-500"
      />
      <label
        for="default-checkbox"
        class="ml-2 text-sm font-medium text-gray-900"
      >
        Default checkbox
      </label>
    </div>
  );
}

function FilterCriteria(props) {
  return (
    <div className="border-b-2 border-primary-200 mb-4">
      <h4>{props.title}</h4>
      {props.children}
    </div>
  );
}
export default function SearchPage() {
  return (
    <Layout fluid={true}>
      <div className="grid grid-cols-12 gap-4">
        <div className="col-span-3 border-r-2 border-primary-200 px-4">
          <h3 className="underline decoration-primary-300">Filter By</h3>

          <FilterCriteria title="Category">
            <Checkbox></Checkbox>
            <Checkbox></Checkbox>
            <Checkbox></Checkbox>
            <Checkbox></Checkbox>
          </FilterCriteria>

          <FilterCriteria title="Datastreams">
            <Checkbox></Checkbox>
            <Checkbox></Checkbox>
            <Checkbox></Checkbox>
            <Checkbox></Checkbox>
          </FilterCriteria>
        </div>

        <div className="col-span-9 px-4 ">
          Resultado de busca
        </div>
      </div>
    </Layout>
  );
}
