import axios from "axios";

export async function createDataset(title: string) {
    try {

        const config = {
            headers: {
                "X-Api-Key": "7b206bf7-42f2-4c68-81c1-7a0c011fb362",
                "X-Api-Secret": "g*aZkbWom3deiAX-vtoT"
            }
        }

        const url = "http://localhost/api/datasets";

        const data = {
            name: title,
            data: {}
        }

        const response = await axios.post(url, data, config);
        return response.data;
    } catch (error) {
        return error.response.data;
    }

    return {
        providerId: "provider_id",
        uid: "0cbb9610-4b81-44f0-8d1b-0da1fb4a4da7",
        created_at: new Date()
    };
}
