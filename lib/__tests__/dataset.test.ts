import { NextRequest } from "next/server";
import { NewContext } from "../appLocalContext";
import { deleteDataset, getDatasetBy } from "../dataset";
import axiosInstance from "../rpc";

jest.mock("../rpc")
const mockAxiosGet = jest.mocked(axiosInstance.get)
const mockAxiosDelete = jest.mocked(axiosInstance.delete)

const APIResponseFixture = {
    id: '06ecaae3-ae7f-4301-901f-7532c915d137',
    name: 'test 4',
    data: {
        id: '',
        name: 'test 4',
        tags: [],
        level: '',
        owner: null,
        realm: '',
        author: null,
        source: '',
        license: '',
        project: '',
        version: '',
        category: 'AEROSOLS',
        contacts: null,
        database: '',
        end_date: '1970-02-01T03:00:00.000Z',
        location: { location: 'Global' },
        dataFiles: [[Object]],
        data_type: '',
        grid_type: '',
        reference: [],
        variables: [],
        is_enabled: true,
        resolution: { spatial: '', temporal: '' },
        start_date: '1970-02-01T03:00:00.000Z',
        description: '',
        institution: '',
        creation_date: '2024-05-26T03:50:00.830Z',
        source_instrument: '',
        additional_information: []
    },
    tenancy: 'datamap/production/data-amazon',
    is_enabled: true,
    created_at: '2024-05-26T03:50:01.159032Z',
    updated_at: '2024-05-26T03:50:01.159032Z',
    versions: [
        {
            id: 'ce2198fe-83c4-4dc3-9c87-1529d4de88c9',
            name: '1',
            design_state: 'DRAFT',
            is_enabled: true,
            files: []
        }
    ],
    current_version: {
        id: 'ce2198fe-83c4-4dc3-9c87-1529d4de88c9',
        name: '1',
        design_state: 'DRAFT',
        is_enabled: true,
        files: []
    }
};

describe('Dataset Gateway test', () => {

    describe('getDatasetBy', () => {
        it('success', async () => {

            // given
            const datasetId = APIResponseFixture.id;
            const ctx = await NewContext(new NextRequest(new URL('http://localhost:3000')))

            mockAxiosGet.mockResolvedValue({
                data: APIResponseFixture
            })

            // when
            const actual = await getDatasetBy(ctx, datasetId)

            // then
            expect(actual).not.toBeUndefined()
            expect(actual).toMatchObject({
                id: datasetId,
                name: APIResponseFixture.name,
                is_enabled: true,
                current_version: APIResponseFixture.current_version
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
})


