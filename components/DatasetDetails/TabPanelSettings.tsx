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
      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_300px] gap-10 items-start pt-2">
        <section className="flex flex-col gap-3 min-w-0">
          <div>
            <h2 className="m-0 text-lg leading-snug tracking-[-0.01em]">General</h2>
            <p className="m-0 mt-1 text-sm text-primary-600">The name and owner institution shown on the dataset page and in citations.</p>
          </div>

          <Formik
            initialValues={{
              name: props.dataset.name,
              institution: props.dataset.data.institution,
            }}
            validationSchema={schema}
            onSubmit={onSubmit}
          >
            {({ isSubmitting, values, setFieldTouched }) => (
              <Form className="rounded-lg border border-primary-200 bg-primary-0">

                {/* TODO: Avoid duplicated form */}
                <div className="flex flex-col gap-5 p-5">
                  <SettingsField
                    name="name"
                    label="Name"
                    placeholder="e.g. GoAmazon 2014/5 — Aerosol size distribution, T3 site"
                    help="Identify the campaign, the measurement and the site."
                  />
                  <SettingsField
                    name="institution"
                    label="Institution"
                    placeholder="What is the institution owner of this dataset?"
                  />
                  {/* TODO: Define how visibility will work */}
                </div>

                <div className="flex items-center justify-end gap-2 border-t border-primary-200 bg-primary-50 px-5 py-3 rounded-b-lg">
                  <button type="submit" className="btn-primary m-0" disabled={isSubmitting}>Save changes</button>
                </div>
              </Form>
            )}
          </Formik>
        </section>

        <aside className="rounded-lg border border-primary-200 bg-primary-0 p-4 flex flex-col gap-2">
          <span className="text-[11px] font-semibold uppercase tracking-[0.08em] text-primary-500">About settings</span>
          <p className="m-0 text-[13px] leading-[19px] text-primary-700">
            Changes apply to every version of this dataset. Authors, license, coverage and the rest of the metadata are edited from the Data card tab.
          </p>
        </aside>
      </div>
    </TabPanel>
  );
}

function SettingsField(props: { name: string, label: string, placeholder?: string, help?: string }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={props.name} className="m-0 text-[13px] font-semibold text-primary-900">{props.label}</label>
      <Field
        type="text"
        id={props.name}
        name={props.name}
        placeholder={props.placeholder}
        className="h-11 px-3.5 py-0 text-sm rounded-md border border-primary-300 bg-primary-0 invalid:border-error-500"
      />
      {props.help && <span className="text-[13px] leading-[19px] text-primary-500">{props.help}</span>}
      <ErrorMessage
        name={props.name}
        component="div"
        className="text-xs text-error-600"
      />
    </div>
  );
}
