export const licenseMapping = {
    "unknow": "Unknow",
    "public-domain": "Public Domain",
    "cc-0": "CC-0: Creative Commons Public Domain Dedication",
    "odc-pddl": "ODC-PDDL: Open Data Commons Public Domain Dedication and License",
    "cc-by": "CC-BY: Creative Commons Attribution 4.0 International",
    "odc-by": "ODC-BY: Open Data Commons Attribution License",
    "cc-by-sa": "CC-BY-SA: Creative Commons Attribution-ShareAlike 4.0 International",
    "odc-odbl": "ODC-ODbL: Open Data Commons Open Database License",
    "cc-by-nc": "CC BY-NC: Creative Commons Attribution-NonCommercial 4.0 International",
    "cc-by-nd": "CC BY-ND: Creative Commons Attribution-NoDerivatives 4.0 International",
    "cc-by-nc-sa": "CC BY-NC-SA: Creative Commons Attribution-NonCommercial-ShareAlike 4.0 International",
    "cc-by-nc-nd": "CC BY-NC-ND: Creative Commons Attribution-NonCommercial-NoDerivatives 4.0 International",
    // TODO: fix this licend in the production database.
    "ghg-cci": "GHG-CCI Licence"
}

export function getAllLicensesIds() {
    return Object.keys(licenseMapping);
}
