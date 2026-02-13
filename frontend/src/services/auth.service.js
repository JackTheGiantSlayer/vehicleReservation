import api from './api';


const register = (email, password, fullName, phoneNumber) => {
    return api.post('/auth/register', {
        email,
        password,
        full_name: fullName,
        phone_number: phoneNumber
    });
};

const login = async (email, password) => {
    const response = await api.post('/auth/login', {
        email,
        password,
    });
    if (response.data.token) {
        localStorage.setItem('token', response.data.token);
        try {
            const user = response.data.user;
            localStorage.setItem('user', JSON.stringify(user));
        } catch (e) {
            console.error("Error saving user", e);
        }
    }
    return response.data;
};

const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
};

const getCurrentUser = () => {
    const userStr = localStorage.getItem('user');
    if (userStr) return JSON.parse(userStr);
    return null;
};

const forgotPassword = (email, phoneNumber) => {
    return api.post('/auth/forgot-password', {
        email,
        phone_number: phoneNumber
    });
};

const AuthService = {
    register,
    login,
    logout,
    getCurrentUser,
    forgotPassword,
};

export default AuthService;
