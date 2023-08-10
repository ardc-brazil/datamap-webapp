import React from "react";

export function EmptySearch(props) {

  return (<div className="flex flex-col items-center justify-center py-2">
    <p className="text-sm">
      {props.children}
    </p>

  </div>);
}
