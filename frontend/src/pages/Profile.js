import React, { useState, useContext, useEffect } from 'react';
import { Card, Form, Input, Button, message, Typography, Row, Col, Divider } from 'antd';
import { UserOutlined, MailOutlined, PhoneOutlined, LockOutlined } from '@ant-design/icons';
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
            // Only send password if it's provided
            const updateData = {
                full_name: values.full_name,
                phone_number: values.phone_number,
            };
            if (values.password) {
                updateData.password = values.password;
            }

            const response = await UserService.updateProfile(updateData);

            // Update local user context
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
        <div style={{ padding: '4px' }}>
            <Row justify="center">
                <Col xs={24} md={18} lg={12}>
                    <Card
                        title={<Title level={4} style={{ margin: 0 }}>My Profile</Title>}
                        bordered={false}
                        style={{ borderRadius: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}
                    >
                        <Form
                            form={form}
                            layout="vertical"
                            onFinish={onFinish}
                            size="large"
                        >
                            <Form.Item
                                name="full_name"
                                label="Full Name"
                                rules={[{ required: true, message: 'Please input your full name!' }]}
                            >
                                <Input prefix={<UserOutlined style={{ color: '#bfbfbf' }} />} placeholder="John Doe" />
                            </Form.Item>

                            <Form.Item
                                name="email"
                                label="Email Address"
                            >
                                <Input prefix={<MailOutlined style={{ color: '#bfbfbf' }} />} disabled />
                            </Form.Item>

                            <Form.Item
                                name="phone_number"
                                label="Phone Number"
                            >
                                <Input prefix={<PhoneOutlined style={{ color: '#bfbfbf' }} />} placeholder="08x-xxx-xxxx" />
                            </Form.Item>

                            <Divider orientation="left" style={{ margin: '32px 0 24px' }}>
                                <Text strong><LockOutlined /> Security</Text>
                            </Divider>

                            <Text type="secondary" style={{ display: 'block', marginBottom: 24 }}>Leave blank if you don't want to change your password.</Text>

                            <Form.Item
                                name="password"
                                label="New Password"
                                rules={[
                                    { min: 6, message: 'Password must be at least 6 characters!' }
                                ]}
                                hasFeedback
                            >
                                <Input.Password prefix={<LockOutlined style={{ color: '#bfbfbf' }} />} placeholder="Minimum 6 characters" />
                            </Form.Item>

                            <Form.Item
                                name="confirm"
                                label="Confirm New Password"
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
                                <Input.Password prefix={<LockOutlined style={{ color: '#bfbfbf' }} />} placeholder="Repeat new password" />
                            </Form.Item>

                            <Form.Item style={{ marginTop: 32 }}>
                                <Button type="primary" htmlType="submit" loading={loading} block style={{ height: '48px', fontWeight: 600 }}>
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
