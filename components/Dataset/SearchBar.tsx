import React, { useState } from "react";
import { Props } from "../../components/types/BaseInterfaces";

interface SearchProps extends Props {
  onClear(): void;
  onSearch(text: string): void;
}

export default (props: SearchProps) => {
  const [searchText, setSearchText] = useState("");

  function onClear() {
    setSearchText("");
    props.onClear();
  }

  function onSearch() {
    props.onSearch(searchText);
  }

  function onTextChange(e: React.ChangeEvent<HTMLInputElement>) {
    setSearchText(e.target.value);

    if (e.target.value = "") {
      this.onClear();
    }
  }

  function onInputEnterSearch(e: React.KeyboardEvent) {
    if (e.key === "Enter") {
      onSearch();
    }
  }

  return (
    <div className="space-x-4 flex">
      <label htmlFor="txt-dataset-search" className="text-4xl">
        Search
      </label>
      <input
        type="text"
        name="txt-dataset-search"
        id="txt-dataset-search"
        placeholder="Enter a category, measurement, datastream, site, source or keyword to begin your search."
        className="form-input border-b-2 border-primary-300 h-10 w-11/12 block border-0 p-3 focus:outline-none focus:ring-0 ring-secondary-900 bg-transparent outline-secondary-900 text-xl"
        value={searchText}
        onChange={onTextChange}
        onKeyDown={onInputEnterSearch}
      />
      <button
        className="rounded-full p-2.5 hover:bg-primary-200"
        name="btn-search"
        onClick={onSearch}
      >
       <img src="/img/icon-search.svg" />
      </button>
      <button
        className="rounded-full p-2.5 hover:bg-primary-200"
        name="btn-clear"
        onClick={onClear}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="20"
          height="20"
          fill="none"
          viewBox="0 0 20 20"
          className="w-4 h-4"
        >
          <path
            fill="#000"
            d="M0 18.049 8.049 10 0 1.951 1.951 0 10 8.049 18.049 0 20 1.951 11.951 10 20 18.049 18.049 20 10 11.951 1.951 20 0 18.049Z"
          />
        </svg>
      </button>
    </div>
  );
};
