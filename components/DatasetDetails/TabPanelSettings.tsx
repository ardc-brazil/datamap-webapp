import { ErrorMessage, Field, Form, Formik } from "formik";
import { TabPanel } from "./TabPanel";

import { useRouter } from "next/router";
import * as Yup from 'yup';
import { BFFAPI } from "../../gateways/BFFAPI";
import { UpdateDatasetRequest } from "../../types/BffAPI";
import { TabPanelProps } from "./TabPanel";

export function TabPanelSettings(props: TabPanelProps) {
  const bffGateway = new BFFAPI();
  const router = useRouter();
  const schema = Yup.object().shape({
    name: Yup.string()
      .min(3, 'Min 3 characteres')
      .max(255, 'Max 255 characters')
      .required('Required'),
    institution: Yup.string()
      .max(255, 'Too long. Max 255 chars')
  });

  function onSubmit(values, { setSubmitting }) {
    setSubmitting(true);
    props.dataset.name = values.name;
    props.dataset.data.institution = values.institution;

    try {
      const updateDatasetRequest = {
        id: props.dataset.id,
        name: props.dataset.name,
        data: props.dataset.data,
        tenancy: props.dataset.tenancy,
        is_enabled: props.dataset.is_enabled
      } as UpdateDatasetRequest

      bffGateway.updateDataset(updateDatasetRequest);
      router.reload();
    } catch (error) {
      console.log(error);
      alert("Sorry! Error...");
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <TabPanel title={props.title}>
      <h5>Settings</h5>

      <h6 className="font-bold py-4">General</h6>

      <Formik
        initialValues={{
          name: props.dataset.name,
          institution: props.dataset.data.institution,
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
              <div className="w-full py-4">
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
              {/* TODO: Define how visibility will work */}
              {/* <div className="w-48 py-4">
                <label htmlFor="visibility">Visibility</label>
                <Field
                  type="text"
                  id="visibility"
                  name="visibility"
                  className="invalid:border-error-500"
                  as="select"
                >
                  <option value="private">Private</option>
                  <option value="public">Public</option>
                  </Field>
                <ErrorMessage
                  name="institution"
                  component="div"
                  className="text-xs text-error-600"
                />
              </div> */}

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
