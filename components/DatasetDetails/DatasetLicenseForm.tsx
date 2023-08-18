import axios from 'axios';
import { ErrorMessage, Field, Form, Formik } from 'formik';
import { useState } from 'react';
import * as Yup from 'yup';

const licenseMap = {
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

export default function DatasetLicenseForm(props) {

    const [editing, setEditing] = useState(false);

    function handleEditClick(event): void {
        setEditing(true);
    }

    function handleCancelClick(event): void {
        setEditing(false)
    }

    const schema = Yup.object().shape({
        license: Yup.string()
            .max(50, 'Too long. Max 80 chars')
    });

    function onSubmit(values, { setSubmitting }) {
        setSubmitting(true);
        props.dataset.license = values.license;

        axios.put("/api/datasets/" + props.dataset.id, props.dataset)
            .then(response => {
                if (response.status == 200) {
                    setEditing(false);
                } else {
                    console.log(response);
                    alert("Sorry! Error...");
                }
            })
            .catch(error => {
                console.log(error);
                alert("Sorry! Error...");
            })
            .finally(() => setSubmitting(false));
    }

    function EditButton() {
        return <button className={`${editing && "hidden"} btn-primary-outline btn-small h-8 w-16`} onClick={handleEditClick}>Edit</button>
    }

    if (editing || props.alwaysEdition) {
        return (
            <Formik
                initialValues={{ license: props.dataset.license }}
                validationSchema={schema}
                onSubmit={onSubmit}
            >
                {({ isSubmitting, values, setFieldTouched }) => (
                    <Form>
                        <div className="flex flex-row items-center">
                            <div className="w-full h-12">
                                <Field
                                    type="text"
                                    id="license"
                                    name="license"
                                    className="invalid:border-error-500"
                                    as="select"
                                >
                                    {Object.keys(licenseMap).map((lic, i) => {
                                        return <option key={i} value={lic}>{licenseMap[lic]}</option>
                                    })}
                                </Field>

                                <ErrorMessage
                                    name="license"
                                    component="div"
                                    className="text-xs text-error-600"
                                />
                            </div>
                            <div className="flex w-64 h-10 gap-2 pl-4">
                                <button type="button" className="btn-primary-outline btn-small" onClick={handleCancelClick}>Cancel</button>
                                <button type="submit" className="btn-primary btn-small" disabled={isSubmitting}>Save</button>
                            </div>
                        </div>
                    </Form>
                )}
            </Formik>
        );
    } else if (props.dataset.license) {
        // Print the license information
        return <div className="flex flex-row w-full items-center">
            <p className="text-primary-500 w-full">
                {licenseMap[props.dataset.license]}
            </p>
            <EditButton />
        </div>
    }

    // when no license is informed
    return (
        <div className="flex flex-row w-full items-center">
            <p className="text-primary-500 italic w-full">
                Informe a license for your dataset
            </p>
            <EditButton />
        </div>
    );

}
