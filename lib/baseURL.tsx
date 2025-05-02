import { token } from "./hardCodingData";

// const productionURL = 'http://localhost:2000';
const productionURL = 'https://front-end-task-lake.vercel.app/api/v1';
export const getBaseURL = () => {
    return productionURL;
}

export async function getDataFromServer(getUrl: string) {
    try {
        const res = await fetch(getBaseURL() + getUrl, {
            cache: 'no-store',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (!res.ok) {
            throw new Error(`HTTP error! status: ${res.status}`);
        }
        
        const data = await res.json();
        return data;
    } catch (error) {
        console.error('Error fetching data:', error);
        return { success: false, message: 'Failed to fetch data' };
    }
}

// export async function getDataFromServer(getUrl: string) {
//     try {
//         const res = await fetch(getBaseURL() + getUrl, { cache: 'no-store' });
//         const data = await res?.json();
//         return data;
//     } catch (error) {
//         return [];
//     }
// }