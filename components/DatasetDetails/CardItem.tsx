import React from "react";

export function CardItem(props) {
  return (
    <div className={props.className}>
      <div className="text-primary-400 font-bold text-sm uppercase">
        {props.title}
      </div>
      <div>{props.children}</div>
    </div>
  );
}
