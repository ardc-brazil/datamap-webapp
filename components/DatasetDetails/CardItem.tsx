import React from "react";

export function CardItem(props) {
  return (
    <div className={`${props.className}`}>
      <div className="text-primary-400 font-semibold text-xs uppercase">
        {props.title}
      </div>
      <div className="py-2">{props.children}</div>
    </div>
  );
}
