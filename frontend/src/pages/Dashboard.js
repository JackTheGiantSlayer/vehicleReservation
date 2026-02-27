import React, { useContext, useState, useEffect, useCallback } from 'react';
import { AuthContext } from '../context/AuthContext';
import { Button, Typography, Menu, Layout, Badge, Dropdown, List, Avatar, Card, Grid, Drawer } from 'antd';
import { useNavigate, Outlet, Link, useLocation } from 'react-router-dom';
import { CarOutlined, DashboardOutlined, LogoutOutlined, CalendarOutlined, SolutionOutlined, TeamOutlined, BarChartOutlined, SettingOutlined, BellOutlined, CheckCircleOutlined, WarningOutlined, ToolOutlined, MenuUnfoldOutlined, MenuFoldOutlined } from '@ant-design/icons';
import NotificationService from '../services/notification.service';
import moment from 'moment';

const { Title, Text } = Typography;
const { Header, Content, Sider } = Layout;
const { useBreakpoint } = Grid;

const Dashboard = () => {
    const { user, logout } = useContext(AuthContext);
    const navigate = useNavigate();
    const location = useLocation();
    const screens = useBreakpoint();

    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [collapsed, setCollapsed] = useState(false);
    const [drawerVisible, setDrawerVisible] = useState(false);

    const isMobile = !screens.md;

    const fetchNotifications = useCallback(async () => {
        try {
            const [notifsData, countData] = await Promise.all([
                NotificationService.getNotifications(),
                NotificationService.getUnreadCount()
            ]);
            setNotifications(notifsData.notifications);
            setUnreadCount(countData.count);
        } catch (error) {
            console.error("Failed to fetch notifications:", error);
        }
    }, []);

    useEffect(() => {
        if (user) {
            fetchNotifications();
            // Poll every 1 minute
            const interval = setInterval(fetchNotifications, 60000);
            return () => clearInterval(interval);
        }
    }, [user, fetchNotifications]);

    const handleMarkAsRead = async (id) => {
        try {
            await NotificationService.markAsRead(id);
            fetchNotifications();
        } catch (error) {
            console.error("Failed to mark notification as read:", error);
        }
    };

    const handleMarkAllAsRead = async () => {
        try {
            await NotificationService.markAllAsRead();
            fetchNotifications();
        } catch (error) {
            console.error("Failed to mark all notifications as read:", error);
        }
    };

    const getNotificationIcon = (type) => {
        switch (type) {
            case 'maintenance': return <Avatar icon={<ToolOutlined />} style={{ backgroundColor: '#ff4d4f' }} />;
            case 'warning': return <Avatar icon={<WarningOutlined />} style={{ backgroundColor: '#faad14' }} />;
            default: return <Avatar icon={<BellOutlined />} style={{ backgroundColor: '#1890ff' }} />;
        }
    };

    const notificationMenu = (
        <Card
            title="Notifications"
            size="small"
            style={{ width: 350 }}
            extra={<Button type="link" size="small" onClick={handleMarkAllAsRead}>Mark all as read</Button>}
        >
            <List
                dataSource={notifications}
                renderItem={item => (
                    <List.Item
                        onClick={() => handleMarkAsRead(item.id)}
                        style={{ cursor: 'pointer', backgroundColor: item.is_read ? 'transparent' : '#f0faff', padding: '12px' }}
                    >
                        <List.Item.Meta
                            avatar={getNotificationIcon(item.type)}
                            title={
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <span style={{ fontWeight: item.is_read ? 'normal' : 'bold' }}>{item.title}</span>
                                    {!item.is_read && <Badge status="processing" />}
                                </div>
                            }
                            description={
                                <div>
                                    <div style={{ color: '#555', fontSize: '12px', marginBottom: '4px' }}>{item.message}</div>
                                    <div style={{ fontSize: '10px', color: '#999' }}>{moment(item.created_at).fromNow()}</div>
                                </div>
                            }
                        />
                    </List.Item>
                )}
                locale={{ emptyText: 'No notifications' }}
            />
        </Card>
    );

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const menuItems = [
        { key: '/dashboard', icon: <DashboardOutlined />, label: <Link to="/dashboard">Overview</Link> },
        { key: '/dashboard/bookings', icon: <CalendarOutlined />, label: <Link to="/dashboard/bookings">My Bookings</Link> },
        { key: '/dashboard/profile', icon: <SolutionOutlined />, label: <Link to="/dashboard/profile">My Profile</Link> },
    ];

    if (user?.role === 'admin') {
        menuItems.push({ type: 'divider' });
        menuItems.push({
            key: 'admin',
            label: 'Admin',
            type: 'group',
            children: [
                { key: '/dashboard/admin/cars', icon: <CarOutlined />, label: <Link to="/dashboard/admin/cars">Cars</Link> },
                { key: '/dashboard/admin/bookings', icon: <SolutionOutlined />, label: <Link to="/dashboard/admin/bookings">All Bookings</Link> },
                { key: '/dashboard/admin/users', icon: <TeamOutlined />, label: <Link to="/dashboard/admin/users">Users</Link> },
                { key: '/dashboard/admin/reports', icon: <BarChartOutlined />, label: <Link to="/dashboard/admin/reports">Reports</Link> },
                { key: '/dashboard/admin/settings', icon: <SettingOutlined />, label: <Link to="/dashboard/admin/settings">Settings</Link> },
            ]
        });
    }

    const userMenu = (
        <Menu
            className="premium-card"
            style={{ borderRadius: '12px', padding: '8px' }}
            items={[
                { key: 'profile', icon: <SolutionOutlined />, label: <Link to="/dashboard/profile">My Profile</Link> },
                { type: 'divider' },
                { key: 'logout', icon: <LogoutOutlined />, label: 'Logout', onClick: handleLogout, danger: true },
            ]}
        />
    );

    const sidebarContent = (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: '#001529' }}>
            <div style={{
                height: 64,
                display: 'flex',
                alignItems: 'center',
                padding: '0 24px',
                color: '#fff',
                fontSize: '20px',
                fontWeight: 800,
                letterSpacing: '-1px'
            }}>
                <CarOutlined style={{ marginRight: 12, fontSize: '24px', color: '#6366f1' }} />
                {(!collapsed || isMobile) && <span>CarBook</span>}
            </div>
            <Menu
                theme="dark"
                mode="inline"
                selectedKeys={[location.pathname]}
                items={menuItems}
                onClick={() => isMobile && setDrawerVisible(false)}
                style={{ border: 'none' }}
            />
        </div>
    );

    return (
        <Layout style={{ minHeight: '100vh' }}>
            {!isMobile && (
                <Sider
                    collapsible
                    collapsed={collapsed}
                    onCollapse={(value) => setCollapsed(value)}
                    style={{ overflow: 'auto', height: '100vh', position: 'fixed', left: 0, top: 0, bottom: 0 }}
                >
                    {sidebarContent}
                </Sider>
            )}

            <Drawer
                title="Car Booking System"
                placement="left"
                onClose={() => setDrawerVisible(false)}
                open={drawerVisible}
                styles={{ body: { padding: 0, backgroundColor: '#001529' }, header: { backgroundColor: '#001529', color: '#fff' } }}
                width={250}
            >
                {sidebarContent}
            </Drawer>

            <Layout style={{ marginLeft: !isMobile ? (collapsed ? 80 : 200) : 0, transition: 'all 0.2s' }}>
                <Header style={{
                    padding: '0 24px',
                    background: 'rgba(255, 255, 255, 0.8)',
                    backdropFilter: 'blur(8px)',
                    WebkitBackdropFilter: 'blur(8px)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
                    position: 'sticky',
                    top: 0,
                    zIndex: 10,
                    width: '100%',
                    borderBottom: '1px solid rgba(0,0,0,0.05)'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                        {isMobile ? (
                            <Button icon={<MenuUnfoldOutlined />} onClick={() => setDrawerVisible(true)} />
                        ) : (
                            <Button
                                type="text"
                                icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
                                onClick={() => setCollapsed(!collapsed)}
                                style={{ fontSize: '16px' }}
                            />
                        )}
                        {!isMobile && (
                            <Text strong style={{ fontSize: '16px', color: '#1e293b' }}>
                                Vehicle Reservation System
                            </Text>
                        )}
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? '12px' : '24px' }}>
                        <Dropdown
                            dropdownRender={() => (
                                <div className="premium-card" style={{ background: '#fff', borderRadius: '16px' }}>
                                    {notificationMenu}
                                </div>
                            )}
                            trigger={['click']}
                            placement="bottomRight"
                        >
                            <Badge count={unreadCount} overflowCount={99} size="small" style={{ cursor: 'pointer' }}>
                                <div style={{
                                    padding: '8px',
                                    borderRadius: '10px',
                                    background: '#f1f5f9',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center'
                                }}>
                                    <BellOutlined style={{ fontSize: '18px', color: '#64748b' }} />
                                </div>
                            </Badge>
                        </Dropdown>

                        <Dropdown overlay={userMenu} placement="bottomRight">
                            <div style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <Avatar style={{ backgroundColor: '#4f46e5' }}>{user?.full_name?.charAt(0)}</Avatar>
                                {!isMobile && <span>{user?.full_name}</span>}
                            </div>
                        </Dropdown>
                    </div>
                </Header>
                <Content style={{ margin: 0, padding: isMobile ? '16px' : '32px' }}>
                    <Outlet />
                </Content>
            </Layout>
        </Layout>
    );
};

export default Dashboard;
