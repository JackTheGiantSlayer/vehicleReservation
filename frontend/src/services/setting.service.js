import api from './api';

const getSettings = async () => {
    const response = await api.get('/settings/');
    return response.data;
};

const updateSettings = async (settings) => {
    const response = await api.post('/settings/', settings);
    return response.data;
};

const SettingService = {
    getSettings,
    updateSettings
};

export default SettingService;
