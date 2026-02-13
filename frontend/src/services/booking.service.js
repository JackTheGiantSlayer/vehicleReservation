import api from './api';

const createBooking = (data) => {
    return api.post('/bookings/', data);
};

const getBookings = (params) => {
    return api.get('/bookings/', { params });
};

const updateBookingStatus = (id, status) => {
    return api.put(`/bookings/${id}/status`, { status });
};

const getAvailableCars = (startTime, endTime) => {
    return api.get(`/bookings/available-cars?start_time=${startTime}&end_time=${endTime}`);
};

const returnCar = (id, endMileage) => {
    return api.put(`/bookings/${id}/return`, { end_mileage: endMileage });
};

const BookingService = {
    createBooking,
    getBookings,
    updateBookingStatus,
    getAvailableCars,
    returnCar
};

export default BookingService;
