import React, { useState, useEffect } from 'react';
import { Calendar, Badge, Modal, List, Tag, Typography, Spin, message, Row, Col, Card, Statistic, Avatar, Radio, Select, Space } from 'antd';
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
            <div className="events" style={{ padding: '4px 0', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                {listData.map((item) => (
                    <div key={item.id} style={{ display: 'flex', alignItems: 'center' }}>
                        <Badge
                            status={item.status === 'completed' ? 'success' : (item.status === 'approved' ? 'error' : 'warning')}
                            text={`${item.car_license} (${item.car_model})`}
                            style={{
                                fontSize: '11px',
                                whiteSpace: 'nowrap',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                width: '100%'
                            }}
                        />
                    </div>
                ))}
            </div>
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
            <div className="ant-picker-cell-inner ant-picker-calendar-date"
                style={{
                    backgroundColor,
                    height: '140px',
                    display: 'flex',
                    flexDirection: 'column',
                    padding: '8px',
                    transition: 'all 0.2s ease'
                }}
            >
                <div className="ant-picker-calendar-date-value" style={{ marginBottom: '8px', fontWeight: 600 }}>{date.date()}</div>
                <div className="ant-picker-calendar-date-content" style={{ flex: 1, overflowY: 'auto', margin: 0 }}>
                    {dateCellRender(date)}
                </div>
            </div>
        );
    };

    return (
        <div style={{ padding: '0 24px 24px 24px', maxWidth: '1600px', margin: '0 auto' }}>
            <div style={{ marginBottom: '40px' }}>
                <Title level={2} style={{ marginBottom: '24px', fontWeight: 800, letterSpacing: '-0.5px' }}>
                    Dashboard Overview
                </Title>
                <Row gutter={[24, 24]}>
                    <Col xs={24} sm={12} lg={6}>
                        <Card
                            bordered={false}
                            className="premium-card mesh-gradient-primary"
                            style={{ borderRadius: '16px', height: '100%' }}
                        >
                            <Statistic
                                title={<Text style={{ color: 'rgba(255,255,255,0.85)', fontWeight: 500 }}>Total Bookings</Text>}
                                value={stats.total}
                                prefix={<CalendarOutlined style={{ color: '#fff', opacity: 0.8 }} />}
                                valueStyle={{ color: '#fff', fontWeight: 800, fontSize: '28px' }}
                            />
                            <div style={{ marginTop: '8px', fontSize: '12px', color: 'rgba(255,255,255,0.7)' }}>
                                Cumulative history
                            </div>
                        </Card>
                    </Col>
                    <Col xs={24} sm={12} lg={6}>
                        <Card
                            bordered={false}
                            className="premium-card"
                            style={{ borderRadius: '16px', background: '#fff', height: '100%' }}
                        >
                            <Statistic
                                title={<Text strong>Active Reservations</Text>}
                                value={stats.active}
                                prefix={<SyncOutlined spin style={{ color: '#6366f1' }} />}
                                valueStyle={{ color: '#1e293b', fontWeight: 800, fontSize: '28px' }}
                            />
                            <div style={{ marginTop: '8px', fontSize: '12px', color: '#64748b' }}>
                                Currently in progress
                            </div>
                        </Card>
                    </Col>
                    <Col xs={24} sm={12} lg={6}>
                        <Card
                            bordered={false}
                            className="premium-card"
                            style={{ borderRadius: '16px', background: '#fff', height: '100%' }}
                        >
                            <Statistic
                                title={<Text strong>Waiting Approval</Text>}
                                value={stats.pending}
                                prefix={<ClockCircleOutlined style={{ color: '#f59e0b' }} />}
                                valueStyle={{ color: '#1e293b', fontWeight: 800, fontSize: '28px' }}
                            />
                            <div style={{ marginTop: '8px', fontSize: '12px', color: '#64748b' }}>
                                Needs attention
                            </div>
                        </Card>
                    </Col>
                    <Col xs={24} sm={12} lg={6}>
                        <Card
                            bordered={false}
                            className="premium-card"
                            style={{ borderRadius: '16px', background: '#fff', height: '100%' }}
                        >
                            <Statistic
                                title={<Text strong>Completed Today</Text>}
                                value={stats.completed}
                                prefix={<CheckCircleOutlined style={{ color: '#10b981' }} />}
                                valueStyle={{ color: '#1e293b', fontWeight: 800, fontSize: '28px' }}
                            />
                            <div style={{ marginTop: '8px', fontSize: '12px', color: '#64748b' }}>
                                Successfully returned
                            </div>
                        </Card>
                    </Col>
                </Row>
            </div>

            <Card
                title={
                    <Space size="small" style={{ fontWeight: 700 }}>
                        <CalendarOutlined style={{ color: '#6366f1' }} />
                        <span>Car Schedule</span>
                    </Space>
                }
                className="premium-card"
                style={{ borderRadius: '20px', border: 'none' }}
                bodyStyle={{ padding: '20px' }}
            >
                <Spin spinning={loading}>
                    <Calendar
                        fullCellRender={fullCellRender}
                        onSelect={onSelect}
                        headerRender={({ value, type, onChange, onTypeChange }) => {
                            const start = 0;
                            const end = 12;
                            const monthOptions = [];
                            const current = value.clone();
                            const localeData = value.localeData();
                            const months = [];
                            for (let i = 0; i < 12; i++) {
                                current.month(i);
                                months.push(localeData.monthsShort(current));
                            }
                            for (let i = start; i < end; i++) {
                                monthOptions.push(
                                    <Select.Option key={i} value={i} className="month-item">
                                        {months[i]}
                                    </Select.Option>,
                                );
                            }
                            const year = value.year();
                            const month = value.month();
                            const options = [];
                            for (let i = year - 10; i < year + 10; i += 1) {
                                options.push(
                                    <Select.Option key={i} value={i} className="year-item">
                                        {i}
                                    </Select.Option>,
                                );
                            }
                            return (
                                <div style={{ padding: 8, display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                                    <Select
                                        size="small"
                                        dropdownMatchSelectWidth={false}
                                        className="my-year-select"
                                        value={year}
                                        onChange={(newYear) => {
                                            const now = value.clone().year(newYear);
                                            onChange(now);
                                        }}
                                    >
                                        {options}
                                    </Select>
                                    <Select
                                        size="small"
                                        dropdownMatchSelectWidth={false}
                                        value={month}
                                        onChange={(newMonth) => {
                                            const now = value.clone().month(newMonth);
                                            onChange(now);
                                        }}
                                    >
                                        {monthOptions}
                                    </Select>
                                    <Radio.Group
                                        size="small"
                                        onChange={(e) => onTypeChange(e.target.value)}
                                        value={type}
                                    >
                                        <Radio.Button value="month">Month</Radio.Button>
                                        <Radio.Button value="year">Year</Radio.Button>
                                    </Radio.Group>
                                </div>
                            );
                        }}
                    />
                </Spin>
            </Card>

            <Modal
                title={
                    <Space>
                        <CarOutlined style={{ color: '#6366f1' }} />
                        <span>Bookings for {selectedDate?.format('DD MMM YYYY')}</span>
                    </Space>
                }
                open={isModalVisible}
                onCancel={() => setIsModalVisible(false)}
                footer={null}
                centered
                width={600}
                bodyStyle={{ maxHeight: '70vh', overflowY: 'auto', padding: '12px 24px' }}
            >
                <List
                    itemLayout="horizontal"
                    dataSource={selectedBookings}
                    renderItem={item => (
                        <List.Item style={{ borderBottom: '1px solid #f1f5f9', padding: '20px 0' }}>
                            <List.Item.Meta
                                avatar={
                                    <div style={{
                                        width: 48,
                                        height: 48,
                                        borderRadius: '12px',
                                        background: '#f1f5f9',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center'
                                    }}>
                                        <CarOutlined style={{ color: '#6366f1', fontSize: '24px' }} />
                                    </div>
                                }
                                title={
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                                        <Text strong style={{ fontSize: '16px' }}>{item.car_model}</Text>
                                        <Tag color="blue" style={{ borderRadius: '4px', border: 'none', background: '#e0e7ff', color: '#4338ca' }}>
                                            {item.car_license}
                                        </Tag>
                                    </div>
                                }
                                description={
                                    <Space direction="vertical" size={2} style={{ width: '100%' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                            <SyncOutlined style={{ fontSize: '12px', color: '#94a3b8' }} />
                                            <Text type="secondary">{item.destination}</Text>
                                        </div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                            <ClockCircleOutlined style={{ fontSize: '12px', color: '#94a3b8' }} />
                                            <Text type="secondary">
                                                {dayjs(item.start_time).format('HH:mm')} - {dayjs(item.end_time).format('HH:mm')}
                                            </Text>
                                        </div>
                                        <div style={{ marginTop: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <Tag
                                                color={item.status === 'completed' || item.status === 'returned' ? 'success' : (item.status === 'approved' || item.status === 'picked_up' ? 'processing' : 'warning')}
                                                style={{ borderRadius: '20px', padding: '0 12px' }}
                                            >
                                                {item.status.toUpperCase()}
                                            </Tag>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                <Avatar size="small" icon={<UserOutlined />} src={item.user_avatar} />
                                                <Text type="secondary" style={{ fontSize: '12px' }}>{item.user_name}</Text>
                                            </div>
                                        </div>
                                    </Space>
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

