
import axiosInstance from "./rpc";

interface Metadata {
    id: string;
    name: string;
    description: string;
    source: string;
    created_at: string;
    dataset_file: string;
}

function toData(metadata: Metadata) {
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

export async function createDataset(title: string) {
    try {

        const metadata = {
            name: title
        } as Metadata;

        const data = {
            name: title,
            data: toData(metadata)
        }

        const response = await axiosInstance.post("/datasets", data);

        return response.data;
    } catch (error) {
        return error.response;
    }
}

export async function getDatasetBy(id: string) {
    try {
        const response = await axiosInstance.get("/datasets/" + id);
        return response.data;
    } catch (error) {
        return error.response;
    }
}

export async function getAllDataset() {
    try {
        const response = await axiosInstance.get("/datasets/");
        return response.data;
    } catch (error) {
        return error.response;
    }
}
