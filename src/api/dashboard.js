import api from './axiosInstance';

export const fetchDashboardStats = async (storeId) => {
    const params = storeId ? { storeId } : {};
    const response = await api.get('/dashboard/stats', { params });
    return response.data;
};
