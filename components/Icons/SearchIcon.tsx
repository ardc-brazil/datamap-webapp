import React from "react";

export default function SearchIcon(props) {
  return (
    <svg
      className={`min-w-fit w-5 h-5 inline-block fill-primary-600 ${props.className}`}
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 20 20"
    >
      <path
        fillRule="evenodd"
        d="M9 0a9 9 0 0 1 7.032 14.617l3.675 3.676a1 1 0 0 1-1.32 1.497l-.094-.083-3.676-3.675A9 9 0 1 1 9 0Zm0 2a7 7 0 1 0 0 14A7 7 0 0 0 9 2Z"
        clipRule="evenodd"
      />
    </svg>
  );
}
