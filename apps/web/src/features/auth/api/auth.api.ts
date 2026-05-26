import { api } from "@/lib/api/client";

export const authApi = {
    login: async (email: string, password: string) => {
        const response = await api.post('/auth/login', { email, password });
        return response.data;
    },
    register: async (email: string, password: string, name: string) => {
        const response = await api.post('/auth/register', { email, password, name });
        return response.data;
    },
    refresh: async () => {
        const response = await api.post<{ access_token: string }>('/auth/refresh');
        return response.data;
    },
    logout: async () => {
        const response = await api.post('/auth/logout');
        return response.data;
    },
};