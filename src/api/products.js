import api from './axiosInstance';
import { useQuery } from '@tanstack/react-query';

export const fetchProducts = async (storeId) => {
    const params = storeId ? { storeId } : {};
    const response = await api.get('/products', { params });
    return response.data;
};

export const fetchProductsPaged = async (params = {}) => {
    // params: { storeId, page, size, search }
    const response = await api.get('/products/paged', { params });
    return response.data;
};

export const createProduct = async (productData) => {
    const response = await api.post('/products', productData);
    return response.data;
};

export const updateProduct = async (id, productData) => {
    const response = await api.put(`/products/${id}`, productData);
    return response.data;
};

export const deleteProduct = async (id, storeId) => {
    const params = storeId ? { storeId } : {};
    const response = await api.delete(`/products/${id}`, { params });
    return response.data;
};

export const fetchProductLogs = async (params = {}) => {
    // params: { page, size, startDate, endDate }
    const response = await api.get('/products/logs', { params });
    return response.data;
};

// --- Custom Hooks ---

export const useProducts = (storeId) => {
    return useQuery({
        queryKey: ['products', storeId],
        queryFn: () => fetchProducts(storeId),
        staleTime: 60000,
        refetchInterval: 60000
    });
};

export const useProductsPaged = (params = {}) => {
    return useQuery({
        queryKey: ['products', params.storeId, params.page, params.search],
        queryFn: () => fetchProductsPaged(params),
        placeholderData: (previousData) => previousData,
        refetchInterval: 10000
    });
};
