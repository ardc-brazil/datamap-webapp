import React, { useEffect, useState } from "react";
import { TabPanel, TabPanelProps } from "./TabPanel";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface TabPanelDataObject {
  usability: string;
  license: string;
  updateFrequency: string;
}

export function TabPanelData(props: TabPanelProps) {
  const [data, setData] = useState(null as TabPanelDataObject);
  const [isLoading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    setTimeout(() => {
      setData({
        usability: "8.75",
        license: "CC BY-SA 4.0",
        updateFrequency: "Quarterly",
      });
      setLoading(false);
    }, 500);
  }, []);

  const markdown = `# Ballaenarumque pellibus

  ## Aevo plena iuventa nobis memorabat fraterno
  
  Lorem markdownum inrita quam, non faces colebat hic aliquod. Regna *quos*
  conchae. Totoque o aetas spectante paene servabant est per notam opus longa
  primus manentem.
  
  > Cortex mihi nec genitorem ille freta silenti et tibi carinis gloria femina at
  > aevo, sistraque illum quod. Accipiter qui dedimus videndi; nisi **Aurora
  > spumisque** in factus missus nomen adhuc
  > [quis](http://www.est.io/novodescendunt.html). Truculenta rediit deus palmis
  > creverat oscula. Documenta me voluit magna, quaque sub vocem communem
  > insequitur caputque Argolica relicta corpore Pleuronius [lacerum
  > et](http://www.etiam.net/proque.html) impetus. Quid quid, dat acta quaerunt,
  > et lumina et ut, fallere levi lacus tulit abdita.
  
  ## Leto Paeonas trahens aetasque gaudere populi cedendo
  
  Quaerere Aeetias, sanguine. Atro modo nam, iracundique nubes tumentibus nemus
  fatebitur a! Denupsit Argum. Fratrem prudens minimum.
  
  1. Ignibus verbis usquam
  2. Tendentem ferrum apris timidas Inachis nullique
  3. Alto terras deum foliis fidem mihi tendit
  4. Dixit ara coniugis bonis
  5. Poterat superare
  
  ## Terram in referam deus falsoque tulit Alphenor
  
  *Vacantem membra* quod nomen, tendunt; in deus dixerat gloria serisque. Alios
  saevi virgo sidus, simul unda concita precor, corrigit haec hebetarat vestigia
  visum. Tum est tristis: in hoc habebat quinque **laudatissima velamina**, Romana
  tibi pulvere solitum, Ditis est.
  
  ## Siqua et hanc haesit ramos
  
  Penetralibus verso. Elige parte ille sortite factus tempore iterabat indigenis
  relictis accipe, sinuantur. Quodque huic quamvis arduus, crinalem; in ignavus
  fugio venit non.
  
      unit += keywords;
      and_hfs_fsb += phreaking_ppm_mysql;
      system_vector_piconet(webHard + system * clientTunneling);
      shortcut_ppc = 5;
      device.archive_up /= 1;
  
  Graves tacuit tradere Icare, virgine numen! Bono eram est crescunt attactu,
  caelo, quisquis, Aetnaea perdidimus Tartara praefixaque equi, ademptam. Ait unda
  supposuique urbe mactandus proceres orbe quis visibus simulac variarum cantus
  frustraque, certo Ide perque habent ut
  [tribusque](http://resolvitmodo.net/iaculum-vittas.html). Corpore deum *aeterna
  adiere Idalien*.
  
  
  # GFM

## Autolink literals

www.example.com, https://example.com, and contact@example.com.

## Footnote

A note[^1]

[^1]: Big note.

## Strikethrough

~one~ or ~~two~~ tildes.

## Table

| a | b  |  c |  d  |
| - | :- | -: | :-: |
| content | content | content | content |
| content | content | content | content |
| content | content | content | content |

## Tasklist

* [ ] to do
* [x] done`;

  if (isLoading) return <p>Loading...</p>;
  if (!data) return <p>No dataset data</p>;

  return (
    <TabPanel title={props.title}>
      <div className="grid grid-cols-12">
        {/* TODO: Truncate big htmls */}
        <div className="col-span-9 pr-4 py-4">
          <article className="prose lg:prose-xl max-w-none small-font-size">
            <ReactMarkdown children={markdown} remarkPlugins={[remarkGfm]} />
          </article>
        </div>
        <div className="col-span-3 flex flex-col gap-8 pl-8">
          <div>
            <h5 className="font-bold">Usability</h5>
            <p>{data.usability}</p>
          </div>

          <div>
            <h5 className="font-bold">License</h5>
            <p>{data.license}</p>
          </div>

          <div>
            <h5 className="font-bold">Expected update frequency</h5>
            <p>{data.updateFrequency}</p>
          </div>
        </div>
      </div>
    </TabPanel>
  );
}
