import api from './api';
import { AuthResponse } from '../types';

export const loginUser = async (email: string, password: string): Promise<AuthResponse> => {
    const formData = new FormData();
    formData.append('username', email);
    formData.append('password', password);
    const response = await api.post('/auth/login', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
};

export const registerUser = async (email: string, password: string) => {
    const response = await api.post('/auth/register', { email, password });
    return response.data;
};
