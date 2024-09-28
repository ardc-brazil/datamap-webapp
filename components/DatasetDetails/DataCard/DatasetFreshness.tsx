

/**
 * Dataset freshness, how frequently the dataset info is updated.
 * @param props react component props
 * @returns react component
 */
export default function DatasetFreshness(props) {
    // const updateFrquency = "Quarterly";
    const updateFrquency = null;
  
    return (
      <div>
        <h6 className="font-semibold">Expected update frequency</h6>
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
        <p>{updateFrquency ?? "Never"}</p>
      </div>
    );
  }