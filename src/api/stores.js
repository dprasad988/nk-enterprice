import api from './axiosInstance';
import { useQuery } from '@tanstack/react-query';

export const fetchStores = async () => {
    const response = await api.get('/stores');
    return response.data;
};

export const useStores = () => {
    return useQuery({
        queryKey: ['stores'],
        queryFn: fetchStores,
        staleTime: 600000 // 10 mins
    });
};
