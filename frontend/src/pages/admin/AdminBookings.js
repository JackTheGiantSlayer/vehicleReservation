import React, { useState, useEffect } from 'react';
import { Table, Tag, Button, message, Space } from 'antd';
import { CheckCircleOutlined, CloseCircleOutlined } from '@ant-design/icons';
import BookingService from '../../services/booking.service';
import moment from 'moment';

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
        { title: 'ID', dataIndex: 'id', key: 'id' },
        { title: 'User', dataIndex: 'user_name', key: 'user_name' },
        { title: 'Phone', dataIndex: 'user_phone', key: 'user_phone' },
        { title: 'Car', dataIndex: 'car_model', key: 'car_model' },
        {
            title: 'Dates',
            key: 'dates',
            render: (_, record) => (
                <span>
                    {moment(record.start_time).format('MM/DD HH:mm')} - <br />
                    {moment(record.end_time).format('MM/DD HH:mm')}
                </span>
            )
        },
        {
            title: 'Mileage (km)',
            key: 'mileage',
            render: (_, record) => (
                <div style={{ fontSize: '12px' }}>
                    <div>Start: {record.start_mileage ?? '-'}</div>
                    <div>End: {record.end_mileage ?? '-'}</div>
                    {record.end_mileage && record.start_mileage && (
                        <div style={{ fontWeight: 'bold', color: '#1890ff' }}>
                            Dist: {record.end_mileage - record.start_mileage}
                        </div>
                    )}
                </div>
            )
        },
        { title: 'Objective', dataIndex: 'objective', key: 'objective' },
        {
            title: 'Status',
            dataIndex: 'status',
            key: 'status',
            render: status => {
                let color = 'blue';
                if (status === 'approved') color = 'green';
                if (status === 'rejected') color = 'red';
                return <Tag color={color}>{status.toUpperCase()}</Tag>;
            }
        },
        {
            title: 'Action',
            key: 'action',
            render: (_, record) => (
                <Space>
                    {record.status === 'pending' && (
                        <>
                            <Button
                                type="primary"
                                size="small"
                                icon={<CheckCircleOutlined />}
                                onClick={() => handleStatusUpdate(record.id, 'approved')}
                            >
                                Approve
                            </Button>
                            <Button
                                danger
                                size="small"
                                icon={<CloseCircleOutlined />}
                                onClick={() => handleStatusUpdate(record.id, 'rejected')}
                            >
                                Reject
                            </Button>
                        </>
                    )}
                    {record.status === 'approved' && (
                        <Button
                            danger
                            size="small"
                            icon={<CloseCircleOutlined />}
                            onClick={() => handleStatusUpdate(record.id, 'cancelled')}
                        >
                            Cancel
                        </Button>
                    )}
                </Space>
            ),
        },
    ];

    return (
        <div>
            <h2>Booking Management</h2>
            <Table columns={columns} dataSource={bookings} rowKey="id" loading={loading} />
        </div>
    );
};

export default AdminBookings;
