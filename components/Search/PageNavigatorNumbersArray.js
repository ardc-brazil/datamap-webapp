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
              className="btn-primary-outline border-r-0 rounded-l"
            >
              {index + 1}
            </button>
          );
        } else if (index == props.pages - 1) {
          return (
            <button
              key={index}
              type="button"
              className="btn-primary-outline rounded-r"
            >
              {index + 1}
            </button>
          );
        } else {
          return (
            <button
              key={index}
              type="button"
              className="btn-primary-outline border-r-0"
            >
              {index + 1}
            </button>
          );
        }
      })}
      {/* {Arrays.from({ length: 20 }, (pageNumber, index) => {
             
            })} */}
    </div>
  );
}
