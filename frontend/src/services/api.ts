import axios from 'axios';
import * as SecureStore from 'expo-secure-store';


export const api = axios.create({
    baseURL: 'https://lfdr3cm-axelitoow-8081.exp.direct',
});

api.interceptors.request.use(
    async (config) => {
        const token = await SecureStore.getItemAsync('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);


export default api;
