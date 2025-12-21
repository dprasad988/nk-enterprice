import api from './axiosInstance';

export const fetchSales = async (storeId) => {
    try {
        const params = storeId ? { storeId } : {};
        const response = await api.get('/sales', { params });
        return response.data;
    } catch (error) {
        console.error("Error fetching sales:", error);
        throw error;
    }
};

export const fetchSaleLogs = async (params) => {
    try {
        const response = await api.get('/sales/logs', { params });
        return response.data;
    } catch (error) {
        console.error("Error fetching sale logs:", error);
        throw error;
    }
};

export const createSale = async (saleData) => {
    const response = await api.post('/sales', saleData);
    return response.data;
};
export const fetchSaleById = async (id) => {
    const response = await api.get(`/sales/${id}`);
    return response.data;
};

export const fetchExchangeableSaleById = async (id) => {
    const response = await api.get(`/sales/${id}/exchangeable`);
    return response.data;
};

export const updateSale = async (id, saleData) => {
    const response = await api.put(`/sales/${id}`, saleData);
    return response.data;
};
