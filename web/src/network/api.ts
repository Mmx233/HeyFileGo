import axios from "axios";

export const api = axios.create({
    baseURL: '/api/'
})
export default api
