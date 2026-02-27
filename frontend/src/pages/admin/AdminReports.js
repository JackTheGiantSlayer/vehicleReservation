import React, { useState, useEffect, useRef } from 'react';
import { Card, Row, Col, Statistic, Table, Typography, Spin, message, DatePicker, Button, Space } from 'antd';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line } from 'recharts';
import { DownloadOutlined, UserOutlined, CarOutlined, DashboardOutlined, FileExcelOutlined } from '@ant-design/icons';
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

    const handleExportCSV = () => {
        if (!advancedStats || !advancedStats.bookings) return;

        const filename = dateRange[0] && dateRange[1]
            ? `bookings_${dateRange[0].format('YYYYMMDD')}_${dateRange[1].format('YYYYMMDD')}.csv`
            : 'detailed_bookings.csv';

        // Prepare data with localized key names for better readability
        const csvData = advancedStats.bookings.map(b => ({
            'วันที่ (Date)': b.start_time,
            'ผู้ใช้งาน (User)': b.user,
            'พาหนะ (Vehicle)': b.car,
            'จุดหมาย (Destination)': b.destination,
            'วัตถุประสงค์ (Purpose)': b.purpose,
            'สถานะ (Status)': b.status.toUpperCase(),
            'ระยะทาง (Mileage)': b.mileage > 0 ? `${b.mileage} km` : '-'
        }));

        ExportService.exportToCSV(csvData, filename);
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
        <div style={{ padding: '0 24px 24px 24px', maxWidth: '1600px', margin: '0 auto' }}>
            <Row justify="space-between" align="middle" style={{ marginBottom: '32px' }}>
                <Col>
                    <Title level={2} style={{ margin: 0, fontWeight: 800, letterSpacing: '-0.5px' }}>
                        รายงานการใช้รถยนต์ (Vehicle Usage Report)
                    </Title>
                </Col>
                <Col>
                    <Space size="middle">
                        <RangePicker
                            onChange={handleDateChange}
                            style={{ borderRadius: '8px', padding: '8px 12px' }}
                        />
                        <Button
                            type="primary"
                            icon={<DownloadOutlined />}
                            onClick={handleExportPDF}
                            disabled={!advancedStats}
                            style={{
                                borderRadius: '8px',
                                height: '40px',
                                background: 'var(--primary-gradient)',
                                border: 'none',
                                fontWeight: 600
                            }}
                        >
                            Download PDF Report
                        </Button>
                    </Space>
                </Col>
            </Row>

            {loading ? (
                <div style={{ textAlign: 'center', padding: '100px 0' }}>
                    <Spin size="large" />
                </div>
            ) : !advancedStats ? (
                <Card className="premium-card" style={{ textAlign: 'center', borderRadius: '16px' }}>
                    <Text type="secondary">กรุณาเลือกช่วงวันที่เพื่อดูรายงาน</Text>
                </Card>
            ) : (
                <>
                    <Row gutter={[24, 24]} style={{ marginBottom: '32px' }}>
                        <Col xs={24} sm={12} md={8}>
                            <Card bordered={false} className="premium-card mesh-gradient-primary" style={{ borderRadius: '16px', height: '100%' }}>
                                <Statistic
                                    title={<Text style={{ color: 'rgba(255,255,255,0.85)' }}>ระยะทางรวมทั้งหมด</Text>}
                                    value={advancedStats.summary?.total_mileage || 0}
                                    precision={2}
                                    suffix="กม."
                                    valueStyle={{ color: '#fff', fontWeight: 800 }}
                                />
                                <div style={{ marginTop: '4px', fontSize: '12px', color: 'rgba(255,255,255,0.7)' }}>
                                    ระยะทางสะสมรวม
                                </div>
                            </Card>
                        </Col>
                        <Col xs={24} sm={12} md={8}>
                            <Card bordered={false} className="premium-card" style={{ borderRadius: '16px', background: '#fff', height: '100%' }}>
                                <Statistic
                                    title={<Text strong>จำนวนการจองทั้งหมด</Text>}
                                    value={advancedStats.summary?.total_bookings || 0}
                                    suffix="รายการ"
                                    valueStyle={{ color: '#1e293b', fontWeight: 800 }}
                                />
                                <div style={{ marginTop: '4px', fontSize: '12px', color: '#64748b' }}>
                                    ประวัติการทำรายการ
                                </div>
                            </Card>
                        </Col>
                        <Col xs={24} sm={12} md={8}>
                            <Card bordered={false} className="premium-card" style={{ borderRadius: '16px', background: '#fff', height: '100%' }}>
                                <Statistic
                                    title={<Text strong>สถานะรถ</Text>}
                                    value={`${basicStats?.active_cars || 0} / ${basicStats?.total_cars || 0}`}
                                    valueStyle={{ color: '#1e293b', fontWeight: 800 }}
                                />
                                <div style={{ marginTop: '4px', fontSize: '12px', color: '#64748b' }}>
                                    พร้อมใช้ / ทั้งหมด (คัน)
                                </div>
                            </Card>
                        </Col>
                    </Row>

                    <Row gutter={[24, 24]} style={{ marginBottom: '32px' }}>
                        <Col xs={24} lg={16}>
                            <div ref={chartRef}>
                                <Card
                                    title="สถิติการใช้งานรายวัน (Daily Usage Trends)"
                                    className="premium-card"
                                    style={{ borderRadius: '20px' }}
                                    bodyStyle={{ padding: '24px' }}
                                >
                                    <ResponsiveContainer width="100%" height={350}>
                                        <LineChart data={advancedStats.daily_stats}>
                                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                            <XAxis
                                                dataKey="date"
                                                axisLine={false}
                                                tickLine={false}
                                                tick={{ fill: '#64748b', fontSize: 12 }}
                                                dy={10}
                                            />
                                            <YAxis
                                                allowDecimals={false}
                                                axisLine={false}
                                                tickLine={false}
                                                tick={{ fill: '#64748b', fontSize: 12 }}
                                            />
                                            <Tooltip
                                                contentStyle={{
                                                    borderRadius: '12px',
                                                    border: 'none',
                                                    boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)'
                                                }}
                                            />
                                            <Legend verticalAlign="top" height={36} align="right" />
                                            <Line
                                                type="monotone"
                                                dataKey="bookings"
                                                stroke="#6366f1"
                                                strokeWidth={3}
                                                name="Bookings"
                                                dot={{ r: 4, fill: '#6366f1', strokeWidth: 2, stroke: '#fff' }}
                                                activeDot={{ r: 6, strokeWidth: 0 }}
                                            />
                                        </LineChart>
                                    </ResponsiveContainer>
                                </Card>
                            </div>
                        </Col>
                        <Col xs={24} lg={8}>
                            <Card
                                title="Top Users"
                                className="premium-card"
                                style={{ borderRadius: '20px', height: '100%' }}
                            >
                                <Table
                                    dataSource={advancedStats.summary.top_users}
                                    columns={userColumns}
                                    pagination={false}
                                    size="small"
                                    rowKey="name"
                                />
                            </Card>
                        </Col>
                    </Row>

                    <Card
                        title="สรุปการใช้งานตามหน่วยรถ (Vehicle Usage Summary)"
                        className="premium-card"
                        style={{ borderRadius: '20px', marginBottom: '32px' }}
                    >
                        <Table
                            dataSource={advancedStats.summary.car_stats}
                            columns={carColumns}
                            pagination={false}
                            rowKey="name"
                        />
                    </Card>

                    <Card
                        title="Detailed Booking History (Selected Range)"
                        className="premium-card"
                        extra={
                            <Button
                                icon={<FileExcelOutlined />}
                                onClick={handleExportCSV}
                                disabled={!advancedStats?.bookings?.length}
                                style={{ borderRadius: '8px' }}
                            >
                                Export CSV
                            </Button>
                        }
                        style={{ borderRadius: '20px' }}
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
