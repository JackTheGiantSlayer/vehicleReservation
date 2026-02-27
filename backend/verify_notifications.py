import sys
import os
from datetime import datetime, timedelta

# Add current directory to path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app import create_app, db
from app.models import Booking, Car, User, Notification, Setting
from app.services.scheduler import check_overdue_bookings_internal

def verify():
    app = create_app()
    with app.app_context():
        print("--- Starting Notification Verification ---")
        
        # 1. Ensure a user exists
        user = User.query.filter_by(role='admin').first()
        if not user:
            user = User(email="admin_test@example.com", full_name="Test Admin", role="admin")
            user.set_password("test1234")
            db.session.add(user)
            db.session.commit()
            print(f"Created test user: {user.email}")
        
        # 2. Ensure a car exists
        car = Car.query.filter_by(license_plate="TEST-999").first()
        if not car:
            car = Car(license_plate="TEST-999", brand="Toyota", model="Camry", status="available")
            db.session.add(car)
            db.session.commit()
            print(f"Created test car: {car.license_plate}")

        # 3. Create an overdue booking
        # End time 1 hour ago
        end_time = datetime.now() - timedelta(hours=1)
        start_time = end_time - timedelta(days=1)
        
        booking = Booking(
            user_id=user.id,
            car_id=car.id,
            start_time=start_time,
            end_time=end_time,
            status='approved',
            objective="Test notification",
            destination="Test Location"
        )
        db.session.add(booking)
        db.session.commit()
        print(f"Created overdue booking (ID: {booking.id}) ending at {end_time}")

        # 4. Check email settings (ensure we don't fail due to disabled emails, but also see if it would try)
        enabled_setting = Setting.query.filter_by(key='email_notifications_enabled').first()
        if not enabled_setting or enabled_setting.value != 'true':
            print("NOTE: Email notifications are disabled in settings. Only internal notifications will be created.")
        
        # 5. Run the check
        print("Running check_overdue_bookings_internal...")
        count_before = Notification.query.count()
        check_overdue_bookings_internal()
        count_after = Notification.query.count()
        
        # 6. Verify result
        if count_after > count_before:
            new_notif = Notification.query.order_by(Notification.created_at.desc()).first()
            print(f"SUCCESS: New notification created: {new_notif.title} - {new_notif.message}")
        else:
            print("FAILURE: No new notification created.")

        # Cleanup test data? (Optional, maybe keep for manual inspection)
        # db.session.delete(booking)
        # db.session.commit()

if __name__ == '__main__':
    verify()
