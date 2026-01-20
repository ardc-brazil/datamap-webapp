import React from "react";

interface Props {
  currentPage: number;
  totalPages: number;
  hasNext: boolean;
  hasPrevious: boolean;
  onPageChange: (page: number) => void;
}

export function ListDatasetPageNavigator(props: Props) {
  const { currentPage, totalPages, hasNext, hasPrevious, onPageChange } = props;

  // Calculate which page numbers to show
  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    const maxVisiblePages = 7;

    if (totalPages <= maxVisiblePages) {
      // Show all pages if total is small
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Always show first page
      pages.push(1);

      if (currentPage > 3) {
        pages.push("...");
      }

      // Show pages around current page
      const start = Math.max(2, currentPage - 1);
      const end = Math.min(totalPages - 1, currentPage + 1);

      for (let i = start; i <= end; i++) {
        if (!pages.includes(i)) {
          pages.push(i);
        }
      }

      if (currentPage < totalPages - 2) {
        pages.push("...");
      }

      // Always show last page
      if (!pages.includes(totalPages)) {
        pages.push(totalPages);
      }
    }

    return pages;
  };

  const handlePrevious = () => {
    if (hasPrevious) {
      onPageChange(currentPage - 1);
    }
  };

  const handleNext = () => {
    if (hasNext) {
      onPageChange(currentPage + 1);
    }
  };

  const handlePageClick = (page: number | string) => {
    if (typeof page === "number" && page !== currentPage) {
      onPageChange(page);
    }
  };

  const pageNumbers = getPageNumbers();

  return (
    <div className="flex justify-center items-center gap-2">
      <button
        onClick={handlePrevious}
        disabled={!hasPrevious}
        className={`flex-none p-2 border border-primary-300 rounded-md bg-white text-gray-700 hover:bg-gray-50 ${
          !hasPrevious ? "opacity-50 cursor-not-allowed" : ""
        }`}
        aria-label="Previous page"
      >
        <svg
          aria-hidden="true"
          className="w-5 h-5 rotate-180"
          fill="currentColor"
          viewBox="0 0 20 20"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            fillRule="evenodd"
            d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z"
            clipRule="evenodd"
          ></path>
        </svg>
      </button>

      <div className="inline-flex rounded-md shadow-sm" role="group">
        {pageNumbers.map((page, index) => {
          if (page === "...") {
            return (
              <span
                key={`ellipsis-${index}`}
                className="px-3 py-2 text-gray-500 flex items-center"
              >
                ...
              </span>
            );
          }

          const isActive = page === currentPage;
          const isFirst = index === 0;
          const isLast = index === pageNumbers.length - 1;

          // Base classes for all buttons
          let buttonClass = "px-4 py-2 border border-primary-300 text-sm font-medium";

          // Active vs inactive styling
          if (isActive) {
            buttonClass += " bg-primary-600 text-white border-primary-600 z-10";
          } else {
            buttonClass += " bg-white text-gray-700 hover:bg-gray-50";
          }

          // Border radius based on position
          if (isFirst) {
            buttonClass += " rounded-l-md";
          }
          if (isLast) {
            buttonClass += " rounded-r-md";
          }
          if (!isFirst) {
            buttonClass += " -ml-px"; // Overlap borders
          }

          return (
            <button
              key={page}
              type="button"
              onClick={() => handlePageClick(page)}
              className={buttonClass}
              aria-current={isActive ? "page" : undefined}
            >
              {page}
            </button>
          );
        })}
      </div>

      <button
        onClick={handleNext}
        disabled={!hasNext}
        className={`flex-none p-2 border border-primary-300 rounded-md bg-white text-gray-700 hover:bg-gray-50 ${
          !hasNext ? "opacity-50 cursor-not-allowed" : ""
        }`}
        aria-label="Next page"
      >
        <svg
          aria-hidden="true"
          className="w-5 h-5"
          fill="currentColor"
          viewBox="0 0 20 20"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            fillRule="evenodd"
            d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z"
            clipRule="evenodd"
          ></path>
        </svg>
      </button>
    </div>
  );
}
