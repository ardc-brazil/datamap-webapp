import { ErrorMessage, Field, Form, Formik } from "formik";
import { TabPanel } from "./TabPanel";

import axios from "axios";
import { useRouter } from "next/router";
import * as Yup from 'yup';
import { TabPanelProps } from "./TabPanel";

export function TabPanelSettings(props: TabPanelProps) {


  console.log(props);
  const router = useRouter();

  const schema = Yup.object().shape({
    name: Yup.string()
      .min(3, 'Min 3 characteres')
      .max(50, 'Max 50 characters')
      .required('Required'),
    institution: Yup.string()
      .max(50, 'Too long. Max 80 chars')
  });

  function onSubmit(values, { setSubmitting }) {
    setSubmitting(true);
    props.dataset.name = values.name;
    props.dataset.institution = values.institution;

    axios.put("/api/datasets/" + props.dataset.id, props.dataset)
      .then(response => {
        if (response.status == 200) {
          // setEditing(false);
          // TODO: Reload data smoothly external to settings tab.
          router.reload();
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

  return (
    <TabPanel title={props.title}>
      <h5>Settings</h5>

      <h6 className="font-bold py-4">General</h6>

      <Formik
        initialValues={{
          name: props.dataset.name,
          institution: props.dataset.institution,
        }}
        validationSchema={schema}
        onSubmit={onSubmit}
      >
        {({ isSubmitting, values, setFieldTouched }) => (
          <Form>

            {/* TODO: Avoid duplicated form */}
            <div className="flex flex-col items-start max-w-3xl">
              <div className="w-full py-4">
                <label htmlFor="name">Name</label>
                <Field
                  type="text"
                  id="name"
                  name="name"
                  placeholder="What is the institution owner of this dataset?"
                  className="invalid:border-error-500"

                />
                <ErrorMessage
                  name="name"
                  component="div"
                  className="text-xs text-error-600"
                />
              </div>
              <div className="w-full">
                <label htmlFor="institution">Institution</label>
                <Field
                  type="text"
                  id="institution"
                  name="institution"
                  placeholder="What is the institution owner of this dataset?"
                  className="invalid:border-error-500"

                />
                <ErrorMessage
                  name="institution"
                  component="div"
                  className="text-xs text-error-600"
                />
              </div>

              <div className="flex h-24 items-center w-full">
                <button type="submit" className="btn-primary" disabled={isSubmitting}>Save Changes</button>
              </div>
            </div>
          </Form>
        )}
      </Formik>

    </TabPanel>
  );
}
