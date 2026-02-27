import api from './api';

const getStats = () => {
    return api.get('/reports/stats');
};

const getAdvancedStats = (params) => {
    return api.get('/reports/advanced-stats', { params });
};

const ReportService = {
    getStats,
    getAdvancedStats,
};

export default ReportService;
