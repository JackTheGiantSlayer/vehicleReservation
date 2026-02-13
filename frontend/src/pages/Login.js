import React, { useState, useContext } from 'react';
import { Form, Input, Button, Card, message, Typography, Modal } from 'antd';
import { UserOutlined, LockOutlined, PhoneOutlined, CarOutlined } from '@ant-design/icons';
import { useNavigate, Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import AuthService from '../services/auth.service';

const { Title, Text } = Typography;

const Login = () => {
    const [loading, setLoading] = useState(false);
    const [forgotModalVisible, setForgotModalVisible] = useState(false);
    const [forgotLoading, setForgotLoading] = useState(false);

    const { login } = useContext(AuthContext);
    const navigate = useNavigate();
    const [forgotForm] = Form.useForm();

    const onFinish = async (values) => {
        setLoading(true);
        try {
            await login(values.email, values.password);
            message.success('Login successful!');
            navigate('/dashboard');
        } catch (error) {
            const msg = error.response?.data?.message || 'Login failed';
            message.error(msg);
        } finally {
            setLoading(false);
        }
    };

    const handleForgotPassword = async (values) => {
        setForgotLoading(true);
        try {
            await AuthService.forgotPassword(values.email, values.phone_number);
            message.success('Temporary password has been sent to your email.');
            setForgotModalVisible(false);
            forgotForm.resetFields();
        } catch (error) {
            message.error(error.response?.data?.message || 'Failed to request password reset');
        } finally {
            setForgotLoading(false);
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
                width: 450,
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
                    <Title level={2} style={{ margin: 0, fontWeight: 700 }}>Welcome Back</Title>
                    <Text type="secondary">Sign in to manage your vehicle reservations</Text>
                </div>

                <Form
                    name="login_form"
                    layout="vertical"
                    onFinish={onFinish}
                    size="large"
                >
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
                        rules={[{ required: true, message: 'Please input your Password!' }]}
                    >
                        <Input.Password prefix={<LockOutlined style={{ color: '#bfbfbf' }} />} placeholder="Enter your password" />
                    </Form.Item>

                    <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 24 }}>
                        <Button type="link" onClick={() => setForgotModalVisible(true)} style={{ padding: 0, height: 'auto' }}>
                            Forgot password?
                        </Button>
                    </div>

                    <Form.Item style={{ marginBottom: 16 }}>
                        <Button type="primary" htmlType="submit" block loading={loading} style={{ height: '48px', fontWeight: 600 }}>
                            Sign In
                        </Button>
                    </Form.Item>

                    <div style={{ textAlign: 'center' }}>
                        <Text type="secondary">Don't have an account? </Text>
                        <Link to="/register" style={{ fontWeight: 600 }}>Create account</Link>
                    </div>
                </Form>
            </Card>

            <Modal
                title="Reset Password"
                open={forgotModalVisible}
                onCancel={() => setForgotModalVisible(false)}
                footer={null}
                centered
                styles={{ body: { paddingTop: 8 } }}
            >
                <Text type="secondary" style={{ display: 'block', marginBottom: '24px' }}>
                    Enter your email and registered phone number. We will send a temporary password to your email.
                </Text>
                <Form
                    form={forgotForm}
                    layout="vertical"
                    onFinish={handleForgotPassword}
                >
                    <Form.Item
                        name="email"
                        label="Email"
                        rules={[{ required: true, message: 'Please input your email!' }, { type: 'email' }]}
                    >
                        <Input prefix={<UserOutlined />} placeholder="Email" />
                    </Form.Item>
                    <Form.Item
                        name="phone_number"
                        label="Phone Number"
                        rules={[{ required: true, message: 'Please input your phone number!' }]}
                    >
                        <Input prefix={<PhoneOutlined />} placeholder="Phone Number" />
                    </Form.Item>
                    <Form.Item>
                        <Button type="primary" htmlType="submit" loading={forgotLoading} block>
                            Send Temporary Password
                        </Button>
                    </Form.Item>
                </Form>
            </Modal>
        </div>
    );
};

export default Login;
