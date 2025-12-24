import axiosInstance from './axiosInstance';
import { useQuery } from '@tanstack/react-query';

// Fetch settings as a Map (key -> value)
export const fetchSettingsMap = async (storeId) => {
    const params = storeId ? { storeId } : {};
    const response = await axiosInstance.get('/discount-settings/map', { params });
    return response.data;
};

// Update settings
export const updateSettings = async (settingsList) => {
    // settingsList should items with { settingKey, settingValue, storeId, description }
    const response = await axiosInstance.post('/discount-settings', settingsList);
    return response.data;
};

// Hook for fetching settings
export const useSettingsMap = (storeId) => {
    return useQuery({
        queryKey: ['settingsMap', storeId],
        queryFn: () => fetchSettingsMap(storeId),
        refetchOnWindowFocus: false,
    });
};
