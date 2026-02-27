import React, { useState, useEffect } from 'react';
import { Table, Tag, Button, message, Space, Typography, Card, Avatar } from 'antd';
import { CheckCircleOutlined, CloseCircleOutlined, UserOutlined, PhoneOutlined, CarOutlined, ClockCircleOutlined, DashboardOutlined, EnvironmentOutlined } from '@ant-design/icons';
import BookingService from '../../services/booking.service';
import moment from 'moment';

const { Title, Text } = Typography;

const AdminBookings = () => {
    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(false);

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

    const handleStatusUpdate = async (id, status) => {
        try {
            await BookingService.updateBookingStatus(id, status);
            message.success(`Booking ${status}`);
            fetchBookings();
        } catch (error) {
            message.error("Failed to update status");
        }
    };

    const columns = [
        {
            title: 'Booker Info',
            key: 'user',
            render: (_, record) => (
                <Space>
                    <Avatar
                        icon={<UserOutlined />}
                        style={{ backgroundColor: '#6366f1', boxShadow: '0 2px 8px rgba(99, 102, 241, 0.2)' }}
                    />
                    <div>
                        <Text strong style={{ display: 'block', fontSize: '14px' }}>{record.user_name}</Text>
                        <Space size={4}>
                            <PhoneOutlined style={{ fontSize: '11px', color: '#94a3b8' }} />
                            <Text type="secondary" style={{ fontSize: '12px' }}>{record.user_phone}</Text>
                        </Space>
                    </div>
                </Space>
            )
        },
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
                            {record.car_license || 'N/A'}
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
                        <ClockCircleOutlined style={{ fontSize: '12px', color: '#94a3b8' }} />
                        <Text style={{ fontSize: '13px' }}>{moment(record.end_time).format('DD MMM, HH:mm')}</Text>
                    </div>
                </div>
            )
        },
        {
            title: 'Journey',
            key: 'journey',
            render: (_, record) => (
                <div style={{ maxWidth: '200px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                        <EnvironmentOutlined style={{ fontSize: '12px', color: '#6366f1' }} />
                        <Text strong style={{ fontSize: '13px' }}>{record.destination || 'Not Specified'}</Text>
                    </div>
                    <Text type="secondary" style={{ fontSize: '12px', display: 'block' }}>{record.objective}</Text>
                </div>
            )
        },
        {
            title: 'Mileage Tracker',
            key: 'mileage',
            render: (_, record) => (
                <div style={{ background: '#f8fafc', padding: '10px', borderRadius: '12px', minWidth: '140px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2px' }}>
                        <Text type="secondary" style={{ fontSize: '11px' }}>Start</Text>
                        <Text strong style={{ fontSize: '11px' }}>{record.start_mileage ?? '-'} km</Text>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                        <Text type="secondary" style={{ fontSize: '11px' }}>End</Text>
                        <Text strong style={{ fontSize: '11px' }}>{record.end_mileage ?? '-'} km</Text>
                    </div>
                    {record.end_mileage && record.start_mileage ? (
                        <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: '4px', display: 'flex', justifyContent: 'space-between' }}>
                            <Text strong style={{ fontSize: '11px', color: '#6366f1' }}>Total</Text>
                            <Text strong style={{ fontSize: '11px', color: '#6366f1' }}>{record.end_mileage - record.start_mileage} km</Text>
                        </div>
                    ) : (
                        <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: '4px' }}>
                            <Text type="secondary" style={{ fontSize: '10px', fontStyle: 'italic' }}>Ongoing...</Text>
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
                if (status === 'approved' || status === 'picked_up') color = 'processing';
                else if (status === 'completed' || status === 'returned') color = 'success';
                else if (status === 'rejected' || status === 'cancelled') color = 'error';
                else if (status === 'pending') color = 'warning';

                return (
                    <Tag style={{ borderRadius: '20px', padding: '2px 12px', fontWeight: 600, textTransform: 'capitalize', border: 'none' }} color={color}>
                        {status}
                    </Tag>
                );
            }
        },
        {
            title: 'Action',
            key: 'action',
            width: 150,
            render: (_, record) => (
                <Space>
                    {record.status === 'pending' && (
                        <>
                            <Button
                                type="text"
                                icon={<CheckCircleOutlined style={{ color: '#10b981' }} />}
                                onClick={() => handleStatusUpdate(record.id, 'approved')}
                                style={{ background: '#ecfdf5', borderRadius: '8px' }}
                                title="Approve"
                            />
                            <Button
                                type="text"
                                icon={<CloseCircleOutlined style={{ color: '#ef4444' }} />}
                                onClick={() => handleStatusUpdate(record.id, 'rejected')}
                                style={{ background: '#fef2f2', borderRadius: '8px' }}
                                title="Reject"
                            />
                        </>
                    )}
                    {record.status === 'approved' && (
                        <Button
                            type="text"
                            icon={<CloseCircleOutlined style={{ color: '#ef4444' }} />}
                            onClick={() => handleStatusUpdate(record.id, 'cancelled')}
                            style={{ background: '#fef2f2', borderRadius: '8px' }}
                            title="Cancel"
                        />
                    )}
                </Space>
            ),
        },
    ];

    return (
        <div style={{ padding: '24px', maxWidth: '1600px', margin: '0 auto' }}>
            <div style={{ marginBottom: '32px' }}>
                <Title level={2} style={{ margin: 0, fontWeight: 800, letterSpacing: '-0.5px' }}>Booking Management</Title>
                <Text type="secondary">Review and manage all vehicle reservation requests in the system</Text>
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
                    pagination={{ pageSize: 10, hideOnSinglePage: true }}
                    scroll={{ x: true }}
                />
            </Card>
        </div>
    );
};

export default AdminBookings;
