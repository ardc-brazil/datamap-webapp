import React from "react";

export function EmptySearch(props) {

  function LoadingAnimate() {
    return (<div className="flex items-center space-x-2 w-full">
      <div className="h-2.5 bg-primary-200 rounded-full dark:bg-primary-700 w-32"></div>
      <div className="h-2.5 bg-primary-300 rounded-full dark:bg-primary-600 w-24"></div>
      <div className="h-2.5 bg-primary-300 rounded-full dark:bg-primary-600 w-full"></div>
      <div className="h-2.5 bg-primary-300 rounded-full dark:bg-primary-600 w-full"></div>
      <div className="h-2.5 bg-primary-300 rounded-full dark:bg-primary-600 w-24"></div>
      <div className="h-2.5 bg-primary-300 rounded-full dark:bg-primary-600 w-full"></div>
      <div className="h-2.5 bg-primary-300 rounded-full dark:bg-primary-600 w-24"></div>
    </div>);
  }
  return (<div className="flex flex-col items-center justify-center py-2">
    <p>
      {props.children}
    </p>
    <div role="status" className="space-y-2.5 animate-pulse max-w-lg mb-8">

      <LoadingAnimate />
      <LoadingAnimate />
      <LoadingAnimate />
    </div>
  </div>);
}
