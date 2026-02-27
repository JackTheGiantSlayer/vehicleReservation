import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Statistic, Table, Typography, Spin, message, DatePicker, Button, Space } from 'antd';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line } from 'recharts';
import { DownloadOutlined, UserOutlined, CarOutlined, DashboardOutlined } from '@ant-design/icons';
import ReportService from '../../services/report.service';
import moment from 'moment';
import ExportService from '../../services/export.service';

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;

const AdminReports = () => {
    const [basicStats, setBasicStats] = useState(null);
    const [advancedStats, setAdvancedStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [dateRange, setDateRange] = useState([null, null]);

    const fetchBasicData = async () => {
        try {
            const res = await ReportService.getStats();
            setBasicStats(res.data);
        } catch (error) {
            console.error("Failed to fetch basic stats", error);
        }
    };

    const fetchAdvancedData = async (dates) => {
        setLoading(true);
        try {
            const params = {};
            if (dates && dates[0] && dates[1]) {
                params.start_date = dates[0].startOf('day').toISOString();
                params.end_date = dates[1].endOf('day').toISOString();
            }
            const res = await ReportService.getAdvancedStats(params);
            setAdvancedStats(res.data);
        } catch (error) {
            message.error("Failed to fetch report data");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchBasicData();
        fetchAdvancedData(null);
    }, []);

    const handleDateChange = (dates) => {
        setDateRange(dates);
        fetchAdvancedData(dates);
    };

    const handleExportPDF = () => {
        if (!advancedStats || !advancedStats.bookings) return;

        const pdfColumns = [
            { title: 'Date', dataIndex: 'start_time' },
            { title: 'User', dataIndex: 'user' },
            { title: 'Vehicle', dataIndex: 'car' },
            { title: 'Status', dataIndex: 'status' },
            { title: 'Mileage (km)', dataIndex: 'mileage' }
        ];

        const pdfData = advancedStats.bookings.map(b => ({
            ...b,
            status: b.status.toUpperCase(),
        }));

        const filename = dateRange[0] && dateRange[1]
            ? `report_${dateRange[0].format('YYYYMMDD')}_${dateRange[1].format('YYYYMMDD')}.pdf`
            : 'vehicle_report.pdf';

        ExportService.exportToPDF(pdfColumns, pdfData, filename);
    };

    const columns = [
        {
            title: 'Date',
            dataIndex: 'start_time',
            key: 'start_time',
            sorter: (a, b) => moment(a.start_time).unix() - moment(b.start_time).unix(),
        },
        { title: 'User', dataIndex: 'user', key: 'user' },
        { title: 'Vehicle', dataIndex: 'car', key: 'car' },
        {
            title: 'Mileage',
            dataIndex: 'mileage',
            key: 'mileage',
            render: val => val > 0 ? `${val} km` : '-'
        },
        {
            title: 'Status',
            dataIndex: 'status',
            key: 'status',
            render: status => status.toUpperCase()
        }
    ];

    return (
        <div style={{ padding: '24px' }}>
            <Row justify="space-between" align="middle" style={{ marginBottom: 24 }}>
                <Col>
                    <Title level={2} style={{ margin: 0 }}>Advanced Reports</Title>
                </Col>
                <Col>
                    <Space size="middle">
                        <RangePicker
                            onChange={handleDateChange}
                            style={{ borderRadius: '8px' }}
                        />
                        <Button
                            type="primary"
                            icon={<DownloadOutlined />}
                            onClick={handleExportPDF}
                            disabled={!advancedStats}
                        >
                            Export PDF
                        </Button>
                    </Space>
                </Col>
            </Row>

            {/* Overall Stats Cards */}
            <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
                <Col xs={24} sm={12} md={6}>
                    <Card bordered={false} style={{ borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
                        <Statistic
                            title="Total Mileage"
                            value={advancedStats?.summary.total_mileage || 0}
                            suffix="km"
                            prefix={<DashboardOutlined style={{ marginRight: 8, color: '#4f46e5' }} />}
                            valueStyle={{ fontWeight: 700, color: '#4f46e5' }}
                        />
                    </Card>
                </Col>
                <Col xs={24} sm={12} md={6}>
                    <Card bordered={false} style={{ borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
                        <Statistic
                            title="Total Bookings"
                            value={advancedStats?.summary.total_bookings || 0}
                            valueStyle={{ fontWeight: 700 }}
                        />
                    </Card>
                </Col>
                <Col xs={24} sm={12} md={6}>
                    <Card bordered={false} style={{ borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
                        <Text type="secondary" style={{ fontSize: '14px' }}>Top User</Text>
                        <div style={{ marginTop: 8 }}>
                            <Space align="start">
                                <UserOutlined style={{ fontSize: '20px', color: '#10b981', marginTop: 4 }} />
                                <div>
                                    <div style={{ fontWeight: 700, fontSize: '18px' }}>{advancedStats?.summary.top_user?.name || '-'}</div>
                                    <Text type="secondary" size="small">{advancedStats?.summary.top_user?.count || 0} bookings</Text>
                                </div>
                            </Space>
                        </div>
                    </Card>
                </Col>
                <Col xs={24} sm={12} md={6}>
                    <Card bordered={false} style={{ borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
                        <Text type="secondary" style={{ fontSize: '14px' }}>Top Vehicle</Text>
                        <div style={{ marginTop: 8 }}>
                            <Space align="start">
                                <CarOutlined style={{ fontSize: '20px', color: '#f59e0b', marginTop: 4 }} />
                                <div>
                                    <div style={{ fontWeight: 700, fontSize: '18px' }}>{advancedStats?.summary.top_car?.name || '-'}</div>
                                    <Text type="secondary" size="small">{advancedStats?.summary.top_car?.count || 0} bookings</Text>
                                </div>
                            </Space>
                        </div>
                    </Card>
                </Col>
            </Row>

            {loading ? (
                <div style={{ textAlign: 'center', padding: '50px' }}>
                    <Spin size="large" />
                </div>
            ) : (
                <>
                    <Row gutter={[24, 24]} style={{ marginBottom: 24 }}>
                        <Col xs={24} lg={16}>
                            <Card title="Usage Trend" bordered={false} style={{ borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
                                <ResponsiveContainer width="100%" height={300}>
                                    <LineChart data={advancedStats?.daily_stats}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                        <XAxis dataKey="date" />
                                        <YAxis allowDecimals={false} />
                                        <Tooltip />
                                        <Legend />
                                        <Line type="monotone" dataKey="bookings" stroke="#4f46e5" strokeWidth={2} name="Bookings" dot={{ r: 4 }} activeDot={{ r: 6 }} />
                                    </LineChart>
                                </ResponsiveContainer>
                            </Card>
                        </Col>
                        <Col xs={24} lg={8}>
                            <Card title="Quick Overview" bordered={false} style={{ borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
                                <Statistic title="Fleet Size" value={basicStats?.total_cars} />
                                <div style={{ marginTop: 20 }}>
                                    <Text type="secondary">System data as of today.</Text>
                                </div>
                            </Card>
                        </Col>
                    </Row>

                    <Card
                        title="Bookings in Range"
                        bordered={false}
                        style={{ borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}
                    >
                        <Table
                            dataSource={advancedStats?.bookings}
                            columns={columns}
                            rowKey="id"
                            pagination={{ pageSize: 10 }}
                            scroll={{ x: true }}
                        />
                    </Card>
                </>
            )}
        </div>
    );
};

export default AdminReports;
