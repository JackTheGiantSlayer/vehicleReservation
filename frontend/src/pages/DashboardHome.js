import React, { useState, useEffect } from 'react';
import { Calendar, Badge, Modal, List, Tag, Typography, Spin, message, Row, Col, Card, Statistic, Avatar } from 'antd';
import { CalendarOutlined, ClockCircleOutlined, CheckCircleOutlined, SyncOutlined, CarOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import BookingService from '../services/booking.service';
import isBetween from 'dayjs/plugin/isBetween';

dayjs.extend(isBetween);

const { Title, Text } = Typography;

const DashboardHome = () => {
    const [bookings, setBookings] = useState([]);
    const [stats, setStats] = useState({ total: 0, pending: 0, active: 0, completed: 0 });
    const [loading, setLoading] = useState(false);
    const [selectedDate, setSelectedDate] = useState(null);
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [selectedBookings, setSelectedBookings] = useState([]);

    const fetchBookings = async () => {
        setLoading(true);
        try {
            const response = await BookingService.getBookings({ all: true });
            const allBookings = response.data.bookings;
            setBookings(allBookings);

            // Calculate simple stats
            const pending = allBookings.filter(b => b.status === 'pending').length;
            const active = allBookings.filter(b => b.status === 'approved' || b.status === 'picked_up').length;
            const completed = allBookings.filter(b => b.status === 'completed' || b.status === 'returned').length;

            setStats({
                total: allBookings.length,
                pending,
                active,
                completed
            });
        } catch (error) {
            message.error("Failed to fetch dashboard data");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchBookings();
    }, []);

    const getBookingsForDate = (date) => {
        return bookings.filter(booking => {
            const start = dayjs(booking.start_time).startOf('day');
            const end = dayjs(booking.end_time).endOf('day');
            const current = date.startOf('day');
            // Note: status 'rejected' or 'cancelled' might be excluded if desired
            return (booking.status === 'approved' || booking.status === 'pending' || booking.status === 'completed') &&
                (current.isSame(start) || current.isSame(end) || (current.isAfter(start) && current.isBefore(end)));
        });
    };

    const dateCellRender = (value) => {
        const listData = getBookingsForDate(value);
        return (
            <ul className="events" style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                {listData.map((item) => (
                    <li key={item.id}>
                        <Badge
                            status={item.status === 'completed' ? 'success' : (item.status === 'approved' ? 'error' : 'warning')}
                            text={`${item.car_license} (${item.car_model})`}
                            style={{ fontSize: '10px' }}
                        />
                    </li>
                ))}
            </ul>
        );
    };

    const onSelect = (value) => {
        const list = getBookingsForDate(value);
        setSelectedDate(value);
        setSelectedBookings(list);
        if (list.length > 0) {
            setIsModalVisible(true);
        }
    };

    const fullCellRender = (date, info) => {
        if (info.type !== 'date') return info.originNode;

        const isWeekend = date.day() === 0 || date.day() === 6;
        const backgroundColor = isWeekend ? '#fff1f0' : 'transparent';

        return (
            <div className="ant-picker-cell-inner ant-picker-calendar-date" style={{ backgroundColor, height: '100%', minHeight: '100px', display: 'flex', flexDirection: 'column' }}>
                <div className="ant-picker-calendar-date-value">{date.date()}</div>
                <div className="ant-picker-calendar-date-content" style={{ flex: 1 }}>
                    {dateCellRender(date)}
                </div>
            </div>
        );
    };

    return (
        <div style={{ padding: '4px' }}>
            <div style={{ marginBottom: '32px' }}>
                <Title level={4} style={{ marginBottom: '16px' }}>Quick Overview</Title>
                <Row gutter={[16, 16]}>
                    <Col xs={24} sm={12} lg={6}>
                        <Card bordered={false} style={{ background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)', borderRadius: '12px' }}>
                            <Statistic
                                title={<Text style={{ color: 'rgba(255,255,255,0.8)' }}>Total Bookings</Text>}
                                value={stats.total}
                                prefix={<CalendarOutlined style={{ color: '#fff' }} />}
                                valueStyle={{ color: '#fff', fontWeight: 700 }}
                            />
                        </Card>
                    </Col>
                    <Col xs={24} sm={12} lg={6}>
                        <Card bordered={false} style={{ background: '#fff', borderRadius: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
                            <Statistic
                                title="Active"
                                value={stats.active}
                                prefix={<SyncOutlined spin style={{ color: '#1890ff' }} />}
                                valueStyle={{ color: '#1890ff', fontWeight: 700 }}
                            />
                        </Card>
                    </Col>
                    <Col xs={24} sm={12} lg={6}>
                        <Card bordered={false} style={{ background: '#fff', borderRadius: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
                            <Statistic
                                title="Pending"
                                value={stats.pending}
                                prefix={<ClockCircleOutlined style={{ color: '#faad14' }} />}
                                valueStyle={{ color: '#faad14', fontWeight: 700 }}
                            />
                        </Card>
                    </Col>
                    <Col xs={24} sm={12} lg={6}>
                        <Card bordered={false} style={{ background: '#fff', borderRadius: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
                            <Statistic
                                title="Completed"
                                value={stats.completed}
                                prefix={<CheckCircleOutlined style={{ color: '#52c41a' }} />}
                                valueStyle={{ color: '#52c41a', fontWeight: 700 }}
                            />
                        </Card>
                    </Col>
                </Row>
            </div>

            <Card title={<><CalendarOutlined /> Car Schedule</>} style={{ borderRadius: '12px', overflow: 'hidden' }} bodyStyle={{ padding: 0 }}>
                <Spin spinning={loading}>
                    <Calendar
                        fullCellRender={fullCellRender}
                        onSelect={onSelect}
                        style={{ padding: '12px' }}
                    />
                </Spin>
            </Card>

            <Modal
                title={`Bookings for ${selectedDate?.format('YYYY-MM-DD')}`}
                open={isModalVisible}
                onCancel={() => setIsModalVisible(false)}
                footer={null}
                centered
            >
                <List
                    itemLayout="horizontal"
                    dataSource={selectedBookings}
                    renderItem={item => (
                        <List.Item>
                            <List.Item.Meta
                                avatar={<Avatar style={{ backgroundColor: '#4f46e5' }} icon={<CarOutlined />} />}
                                title={<Text strong>{item.car_model} <Tag color="blue">{item.car_license}</Tag></Text>}
                                description={
                                    <>
                                        <div><Text strong>Destination:</Text> {item.destination}</div>
                                        <div><Text strong>Time:</Text> {dayjs(item.start_time).toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })} - {dayjs(item.end_time).toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })}</div>
                                        <div style={{ marginTop: 8 }}>
                                            <Tag color={item.status === 'completed' ? 'green' : (item.status === 'approved' ? 'blue' : 'orange')}>
                                                {item.status.toUpperCase()}
                                            </Tag>
                                            <Text type="secondary" size="small">by {item.user_name}</Text>
                                        </div>
                                    </>
                                }
                            />
                        </List.Item>
                    )}
                />
            </Modal>
        </div>
    );
};

export default DashboardHome;

