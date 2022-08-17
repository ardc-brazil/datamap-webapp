export default () => {
    return (
      <form action="#" method="POST" className="space-x-4 flex">
        <label htmlFor="txt-dataset-search" className="text-4xl">Search</label>
        <input
          type="text"
          name="txt-dataset-search"
          id="txt-dataset-search"
          placeholder="Enter a category, measurement, datastream, site, source or keyword to begin your search."
          className="border-b-2 h-10 w-11/12 block border-0 p-3 focus:outline-none bg-input-transparent text-xl"
        />
        <button className="rounded-full p-4 bg-primary-200" name="btn-search">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="20"
            height="20"
            fill="none"
            viewBox="0 0 20 20"
          >
            <path
              fill="#000"
              fill-rule="evenodd"
              d="M9 0a9 9 0 0 1 7.032 14.617l3.675 3.676a1 1 0 0 1-1.32 1.497l-.094-.083-3.676-3.675A9 9 0 1 1 9 0Zm0 2a7 7 0 1 0 0 14A7 7 0 0 0 9 2Z"
              clip-rule="evenodd"
            />
          </svg>
        </button>
        <button className="rounded-full" name="btn-clear">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="20"
            height="20"
            fill="none"
            viewBox="0 0 20 20"
          >
            <path
              fill="#000"
              d="M0 18.049 8.049 10 0 1.951 1.951 0 10 8.049 18.049 0 20 1.951 11.951 10 20 18.049 18.049 20 10 11.951 1.951 20 0 18.049Z"
            />
          </svg>
        </button>
      </form>
    );
  };
  