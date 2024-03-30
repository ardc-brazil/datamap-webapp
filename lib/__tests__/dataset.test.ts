import { NextRequest } from "next/server";
import { NewContext } from "../appLocalContext";
import { deleteDataset, getDatasetBy } from "../dataset";
import axiosInstance from "../rpc";

jest.mock("../rpc")
const mockAxiosGet = jest.mocked(axiosInstance.get)
const mockAxiosDelete = jest.mocked(axiosInstance.delete)

describe('Dataset Gateway test', () => {

    describe('getDatasetBy', () => {
        it('success', async () => {

            // given
            const datasetId = "b7fe1dd9-5cd3-4814-87b1-0926af050297"
            const ctx = await NewContext(new NextRequest(new URL('http://localhost:3000')))

            mockAxiosGet.mockResolvedValue({
                data: {
                    "id": "b7fe1dd9-5cd3-4814-87b1-0926af050297",
                    "name": "Test",
                    "data": "{\"id\": \"b7fe1dd9-5cd3-4814-87b1-0926af050297\", \"name\": \"Test\", \"tags\": [], \"level\": \"\", \"owner\": null, \"realm\": \"\", \"author\": null, \"source\": \"\", \"license\": \"\", \"project\": \"\", \"version\": \"\", \"category\": \"AEROSOLS\", \"contacts\": null, \"database\": \"\", \"end_date\": \"1970-02-01T03:00:00.000Z\", \"location\": {\"location\": \"Global\"}, \"dataFiles\": [{\"path\": \"/path/to/the/file.ext\"}], \"data_type\": \"\", \"grid_type\": \"\", \"reference\": [], \"variables\": [], \"is_enabled\": true, \"resolution\": {\"spatial\": \"\", \"temporal\": \"\"}, \"start_date\": \"1970-02-01T03:00:00.000Z\", \"description\": \"\", \"institution\": \"\", \"colaborators\": [{\"name\": \"asdfadsf\", \"permission\": \"can_view\"}, {\"name\": \"asdfadsf\", \"permission\": \"can_edit\"}], \"creation_date\": \"2023-08-20T20:26:12.671Z\", \"source_instrument\": \"\", \"additional_information\": []}",
                    "is_enabled": true,
                    "updated_at": "2023-08-20 20:27:12",
                    "created_at": "2023-08-20 20:26:12",
                    "tenancy": "datamap/production/data-amazon"
                }
            })

            // when
            const actual = await getDatasetBy(ctx, datasetId)

            // then
            expect(actual).not.toBeUndefined()
            expect(actual).toMatchObject({
                id: datasetId,
                name: "Test",
                is_enabled: true,
            })
        })

        // TODO: Test request errors for getDatasetBy

    })

    describe('deleteDataset', () => {
        it('success', async () => {
            // given
            const datasetId = "b7fe1dd9-5cd3-4814-87b1-0926af050297"
            const ctx = await NewContext(new NextRequest(new URL('http://localhost:3000')))

            mockAxiosDelete.mockResolvedValue({
                data: {},
                status: 200,
            })

            // when, then
            expect(await deleteDataset(ctx, datasetId)).toBeUndefined()
        });

        it('not found', async () => {
            // given
            const datasetId = "b7fe1dd9-5cd3-4814-87b1-0926af050297"
            const ctx = await NewContext(new NextRequest(new URL('http://localhost:3000')))

            mockAxiosDelete.mockResolvedValue({
                data: {
                    "message": `Dataset ${datasetId} not found`
                },
                status: 404,
            })

            // when, then
            await  expect(deleteDataset(ctx, datasetId)).rejects.toBe(`Dataset ${datasetId} not found`)
        });
    })
})


