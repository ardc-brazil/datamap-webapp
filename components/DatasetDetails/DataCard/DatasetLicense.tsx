import { licenseMapping } from "../../../lib/licenseMapping";

/**
 * Dataset license viewer.
 * @param props react component props
 * @returns react component
 */
export default function DatasetLicense(props) {
    return <div>
      <h6 className="font-semibold">License</h6>
      <p>{props.dataset.data.license ? licenseMapping[props.dataset.data.license] : "Unknow"}</p>
    </div>;
  }
  
  