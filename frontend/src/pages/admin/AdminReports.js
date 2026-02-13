import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Statistic, Table, Typography, Spin, message } from 'antd';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line } from 'recharts';
import ReportService from '../../services/report.service';
import BookingService from '../../services/booking.service';
import moment from 'moment';
import { Button, Space } from 'antd';
import { DownloadOutlined } from '@ant-design/icons';
import ExportService from '../../services/export.service';

const { Title } = Typography;

const AdminReports = () => {
    const [stats, setStats] = useState(null);
    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchData = async () => {
        try {
            const [statsRes, bookingsRes] = await Promise.all([
                ReportService.getStats(),
                BookingService.getBookings({ all: true }) // Reuse existing API to get full list
            ]);
            setStats(statsRes.data);
            setBookings(bookingsRes.data.bookings);
        } catch (error) {
            message.error("Failed to fetch report data");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleExportCSV = () => {
        // Prepare data for CSV with calculated fields
        const csvData = bookings.map(b => ({
            ID: b.id,
            User: b.user_name,
            Car: b.car_model,
            License: b.car_license,
            Date: b.start_time ? moment(b.start_time).format('YYYY-MM-DD') : '',
            'Start (km)': b.start_mileage ?? '-',
            'End (km)': b.end_mileage ?? '-',
            'Distance (km)': (b.end_mileage && b.start_mileage) ? b.end_mileage - b.start_mileage : '-',
            Destination: b.destination,
            Status: b.status ? b.status.toUpperCase() : ''
        }));
        ExportService.exportToCSV(csvData, 'bookings_report.csv');
    };

    const handleExportPDF = () => {
        const pdfColumns = [
            { title: 'ID', dataIndex: 'id' },
            { title: 'User', dataIndex: 'user_name' },
            { title: 'Car', dataIndex: 'car_model' },
            { title: 'Date', dataIndex: 'start_date' },
            { title: 'Start', dataIndex: 'start_mileage' },
            { title: 'End', dataIndex: 'end_mileage' },
            { title: 'Dist', dataIndex: 'dist' },
            { title: 'Status', dataIndex: 'status' }
        ];

        const pdfData = bookings.map(b => ({
            ...b,
            start_date: b.start_time ? moment(b.start_time).format('YYYY-MM-DD') : '',
            status: b.status ? b.status.toUpperCase() : '',
            dist: (b.end_mileage && b.start_mileage) ? b.end_mileage - b.start_mileage : '-'
        }));

        ExportService.exportToPDF(pdfColumns, pdfData, 'bookings_report.pdf');
    };

    // Helper to get unique values for filters
    const getUniqueFilters = (key) => {
        const unique = [...new Set(bookings.map(item => item[key]))];
        return unique.filter(Boolean).map(val => ({ text: val.toString(), value: val }));
    };

    const columns = [
        { title: 'ID', dataIndex: 'id', key: 'id', sorter: (a, b) => a.id - b.id },
        {
            title: 'User',
            dataIndex: 'user_name',
            key: 'user_name',
            filters: getUniqueFilters('user_name'),
            onFilter: (value, record) => record.user_name.indexOf(value) === 0,
        },
        {
            title: 'Car',
            dataIndex: 'car_model',
            key: 'car_model',
            filters: getUniqueFilters('car_model'),
            onFilter: (value, record) => record.car_model.indexOf(value) === 0,
        },
        {
            title: 'Date',
            key: 'date',
            render: (_, record) => moment(record.start_time).format('YYYY-MM-DD'),
            sorter: (a, b) => moment(a.start_time).unix() - moment(b.start_time).unix(),
        },
        { title: 'Start (km)', dataIndex: 'start_mileage', key: 'start_mileage' },
        { title: 'End (km)', dataIndex: 'end_mileage', key: 'end_mileage' },
        {
            title: 'Distance',
            key: 'distance',
            render: (_, record) => (record.end_mileage && record.start_mileage) ? record.end_mileage - record.start_mileage : '-'
        },
        { title: 'Destination', dataIndex: 'destination', key: 'destination' },
        {
            title: 'Status',
            dataIndex: 'status',
            key: 'status',
            filters: getUniqueFilters('status'),
            onFilter: (value, record) => record.status.indexOf(value) === 0,
            render: status => status.toUpperCase()
        }
    ];

    if (loading) return <Spin size="large" style={{ display: 'block', margin: 'auto', marginTop: 50 }} />;

    return (
        <div>
            <Title level={2}>Admin Reports</Title>

            <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
                <Col xs={12} sm={8}>
                    <Card bordered={false} style={{ borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
                        <Statistic title="Total Cars" value={stats?.total_cars} valueStyle={{ fontWeight: 700 }} />
                    </Card>
                </Col>
                <Col xs={12} sm={8}>
                    <Card bordered={false} style={{ borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
                        <Statistic title="Total Bookings" value={stats?.total_bookings} valueStyle={{ fontWeight: 700 }} />
                    </Card>
                </Col>
            </Row>

            <Row gutter={[24, 24]} style={{ marginBottom: 24 }}>
                <Col xs={24} lg={12}>
                    <Card title="Bookings per Car" bordered={false} style={{ borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
                        <ResponsiveContainer width="100%" height={300}>
                            <BarChart data={stats?.cars_stats}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                <XAxis dataKey="name" interval={0} fontSize={10} />
                                <YAxis allowDecimals={false} />
                                <Tooltip cursor={{ fill: 'transparent' }} />
                                <Legend />
                                <Bar dataKey="bookings" fill="#4f46e5" name="Bookings" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </Card>
                </Col>
                <Col xs={24} lg={12}>
                    <Card title="Monthly Usage" bordered={false} style={{ borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
                        <ResponsiveContainer width="100%" height={300}>
                            <LineChart data={stats?.monthly_stats}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                <XAxis dataKey="month" />
                                <YAxis allowDecimals={false} />
                                <Tooltip />
                                <Legend />
                                <Line type="monotone" dataKey="bookings" stroke="#10b981" strokeWidth={2} name="Bookings" dot={{ r: 4 }} activeDot={{ r: 6 }} />
                            </LineChart>
                        </ResponsiveContainer>
                    </Card>
                </Col>
            </Row>

            <Card
                title="Recent Bookings"
                bordered={false}
                style={{ borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}
                extra={
                    <Space wrap>
                        <Button icon={<DownloadOutlined />} onClick={handleExportCSV}>CSV</Button>
                        <Button type="primary" icon={<DownloadOutlined />} onClick={handleExportPDF}>PDF</Button>
                    </Space>
                }
            >
                <Table
                    dataSource={bookings}
                    columns={columns}
                    rowKey="id"
                    pagination={{ pageSize: 5 }}
                    scroll={{ x: true }}
                />
            </Card>
        </div>
    );
};

export default AdminReports;
