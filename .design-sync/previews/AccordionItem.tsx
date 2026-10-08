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

export const OpenAndClosed = () => (
  <div style={{ width: 560 }}>
    <Accordion type="single" collapsible defaultValue="provenance">
      <MetadataItem title="Coverage" value="coverage">
        <Field title="Spatial Coverage">Manacapuru, AM · -3.2133, -60.5987</Field>
      </MetadataItem>
      <MetadataItem title="Provenance" value="provenance">
        <Field title="Sources">AERONET level 2.0, ARM Mobile Facility (T3 site)</Field>
        <Field title="Source instrument">Cimel CE318 sun photometer</Field>
      </MetadataItem>
      <MetadataItem title="Citation" value="citation">
        <Field title="DOI (Digital Object Identifier)">10.5072/datamap.4821</Field>
      </MetadataItem>
    </Accordion>
  </div>
);
