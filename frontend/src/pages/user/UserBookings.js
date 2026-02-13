import React, { useState, useEffect } from 'react';
import { Table, Tag, Button, Modal, Form, DatePicker, Select, Input, message } from 'antd';
import { PlusOutlined, CarOutlined } from '@ant-design/icons';
import BookingService from '../../services/booking.service';
import moment from 'moment';

const { RangePicker } = DatePicker;
const { Option } = Select;
const { TextArea } = Input;

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
            // Using ISO strings for API
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
            // Using ISO strings for API, but ensure correct format
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
        { title: 'ID', dataIndex: 'id', key: 'id' },
        { title: 'Car', dataIndex: 'car_model', key: 'car_model' },
        { title: 'License', dataIndex: 'car_license', key: 'car_license' },
        {
            title: 'Start Time',
            dataIndex: 'start_time',
            key: 'start_time',
            render: text => moment(text).format('YYYY-MM-DD HH:mm')
        },
        {
            title: 'End Time',
            dataIndex: 'end_time',
            key: 'end_time',
            render: text => moment(text).format('YYYY-MM-DD HH:mm')
        },
        { title: 'Destination', dataIndex: 'destination', key: 'destination' },
        {
            title: 'Mileage (km)',
            key: 'mileage',
            render: (_, record) => (
                <div style={{ fontSize: '12px' }}>
                    <div>Start: {record.start_mileage ?? '-'}</div>
                    <div>End: {record.end_mileage ?? '-'}</div>
                    {record.end_mileage && record.start_mileage && (
                        <div style={{ fontWeight: 'bold' }}>
                            Dist: {record.end_mileage - record.start_mileage}
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
                let color = 'blue';
                if (status === 'approved') color = 'green';
                if (status === 'rejected') color = 'red';
                if (status === 'cancelled') color = 'grey';
                if (status === 'completed') color = 'purple';
                return <Tag color={color}>{status.toUpperCase()}</Tag>;
            }
        },
        {
            title: 'Action',
            key: 'action',
            render: (_, record) => (
                record.status === 'approved' && (
                    <Button
                        type="primary"
                        size="small"
                        icon={<CarOutlined />}
                        onClick={() => showReturnModal(record)}
                    >
                        Return
                    </Button>
                )
            )
        },
    ];

    return (
        <div>
            <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between' }}>
                <h2>My Bookings</h2>
                <Button type="primary" icon={<PlusOutlined />} onClick={() => setIsModalVisible(true)}>
                    New Booking
                </Button>
            </div>
            <Table
                columns={columns}
                dataSource={bookings}
                rowKey="id"
                loading={loading}
                scroll={{ x: true }}
            />

            <Modal
                title="New Booking Request"
                visible={isModalVisible}
                onOk={handleOk}
                onCancel={() => setIsModalVisible(false)}
                width={600}
            >
                <Form form={form} layout="vertical">
                    <Form.Item name="dates" label="Date & Time" rules={[{ required: true }]}>
                        <RangePicker
                            showTime
                            format="YYYY-MM-DD HH:mm"
                            onChange={onDateChange}
                            style={{ width: '100%' }}
                        />
                    </Form.Item>

                    <Form.Item
                        name="car_id"
                        label="Select Car"
                        rules={[{ required: true }]}
                        help={availableCars.length > 0 ? `${availableCars.length} cars available` : "Select dates to see available cars"}
                    >
                        <Select placeholder="Select a car" disabled={availableCars.length === 0}>
                            {availableCars.map(car => (
                                <Option key={car.id} value={car.id}>
                                    {car.brand} {car.model} ({car.license_plate}) - {car.color}
                                </Option>
                            ))}
                        </Select>
                    </Form.Item>

                    <Form.Item name="objective" label="Objective" rules={[{ required: true }]}>
                        <TextArea rows={2} />
                    </Form.Item>

                    <Form.Item name="destination" label="Destination" rules={[{ required: true }]}>
                        <Input />
                    </Form.Item>
                </Form>
            </Modal>

            <Modal
                title="Return Car"
                visible={isReturnModalVisible}
                onOk={handleReturnCar}
                onCancel={() => setIsReturnModalVisible(false)}
            >
                <p>Please enter the current mileage to complete the booking.</p>
                <Form form={returnForm} layout="vertical">
                    <Form.Item
                        name="end_mileage"
                        label="End Mileage"
                        rules={[
                            { required: true, message: 'Please enter mileage' },
                            { pattern: /^\d+$/, message: 'Must be a number' }
                        ]}
                    >
                        <Input type="number" suffix="km" />
                    </Form.Item>
                </Form>
            </Modal>
        </div>
    );
};

export default UserBookings;
