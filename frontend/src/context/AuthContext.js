import React, { createContext, useState, useEffect } from 'react';
import AuthService from '../services/auth.service';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const currentUser = AuthService.getCurrentUser();
        setUser(currentUser);
        setLoading(false);
    }, []);

    const login = async (email, password) => {
        const data = await AuthService.login(email, password);
        setUser(data.user);
        return data;
    };

    const logout = () => {
        AuthService.logout();
        setUser(null);
    };

    const register = async (email, password, fullName) => {
        return await AuthService.register(email, password, fullName);
    };

    return (
        <AuthContext.Provider value={{ user, setUser, login, logout, register, loading }}>
            {children}
        </AuthContext.Provider>
    );
};
