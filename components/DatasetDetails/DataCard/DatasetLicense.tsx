import { licenseMapping } from "../../../lib/licenseMapping";
import { FactRow } from "./FactRow";

/**
 * Dataset license viewer.
 * @param props react component props
 * @returns react component
 */
export default function DatasetLicense(props) {
    return <FactRow label="License">
      {props.dataset.data.license ? licenseMapping[props.dataset.data.license] : "Unknow"}
    </FactRow>;
  }
