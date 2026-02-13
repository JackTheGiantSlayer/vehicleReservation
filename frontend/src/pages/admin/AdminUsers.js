import React, { useState, useEffect, useContext } from 'react';
import { Table, Button, Modal, Form, Select, message, Popconfirm, Tag, Input } from 'antd';
import { EditOutlined, DeleteOutlined, KeyOutlined } from '@ant-design/icons';
import UserService from '../../services/user.service';
import { AuthContext } from '../../context/AuthContext';

const { Option } = Select;

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
        { title: 'ID', dataIndex: 'id', key: 'id' },
        { title: 'Full Name', dataIndex: 'full_name', key: 'full_name' },
        { title: 'Phone', dataIndex: 'phone_number', key: 'phone_number' },
        { title: 'Email', dataIndex: 'email', key: 'email' },
        {
            title: 'Role',
            dataIndex: 'role',
            key: 'role',
            render: role => {
                let color = role === 'admin' ? 'volcano' : 'green';
                return <Tag color={color}>{role.toUpperCase()}</Tag>;
            }
        },
        {
            title: 'Created At',
            dataIndex: 'created_at',
            key: 'created_at',
            render: date => date ? new Date(date).toLocaleDateString() : '-'
        },
        {
            title: 'Action',
            key: 'action',
            render: (_, record) => (
                <>
                    <Button
                        icon={<EditOutlined />}
                        onClick={() => showModal(record)}
                        style={{ marginRight: 8 }}
                    />
                    <Button
                        icon={<KeyOutlined />}
                        onClick={() => showResetModal(record)}
                        style={{ marginRight: 8 }}
                        title="Reset Password"
                    />
                    <Popconfirm
                        title="Delete this user?"
                        onConfirm={() => handleDelete(record.id)}
                        disabled={record.id === currentUser?.id}
                    >
                        <Button
                            icon={<DeleteOutlined />}
                            danger
                            disabled={record.id === currentUser?.id}
                        />
                    </Popconfirm>
                </>
            ),
        },
    ];

    return (
        <div>
            <h2>User Management</h2>
            <Table
                columns={columns}
                dataSource={users}
                rowKey="id"
                loading={loading}
                scroll={{ x: true }}
            />

            <Modal
                title="Edit User"
                visible={isModalVisible}
                onOk={handleOk}
                onCancel={() => setIsModalVisible(false)}
            >
                <Form form={form} layout="vertical">
                    <Form.Item name="full_name" label="Full Name">
                        <Input />
                    </Form.Item>
                    <Form.Item name="phone_number" label="Phone Number">
                        <Input />
                    </Form.Item>
                    <Form.Item name="role" label="Role" rules={[{ required: true }]}>
                        <Select>
                            <Option value="user">User</Option>
                            <Option value="admin">Admin</Option>
                        </Select>
                    </Form.Item>
                </Form>
            </Modal>

            <Modal
                title={`Reset Password for ${resettingUser?.full_name}`}
                visible={isResetModalVisible}
                onOk={handleResetPassword}
                onCancel={() => setIsResetModalVisible(false)}
            >
                <Form form={resetForm} layout="vertical">
                    <Form.Item
                        name="newPassword"
                        label="New Password"
                        rules={[{ required: true, message: 'Please enter a new password' }]}
                    >
                        <Input.Password />
                    </Form.Item>
                </Form>
            </Modal>
        </div>
    );
};

// Import Input separately because it was missing in destructing - FIXED


export default AdminUsers;
