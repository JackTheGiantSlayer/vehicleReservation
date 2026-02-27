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

@bp.route('/advanced-stats', methods=['GET'])
def get_advanced_stats():
    from flask import request
    from app.models import User, Car
    from datetime import datetime

    start_date_str = request.args.get('start_date')
    end_date_str = request.args.get('end_date')

    query = Booking.query

    if start_date_str:
        start_date = datetime.fromisoformat(start_date_str)
        query = query.filter(Booking.start_time >= start_date)
    if end_date_str:
        end_date = datetime.fromisoformat(end_date_str)
        # End of day for the end_date
        query = query.filter(Booking.start_time <= end_date)

    bookings = query.all()

    # 1. Top User
    user_counts = db.session.query(
        User.full_name,
        func.count(Booking.id).label('count')
    ).join(Booking, User.id == Booking.user_id) \
     .filter(Booking.id.in_([b.id for b in bookings])) \
     .group_by(User.id).order_by(func.count(Booking.id).desc()).first()

    # 2. Top Car
    car_counts = db.session.query(
        Car.license_plate,
        Car.brand,
        Car.model,
        func.count(Booking.id).label('count')
    ).join(Booking, Car.id == Booking.car_id) \
     .filter(Booking.id.in_([b.id for b in bookings])) \
     .group_by(Car.id).order_by(func.count(Booking.id).desc()).first()

    # 3. Total Mileage (Only for completed bookings)
    total_mileage = db.session.query(
        func.sum(Booking.end_mileage - Booking.start_mileage)
    ).filter(Booking.id.in_([b.id for b in bookings]), Booking.status == 'completed').scalar() or 0

    # 4. Daily Stats for Chart
    daily_stats = db.session.query(
        func.to_char(Booking.start_time, 'YYYY-MM-DD').label('date'),
        func.count(Booking.id)
    ).filter(Booking.id.in_([b.id for b in bookings])) \
     .group_by('date').order_by('date').all()

    daily_data = [{'date': d[0], 'bookings': d[1]} for d in daily_stats]

    # 5. Full list for table/PDF
    detailed_bookings = []
    for b in bookings:
        u = User.query.get(b.user_id)
        c = Car.query.get(b.car_id)
        detailed_bookings.append({
            'id': b.id,
            'user': u.full_name if u else 'N/A',
            'car': f"{c.brand} {c.model} ({c.license_plate})" if c else 'N/A',
            'start_time': b.start_time.strftime('%Y-%m-%d %H:%M'),
            'end_time': b.end_time.strftime('%Y-%m-%d %H:%M'),
            'status': b.status,
            'mileage': (b.end_mileage - b.start_mileage) if b.status == 'completed' and b.end_mileage else 0
        })

    return jsonify({
        'summary': {
            'top_user': {'name': user_counts.full_name, 'count': user_counts.count} if user_counts else None,
            'top_car': {'name': f"{car_counts.brand} {car_counts.model} ({car_counts.license_plate})", 'count': car_counts.count} if car_counts else None,
            'total_mileage': int(total_mileage),
            'total_bookings': len(bookings)
        },
        'daily_stats': daily_data,
        'bookings': detailed_bookings
    }), 200
