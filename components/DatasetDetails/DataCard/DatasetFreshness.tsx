import { FactRow } from "./FactRow";

/**
 * Dataset freshness, how frequently the dataset info is updated.
 * @param props react component props
 * @returns react component
 */
export default function DatasetFreshness(props) {
    // const updateFrquency = "Quarterly";
    const updateFrquency = null;
  
    return (
      <FactRow label="Update frequency">
        {/* TODO: Update the updateFrequency information
          Possibilities:
            - Unspecified
            - Never
            - Annually
            - Quarterly
            - Monthly
            - Weekly
            - Daily
            - Hourly
          */}
        {updateFrquency ?? "Never"}
      </FactRow>
    );
  }