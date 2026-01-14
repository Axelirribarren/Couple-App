import React, { createContext, useState, useEffect, useContext } from 'react';
import * as SecureStore from 'expo-secure-store';
import api from '../services/api';
import { User } from '../types';

interface AuthContextData {
    token: string | null;
    user: User | null;
    isLoading: boolean;
    login: (token: string) => Promise<void>;
    logout: () => Promise<void>;
    refreshUser: () => Promise<void>;
    setUser: (user: User | null) => void;
}


const AuthContext = createContext<AuthContextData>({} as AuthContextData);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [token, setToken] = useState<string | null>(null);
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        loadStorageData();
    }, []);

    const loadStorageData = async () => {
        try {
            const storedToken = await SecureStore.getItemAsync('token');
            if (storedToken) {
                setToken(storedToken);
                // Fetch user data
                api.defaults.headers.common['Authorization'] = `Bearer ${storedToken}`;
                const response = await api.get('/auth/me');
                setUser(response.data);
            }
        } catch (e) {
            console.log("Failed to load user", e);
            // If token is invalid (401), clear it
            await SecureStore.deleteItemAsync('token');
            setToken(null);
            setUser(null);
        } finally {
            setIsLoading(false);
        }

    };

    const login = async (newToken: string) => {
        setIsLoading(true);
        try {
            await SecureStore.setItemAsync('token', newToken);
            setToken(newToken);
            const response = await api.get('/auth/me');
            setUser(response.data);
        } catch (e) {
            console.log(e);
        } finally {
            setIsLoading(false);
        }
    };

    const logout = async () => {
        await SecureStore.deleteItemAsync('token');
        setToken(null);
        setUser(null);
    };

    const refreshUser = async () => {
        if (!token) return;
        try {
            const response = await api.get('/auth/me');
            setUser(response.data);
        } catch (e) {
            console.log(e);
        }
    }

    return (
        <AuthContext.Provider value={{ token, user, isLoading, login, logout, refreshUser, setUser }}>
            {children}
        </AuthContext.Provider>
    );

};

export const useAuth = () => useContext(AuthContext);
