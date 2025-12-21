import api from './axiosInstance';

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
