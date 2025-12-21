import api from './axiosInstance';

export const fetchSettings = async () => {
    try {
        const response = await api.get('/settings');
        return response.data;
    } catch (error) {
        throw error;
    }
};

export const fetchSettingsMap = async () => {
    try {
        const response = await api.get('/settings/map');
        return response.data;
    } catch (error) {
        throw error;
    }
};

export const updateSettings = async (settings) => {
    try {
        const response = await api.post('/settings', settings);
        return response.data;
    } catch (error) {
        throw error;
    }
};
