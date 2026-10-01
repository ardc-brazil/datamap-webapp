import { useState } from "react";
import { MaterialSymbol } from "react-material-symbols";

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
      <div className="relative w-full">
      <MaterialSymbol icon="search" size={20} weight={400} grade={-25} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-primary-400 pointer-events-none" />
      <input
        type="search"
        id="default-search"
        className="block pl-11 pr-3.5 w-full text-sm select-all h-11 rounded-md"
        placeholder="Search by category, measurement, datastream, site, source or keyword"
        required
        value={searchText}
        onChange={onTextChange}
        onKeyDown={onInputEnterSearch}
      />
      </div>

      <button
        className="btn-primary m-0 h-11 px-[18px]"
        name="btn-search"
        onClick={onSearchClick}
      >
        Search
      </button>
    </div>
  </div>
}