import axios from 'axios';
import * as SecureStore from 'expo-secure-store';

// CHANGE THIS IP TO YOUR COMPUTER'S LOCAL IP
const API_URL = 'http://192.168.1.X:8000';

const api = axios.create({
    baseURL: API_URL,
});

api.interceptors.request.use(async (config) => {
    const token = await SecureStore.getItemAsync('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

export default api;
