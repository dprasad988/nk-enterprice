import axios from './axiosInstance';

export const login = async (username, password) => {
    const response = await axios.post('/auth/login',
        { username, password },
        { headers: { 'Content-Type': 'application/json' } }
    );
    return response.data;
};

export const logout = async () => {
    try {
        await axios.post('/auth/logout', {});
    } catch (error) {
        console.error("Logout failed", error);
    }
};
