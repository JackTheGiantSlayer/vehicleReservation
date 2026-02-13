from flask import Blueprint, jsonify
from app import db
from app.models import Car, Booking
from sqlalchemy import func

bp = Blueprint('reports', __name__)

@bp.route('/stats', methods=['GET'])
def get_stats():
    # 1. Total Cars
    total_cars = Car.query.count()

    # 2. Total Bookings
    total_bookings = Booking.query.count()

    # 3. Bookings per Car (for Bar Chart)
    # Query: SELECT car.license_plate, car.brand, car.model, COUNT(booking.id) 
    #        FROM cars JOIN bookings ON ... GROUP BY car.id
    cars_stats = db.session.query(
        Car.license_plate, 
        Car.brand, 
        Car.model, 
        func.count(Booking.id).label('booking_count')
    ).outerjoin(Booking, Car.id == Booking.car_id).group_by(Car.id).all()

    car_data = []
    for cs in cars_stats:
        car_data.append({
            'name': f"{cs.brand} {cs.model} ({cs.license_plate})",
            'bookings': cs.booking_count
        })

    # 4. Monthly Usage (for Line Chart)
    # Query: Extract month from start_time and count
    # This might be database specific. For simplicity in SQLite/Postgres:
    # We will fetch all bookings and aggregate in Python for DB compatibility safety 
    # or use EXTRACT(MONTH FROM start_time) if we are sure about Postgres.
    # Given the environment is Docker/Postgres (from previous context), we can use extract.
    
    from sqlalchemy import extract
    
    monthly_stats = db.session.query(
        func.to_char(Booking.start_time, 'YYYY-MM').label('month'),
        func.count(Booking.id)
    ).group_by('month').order_by('month').all()

    monthly_data = []
    for ms in monthly_stats:
        monthly_data.append({
            'month': ms[0],
            'bookings': ms[1]
        })

    return jsonify({
        'total_cars': total_cars,
        'total_bookings': total_bookings,
        'cars_stats': car_data,
        'monthly_stats': monthly_data
    }), 200
