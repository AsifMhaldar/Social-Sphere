import axios from "axios"

const axiosClient = axios.create({
    baseURL: import.meta.env.VITE_API_URL,
    withCredentials: true,   // ✅ must be true for cookies
    headers: {
        'Content-Type': 'application/json'
    }
}); 


export default axiosClient;
