from app import db
from app.models import Notification, Setting, Car
from app.services.email_service import EmailService

class NotificationService:
    @staticmethod
    def create_notification(title, message, type='info', user_id=None):
        new_notif = Notification(
            title=title,
            message=message,
            type=type,
            user_id=user_id
        )
        db.session.add(new_notif)
        db.session.commit()
        return new_notif

    @staticmethod
    def notify_admin(title, message, type='info', send_email=True):
        # Create in-app notification for admins (user_id=None)
        notif = NotificationService.create_notification(title, message, type)
        
        if send_email:
            admin_email = Setting.query.filter_by(key='admin_email').first()
            if admin_email and admin_email.value:
                EmailService.send_email(admin_email.value, title, message)
        
        return notif

    @staticmethod
    def check_maintenance(car):
        """
        Check if car needs maintenance based on 10,000 km interval.
        Triggers if it crosses a 10,000 km mark since last maintenance.
        """
        interval = 10000
        current = car.current_mileage
        last = car.last_maintenance_mileage
        
        # Check if the car has crossed a 10,000 km threshold
        # e.g., if it was 9,500 and now 10,050 -> alert
        # or if it's been more than 10,000 km since last recorded maintenance
        if (current // interval) > (last // interval) or (current - last >= interval):
            title = f"Maintenance Due: {car.brand} {car.model} ({car.license_plate})"
            message = f"""
            <h3>Vehicle Maintenance Alert</h3>
            <p>The vehicle <strong>{car.brand} {car.model}</strong> with license plate <strong>{car.license_plate}</strong> 
            has reached <strong>{current:,} km</strong>.</p>
            <p>Last maintenance was recorded at {last:,} km. It is now due for its {interval:,} km service.</p>
            <p>Please update the car's maintenance status once the service is complete.</p>
            """
            NotificationService.notify_admin(title, message, type='maintenance')
            return True
        return False
