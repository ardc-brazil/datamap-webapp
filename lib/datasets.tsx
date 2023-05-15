interface Metadata {
  id: string;
  name: string;
  description: string;
  source: string;
  created_at: string;
  dataset_file: string;
}

function toModel(metadata: Metadata) {
  var fileData = [
    {
      file_type: "",
      download_path: metadata.dataset_file,
      format: "",
      file_size_gb: "0.1",
    },
  ];

  if (!metadata.dataset_file || metadata.dataset_file == "") {
    fileData = [];
  }

  return {
    id: metadata.id,
    name: metadata.name,
    database: "",
    creation_date: metadata.created_at,
    license: "",
    description: metadata.description,
    realm: "",
    version: "",
    project: "",
    source_instrument: "",
    source: metadata.source,
    institution: "",
    start_date: "",
    end_date: "",
    tags: [],
    category: "AEROSOLS",
    data_type: "",
    grid_type: "",
    location: {
      location: "Global",
    },
    owner: {
      name: "",
    },
    author: {
      name: "",
    },
    contacts: [
      {
        name: "",
      },
    ],
    reference: [""],
    data: fileData,
    additional_information: [""],
    level: "",
    resolution: {
      temporal: "",
      spatial: "",
    },
    variables: [],
  };
}

export async function getAllDatasets() {

  // TODO: Change to Client Credential when this is fixed
  // More info https://django-oauth-toolkit.readthedocs.io/en/latest/getting_started.html#django-oauth-toolkit
  const basicAuth = process.env.OAUTH_DATAMAP_BASIC_AUTH;

  const data = (await fetch(
    "http://ec2-52-91-147-100.compute-1.amazonaws.com/api/v1/datasets/",
    {
      headers: {
        Authorization: `Basic ${basicAuth}`
      },
      referrer: "http://ec2-52-91-147-100.compute-1.amazonaws.com/api/v1/",
      referrerPolicy: "same-origin",
      body: null,
      method: "GET",
      mode: "cors",
      credentials: "include",
    }
  ).then((res) => res.json()));

  if (data.detail) {
    return [];
  }

  // TODO: Create to separate usp datasets from other datasets.
  return (data as Metadata[])
    .filter((x) => x.source.toLowerCase() === "[datamap-usp]")
    .map(toModel);
}
