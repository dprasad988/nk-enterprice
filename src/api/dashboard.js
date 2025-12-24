import api from './axiosInstance';
import { useQuery } from '@tanstack/react-query';

export const fetchDashboardStats = async (storeId) => {
    const params = storeId ? { storeId } : {};
    const response = await api.get('/dashboard/stats', { params });
    return response.data;
};

export const useDashboardStats = (storeId) => {
    return useQuery({
        queryKey: ['dashboard', storeId],
        queryFn: () => fetchDashboardStats(storeId),
        refetchInterval: 60000 // 1 minute polling
    });
};
