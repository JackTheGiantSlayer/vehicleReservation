import React, { useState, useContext, useEffect } from 'react';
import { Card, Form, Input, Button, message, Typography, Row, Col, Divider, Avatar, Space, Tag } from 'antd';
import { UserOutlined, MailOutlined, PhoneOutlined, LockOutlined, CameraOutlined, SafetyCertificateOutlined } from '@ant-design/icons';
import { AuthContext } from '../context/AuthContext';
import UserService from '../services/user.service';

const { Title, Text } = Typography;

const Profile = () => {
    const { user, setUser } = useContext(AuthContext);
    const [form] = Form.useForm();
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (user) {
            form.setFieldsValue({
                full_name: user.full_name,
                email: user.email,
                phone_number: user.phone_number
            });
        }
    }, [user, form]);

    const onFinish = async (values) => {
        setLoading(true);
        try {
            const updateData = {
                full_name: values.full_name,
                phone_number: values.phone_number,
            };
            if (values.password) {
                updateData.password = values.password;
            }

            const response = await UserService.updateProfile(updateData);
            const updatedUser = { ...user, ...response.data.user };
            setUser(updatedUser);
            localStorage.setItem('user', JSON.stringify(updatedUser));

            message.success("Profile updated successfully");
            form.setFieldsValue({ password: '', confirm: '' });
        } catch (error) {
            message.error(error.response?.data?.message || "Failed to update profile");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto' }}>
            <div style={{ marginBottom: '32px' }}>
                <Title level={2} style={{ margin: 0, fontWeight: 800, letterSpacing: '-0.5px' }}>Account Settings</Title>
                <Text type="secondary">Update your personal information and security preferences</Text>
            </div>

            <Row gutter={[32, 32]}>
                <Col xs={24} lg={8}>
                    <Card
                        className="premium-card"
                        style={{ borderRadius: '20px', textAlign: 'center', height: '100%' }}
                        bodyStyle={{ padding: '40px 24px' }}
                    >
                        <div style={{ position: 'relative', display: 'inline-block', marginBottom: '24px' }}>
                            <Avatar
                                size={120}
                                icon={<UserOutlined />}
                                style={{
                                    backgroundColor: '#6366f1',
                                    fontSize: '60px',
                                    boxShadow: '0 8px 16px rgba(99, 102, 241, 0.25)'
                                }}
                                src={user?.avatar}
                            />
                            <Button
                                shape="circle"
                                icon={<CameraOutlined />}
                                size="small"
                                style={{
                                    position: 'absolute',
                                    bottom: 5,
                                    right: 5,
                                    background: '#fff',
                                    border: 'none',
                                    boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                                }}
                            />
                        </div>
                        <Title level={3} style={{ marginBottom: '4px', fontWeight: 700 }}>{user?.full_name}</Title>
                        <Text type="secondary" style={{ display: 'block', marginBottom: '24px' }}>{user?.email}</Text>

                        <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '12px', textAlign: 'left' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                                <SafetyCertificateOutlined style={{ color: '#10b981' }} />
                                <Text strong style={{ fontSize: '13px' }}>Verified Member</Text>
                            </div>
                            <Text type="secondary" style={{ fontSize: '12px' }}>
                                Account Status: <Tag color="success" style={{ borderRadius: '4px', border: 'none', marginLeft: '4px' }}>Active</Tag>
                            </Text>
                        </div>
                    </Card>
                </Col>

                <Col xs={24} lg={16}>
                    <Card
                        className="premium-card"
                        style={{ borderRadius: '20px', border: 'none' }}
                        bodyStyle={{ padding: '32px' }}
                    >
                        <Form
                            form={form}
                            layout="vertical"
                            onFinish={onFinish}
                            size="large"
                            requiredMark={false}
                        >
                            <Title level={4} style={{ marginBottom: '24px', fontWeight: 700 }}>Personal Information</Title>
                            <Row gutter={24}>
                                <Col span={24} md={12}>
                                    <Form.Item
                                        name="full_name"
                                        label={<Text strong>Full Name</Text>}
                                        rules={[{ required: true, message: 'Please input your full name!' }]}
                                    >
                                        <Input prefix={<UserOutlined style={{ color: '#94a3b8' }} />} placeholder="John Doe" style={{ borderRadius: '10px' }} />
                                    </Form.Item>
                                </Col>
                                <Col span={24} md={12}>
                                    <Form.Item
                                        name="email"
                                        label={<Text strong>Email Address</Text>}
                                    >
                                        <Input prefix={<MailOutlined style={{ color: '#94a3b8' }} />} disabled style={{ borderRadius: '10px' }} />
                                    </Form.Item>
                                </Col>
                                <Col span={24} md={12}>
                                    <Form.Item
                                        name="phone_number"
                                        label={<Text strong>Phone Number</Text>}
                                    >
                                        <Input prefix={<PhoneOutlined style={{ color: '#94a3b8' }} />} placeholder="08x-xxx-xxxx" style={{ borderRadius: '10px' }} />
                                    </Form.Item>
                                </Col>
                            </Row>

                            <Divider style={{ margin: '40px 0' }} />

                            <Title level={4} style={{ marginBottom: '16px', fontWeight: 700 }}>Security Setting</Title>
                            <Text type="secondary" style={{ display: 'block', marginBottom: '24px' }}>
                                Manage your password and account security. Leave blank to keep current password.
                            </Text>

                            <Row gutter={24}>
                                <Col span={24} md={12}>
                                    <Form.Item
                                        name="password"
                                        label={<Text strong>New Password</Text>}
                                        rules={[
                                            { min: 6, message: 'Password must be at least 6 characters!' }
                                        ]}
                                        hasFeedback
                                    >
                                        <Input.Password prefix={<LockOutlined style={{ color: '#94a3b8' }} />} placeholder="Minimum 6 characters" style={{ borderRadius: '10px' }} />
                                    </Form.Item>
                                </Col>
                                <Col span={24} md={12}>
                                    <Form.Item
                                        name="confirm"
                                        label={<Text strong>Confirm Password</Text>}
                                        dependencies={['password']}
                                        hasFeedback
                                        rules={[
                                            ({ getFieldValue }) => ({
                                                validator(_, value) {
                                                    if (!value || getFieldValue('password') === value) {
                                                        return Promise.resolve();
                                                    }
                                                    return Promise.reject(new Error('Passwords do not match!'));
                                                },
                                            }),
                                        ]}
                                    >
                                        <Input.Password prefix={<LockOutlined style={{ color: '#94a3b8' }} />} placeholder="Repeat new password" style={{ borderRadius: '10px' }} />
                                    </Form.Item>
                                </Col>
                            </Row>

                            <Form.Item style={{ marginTop: '40px', marginBottom: 0 }}>
                                <Button
                                    type="primary"
                                    htmlType="submit"
                                    loading={loading}
                                    style={{
                                        height: '48px',
                                        padding: '0 40px',
                                        borderRadius: '12px',
                                        background: 'var(--primary-gradient)',
                                        border: 'none',
                                        fontWeight: 700,
                                        boxShadow: '0 4px 14px 0 rgba(99, 102, 241, 0.3)'
                                    }}
                                >
                                    Save Profile Changes
                                </Button>
                            </Form.Item>
                        </Form>
                    </Card>
                </Col>
            </Row>
        </div>
    );
};

export default Profile;
