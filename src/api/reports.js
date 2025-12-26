import api from './axiosInstance';
import { useQuery } from '@tanstack/react-query';

// Fetch Daily Sales Report
export const fetchDailySalesReport = async ({ date, storeId, page = 0, size = 5, search = '', status = 'ALL' }) => {
    const params = { date, page, size, search, status };
    if (storeId) params.storeId = storeId;
    const response = await api.get('/reports/daily-sales', { params });
    return response.data;
};

// React Query Hook
export const useDailySalesReport = (date, storeId, page, size, search, status) => {
    return useQuery({
        queryKey: ['daily-sales-report', date, storeId, page, size, search, status],
        queryFn: () => fetchDailySalesReport({ date, storeId, page, size, search, status }),
        enabled: !!date, // Only run if date is selected
        staleTime: 0, // Always fetch fresh data
        refetchInterval: 5000, // Auto-refresh every 5 seconds
        keepPreviousData: true // Keep showing previous page data while loading new page
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
