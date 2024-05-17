import { NextRequest } from "next/server";
import { NewContext } from "../appLocalContext";
import { createDataset, deleteDataset } from "../dataset";
import axiosInstance from "../rpc";
import { CreateDatasetBFFRequest, CreateDatasetResponse, Url } from "../../types/BffAPI";
import { AxiosError } from "axios";
import { GatekeeperAPI } from "../../gateways/Gatekeeper";

jest.mock("../rpc")
const mockAxiosGet = jest.mocked(axiosInstance.get)
const mockAxiosDelete = jest.mocked(axiosInstance.delete)
const mockAxiosPost = jest.mocked(axiosInstance.post)

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

            const target = new GatekeeperAPI()

            // when
            const actual = await target.getDatasetBy(ctx, datasetId)

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
            const expected = {
                data: {
                    "message": `Dataset ${datasetId} not found`
                },
                status: 404,
            };

            mockAxiosDelete.mockResolvedValue({
                data: {
                    "message": `Dataset ${datasetId} not found`
                },
                status: 404,
            })

            // when, then
            await expect(deleteDataset(ctx, datasetId)).rejects.toMatchObject(expected)
        });
    })

    describe('createDataset', () => {
        it('success', async () => {
            // given
            const expectedDatasetId = "b7fe1dd9-5cd3-4814-87b1-0926af050297"
            const ctx = await NewContext(new NextRequest(new URL('http://localhost:3000')))
            const expectedCreateDatasetRequest = {
                datasetTitle: "dataset title",
                urls: [
                    {
                        url: "url/for/file.txt",
                        confirmed: true
                    } as Url
                ],
                remoteFilesCount: 0,
            } as CreateDatasetBFFRequest;

            mockAxiosPost.mockResolvedValue({
                data: {
                    id: expectedDatasetId,
                } as CreateDatasetResponse
            });

            // when
            const actual = await createDataset(ctx, expectedCreateDatasetRequest);

            // then
            expect(actual).not.toBeUndefined()
            expect(actual).toMatchObject({
                id: expectedDatasetId,
            })
        })

        it('tenancy is required', async () => {
            // given
            const expectedResponse = {
                data: {
                    errors: ["'tenancy' is a required property"],
                    message: 'Input payload validation failed'
                },
                status: 401,
                statusText: 'Unauthorized',
                headers: {},
                config: null,
            };

            const ctx = await NewContext(new NextRequest(new URL('http://localhost:3000')))
            const expectedCreateDatasetRequest = {
                datasetTitle: "dataset title",
                urls: [
                    {
                        url: "url/for/file.txt",
                        confirmed: true
                    } as Url
                ],
                remoteFilesCount: 0,
            } as CreateDatasetBFFRequest;

            mockAxiosPost.mockRejectedValue(
                new AxiosError("Unauthorized", "401", null, {},
                    {
                        data: {
                            errors: ["'tenancy' is a required property"],
                            message: 'Input payload validation failed'
                        },
                        status: 401,
                        statusText: 'Unauthorized',
                        headers: {},
                        config: null,
                    }))


            // when
            const actual = await createDataset(ctx, expectedCreateDatasetRequest);

            // then
            expect(actual).not.toBeUndefined()
            expect(actual).toMatchObject(expectedResponse)
        })

    })
})


