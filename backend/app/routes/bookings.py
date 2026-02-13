from flask import Blueprint, request, jsonify
from app import db
from app.models import Booking, Car, User
from app.utils.decorators import token_required, admin_required
from datetime import datetime

bp = Blueprint('bookings', __name__)

@bp.route('/', methods=['POST'])
@token_required
def create_booking(current_user):
    data = request.get_json()
    
    # Validation
    required_fields = ['car_id', 'start_time', 'end_time']
    for field in required_fields:
        if field not in data:
            return jsonify({'message': f'Missing field: {field}'}), 400
            
    try:
        start_time = datetime.fromisoformat(data['start_time'].replace('Z', '+00:00'))
        end_time = datetime.fromisoformat(data['end_time'].replace('Z', '+00:00'))
    except ValueError:
        return jsonify({'message': 'Invalid date format'}), 400
        
    car = Car.query.get(data['car_id'])
    if not car:
        return jsonify({'message': 'Car not found'}), 404
        
    if car.status != 'available':
        # Check if the car is actually available for these dates using strict overlap?
        # For simplicity in this version, if status is 'maintenance' or 'reserved' globally, we might block.
        # But a robust system checks overlapping bookings.
        # Let's keep it simple: If car.status is 'maintenance', block.
        # If 'reserved', check dates.
        if car.status == 'maintenance':
             return jsonify({'message': 'Car is under maintenance'}), 400
    
    # Check for overlapping approved bookings
    overlapping_booking = Booking.query.filter(
        Booking.car_id == car.id,
        Booking.status == 'approved',
        Booking.start_time < end_time,
        Booking.end_time > start_time
    ).first()
    
    if overlapping_booking:
        return jsonify({
            'message': f'Car is already booked from {overlapping_booking.start_time.strftime("%Y-%m-%d %H:%M")} to {overlapping_booking.end_time.strftime("%Y-%m-%d %H:%M")}'
        }), 400

    new_booking = Booking(
        user_id=current_user.id,
        car_id=car.id,
        start_time=start_time,
        end_time=end_time,
        objective=data.get('objective'),
        destination=data.get('destination'),
        status='pending'
    )
    
    db.session.add(new_booking)
    db.session.commit()
    
    # Notify admin
    from app.services.email_service import EmailService
    EmailService.notify_new_booking(new_booking, current_user, car)
    
    return jsonify({'message': 'Booking created successfully', 'id': new_booking.id}), 201

@bp.route('/', methods=['GET'])
@token_required
def get_bookings(current_user):
    show_all = request.args.get('all') == 'true'

    if current_user.role == 'admin' or show_all:
        bookings = Booking.query.order_by(Booking.created_at.desc()).all()
    else:
        bookings = Booking.query.filter_by(user_id=current_user.id).order_by(Booking.created_at.desc()).all()
        
    output = []
    for b in bookings:
        car = Car.query.get(b.car_id)
        user = User.query.get(b.user_id)
        
        output.append({
            'id': b.id,
            'user_id': b.user_id,
            'user_name': user.full_name if user else 'Unknown',
            'user_phone': user.phone_number if user else 'Unknown',
            'car_id': b.car_id,
            'car_license': car.license_plate if car else 'Unknown',
            'car_model': f"{car.brand} {car.model}" if car else 'Unknown',
            'start_time': b.start_time.isoformat(),
            'end_time': b.end_time.isoformat(),
            'objective': b.objective,
            'destination': b.destination,
            'status': b.status,
            'start_mileage': b.start_mileage,
            'end_mileage': b.end_mileage,
            'created_at': b.created_at.isoformat()
        })
        
    return jsonify({'bookings': output}), 200

@bp.route('/<int:id>/status', methods=['PUT'])
@token_required
@admin_required
def update_booking_status(current_user, id):
    booking = Booking.query.get_or_404(id)
    data = request.get_json()
    
    if 'status' not in data:
        return jsonify({'message': 'Status is required'}), 400
        
    new_status = data['status']
    allowed_statuses = ['pending', 'approved', 'rejected', 'completed', 'cancelled']
    
    if new_status not in allowed_statuses:
         return jsonify({'message': 'Invalid status'}), 400
         
    booking.status = new_status
    
    # If approved, maybe update car status to 'reserved'? 
    # Or just rely on the overlap check?
    # Let's keep car status as 'available' but rely on bookings table for availability.
    
    db.session.commit()
    return jsonify({'message': f'Booking {new_status}'}), 200

@bp.route('/available-cars', methods=['GET'])
@token_required
def get_available_cars(current_user):
    start_str = request.args.get('start_time')
    end_str = request.args.get('end_time')
    
    if not start_str or not end_str:
        return jsonify({'message': 'Start and End time required'}), 400
        
    try:
        start_time = datetime.fromisoformat(start_str.replace('Z', '+00:00'))
        end_time = datetime.fromisoformat(end_str.replace('Z', '+00:00'))
    except ValueError:
        return jsonify({'message': 'Invalid date format'}), 400
        
    # Find cars that have NO approved bookings overlapping with the requested time
    # Subquery for booked car IDs in that time range
    booked_car_ids = db.session.query(Booking.car_id).filter(
        Booking.status == 'approved',
        Booking.start_time < end_time,
        Booking.end_time > start_time
    ).subquery()
    
    available_cars = Car.query.filter(
        Car.status == 'available',
        ~Car.id.in_(booked_car_ids)
    ).all()
    
    output = []
    for car in available_cars:
         output.append({
            'id': car.id,
            'license_plate': car.license_plate,
            'brand': car.brand,
            'model': car.model,
            'color': car.color
        })
        
    return jsonify({'cars': output}), 200

@bp.route('/<int:id>/return', methods=['PUT'])
@token_required
def return_car(current_user, id):
    booking = Booking.query.get_or_404(id)
    
    # Verify user owns the booking or is admin
    if booking.user_id != current_user.id and current_user.role != 'admin':
        return jsonify({'message': 'Unauthorized'}), 403
        
    if booking.status != 'approved':
        return jsonify({'message': 'Booking must be approved to return car'}), 400
        
    data = request.get_json()
    if 'end_mileage' not in data:
        return jsonify({'message': 'End mileage is required'}), 400
        
    try:
        end_mileage = int(data['end_mileage'])
    except ValueError:
        return jsonify({'message': 'Invalid mileage format'}), 400
        
    car = Car.query.get(booking.car_id)
    
    # Validation: Check if there is any chronologically prior 'approved' booking for this car
    # which would mean the sequence is broken.
    prior_approved = Booking.query.filter(
        Booking.car_id == car.id,
        Booking.status == 'approved',
        Booking.start_time < booking.start_time,
        Booking.id != booking.id
    ).first()
    
    if prior_approved:
        return jsonify({
            'message': f'Cannot return car. There is an earlier booking (ID: {prior_approved.id}) that has not been returned yet.'
        }), 400

    # Auto-set start_mileage from the most recent 'completed' booking
    last_completed = Booking.query.filter(
        Booking.car_id == car.id,
        Booking.status == 'completed',
        Booking.start_time < booking.start_time
    ).order_by(Booking.start_time.desc()).first()
    
    if last_completed:
        start_mileage = last_completed.end_mileage
    else:
        # Fallback to the current car mileage or a base mileage if first ever
        start_mileage = car.current_mileage

    if end_mileage < start_mileage:
        return jsonify({'message': f'End mileage cannot be less than start mileage ({start_mileage})'}), 400
        
    booking.start_mileage = start_mileage
    booking.end_mileage = end_mileage
    booking.status = 'completed'
    car.current_mileage = end_mileage
    
    db.session.commit()

    # Check for maintenance
    from app.services.notification_service import NotificationService
    NotificationService.check_maintenance(car)
    
    return jsonify({'message': 'Car returned successfully'}), 200
