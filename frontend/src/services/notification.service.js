import api from './api';

const getNotifications = async () => {
    const response = await api.get('/notifications/');
    return response.data;
};

const getUnreadCount = async () => {
    const response = await api.get('/notifications/unread-count');
    return response.data;
};

const markAsRead = async (id) => {
    const response = await api.put(`/notifications/${id}/read`);
    return response.data;
};

const markAllAsRead = async () => {
    const response = await api.put('/notifications/read-all');
    return response.data;
};

const NotificationService = {
    getNotifications,
    getUnreadCount,
    markAsRead,
    markAllAsRead
};

export default NotificationService;
