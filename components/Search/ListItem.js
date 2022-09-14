import React from "react";
import Link from "next/link";

// @ts-check
export function ListItem(item) {
  function getTotalFileSize(data) {
    let totalGB = 0;

    data.forEach((d) => {
      if (d.file_size_gb) totalGB += parseFloat(d.file_size_gb);
    });

    return totalGB + "GB";
  }

  return (
    <Link href="/datasets/data-set-id">
      <a>
        <div className="border-b border-primary-200 grid grid-cols-12 hover:bg-primary-100 cursor-pointer py-6">
          <div className="grid place-items-center">
            <div>
              <svg
                className="w-16 h-16 text-primary-200 dark:text-primary-600"
                xmlns="http://www.w3.org/2000/svg"
                aria-hidden="true"
                fill="currentColor"
                viewBox="0 0 640 512"
              >
                <path d="M480 80C480 35.82 515.8 0 560 0C604.2 0 640 35.82 640 80C640 124.2 604.2 160 560 160C515.8 160 480 124.2 480 80zM0 456.1C0 445.6 2.964 435.3 8.551 426.4L225.3 81.01C231.9 70.42 243.5 64 256 64C268.5 64 280.1 70.42 286.8 81.01L412.7 281.7L460.9 202.7C464.1 196.1 472.2 192 480 192C487.8 192 495 196.1 499.1 202.7L631.1 419.1C636.9 428.6 640 439.7 640 450.9C640 484.6 612.6 512 578.9 512H55.91C25.03 512 .0006 486.1 .0006 456.1L0 456.1z" />
              </svg>
            </div>
          </div>
          <div className="col-span-10">
            <p className="font-bold text-lg">{item.data.name}</p>
            <p>
              {item.data.author ? <span>by {item.data.author.name}</span> : ""}
            </p>

            <p>
              <span>1mo ago</span>
              <span className="px-2">•</span>
              <span>{getTotalFileSize(item.data.data)}</span>
            </p>
            <p>{item.data.description}</p>
          </div>
        </div>
      </a>
    </Link>
  );
}
