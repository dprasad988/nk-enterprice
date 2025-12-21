import api from './axiosInstance';

export const fetchStores = async () => {
    const response = await api.get('/stores');
    return response.data;
};
