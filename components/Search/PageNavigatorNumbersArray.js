import React from "react";

export function PageNavigatorNumbersArray(props) {
  return (
    <div className="inline-flex rounded-md shadow-sm" role="group">
      {Array.from({ length: props.pages }, (pageNumber, index) => {
        if (index == 0) {
          return (
            <button
              key={index}
              type="button"
              className="btn-primary-outline border-r-0 rounded-none rounded-l"
            >
              {index + 1}
            </button>
          );
        } else if (index == props.pages - 1) {
          return (
            <button
              key={index}
              type="button"
              className="btn-primary-outline rounded-none rounded-r"
            >
              {index + 1}
            </button>
          );
        } else {
          return (
            <button
              key={index}
              type="button"
              className="btn-primary-outline border-r-0 rounded-none"
            >
              {index + 1}
            </button>
          );
        }
      })}
    </div>
  );
}
