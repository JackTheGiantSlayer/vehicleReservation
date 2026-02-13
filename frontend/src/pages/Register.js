import React, { useState, useContext } from 'react';
import { Form, Input, Button, Card, message, Typography } from 'antd';
import { UserOutlined, LockOutlined, IdcardOutlined, PhoneOutlined, CarOutlined } from '@ant-design/icons';
import { useNavigate, Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

const { Title, Text } = Typography;

const Register = () => {
    const [loading, setLoading] = useState(false);
    const { register } = useContext(AuthContext);
    const navigate = useNavigate();

    const onFinish = async (values) => {
        setLoading(true);
        try {
            await register(values.email, values.password, values.fullName, values.phoneNumber);
            message.success('Registration successful! Please login.');
            navigate('/login');
        } catch (error) {
            const msg = error.response?.data?.message || 'Registration failed';
            message.error(msg);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            minHeight: '100vh',
            background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
            padding: '20px'
        }}>
            <Card style={{
                width: 500,
                borderRadius: '16px',
                boxShadow: '0 10px 25px rgba(0,0,0,0.05)',
                border: 'none',
                overflow: 'hidden'
            }} bodyStyle={{ padding: '40px' }}>
                <div style={{ textAlign: 'center', marginBottom: 40 }}>
                    <div style={{
                        width: 64,
                        height: 64,
                        background: '#4f46e5',
                        borderRadius: '16px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        margin: '0 auto 16px',
                        boxShadow: '0 4px 12px rgba(79, 70, 229, 0.3)'
                    }}>
                        <CarOutlined style={{ fontSize: '32px', color: '#fff' }} />
                    </div>
                    <Title level={2} style={{ margin: 0, fontWeight: 700 }}>Join Us</Title>
                    <Text type="secondary">Create an account to start booking vehicles</Text>
                </div>

                <Form
                    name="register_form"
                    layout="vertical"
                    onFinish={onFinish}
                    size="large"
                >
                    <Form.Item
                        name="fullName"
                        label="Full Name"
                        rules={[{ required: true, message: 'Please input your Full Name!' }]}
                    >
                        <Input prefix={<IdcardOutlined style={{ color: '#bfbfbf' }} />} placeholder="John Doe" />
                    </Form.Item>

                    <Form.Item
                        name="phoneNumber"
                        label="Phone Number"
                        rules={[{ required: true, message: 'Please input your Phone Number!' }]}
                    >
                        <Input prefix={<PhoneOutlined style={{ color: '#bfbfbf' }} />} placeholder="08x-xxx-xxxx" />
                    </Form.Item>

                    <Form.Item
                        name="email"
                        label="Email Address"
                        rules={[{ required: true, message: 'Please input your Email!' }, { type: 'email', message: 'Please enter a valid email!' }]}
                    >
                        <Input prefix={<UserOutlined style={{ color: '#bfbfbf' }} />} placeholder="name@example.com" />
                    </Form.Item>

                    <Form.Item
                        name="password"
                        label="Password"
                        rules={[{ required: true, message: 'Please input your Password!' }, { min: 6, message: 'Password must be at least 6 characters!' }]}
                    >
                        <Input.Password prefix={<LockOutlined style={{ color: '#bfbfbf' }} />} placeholder="Minimum 6 characters" />
                    </Form.Item>

                    <Form.Item
                        name="confirm"
                        label="Confirm Password"
                        dependencies={['password']}
                        hasFeedback
                        rules={[
                            { required: true, message: 'Please confirm your password!' },
                            ({ getFieldValue }) => ({
                                validator(_, value) {
                                    if (!value || getFieldValue('password') === value) {
                                        return Promise.resolve();
                                    }
                                    return Promise.reject(new Error('The two passwords do not match!'));
                                },
                            }),
                        ]}
                    >
                        <Input.Password prefix={<LockOutlined style={{ color: '#bfbfbf' }} />} placeholder="Repeat password" />
                    </Form.Item>

                    <Form.Item style={{ marginTop: 8, marginBottom: 16 }}>
                        <Button type="primary" htmlType="submit" block loading={loading} style={{ height: '48px', fontWeight: 600 }}>
                            Create Account
                        </Button>
                    </Form.Item>

                    <div style={{ textAlign: 'center' }}>
                        <Text type="secondary">Already have an account? </Text>
                        <Link to="/login" style={{ fontWeight: 600 }}>Sign In</Link>
                    </div>
                </Form>
            </Card>
        </div>
    );
};

export default Register;
