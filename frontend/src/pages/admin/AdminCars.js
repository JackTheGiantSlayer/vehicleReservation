import React, { useState, useEffect } from 'react';
import { Table, Button, Modal, Form, Input, Select, InputNumber, message, Popconfirm, Tag, Space, Typography, Card, Row, Col } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, ToolOutlined, CarOutlined, DashboardOutlined, BgColorsOutlined } from '@ant-design/icons';
import CarService from '../../services/car.service';

const { Option } = Select;
const { Title, Text } = Typography;

const AdminCars = () => {
    const [cars, setCars] = useState([]);
    const [loading, setLoading] = useState(false);
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [editingCar, setEditingCar] = useState(null);
    const [form] = Form.useForm();

    const fetchCars = async () => {
        setLoading(true);
        try {
            const response = await CarService.getAllCars();
            setCars(response.data.cars);
        } catch (error) {
            message.error("Failed to fetch cars");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCars();
    }, []);

    const showModal = (car) => {
        setEditingCar(car);
        if (car) {
            form.setFieldsValue(car);
        } else {
            form.resetFields();
        }
        setIsModalVisible(true);
    };

    const handleOk = async () => {
        try {
            const values = await form.validateFields();
            if (editingCar) {
                await CarService.updateCar(editingCar.id, values);
                message.success("Car updated successfully");
            } else {
                await CarService.createCar(values);
                message.success("Car created successfully");
            }
            setIsModalVisible(false);
            fetchCars();
        } catch (error) {
            message.error(error.response?.data?.message || "Operation failed");
        }
    };

    const handleDelete = async (id) => {
        try {
            await CarService.deleteCar(id);
            message.success("Car deleted successfully");
            fetchCars();
        } catch (error) {
            message.error("Failed to delete car");
        }
    };

    const handleService = async (id) => {
        try {
            await CarService.serviceCar(id);
            message.success("Car marked as serviced");
            fetchCars();
        } catch (error) {
            message.error("Failed to mark car as serviced");
        }
    };

    const columns = [
        {
            title: 'Vehicle Info',
            key: 'vehicle',
            render: (_, record) => (
                <Space>
                    <div style={{
                        width: 44,
                        height: 44,
                        borderRadius: '12px',
                        background: '#f1f5f9',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                    }}>
                        <CarOutlined style={{ color: '#6366f1', fontSize: '22px' }} />
                    </div>
                    <div>
                        <Text strong style={{ display: 'block', fontSize: '14px' }}>{record.brand} {record.model}</Text>
                        <Tag color="blue" style={{ borderRadius: '4px', border: 'none', background: '#e0e7ff', color: '#4338ca', fontSize: '11px' }}>
                            {record.license_plate}
                        </Tag>
                    </div>
                </Space>
            )
        },
        {
            title: 'Color',
            dataIndex: 'color',
            key: 'color',
            render: text => (
                <Space size={4}>
                    <BgColorsOutlined style={{ color: '#94a3b8' }} />
                    <Text style={{ fontSize: '13px' }}>{text}</Text>
                </Space>
            )
        },
        {
            title: 'Mileage',
            key: 'mileage',
            render: (_, record) => (
                <div style={{ minWidth: '120px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                        <DashboardOutlined style={{ fontSize: '12px', color: '#94a3b8' }} />
                        <Text style={{ fontSize: '13px' }}>{record.current_mileage?.toLocaleString()} km</Text>
                    </div>
                    <Text type="secondary" style={{ fontSize: '11px' }}>Total Odometer</Text>
                </div>
            )
        },
        {
            title: 'Last Service',
            key: 'last_service',
            render: (_, record) => (
                <div style={{ minWidth: '120px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                        <ToolOutlined style={{ fontSize: '12px', color: '#94a3b8' }} />
                        <Text style={{ fontSize: '13px' }}>{record.last_maintenance_mileage?.toLocaleString()} km</Text>
                    </div>
                    <Text type="secondary" style={{ fontSize: '11px' }}>Previous Maintenance</Text>
                </div>
            )
        },
        {
            title: 'Status',
            dataIndex: 'status',
            key: 'status',
            render: (status, record) => {
                let color = 'success';
                if (status === 'maintenance') color = 'error';
                if (status === 'reserved') color = 'warning';

                const interval = 10000;
                const sinceLast = record.current_mileage - record.last_maintenance_mileage;
                const isDue = sinceLast >= interval || (Math.floor(record.current_mileage / interval) > Math.floor(record.last_maintenance_mileage / interval));

                return (
                    <Space direction="vertical" size={4} style={{ display: 'flex' }}>
                        <Tag color={color} style={{ borderRadius: '20px', padding: '1px 10px', fontWeight: 600, textTransform: 'capitalize', border: 'none' }}>
                            {status}
                        </Tag>
                        {isDue && (
                            <Tag color="error" style={{ borderRadius: '4px', border: 'none', fontWeight: 700, fontSize: '10px' }}>
                                SERVICE DUE
                            </Tag>
                        )}
                    </Space>
                );
            }
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
                    <Popconfirm
                        title="Mark car as serviced? This will reset the maintenance counter."
                        onConfirm={() => handleService(record.id)}
                    >
                        <Button
                            type="text"
                            icon={<ToolOutlined style={{ color: '#10b981' }} />}
                            style={{ background: '#ecfdf5', borderRadius: '8px' }}
                        />
                    </Popconfirm>
                    <Popconfirm title="Sure to delete?" onConfirm={() => handleDelete(record.id)}>
                        <Button
                            type="text"
                            icon={<DeleteOutlined style={{ color: '#ef4444' }} />}
                            style={{ background: '#fef2f2', borderRadius: '8px' }}
                        />
                    </Popconfirm>
                </Space>
            ),
        },
    ];

    return (
        <div style={{ padding: '24px', maxWidth: '1600px', margin: '0 auto' }}>
            <div style={{ marginBottom: '32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <Title level={2} style={{ margin: 0, fontWeight: 800, letterSpacing: '-0.5px' }}>Fleet Management</Title>
                    <Text type="secondary">Monitor and maintain the vehicle inventory</Text>
                </div>
                <Button
                    type="primary"
                    icon={<PlusOutlined />}
                    onClick={() => showModal(null)}
                    size="large"
                    style={{
                        borderRadius: '12px',
                        height: '48px',
                        padding: '0 24px',
                        background: 'var(--primary-gradient)',
                        border: 'none',
                        fontWeight: 700,
                        boxShadow: '0 4px 14px 0 rgba(99, 102, 241, 0.39)'
                    }}
                >
                    Add Vehicle
                </Button>
            </div>

            <Card
                className="premium-card"
                style={{ borderRadius: '20px', border: 'none' }}
                bodyStyle={{ padding: 0 }}
            >
                <Table
                    columns={columns}
                    dataSource={cars}
                    rowKey="id"
                    loading={loading}
                    scroll={{ x: true }}
                    pagination={{ pageSize: 10, hideOnSinglePage: true }}
                />
            </Card>

            <Modal
                title={
                    <Space>
                        <CarOutlined style={{ color: '#6366f1' }} />
                        <span style={{ fontWeight: 700 }}>{editingCar ? "Update Vehicle Details" : "Register New Vehicle"}</span>
                    </Space>
                }
                open={isModalVisible}
                onOk={handleOk}
                onCancel={() => setIsModalVisible(false)}
                width={650}
                centered
                okText={editingCar ? "Save Changes" : "Register Vehicle"}
                okButtonProps={{
                    style: { borderRadius: '8px', height: '40px', background: 'var(--primary-gradient)', border: 'none', fontWeight: 600 }
                }}
                cancelButtonProps={{ style: { borderRadius: '8px', height: '40px' } }}
            >
                <div style={{ padding: '12px 0' }}>
                    <Form form={form} layout="vertical" requiredMark={false}>
                        <Row gutter={16}>
                            <Col span={12}>
                                <Form.Item name="license_plate" label={<Text strong>License Plate</Text>} rules={[{ required: true }]}>
                                    <Input placeholder="e.g. ABC-1234" style={{ borderRadius: '10px' }} />
                                </Form.Item>
                            </Col>
                            <Col span={12}>
                                <Form.Item name="color" label={<Text strong>Car Color</Text>} rules={[{ required: true }]}>
                                    <Input placeholder="e.g. Silver Metallic" style={{ borderRadius: '10px' }} />
                                </Form.Item>
                            </Col>
                        </Row>

                        <Row gutter={16}>
                            <Col span={12}>
                                <Form.Item name="brand" label={<Text strong>Brand</Text>} rules={[{ required: true }]}>
                                    <Input placeholder="e.g. Toyota" style={{ borderRadius: '10px' }} />
                                </Form.Item>
                            </Col>
                            <Col span={12}>
                                <Form.Item name="model" label={<Text strong>Model</Text>} rules={[{ required: true }]}>
                                    <Input placeholder="e.g. Hilux Revo" style={{ borderRadius: '10px' }} />
                                </Form.Item>
                            </Col>
                        </Row>

                        <Divider orientation="left"><Text type="secondary" style={{ fontSize: '12px' }}>Odometer & Status</Text></Divider>

                        <Row gutter={16}>
                            <Col span={12}>
                                <Form.Item name="current_mileage" label={<Text strong>Current Mileage (km)</Text>}>
                                    <InputNumber style={{ width: '100%', borderRadius: '10px' }} min={0} />
                                </Form.Item>
                            </Col>
                            <Col span={12}>
                                <Form.Item name="last_maintenance_mileage" label={<Text strong>Last Service Mileage (km)</Text>}>
                                    <InputNumber style={{ width: '100%', borderRadius: '10px' }} min={0} />
                                </Form.Item>
                            </Col>
                        </Row>

                        <Form.Item name="status" label={<Text strong>Current Status</Text>} initialValue="available">
                            <Select style={{ borderRadius: '10px' }} dropdownStyle={{ borderRadius: '12px' }}>
                                <Option value="available">Available</Option>
                                <Option value="reserved">Reserved</Option>
                                <Option value="maintenance">Maintenance</Option>
                            </Select>
                        </Form.Item>
                    </Form>
                </div>
            </Modal>
        </div>
    );
};

export default AdminCars;
