import React, { useState, useEffect } from 'react';
import { Table, Tag, Button, Modal, Form, DatePicker, Select, Input, message, Typography, Row, Col, Space, Card } from 'antd';
import { PlusOutlined, CarOutlined, ClockCircleOutlined, EnvironmentOutlined, CheckCircleOutlined, SyncOutlined, CloseCircleOutlined, DashboardOutlined } from '@ant-design/icons';
import BookingService from '../../services/booking.service';
import moment from 'moment';

const { RangePicker } = DatePicker;
const { Option } = Select;
const { TextArea } = Input;
const { Title, Text } = Typography;

const UserBookings = () => {
    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(false);
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [availableCars, setAvailableCars] = useState([]);
    const [form] = Form.useForm();
    const [returnForm] = Form.useForm();
    const [isReturnModalVisible, setIsReturnModalVisible] = useState(false);
    const [returningBooking, setReturningBooking] = useState(null);

    const fetchBookings = async () => {
        setLoading(true);
        try {
            const response = await BookingService.getBookings();
            setBookings(response.data.bookings);
        } catch (error) {
            message.error("Failed to fetch bookings");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchBookings();
    }, []);

    const onDateChange = async (dates) => {
        if (!dates || dates.length !== 2) {
            setAvailableCars([]);
            return;
        }

        try {
            const start = dates[0].toISOString();
            const end = dates[1].toISOString();
            const response = await BookingService.getAvailableCars(start, end);
            setAvailableCars(response.data.cars);
        } catch (error) {
            message.error("Failed to check availability");
        }
    };

    const handleOk = async () => {
        try {
            const values = await form.validateFields();
            const payload = {
                car_id: values.car_id,
                start_time: values.dates[0].toISOString(),
                end_time: values.dates[1].toISOString(),
                objective: values.objective,
                destination: values.destination
            };

            await BookingService.createBooking(payload);
            message.success("Booking request submitted");
            setIsModalVisible(false);
            form.resetFields();
            fetchBookings();
        } catch (error) {
            message.error(error.response?.data?.message || "Booking failed");
        }
    };

    const showReturnModal = (booking) => {
        setReturningBooking(booking);
        returnForm.resetFields();
        setIsReturnModalVisible(true);
    };

    const handleReturnCar = async () => {
        try {
            const values = await returnForm.validateFields();
            await BookingService.returnCar(returningBooking.id, values.end_mileage);
            message.success("Car returned successfully");
            setIsReturnModalVisible(false);
            fetchBookings();
        } catch (error) {
            message.error(error.response?.data?.message || "Failed to return car");
        }
    };

    const columns = [
        {
            title: 'Vehicle',
            key: 'vehicle',
            render: (_, record) => (
                <Space>
                    <div style={{
                        width: 40,
                        height: 40,
                        borderRadius: '10px',
                        background: '#f1f5f9',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                    }}>
                        <CarOutlined style={{ color: '#6366f1', fontSize: '20px' }} />
                    </div>
                    <div>
                        <Text strong style={{ display: 'block' }}>{record.car_model}</Text>
                        <Tag color="blue" style={{ borderRadius: '4px', border: 'none', background: '#e0e7ff', color: '#4338ca', fontSize: '11px' }}>
                            {record.car_license}
                        </Tag>
                    </div>
                </Space>
            )
        },
        {
            title: 'Schedule',
            key: 'schedule',
            render: (_, record) => (
                <div style={{ minWidth: '180px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                        <ClockCircleOutlined style={{ fontSize: '12px', color: '#94a3b8' }} />
                        <Text style={{ fontSize: '13px' }}>{moment(record.start_time).format('DD MMM, HH:mm')}</Text>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div style={{ width: '12px', marginLeft: '6px', borderLeft: '1px dashed #e2e8f0', height: '8px' }} />
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <ClockCircleOutlined style={{ fontSize: '12px', color: '#94a3b8' }} />
                        <Text style={{ fontSize: '13px' }}>{moment(record.end_time).format('DD MMM, HH:mm')}</Text>
                    </div>
                </div>
            )
        },
        {
            title: 'Destination',
            dataIndex: 'destination',
            key: 'destination',
            render: text => (
                <Space size={4}>
                    <EnvironmentOutlined style={{ color: '#94a3b8' }} />
                    <Text style={{ fontSize: '13px' }}>{text}</Text>
                </Space>
            )
        },
        {
            title: 'Mileage Tracker',
            key: 'mileage',
            render: (_, record) => (
                <div style={{ background: '#f8fafc', padding: '12px', borderRadius: '12px', minWidth: '150px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                        <Text type="secondary" style={{ fontSize: '11px' }}>Start</Text>
                        <Text strong style={{ fontSize: '11px' }}>{record.start_mileage ?? '-'} km</Text>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                        <Text type="secondary" style={{ fontSize: '11px' }}>End</Text>
                        <Text strong style={{ fontSize: '11px' }}>{record.end_mileage ?? '-'} km</Text>
                    </div>
                    {record.end_mileage && record.start_mileage ? (
                        <div style={{
                            borderTop: '1px solid #e2e8f0',
                            paddingTop: '4px',
                            display: 'flex',
                            justifyContent: 'space-between'
                        }}>
                            <Text strong style={{ fontSize: '12px', color: '#6366f1' }}>Total</Text>
                            <Text strong style={{ fontSize: '12px', color: '#6366f1' }}>
                                {record.end_mileage - record.start_mileage} km
                            </Text>
                        </div>
                    ) : (
                        <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: '4px' }}>
                            <Text type="secondary" style={{ fontSize: '11px', fontStyle: 'italic' }}>Pending return...</Text>
                        </div>
                    )}
                </div>
            )
        },
        {
            title: 'Status',
            dataIndex: 'status',
            key: 'status',
            render: status => {
                let color = 'default';
                let icon = <SyncOutlined spin />;

                if (status === 'approved' || status === 'picked_up') {
                    color = 'processing';
                    icon = <SyncOutlined />;
                } else if (status === 'completed' || status === 'returned') {
                    color = 'success';
                    icon = <CheckCircleOutlined />;
                } else if (status === 'rejected' || status === 'cancelled') {
                    color = 'error';
                    icon = <CloseCircleOutlined />;
                }

                return (
                    <Tag
                        icon={icon}
                        color={color}
                        style={{ borderRadius: '20px', padding: '2px 12px', fontWeight: 600, textTransform: 'capitalize' }}
                    >
                        {status}
                    </Tag>
                );
            }
        },
        {
            title: 'Action',
            key: 'action',
            width: 100,
            render: (_, record) => (
                (record.status === 'approved' || record.status === 'picked_up') && (
                    <Button
                        type="primary"
                        icon={<CarOutlined />}
                        onClick={() => showReturnModal(record)}
                        style={{
                            borderRadius: '8px',
                            background: 'var(--success-gradient)',
                            border: 'none',
                            fontWeight: 600
                        }}
                    >
                        Return Car
                    </Button>
                )
            )
        },
    ];

    return (
        <div style={{ padding: '24px', maxWidth: '1600px', margin: '0 auto' }}>
            <div style={{ marginBottom: '32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <Title level={2} style={{ margin: 0, fontWeight: 800, letterSpacing: '-0.5px' }}>My Bookings</Title>
                    <Text type="secondary">Manage and track your vehicle reservation history</Text>
                </div>
                <Button
                    type="primary"
                    icon={<PlusOutlined />}
                    onClick={() => setIsModalVisible(true)}
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
                    New Booking
                </Button>
            </div>

            <Card
                className="premium-card"
                style={{ borderRadius: '20px', border: 'none' }}
                bodyStyle={{ padding: 0 }}
            >
                <Table
                    columns={columns}
                    dataSource={bookings}
                    rowKey="id"
                    loading={loading}
                    pagination={{ pageSize: 8, hideOnSinglePage: true }}
                    scroll={{ x: true }}
                />
            </Card>

            <Modal
                title={
                    <Space>
                        <CarOutlined style={{ color: '#6366f1' }} />
                        <span style={{ fontWeight: 700 }}>New Booking Request</span>
                    </Space>
                }
                open={isModalVisible}
                onOk={handleOk}
                onCancel={() => setIsModalVisible(false)}
                width={650}
                centered
                okText="Submit Request"
                okButtonProps={{
                    style: { borderRadius: '8px', height: '40px', background: 'var(--primary-gradient)', border: 'none', fontWeight: 600 }
                }}
                cancelButtonProps={{ style: { borderRadius: '8px', height: '40px' } }}
            >
                <div style={{ padding: '12px 0' }}>
                    <Form form={form} layout="vertical">
                        <Row gutter={24}>
                            <Col span={24}>
                                <Form.Item name="dates" label={<Text strong>Date & Time Range</Text>} rules={[{ required: true }]}>
                                    <RangePicker
                                        showTime
                                        format="YYYY-MM-DD HH:mm"
                                        onChange={onDateChange}
                                        style={{ width: '100%', padding: '10px 14px', borderRadius: '10px' }}
                                        placeholder={['Pickup Time', 'Return Time']}
                                    />
                                </Form.Item>
                            </Col>
                            <Col span={24}>
                                <Form.Item
                                    name="car_id"
                                    label={<Text strong>Select Vehicle</Text>}
                                    rules={[{ required: true }]}
                                    help={availableCars.length > 0 ? (
                                        <Tag color="success" style={{ borderRadius: '4px', border: 'none', marginTop: '4px' }}>
                                            {availableCars.length} vehicles available for this period
                                        </Tag>
                                    ) : (
                                        <Text type="secondary" style={{ fontSize: '12px' }}>Pick dates first to see availability</Text>
                                    )}
                                >
                                    <Select
                                        placeholder="Choose a vehicle"
                                        disabled={availableCars.length === 0}
                                        size="large"
                                        style={{ borderRadius: '10px' }}
                                        dropdownStyle={{ borderRadius: '12px' }}
                                    >
                                        {availableCars.map(car => (
                                            <Option key={car.id} value={car.id}>
                                                <div style={{ padding: '4px 0' }}>
                                                    <Text strong>{car.brand} {car.model}</Text>
                                                    <div style={{ fontSize: '12px', color: '#64748b' }}>
                                                        {car.license_plate} • {car.color} • {car.fuel_type || 'Fuel'}
                                                    </div>
                                                </div>
                                            </Option>
                                        ))}
                                    </Select>
                                </Form.Item>
                            </Col>
                        </Row>

                        <Form.Item name="destination" label={<Text strong>Destination</Text>} rules={[{ required: true }]}>
                            <Input prefix={<EnvironmentOutlined style={{ color: '#94a3b8' }} />} placeholder="Where are you going?" size="large" style={{ borderRadius: '10px' }} />
                        </Form.Item>

                        <Form.Item name="objective" label={<Text strong>Purpose of Trip</Text>} rules={[{ required: true }]}>
                            <TextArea rows={3} placeholder="Please describe the reason for this booking..." style={{ borderRadius: '10px' }} />
                        </Form.Item>
                    </Form>
                </div>
            </Modal>

            <Modal
                title={
                    <Space>
                        <DashboardOutlined style={{ color: '#10b981' }} />
                        <span style={{ fontWeight: 700 }}>Record Trip Completion</span>
                    </Space>
                }
                open={isReturnModalVisible}
                onOk={handleReturnCar}
                onCancel={() => setIsReturnModalVisible(false)}
                centered
                okText="Complete Return"
                okButtonProps={{
                    style: { borderRadius: '8px', height: '40px', background: 'var(--success-gradient)', border: 'none', fontWeight: 600 }
                }}
                cancelButtonProps={{ style: { borderRadius: '8px', height: '40px' } }}
            >
                <div style={{ padding: '20px 0' }}>
                    <div style={{ background: '#ecfdf5', padding: '16px', borderRadius: '12px', marginBottom: '24px', border: '1px solid #d1fae5' }}>
                        <Text style={{ color: '#065f46' }}>
                            You are returning <strong>{returningBooking?.car_model}</strong> ({returningBooking?.car_license}).
                            Please enter the finalize mileage reading from the dashboard.
                        </Text>
                    </div>
                    <Form form={returnForm} layout="vertical">
                        <Form.Item
                            name="end_mileage"
                            label={<Text strong>Current Odometer Reading (End Mileage)</Text>}
                            rules={[
                                { required: true, message: 'Trip reading is required' },
                                { pattern: /^\d+$/, message: 'Please enter a valid numeric value' }
                            ]}
                            help={<Text type="secondary" style={{ fontSize: '12px' }}>Must be greater than {returningBooking?.start_mileage} km</Text>}
                        >
                            <Input
                                type="number"
                                suffix={<Text type="secondary">km</Text>}
                                size="large"
                                style={{ borderRadius: '10px' }}
                                placeholder="e.g. 12500"
                            />
                        </Form.Item>
                    </Form>
                </div>
            </Modal>
        </div>
    );
};

export default UserBookings;
