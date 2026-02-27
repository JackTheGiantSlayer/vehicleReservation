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

    if not bookings:
        return jsonify({
            'summary': {
                'top_users': [],
                'car_stats': [],
                'total_mileage': 0,
                'total_bookings': 0
            },
            'daily_stats': [],
            'bookings': []
        }), 200

    # Dictionaries for aggregation
    user_counts = {}
    car_stats_dict = {}
    daily_stats_dict = {}
    total_mileage_sum = 0
    detailed_bookings = []

    # Map users and cars for quick lookup (if list is small)
    # For large datasets, this should be optimized, but for reports it's usually okay.
    from app.models import User, Car
    users_dict = {u.id: u.full_name for u in User.query.all()}
    cars_obj_dict = {c.id: f"{c.brand} {c.model} ({c.license_plate})" for c in Car.query.all()}

    for b in bookings:
        # User count
        u_name = users_dict.get(b.user_id, 'N/A')
        user_counts[u_name] = user_counts.get(u_name, 0) + 1

        # Car stats
        c_name = cars_obj_dict.get(b.car_id, 'N/A')
        if c_name not in car_stats_dict:
            car_stats_dict[c_name] = {'name': c_name, 'count': 0, 'mileage': 0}
        
        car_stats_dict[c_name]['count'] += 1
        
        mileage = 0
        if b.status == 'completed' and b.end_mileage is not None and b.start_mileage is not None:
            mileage = b.end_mileage - b.start_mileage
            car_stats_dict[c_name]['mileage'] += mileage
            total_mileage_sum += mileage

        # Daily stats
        d_str = b.start_time.strftime('%Y-%m-%d')
        daily_stats_dict[d_str] = daily_stats_dict.get(d_str, 0) + 1

        # Detailed record
        detailed_bookings.append({
            'id': b.id,
            'user': u_name,
            'car': c_name,
            'start_time': b.start_time.strftime('%Y-%m-%d %H:%M'),
            'end_time': b.end_time.strftime('%Y-%m-%d %H:%M'),
            'status': b.status,
            'mileage': mileage
        })

    # Format summaries
    sorted_users = sorted([{'name': k, 'count': v} for k, v in user_counts.items()], key=lambda x: x['count'], reverse=True)[:10]
    sorted_cars = sorted(list(car_stats_dict.values()), key=lambda x: x['count'], reverse=True)
    sorted_daily = sorted([{'date': k, 'bookings': v} for k, v in daily_stats_dict.items()], key=lambda x: x['date'])

    return jsonify({
        'summary': {
            'top_users': sorted_users,
            'car_stats': sorted_cars,
            'total_mileage': int(total_mileage_sum),
            'total_bookings': len(bookings)
        },
        'daily_stats': sorted_daily,
        'bookings': detailed_bookings
    }), 200
