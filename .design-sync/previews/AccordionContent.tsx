import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from '@datamap/ui';

const Field = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <div className="flex flex-col gap-1">
    <span className="text-xs font-medium text-primary-500">{title}</span>
    <span className="text-sm text-primary-900">{children}</span>
  </div>
);

const MetadataItem = ({ title, value, children }: { title: string; value: string; children: React.ReactNode }) => (
  <AccordionItem value={value}>
    <AccordionTrigger className="hover:no-underline">
      <h5 className="min-h-fit">{title}</h5>
    </AccordionTrigger>
    <AccordionContent>
      <div className="flex flex-col gap-2">{children}</div>
    </AccordionContent>
  </AccordionItem>
);

export const MetadataFields = () => (
  <div style={{ width: 560 }}>
    <Accordion type="multiple" defaultValue={['authors', 'license', 'citation']}>
      <MetadataItem title="Authors" value="authors">
        <Field title="Author Name">Paulo Artaxo</Field>
        <Field title="Author Name">Luciana Varanda Rizzo</Field>
      </MetadataItem>
      <MetadataItem title="License" value="license">
        <Field title="License Name">CC BY 4.0</Field>
      </MetadataItem>
      <MetadataItem title="Coverage" value="coverage">
        <Field title="Temporal Coverage">2014-01-01 to 2015-12-31</Field>
      </MetadataItem>
      <MetadataItem title="Citation" value="citation">
        <Field title="DOI (Digital Object Identifier)">10.5072/datamap.4821</Field>
      </MetadataItem>
    </Accordion>
  </div>
);
