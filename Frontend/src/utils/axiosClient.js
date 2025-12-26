import axios from "axios"

const axiosClient = axios.create({
    baseURL: 'http://localhost:3000/api',
    withCredentials: true,   // ✅ must be true for cookies
    headers: {
        'Content-Type': 'application/json'
    }
});


export default axiosClient;
