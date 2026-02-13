import api from './api';

const getAllCars = () => {
    return api.get('/cars/');
};

const createCar = (data) => {
    return api.post('/cars/', data);
};

const updateCar = (id, data) => {
    return api.put(`/cars/${id}`, data);
};

const deleteCar = (id) => {
    return api.delete(`/cars/${id}`);
};

const serviceCar = (id) => {
    return api.post(`/cars/${id}/service`);
};

const CarService = {
    getAllCars,
    createCar,
    updateCar,
    deleteCar,
    serviceCar
};

export default CarService;
