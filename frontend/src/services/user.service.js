import api from './api';

const getAllUsers = () => {
    return api.get('/users/');
};

const updateUser = (id, data) => {
    return api.put(`/users/${id}`, data);
};

const deleteUser = (id) => {
    return api.delete(`/users/${id}`);
};

const updateProfile = (data) => {
    return api.put('/users/profile', data);
};

const UserService = {
    getAllUsers,
    updateUser,
    deleteUser,
    updateProfile
};

export default UserService;
