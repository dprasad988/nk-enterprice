import api from './axiosInstance';
import { useQuery } from '@tanstack/react-query';

export const createReturnRequest = async (returnItems) => {
    const response = await api.post('/returns/request', returnItems);
    return response.data;
};

export const fetchPendingReturns = async (storeId) => {
    const params = storeId ? { storeId } : {};
    const response = await api.get('/returns/pending', { params });
    return response.data;
};

export const approveReturn = async (id) => {
    const response = await api.post(`/returns/${id}/approve`);
    return response.data;
};

export const rejectReturn = async (id) => {
    const response = await api.post(`/returns/${id}/reject`);
    return response.data;
};

export const issueReturnVoucher = async (ids) => {
    const response = await api.post('/returns/issue-voucher', ids);
    return response.data;
};

export const fetchReturnsBySale = async (saleId) => {
    const response = await api.get(`/returns/sale/${saleId}`);
    return response.data;
};

export const fetchApprovedReturns = async (storeId) => {
    const params = storeId ? { storeId } : {};
    const response = await api.get('/returns/approved', { params });
    return response.data;
};

export const fetchAllReturns = async (storeId) => {
    const params = storeId ? { storeId } : {};
    const response = await api.get('/returns/all', { params });
    return response.data;
};

// Hooks
export const useApprovedReturns = (storeId) => {
    return useQuery({
        queryKey: ['approvedReturns', storeId],
        queryFn: () => fetchApprovedReturns(storeId),
        refetchInterval: 15000 // Poll every 15s
    });
};

export const usePendingReturns = (storeId) => {
    return useQuery({
        queryKey: ['pendingReturns', storeId],
        queryFn: () => fetchPendingReturns(storeId),
        refetchInterval: 30000
    });
};

export const useAllReturns = (storeId) => {
    return useQuery({
        queryKey: ['allReturns', storeId],
        queryFn: () => fetchAllReturns(storeId),
        staleTime: 60000 // 1 min
    });
};
