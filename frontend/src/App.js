import React, { useContext } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, AuthContext } from './context/AuthContext';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import DashboardHome from './pages/DashboardHome';
import AdminBookings from './pages/admin/AdminBookings';
import AdminCars from './pages/admin/AdminCars';
import AdminUsers from './pages/admin/AdminUsers';
import AdminReports from './pages/admin/AdminReports';
import AdminSettings from './pages/admin/AdminSettings';
import UserBookings from './pages/user/UserBookings';
import Profile from './pages/Profile';
import { ConfigProvider } from 'antd';
import './App.css';

const PrivateRoute = ({ children }) => {
    const { user, loading } = useContext(AuthContext);

    if (loading) return <div>Loading...</div>;

    return user ? children : <Navigate to="/login" />;
};

const AdminRoute = ({ children }) => {
    const { user, loading } = useContext(AuthContext);

    if (loading) return <div>Loading...</div>;

    return user && user.role === 'admin' ? children : <Navigate to="/dashboard" />;
};

function App() {
    return (
        <AuthProvider>
            <ConfigProvider
                theme={{
                    token: {
                        colorPrimary: '#4f46e5', // Modern Indigo
                        borderRadius: 8,
                        fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial",
                    },
                }}
            >
                <Router>
                    <Routes>
                        <Route path="/login" element={<Login />} />
                        <Route path="/register" element={<Register />} />

                        <Route path="/dashboard" element={<PrivateRoute><Dashboard /></PrivateRoute>}>
                            <Route index element={<DashboardHome />} />
                            <Route path="bookings" element={<UserBookings />} />
                            <Route path="profile" element={<PrivateRoute><Profile /></PrivateRoute>} />

                            <Route path="admin/cars" element={<AdminRoute><AdminCars /></AdminRoute>} />
                            <Route path="admin/bookings" element={<AdminRoute><AdminBookings /></AdminRoute>} />
                            <Route path="admin/users" element={<AdminRoute><AdminUsers /></AdminRoute>} />
                            <Route path="admin/reports" element={<AdminRoute><AdminReports /></AdminRoute>} />
                            <Route path="admin/settings" element={<AdminRoute><AdminSettings /></AdminRoute>} />
                        </Route>

                        <Route path="/" element={<Navigate to="/dashboard" />} />
                    </Routes>
                </Router>
            </ConfigProvider>
        </AuthProvider>
    );
}

export default App;
