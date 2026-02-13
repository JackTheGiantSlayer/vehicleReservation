import axios from 'axios';

const getBaseURL = () => {
    const envUrl = process.env.REACT_APP_API_URL;
    if (envUrl && !envUrl.includes('localhost')) {
        return envUrl;
    }
    // If we're accessing via IP or other hostname, use that for the API too
    const { protocol, hostname } = window.location;
    return `${protocol}//${hostname}:5001/api`;
};

const api = axios.create({
    baseURL: getBaseURL(),
});

api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

export default api;
