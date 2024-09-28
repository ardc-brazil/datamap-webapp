import { useState } from "react";


/**
 * A component to show the usability info about dataset
 * @param props react component props
 * @returns react component
 */
export default function DatasetUsability(props) {
    const [showUsabilityPopup, setShowUsabilityPopup] = useState(false);
  
    function handlePointerOver() {
      setShowUsabilityPopup(true);
    }
  
    function onMouseLeave() {
      setShowUsabilityPopup(false);
    }
  
  
    return (
      <div>
        <h6 className="font-semibold">
          Usability &nbsp;
          <span onMouseEnter={handlePointerOver} onMouseLeave={onMouseLeave}>
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="w-4 inline-block">
              <path d="M 12 2 C 6.4889971 2 2 6.4889971 2 12 C 2 17.511003 6.4889971 22 12 22 C 17.511003 22 22 17.511003 22 12 C 22 6.4889971 17.511003 2 12 2 z M 12 4 C 16.430123 4 20 7.5698774 20 12 C 20 16.430123 16.430123 20 12 20 C 7.5698774 20 4 16.430123 4 12 C 4 7.5698774 7.5698774 4 12 4 z M 11 7 L 11 9 L 13 9 L 13 7 L 11 7 z M 11 11 L 11 17 L 13 17 L 13 11 L 11 11 z" />
            </svg>
          </span>
  
          <div className="relative">
            <div className={`${!showUsabilityPopup && "hidden"} absolute -top-5 -left-64 border border-primary-200 rounded-lg shadow bg-primary-50 p-4 w-64 text-xs`}>
              <p className="text-xs">
                This score is calculated by Kaggle.
              </p>
  
              <ul className="font-normal">
                <li className="font-bold">Completeness · 0%</li>
                <li className="style-error">Subtitle</li>
                <li className="style-error"> Tag</li>
                <li className="style-error"> Description</li>
                <li className="style-error"> Cover Image</li>
  
              </ul>
  
              <br />
              <ul className="font-normal">
                <li className="font-bold">Credibility · 67%</li>
                <li className="style-error"> Source/Provenance</li>
                <li className="style-error"> Public Notebook</li>
                <li className="style-error"> Update Frequency</li>
              </ul>
  
              <br />
              <ul className="font-normal">
                <li className="font-bold">Compatibility · 67%</li>
                <li className="style-checked"> License</li>
                <li className="style-error"> File Format</li>
                <li className="style-error"> File Description</li>
              </ul>
            </div>
          </div>
        </h6>
        <p>8.75</p>
      </div>
    );
  }
  