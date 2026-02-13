from flask_apscheduler import APScheduler
from app import db
from app.models import Booking, Notification, Car, User
from app.services.email_service import EmailService
from datetime import datetime
import logging

scheduler = APScheduler()

def check_daily_tasks():
    """
    Combined daily task running at 7:00 AM.
    """
    with scheduler.app.app_context():
        logging.info("Running daily vehicle status checks...")
        
        # 1. Check Overdue Bookings
        check_overdue_bookings_internal()
        
        # 2. Check Maintenance for all cars
        check_maintenance_internal()

def check_overdue_bookings_internal():
    now = datetime.utcnow()
    overdue_bookings = Booking.query.filter(
        Booking.end_time < now,
        Booking.status.in_(['approved', 'picked_up'])
    ).all()

    if overdue_bookings:
        for booking in overdue_bookings:
            user = User.query.get(booking.user_id)
            car = Car.query.get(booking.car_id)
            
            notification = Notification(
                title=f"Overdue Return: {car.license_plate}",
                message=f"Vehicle {car.brand} {car.model} ({car.license_plate}) overdue since {booking.end_time.strftime('%Y-%m-%d %H:%M')}.",
                type='warning'
            )
            db.session.add(notification)
        
        db.session.commit()
        EmailService.notify_overdue_bookings(overdue_bookings)
    logging.info(f"Checked overdue bookings: found {len(overdue_bookings)}")

def check_maintenance_internal():
    from app.services.notification_service import NotificationService
    cars = Car.query.all()
    count = 0
    for car in cars:
        if NotificationService.check_maintenance(car):
            count += 1
    logging.info(f"Checked maintenance: {count} cars due")

def init_scheduler(app):
    if not scheduler.running:
        scheduler.init_app(app)
        scheduler.add_job(
            id='daily_system_check',
            func=check_daily_tasks,
            trigger='cron',
            hour=7,
            minute=0
        )
        scheduler.start()
        logging.info("Scheduler initialized.")
