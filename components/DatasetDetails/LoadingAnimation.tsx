import React from "react";

export function LoadingAnimation() {
  return (
    <div role="status" className="space-y-2.5 animate-pulse max-w-lg mb-8">
      <div className="flex items-center space-x-2 w-full">
        <div className="h-2.5 bg-primary-200 rounded-full dark:bg-primary-700 w-32"></div>
        <div className="h-2.5 bg-primary-300 rounded-full dark:bg-primary-600 w-24"></div>
        <div className="h-2.5 bg-primary-300 rounded-full dark:bg-primary-600 w-full"></div>
      </div>
      <div className="flex items-center w-full space-x-2 max-w-[480px]">
        <div className="h-2.5 bg-primary-200 rounded-full dark:bg-primary-700 w-full"></div>
        <div className="h-2.5 bg-primary-300 rounded-full dark:bg-primary-600 w-full"></div>
        <div className="h-2.5 bg-primary-300 rounded-full dark:bg-primary-600 w-24"></div>
      </div>
      <div className="flex items-center w-full space-x-2 max-w-[400px]">
        <div className="h-2.5 bg-primary-300 rounded-full dark:bg-primary-600 w-full"></div>
        <div className="h-2.5 bg-primary-200 rounded-full dark:bg-primary-700 w-80"></div>
        <div className="h-2.5 bg-primary-300 rounded-full dark:bg-primary-600 w-full"></div>
      </div>
      <div className="flex items-center w-full space-x-2 max-w-[480px]">
        <div className="h-2.5 bg-primary-200 rounded-full dark:bg-primary-700 w-full"></div>
        <div className="h-2.5 bg-primary-300 rounded-full dark:bg-primary-600 w-full"></div>
        <div className="h-2.5 bg-primary-300 rounded-full dark:bg-primary-600 w-24"></div>
      </div>
      <div className="flex items-center w-full space-x-2 max-w-[440px]">
        <div className="h-2.5 bg-primary-300 rounded-full dark:bg-primary-600 w-32"></div>
        <div className="h-2.5 bg-primary-300 rounded-full dark:bg-primary-600 w-24"></div>
        <div className="h-2.5 bg-primary-200 rounded-full dark:bg-primary-700 w-full"></div>
      </div>
      <div className="flex items-center w-full space-x-2 max-w-[360px]">
        <div className="h-2.5 bg-primary-300 rounded-full dark:bg-primary-600 w-full"></div>
        <div className="h-2.5 bg-primary-200 rounded-full dark:bg-primary-700 w-80"></div>
        <div className="h-2.5 bg-primary-300 rounded-full dark:bg-primary-600 w-full"></div>
      </div>
      <span className="sr-only">Loading...</span>
    </div>
  );
}
