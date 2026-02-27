import React, { useState, useEffect, useRef } from 'react';
import { Card, Row, Col, Statistic, Table, Typography, Spin, message, DatePicker, Button, Space } from 'antd';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line } from 'recharts';
import { DownloadOutlined, UserOutlined, CarOutlined, DashboardOutlined } from '@ant-design/icons';
import ReportService from '../../services/report.service';
import moment from 'moment';
import ExportService from '../../services/export.service';
import html2canvas from 'html2canvas';

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;

const AdminReports = () => {
    const [basicStats, setBasicStats] = useState(null);
    const [advancedStats, setAdvancedStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [dateRange, setDateRange] = useState([null, null]);
    const chartRef = useRef(null);

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
                // Clone to avoid mutating the state objects
                params.start_date = dates[0].clone().startOf('day').format('YYYY-MM-DDTHH:mm:ss');
                params.end_date = dates[1].clone().endOf('day').format('YYYY-MM-DDTHH:mm:ss');
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

    const handleExportPDF = async () => {
        if (!advancedStats) return;

        let chartImage = null;
        try {
            if (chartRef.current) {
                const canvas = await html2canvas(chartRef.current, {
                    scale: 2, // Higher quality
                    useCORS: true,
                    logging: false
                });
                chartImage = canvas.toDataURL('image/png');
            }
        } catch (error) {
            console.error("Failed to capture chart image", error);
        }

        const dateRangeString = dateRange[0] && dateRange[1]
            ? `${dateRange[0].format('DD/MM/YYYY')} - ${dateRange[1].format('DD/MM/YYYY')}`
            : 'ทั้งหมด';

        const filename = dateRange[0] && dateRange[1]
            ? `report_${dateRange[0].format('YYYYMMDD')}_${dateRange[1].format('YYYYMMDD')}.pdf`
            : 'vehicle_report.pdf';

        const payload = {
            summary: {
                ...advancedStats.summary,
                active_cars: basicStats?.active_cars,
                total_cars: basicStats?.total_cars
            },
            bookings: advancedStats.bookings.map(b => ({ ...b, status: b.status.toUpperCase() })),
            top_users: advancedStats.summary.top_users.slice(0, 5),
            car_stats: advancedStats.summary.car_stats,
            daily_stats: advancedStats.daily_stats,
            chartImage,
            dateRangeString
        };

        ExportService.exportAdvancedReport(payload, filename);
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
        { title: 'Destination', dataIndex: 'destination', key: 'destination' },
        { title: 'Objective', dataIndex: 'purpose', key: 'purpose' },
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

    const carColumns = [
        { title: 'Vehicle', dataIndex: 'name', key: 'name' },
        { title: 'Bookings', dataIndex: 'count', key: 'count', sorter: (a, b) => a.count - b.count },
        { title: 'Mileage', dataIndex: 'mileage', key: 'mileage', render: val => `${val} km`, sorter: (a, b) => a.mileage - b.mileage }
    ];

    const userColumns = [
        { title: 'User Name', dataIndex: 'name', key: 'name' },
        { title: 'Total Bookings', dataIndex: 'count', key: 'count' }
    ];

    return (
        <div style={{ padding: '24px' }}>
            <Row justify="space-between" align="middle" style={{ marginBottom: 24 }}>
                <Col>
                    <Title level={2} style={{ margin: 0 }}>รายงานการใช้รถยนต์ (Vehicle Usage Report)</Title>
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

            {/* Summary Row */}
            <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
                <Col xs={24} sm={12} md={8}>
                    <Card bordered={false} style={{ borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
                        <Statistic
                            title="Total Distance Covered"
                            value={advancedStats?.summary.total_mileage || 0}
                            suffix="km"
                            prefix={<DashboardOutlined style={{ marginRight: 8, color: '#4f46e5' }} />}
                            valueStyle={{ fontWeight: 700, color: '#4f46e5' }}
                        />
                    </Card>
                </Col>
                <Col xs={24} sm={12} md={8}>
                    <Card bordered={false} style={{ borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
                        <Statistic
                            title="Total Reservations"
                            value={advancedStats?.summary.total_bookings || 0}
                            valueStyle={{ fontWeight: 700 }}
                        />
                    </Card>
                </Col>
                <Col xs={24} sm={12} md={8}>
                    <Card bordered={false} style={{ borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
                        <Statistic
                            title="สถานะรถ"
                            value={`${basicStats?.active_cars || 0} / ${basicStats?.total_cars || 0}`}
                            valueStyle={{ fontWeight: 700 }}
                        />
                        <Text type="secondary" size="small">Ready for use (Active / Total)</Text>
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
                        {/* Car Usage Statistics */}
                        <Col xs={24} xl={16}>
                            <Card
                                title={<Space><CarOutlined /><span>Car Usage & Mileage</span></Space>}
                                bordered={false}
                                style={{ borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}
                            >
                                <Table
                                    dataSource={advancedStats?.summary.car_stats}
                                    columns={carColumns}
                                    rowKey="name"
                                    pagination={{ pageSize: 5 }}
                                    size="small"
                                />
                            </Card>
                        </Col>
                        {/* Top Users */}
                        <Col xs={24} xl={8}>
                            <Card
                                title={<Space><UserOutlined /><span>Top 5 Users</span></Space>}
                                bordered={false}
                                style={{ borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}
                            >
                                <Table
                                    dataSource={advancedStats?.summary.top_users.slice(0, 5)}
                                    columns={userColumns}
                                    rowKey="name"
                                    pagination={false}
                                    size="small"
                                />
                            </Card>
                        </Col>
                    </Row>

                    <Row gutter={[24, 24]} style={{ marginBottom: 24 }}>
                        <Col span={24}>
                            <div ref={chartRef}>
                                <Card title="Daily Booking Trend" bordered={false} style={{ borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
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
                            </div>
                        </Col>
                    </Row>

                    <Card
                        title="Detailed Booking History (Selected Range)"
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
