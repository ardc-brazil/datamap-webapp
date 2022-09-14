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
                className="w-14 h-14 text-primary-200 dark:text-primary-600"
                width="327"
                height="327"
                viewBox="0 0 327 327"
                aria-hidden="true"
                fill="currentColor"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path d="M163.084 326.167C133.567 326.167 106.28 324.362 81.2233 320.753C56.1662 317.143 36.3651 312.205 21.8201 305.941C7.27506 299.677 0.00169909 292.829 2.97529e-07 285.396V244.626C2.97529e-07 242.927 0.637046 240.909 1.91114 238.574C15.0767 246.431 36.577 252.801 66.412 257.685C96.247 262.569 128.471 265.011 163.084 265.011C197.697 265.011 229.92 262.569 259.755 257.685C289.59 252.801 311.091 246.431 324.256 238.574C325.53 240.909 326.167 242.927 326.167 244.626V285.396C326.167 292.829 318.894 299.677 304.349 305.941C289.803 312.205 270.001 317.143 244.944 320.753C219.887 324.362 192.6 326.167 163.084 326.167V326.167ZM163.084 244.626C133.567 244.626 106.28 242.821 81.2233 239.211C56.1662 235.601 36.3651 230.664 21.8201 224.399C7.27506 218.135 0.00169909 211.287 2.97529e-07 203.855V163.084C2.97529e-07 161.385 0.637046 159.368 1.91114 157.032C15.0767 164.889 36.577 171.259 66.412 176.143C96.247 181.027 128.471 183.469 163.084 183.469C197.697 183.469 229.92 181.027 259.755 176.143C289.59 171.259 311.091 164.889 324.256 157.032C325.53 159.368 326.167 161.385 326.167 163.084V203.855C326.167 211.287 318.894 218.135 304.349 224.399C289.803 230.664 270.001 235.601 244.944 239.211C219.887 242.821 192.6 244.626 163.084 244.626ZM163.084 163.084C133.567 163.084 106.28 161.279 81.2233 157.669C56.1662 154.059 36.3651 149.122 21.8201 142.857C7.27506 136.593 0.00169909 129.745 2.97529e-07 122.313V81.5418C2.97529e-07 79.8431 0.637046 77.8257 1.91114 75.4899C15.0767 83.3468 36.577 89.7173 66.412 94.6013C96.247 99.4853 128.471 101.927 163.084 101.927C197.697 101.927 229.92 99.4853 259.755 94.6013C289.59 89.7173 311.091 83.3468 324.256 75.4899C325.53 77.8257 326.167 79.8431 326.167 81.5418V122.313C326.167 129.745 318.894 136.593 304.349 142.857C289.803 149.122 270.001 154.059 244.944 157.669C219.887 161.279 192.6 163.084 163.084 163.084ZM163.084 81.5418C133.567 81.5418 106.28 79.7369 81.2233 76.127C56.1662 72.517 36.3651 67.5799 21.8201 61.3156C7.27506 55.0514 0.00169909 48.2031 2.97529e-07 40.7709C-0.00169849 33.3387 7.27124 26.4905 21.8188 20.2262C36.3664 13.9619 56.1679 9.02481 81.2233 5.41489C106.279 1.80496 133.566 0 163.084 0C192.602 0 219.889 1.80496 244.944 5.41489C269.999 9.02481 289.801 13.9619 304.349 20.2262C318.896 26.4905 326.169 33.3387 326.167 40.7709C326.166 48.2031 318.893 55.0514 304.349 61.3156C289.804 67.5799 270.003 72.517 244.944 76.127C219.885 79.7369 192.598 81.5418 163.084 81.5418V81.5418Z" />
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
