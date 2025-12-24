import axios from './axiosInstance';

export const fetchSessions = async () => {
    const response = await axios.get('/sessions');
    return response.data;
};
