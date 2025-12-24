import api from './axiosInstance';
import { useQuery } from '@tanstack/react-query';

// Fetch Daily Sales Report
export const fetchDailySalesReport = async ({ date, storeId }) => {
    const params = { date };
    if (storeId) params.storeId = storeId;
    const response = await api.get('/reports/daily-sales', { params });
    return response.data;
};

// React Query Hook
export const useDailySalesReport = (date, storeId) => {
    return useQuery({
        queryKey: ['daily-sales-report', date, storeId],
        queryFn: () => fetchDailySalesReport({ date, storeId }),
        enabled: !!date, // Only run if date is selected
        staleTime: 5 * 60 * 1000, // 5 minutes cache
    });
};

// Fetch Profit Summary
export const fetchProfitSummary = async ({ storeId, chartRange }) => {
    const params = { chartRange };
    if (storeId) params.storeId = storeId;
    const response = await api.get('/reports/profit-summary', { params });
    return response.data;
};

export const useProfitSummary = (storeId, chartRange) => {
    return useQuery({
        queryKey: ['profit-summary', storeId, chartRange],
        queryFn: () => fetchProfitSummary({ storeId, chartRange }),
        keepPreviousData: true,
        staleTime: 5 * 60 * 1000,
    });
};
