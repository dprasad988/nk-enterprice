import api from './axiosInstance';

export const verifyVoucher = async (code) => {
    const response = await api.post('/vouchers/verify', { code });
    return response.data; // Voucher object (with amount, balance)
};

export const fetchVouchersBySaleId = async (saleId) => {
    const response = await api.get(`/vouchers/sale/${saleId}`);
    return response.data;
};
