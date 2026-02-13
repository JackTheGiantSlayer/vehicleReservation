import api from './api';

const getStats = () => {
    return api.get('/reports/stats');
};

const ReportService = {
    getStats,
};

export default ReportService;
