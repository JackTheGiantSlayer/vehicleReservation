import React, { useState, useEffect } from 'react';
import { Table, Button, Modal, Form, Input, Select, InputNumber, message, Popconfirm, Tag, Space } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, ToolOutlined } from '@ant-design/icons';
import CarService from '../../services/car.service';

const { Option } = Select;

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
        { title: 'ID', dataIndex: 'id', key: 'id' },
        { title: 'License Plate', dataIndex: 'license_plate', key: 'license_plate' },
        { title: 'Brand', dataIndex: 'brand', key: 'brand' },
        { title: 'Model', dataIndex: 'model', key: 'model' },
        { title: 'Color', dataIndex: 'color', key: 'color' },
        {
            title: 'Mileage',
            dataIndex: 'current_mileage',
            key: 'current_mileage',
            render: (mileage) => <span>{mileage?.toLocaleString()} km</span>
        },
        {
            title: 'Status',
            dataIndex: 'status',
            key: 'status',
            render: (status, record) => {
                let color = 'green';
                if (status === 'maintenance') color = 'red';
                if (status === 'reserved') color = 'orange';

                // Show maintenance warning if due (every 10,000 km)
                const interval = 10000;
                const sinceLast = record.current_mileage - record.last_maintenance_mileage;
                const isDue = sinceLast >= interval || (Math.floor(record.current_mileage / interval) > Math.floor(record.last_maintenance_mileage / interval));

                return (
                    <Space direction="vertical" size={0}>
                        <Tag color={color}>{status.toUpperCase()}</Tag>
                        {isDue && <Tag color="error" style={{ marginTop: 4 }}>SERVICE DUE</Tag>}
                    </Space>
                );
            }
        },
        {
            title: 'Last Service',
            dataIndex: 'last_maintenance_mileage',
            key: 'last_maintenance_mileage',
            render: (mileage) => <span>{mileage?.toLocaleString()} km</span>
        },
        {
            title: 'Action',
            key: 'action',
            render: (_, record) => (
                <Space size="middle">
                    <Button
                        icon={<EditOutlined />}
                        onClick={() => showModal(record)}
                        title="Edit Car"
                    />
                    <Popconfirm
                        title="Mark car as serviced? This will reset the maintenance counter."
                        onConfirm={() => handleService(record.id)}
                    >
                        <Button
                            icon={<ToolOutlined />}
                            title="Mark as Serviced"
                        />
                    </Popconfirm>
                    <Popconfirm title="Sure to delete?" onConfirm={() => handleDelete(record.id)}>
                        <Button icon={<DeleteOutlined />} danger title="Delete Car" />
                    </Popconfirm>
                </Space>
            ),
        },
    ];

    return (
        <div>
            <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between' }}>
                <h2>Car Management</h2>
                <Button type="primary" icon={<PlusOutlined />} onClick={() => showModal(null)}>
                    Add Car
                </Button>
            </div>
            <Table columns={columns} dataSource={cars} rowKey="id" loading={loading} scroll={{ x: true }} />

            <Modal title={editingCar ? "Edit Car" : "Add Car"} visible={isModalVisible} onOk={handleOk} onCancel={() => setIsModalVisible(false)}>
                <Form form={form} layout="vertical">
                    <Form.Item name="license_plate" label="License Plate" rules={[{ required: true }]}>
                        <Input />
                    </Form.Item>
                    <div style={{ display: 'flex', gap: '16px' }}>
                        <Form.Item name="brand" label="Brand" rules={[{ required: true }]} style={{ flex: 1 }}>
                            <Input />
                        </Form.Item>
                        <Form.Item name="model" label="Model" rules={[{ required: true }]} style={{ flex: 1 }}>
                            <Input />
                        </Form.Item>
                    </div>
                    <Form.Item name="color" label="Color" rules={[{ required: true }]}>
                        <Input />
                    </Form.Item>
                    <div style={{ display: 'flex', gap: '16px' }}>
                        <Form.Item name="current_mileage" label="Current Mileage" style={{ flex: 1 }}>
                            <InputNumber style={{ width: '100%' }} />
                        </Form.Item>
                        <Form.Item name="last_maintenance_mileage" label="Last Service Mileage" style={{ flex: 1 }}>
                            <InputNumber style={{ width: '100%' }} />
                        </Form.Item>
                    </div>
                    <Form.Item name="status" label="Status" initialValue="available">
                        <Select>
                            <Option value="available">Available</Option>
                            <Option value="reserved">Reserved</Option>
                            <Option value="maintenance">Maintenance</Option>
                        </Select>
                    </Form.Item>
                </Form>
            </Modal>
        </div>
    );
};

export default AdminCars;
