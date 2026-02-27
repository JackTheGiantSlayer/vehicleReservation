import React, { useState, useEffect, useContext } from 'react';
import { Table, Button, Modal, Form, Select, message, Popconfirm, Tag, Input, Typography, Card, Space, Avatar } from 'antd';
import { EditOutlined, DeleteOutlined, KeyOutlined, UserOutlined, MailOutlined, PhoneOutlined, SafetyCertificateOutlined, CalendarOutlined } from '@ant-design/icons';
import UserService from '../../services/user.service';
import { AuthContext } from '../../context/AuthContext';
import moment from 'moment';

const { Option } = Select;
const { Title, Text } = Typography;

const AdminUsers = () => {
    const { user: currentUser } = useContext(AuthContext);
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(false);
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [editingUser, setEditingUser] = useState(null);
    const [form] = Form.useForm();
    const [resetForm] = Form.useForm();
    const [isResetModalVisible, setIsResetModalVisible] = useState(false);
    const [resettingUser, setResettingUser] = useState(null);

    const fetchUsers = async () => {
        setLoading(true);
        try {
            const response = await UserService.getAllUsers();
            setUsers(response.data.users);
        } catch (error) {
            message.error("Failed to fetch users");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUsers();
    }, []);

    const showModal = (user) => {
        setEditingUser(user);
        form.setFieldsValue({
            role: user.role,
            full_name: user.full_name,
            phone_number: user.phone_number
        });
        setIsModalVisible(true);
    };

    const handleOk = async () => {
        try {
            const values = await form.validateFields();
            await UserService.updateUser(editingUser.id, values);
            message.success("User updated successfully");
            setIsModalVisible(false);
            fetchUsers();
        } catch (error) {
            message.error(error.response?.data?.message || "Operation failed");
        }
    };

    const showResetModal = (user) => {
        setResettingUser(user);
        resetForm.resetFields();
        setIsResetModalVisible(true);
    };

    const handleResetPassword = async () => {
        try {
            const values = await resetForm.validateFields();
            await UserService.updateUser(resettingUser.id, { password: values.newPassword });
            message.success("Password reset successfully");
            setIsResetModalVisible(false);
        } catch (error) {
            message.error(error.response?.data?.message || "Failed to reset password");
        }
    };

    const handleDelete = async (id) => {
        try {
            await UserService.deleteUser(id);
            message.success("User deleted successfully");
            fetchUsers();
        } catch (error) {
            message.error(error.response?.data?.message || "Failed to delete user");
        }
    };

    const columns = [
        {
            title: 'User Profile',
            key: 'user',
            render: (_, record) => (
                <Space>
                    <Avatar
                        src={record.avatar}
                        icon={<UserOutlined />}
                        style={{ backgroundColor: record.role === 'admin' ? '#ef4444' : '#6366f1', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}
                    />
                    <div>
                        <Text strong style={{ display: 'block', fontSize: '14px' }}>{record.full_name}</Text>
                        <Text type="secondary" style={{ fontSize: '12px' }}>ID: #{record.id}</Text>
                    </div>
                </Space>
            )
        },
        {
            title: 'Contact Details',
            key: 'contact',
            render: (_, record) => (
                <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                        <MailOutlined style={{ fontSize: '12px', color: '#94a3b8' }} />
                        <Text style={{ fontSize: '13px' }}>{record.email}</Text>
                    </div>
                    {record.phone_number && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <PhoneOutlined style={{ fontSize: '12px', color: '#94a3b8' }} />
                            <Text style={{ fontSize: '13px' }}>{record.phone_number}</Text>
                        </div>
                    )}
                </div>
            )
        },
        {
            title: 'Role',
            dataIndex: 'role',
            key: 'role',
            render: role => {
                const isAdmin = role === 'admin';
                return (
                    <Tag
                        icon={<SafetyCertificateOutlined />}
                        color={isAdmin ? 'error' : 'success'}
                        style={{ borderRadius: '20px', padding: '1px 12px', fontWeight: 700, textTransform: 'uppercase', border: 'none' }}
                    >
                        {role}
                    </Tag>
                );
            }
        },
        {
            title: 'Joined On',
            dataIndex: 'created_at',
            key: 'created_at',
            render: date => (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <CalendarOutlined style={{ color: '#94a3b8' }} />
                    <Text style={{ fontSize: '13px' }}>{date ? moment(date).format('DD MMM YYYY') : '-'}</Text>
                </div>
            )
        },
        {
            title: 'Action',
            key: 'action',
            render: (_, record) => (
                <Space size="middle">
                    <Button
                        type="text"
                        icon={<EditOutlined style={{ color: '#6366f1' }} />}
                        onClick={() => showModal(record)}
                        style={{ background: '#f5f3ff', borderRadius: '8px' }}
                    />
                    <Button
                        type="text"
                        icon={<KeyOutlined style={{ color: '#f59e0b' }} />}
                        onClick={() => showResetModal(record)}
                        style={{ background: '#fffbeb', borderRadius: '8px' }}
                        title="Reset Password"
                    />
                    <Popconfirm
                        title="Delete this user permanently?"
                        onConfirm={() => handleDelete(record.id)}
                        disabled={record.id === currentUser?.id}
                        okText="Delete"
                        cancelText="Cancel"
                        okButtonProps={{ danger: true }}
                    >
                        <Button
                            type="text"
                            icon={<DeleteOutlined style={{ color: '#ef4444' }} />}
                            danger
                            disabled={record.id === currentUser?.id}
                            style={{ background: '#fef2f2', borderRadius: '8px' }}
                        />
                    </Popconfirm>
                </Space>
            ),
        },
    ];

    return (
        <div style={{ padding: '24px', maxWidth: '1600px', margin: '0 auto' }}>
            <div style={{ marginBottom: '32px' }}>
                <Title level={2} style={{ margin: 0, fontWeight: 800, letterSpacing: '-0.5px' }}>User Management</Title>
                <Text type="secondary">Control user access levels and account security</Text>
            </div>

            <Card
                className="premium-card"
                style={{ borderRadius: '20px', border: 'none' }}
                bodyStyle={{ padding: 0 }}
            >
                <Table
                    columns={columns}
                    dataSource={users}
                    rowKey="id"
                    loading={loading}
                    scroll={{ x: true }}
                    pagination={{ pageSize: 10, hideOnSinglePage: true }}
                />
            </Card>

            <Modal
                title={
                    <Space>
                        <UserOutlined style={{ color: '#6366f1' }} />
                        <span style={{ fontWeight: 700 }}>Update User Profile</span>
                    </Space>
                }
                open={isModalVisible}
                onOk={handleOk}
                onCancel={() => setIsModalVisible(false)}
                centered
                okText="Save Updates"
                okButtonProps={{
                    style: { borderRadius: '8px', height: '40px', background: 'var(--primary-gradient)', border: 'none', fontWeight: 600 }
                }}
                cancelButtonProps={{ style: { borderRadius: '8px', height: '40px' } }}
            >
                <div style={{ padding: '12px 0' }}>
                    <Form form={form} layout="vertical" requiredMark={false}>
                        <Form.Item name="full_name" label={<Text strong>Full Name</Text>} rules={[{ required: true }]}>
                            <Input placeholder="John Doe" style={{ borderRadius: '10px' }} />
                        </Form.Item>
                        <Form.Item name="phone_number" label={<Text strong>Phone Number</Text>}>
                            <Input placeholder="08x-xxx-xxxx" style={{ borderRadius: '10px' }} />
                        </Form.Item>
                        <Form.Item name="role" label={<Text strong>Access Level (Role)</Text>} rules={[{ required: true }]}>
                            <Select style={{ borderRadius: '10px' }} dropdownStyle={{ borderRadius: '12px' }}>
                                <Option value="user">User - Normal Access</Option>
                                <Option value="admin">Admin - Full Access</Option>
                            </Select>
                        </Form.Item>
                    </Form>
                </div>
            </Modal>

            <Modal
                title={
                    <Space>
                        <KeyOutlined style={{ color: '#f59e0b' }} />
                        <span style={{ fontWeight: 700 }}>Security: Password Reset</span>
                    </Space>
                }
                open={isResetModalVisible}
                onOk={handleResetPassword}
                onCancel={() => setIsResetModalVisible(false)}
                centered
                okText="Update Password"
                okButtonProps={{
                    style: { borderRadius: '8px', height: '40px', background: '#f59e0b', border: 'none', fontWeight: 600 }
                }}
                cancelButtonProps={{ style: { borderRadius: '8px', height: '40px' } }}
            >
                <div style={{ padding: '12px 0' }}>
                    <div style={{ background: '#fffbeb', padding: '16px', borderRadius: '12px', marginBottom: '24px', border: '1px solid #fef3c7' }}>
                        <Text style={{ color: '#92400e' }}>
                            You are resetting the password for <strong>{resettingUser?.full_name}</strong>.
                            The user will need to use this new password for their next login.
                        </Text>
                    </div>
                    <Form form={resetForm} layout="vertical">
                        <Form.Item
                            name="newPassword"
                            label={<Text strong>Temporary New Password</Text>}
                            rules={[
                                { required: true, message: 'Please enter a new password' },
                                { min: 6, message: 'Password must be at least 6 characters' }
                            ]}
                        >
                            <Input.Password placeholder="At least 6 characters" style={{ borderRadius: '10px' }} />
                        </Form.Item>
                    </Form>
                </div>
            </Modal>
        </div>
    );
};

export default AdminUsers;
