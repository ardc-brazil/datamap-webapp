
/**
 * Form values for create a new dataset.
 */
interface FormValues {
    datasetTitle?: string,
    urls?: DatafilePath[]
    uploadedDataFiles?: Datafile[],
    remoteFilesCount: number
}

interface DatafilePath {
    url: string,
    confirmed: boolean
}

interface Datafile {
    id: string,
    name: string,
    extension: string,
}