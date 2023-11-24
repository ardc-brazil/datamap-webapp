import { useState } from "react";

export default function TextSearchBar(props) {

  const [searchText, setSearchText] = useState("");


  function onTextChange(e: React.ChangeEvent<HTMLInputElement>) {
    setSearchText(e.target.value);

    if (e.target.value = "") {
      this.onClear();
    }
  }

  function onSearchClick() {
    props.onTextSearchChanged(searchText);
  }

  function onInputEnterSearch(e: React.KeyboardEvent) {
    if (e.key === "Enter") {
      onSearchClick();
    }
  }

  return <div className="relative">
    <div className="flex flex-row gap-2 place-items-center">
      <input
        type="search"
        id="default-search"
        className="block p-2.5 w-full text-xs select-all h-12"
        placeholder="Enter a category, measurement, datastream, site, source or keyword to begin your search."
        required
        value={searchText}
        onChange={onTextChange}
        onKeyDown={onInputEnterSearch}
      />

      <button
        className="btn-primary"
        name="btn-search"
        onClick={onSearchClick}
      >
        Search
      </button>
    </div>
  </div>
}