from flask import Blueprint, request, jsonify
from app import db
from app.models import Car
from app.utils.decorators import token_required, admin_required

bp = Blueprint('cars', __name__)

@bp.route('/', methods=['GET'])
@token_required
def get_cars(current_user):
    # Admins see all cars, Users see available cars? 
    # Requirement: "User can see available cars, if not available cannot select"
    # So we probably want to return all cars but mark their status, or filter by query.
    # For now, let's return all.
    
    cars = Car.query.order_by(Car.id).all()
    
    output = []
    for car in cars:
        car_data = {
            'id': car.id,
            'license_plate': car.license_plate,
            'brand': car.brand,
            'model': car.model,
            'color': car.color,
            'current_mileage': car.current_mileage,
            'status': car.status,
            'last_maintenance_mileage': car.last_maintenance_mileage
        }
        output.append(car_data)
    
    return jsonify({'cars': output}), 200

@bp.route('/', methods=['POST'])
@token_required
@admin_required
def add_car(current_user):
    data = request.get_json()
    
    if not data or not data.get('license_plate'):
        return jsonify({'message': 'License plate is required'}), 400
        
    if Car.query.filter_by(license_plate=data['license_plate']).first():
        return jsonify({'message': 'Car with this license plate already exists'}), 400
        
    new_car = Car(
        license_plate=data['license_plate'],
        brand=data.get('brand'),
        model=data.get('model'),
        color=data.get('color'),
        current_mileage=data.get('current_mileage', 0),
        status=data.get('status', 'available'),
        last_maintenance_mileage=data.get('last_maintenance_mileage', 0)
    )
    
    db.session.add(new_car)
    db.session.commit()
    
    return jsonify({'message': 'Car added successfully'}), 201

@bp.route('/<int:id>', methods=['PUT'])
@token_required
@admin_required
def update_car(current_user, id):
    car = Car.query.get_or_404(id)
    data = request.get_json()
    
    if 'license_plate' in data and data['license_plate'] != car.license_plate:
         if Car.query.filter_by(license_plate=data['license_plate']).first():
            return jsonify({'message': 'License plate already exists'}), 400
         car.license_plate = data['license_plate']
    
    if 'brand' in data: car.brand = data['brand']
    if 'model' in data: car.model = data['model']
    if 'color' in data: car.color = data['color']
    if 'current_mileage' in data: car.current_mileage = data['current_mileage']
    if 'status' in data: car.status = data['status']
    if 'last_maintenance_mileage' in data: car.last_maintenance_mileage = data['last_maintenance_mileage']
    
    db.session.commit()
    
    return jsonify({'message': 'Car updated successfully'}), 200

@bp.route('/<int:id>/service', methods=['POST'])
@token_required
@admin_required
def service_car(current_user, id):
    car = Car.query.get_or_404(id)
    car.last_maintenance_mileage = car.current_mileage
    car.status = 'available' # Reset status to available after service
    
    db.session.commit()
    return jsonify({'message': 'Car marked as serviced', 'new_maintenance_mileage': car.last_maintenance_mileage}), 200

@bp.route('/<int:id>', methods=['DELETE'])
@token_required
@admin_required
def delete_car(current_user, id):
    car = Car.query.get_or_404(id)
    db.session.delete(car)
    db.session.commit()
    
    return jsonify({'message': 'Car deleted successfully'}), 200
