import { ErrorMessage, Field, Form, Formik } from "formik";
import { TabPanel } from "./TabPanel";

import { useRouter } from "next/router";
import * as Yup from 'yup';
import { useDatasetSave } from "../../hooks/UseDatasetSave";
import { canEditDataset, canSeeAccessHistory } from "../../lib/users";
import { TabPanelProps } from "./TabPanel";
import { AccessHistory } from "../Embargo/AccessHistory";
import { AccessSummary } from "../Embargo/AccessSummary";
import { EmbargoSettingsSection, SettingsBlock } from "../Embargo/EmbargoSettingsSection";
import { EditFormError } from "./EditFormError";

export function TabPanelSettings(props: TabPanelProps) {
  const { save, error } = useDatasetSave(props.dataset);
  const router = useRouter();
  const schema = Yup.object().shape({
    name: Yup.string()
      .min(3, 'Min 3 characteres')
      .max(255, 'Max 255 characters')
      .required('Required'),
    institution: Yup.string()
      .max(255, 'Too long. Max 255 chars')
  });

  async function onSubmit(values) {
    if (await save({ name: values.name, data: { institution: values.institution } })) {
      router.reload();
    }
  }

  return (
    <TabPanel title={props.title}>
      <div className="flex flex-col gap-7 pt-2">
        {canEditDataset(props.user, props.dataset) &&
          <SettingsBlock title="General">
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
                    <EditFormError error={error} />
                  </div>

                  <div className="flex items-center justify-end gap-2 border-t border-primary-200 bg-primary-50 px-5 py-3 rounded-b-lg">
                    <button type="submit" className="btn-primary m-0" disabled={isSubmitting}>Save changes</button>
                  </div>
                </Form>
              )}
            </Formik>
          </SettingsBlock>
        }
        <EmbargoSettingsSection dataset={props.dataset} />
        <AccessSummary dataset={props.dataset} />
        {canSeeAccessHistory(props.user, props.dataset) && <AccessHistory datasetId={props.dataset.id} />}
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
