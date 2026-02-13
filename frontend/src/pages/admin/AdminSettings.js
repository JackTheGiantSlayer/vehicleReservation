import React, { useState, useEffect } from 'react';
import { Card, Form, Input, Switch, Button, message, Space, Typography, Divider, Row, Col } from 'antd';
import { SaveOutlined, MailOutlined, SettingOutlined } from '@ant-design/icons';
import SettingService from '../../services/setting.service';
import api from '../../services/api'; // Assuming 'api' is your axios instance

const { Title, Text } = Typography;

const AdminSettings = () => {
    const [form] = Form.useForm();
    const [loading, setLoading] = useState(false);
    const [updating, setUpdating] = useState(false);
    const [testing, setTesting] = useState(false);

    useEffect(() => {
        loadSettings();
    }, []);

    const loadSettings = async () => {
        setLoading(true);
        try {
            const data = await SettingService.getSettings();
            // Convert 'true'/'false' strings to boolean for Switch
            form.setFieldsValue({
                ...data,
                email_notifications_enabled: data.email_notifications_enabled === 'true'
            });
        } catch (error) {
            console.error('Failed to load settings:', error);
            message.error('Failed to load settings');
        } finally {
            setLoading(false);
        }
    };

    const onFinish = async (values) => {
        setUpdating(true);
        try {
            // Convert boolean back to string for backend
            const payload = {
                ...values,
                email_notifications_enabled: values.email_notifications_enabled ? 'true' : 'false'
            };
            await SettingService.updateSettings(payload);
            message.success('Settings updated successfully');
        } catch (error) {
            console.error('Failed to update settings:', error);
            message.error('Failed to update settings');
        } finally {
            setUpdating(false);
        }
    };

    const handleTestEmail = async () => {
        try {
            const values = await form.validateFields();
            setTesting(true);

            // Send current values to test unsaved changes
            const response = await api.post('/settings/test-email', values);
            message.success(response.data.message || 'Test email sent successfully!');
        } catch (error) {
            console.error('Test email failed:', error);
            if (error.errorFields) {
                message.error('Please fill in all SMTP fields correctly before testing');
            } else {
                message.error(error.response?.data?.message || 'Failed to send test email');
            }
        } finally {
            setTesting(false);
        }
    };

    return (
        <div style={{ maxWidth: 800, margin: '0 auto', padding: '12px' }}>
            <Title level={2}>Settings</Title>
            <Divider />

            <Card
                title={<span><MailOutlined /> Email Notifications</span>}
                loading={loading}
                bordered={false}
                style={{ borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}
                extra={
                    <Space>
                        <Button
                            type="default"
                            onClick={handleTestEmail}
                            loading={testing}
                        >
                            Test Connection
                        </Button>
                        <Button
                            type="primary"
                            icon={<SaveOutlined />}
                            onClick={() => form.submit()}
                            loading={updating}
                        >
                            Save Settings
                        </Button>
                    </Space>
                }
            >
                <Form
                    form={form}
                    layout="vertical"
                    onFinish={onFinish}
                >
                    <Form.Item
                        label="Enable Notifications"
                        name="email_notifications_enabled"
                        valuePropName="checked"
                    >
                        <Switch />
                    </Form.Item>

                    <Text type="secondary">Receive an email alert whenever a new vehicle reservation is created.</Text>
                    <Divider />

                    <Form.Item
                        label="Admin Recipient Email"
                        name="admin_email"
                        rules={[{ required: true, type: 'email', message: 'Please enter a valid admin email' }]}
                    >
                        <Input placeholder="admin@example.com" />
                    </Form.Item>

                    <Title level={5} style={{ marginBottom: '16px' }}><SettingOutlined /> SMTP Configuration</Title>
                    <Form.Item
                        label="SMTP Host"
                        name="smtp_host"
                        rules={[{ required: true, message: 'Required' }]}
                    >
                        <Input placeholder="smtp.gmail.com" />
                    </Form.Item>

                    <Row gutter={16}>
                        <Col xs={24} sm={8}>
                            <Form.Item
                                label="SMTP Port"
                                name="smtp_port"
                                rules={[{ required: true, message: 'Required' }]}
                            >
                                <Input placeholder="587" />
                            </Form.Item>
                        </Col>
                        <Col xs={24} sm={16}>
                            <Form.Item
                                label="SMTP User"
                                name="smtp_user"
                                rules={[{ required: true, message: 'Required' }]}
                            >
                                <Input placeholder="your-email@gmail.com" />
                            </Form.Item>
                        </Col>
                    </Row>

                    <Form.Item
                        label="SMTP Password / App Password"
                        name="smtp_pass"
                        rules={[{ required: true, message: 'Required' }]}
                    >
                        <Input.Password placeholder="Enter password" />
                    </Form.Item>
                </Form>
            </Card>
        </div>
    );
};

export default AdminSettings;
