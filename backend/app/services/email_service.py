import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from app.models import Setting
from flask import current_app
import threading

class EmailService:
    @staticmethod
    def get_setting(key, default=None):
        setting = Setting.query.filter_by(key=key).first()
        return setting.value if setting else default

    @staticmethod
    def send_email_sync(app, recipient, subject, body, cc=None):
        with app.app_context():
            smtp_host = EmailService.get_setting('smtp_host')
            smtp_port = EmailService.get_setting('smtp_port')
            smtp_user = EmailService.get_setting('smtp_user')
            smtp_pass = EmailService.get_setting('smtp_pass')
            smtp_enable = EmailService.get_setting('email_notifications_enabled') == 'true'

        if not smtp_enable or not all([smtp_host, smtp_port, smtp_user, smtp_pass]):
            print("Email notifications disabled or SMTP not configured.")
            return

        try:
            msg = MIMEMultipart()
            msg['From'] = smtp_user
            msg['To'] = recipient
            if cc:
                msg['Cc'] = cc
            msg['Subject'] = subject
            msg.attach(MIMEText(body, 'html'))

            destinations = [recipient]
            if cc:
                destinations.append(cc)

            server = smtplib.SMTP(smtp_host, int(smtp_port))
            server.starttls()
            server.login(smtp_user, smtp_pass)
            server.send_message(msg)
            server.quit()
            print(f"Email sent to {recipient} (CC: {cc})")
        except Exception as e:
            print(f"Error sending email: {e}")

    @staticmethod
    def send_email(recipient, subject, body, cc=None):
        # Sending email in a separate thread to avoid blocking the API response
        # Need to pass the current_app object to the thread to access app context
        app = current_app._get_current_object()
        thread = threading.Thread(target=EmailService.send_email_sync, args=(app, recipient, subject, body, cc))
        thread.start()

    @staticmethod
    def notify_new_booking(booking, user, car):
        recipient = EmailService.get_setting('admin_email')
        if not recipient:
            return

        subject = f"New Vehicle Reservation: {car.brand} {car.model}"
        body = f"""
        <h3>New Booking Alert</h3>
        <p>A new vehicle reservation has been created.</p>
        <ul>
            <li><strong>User:</strong> {user.full_name}</li>
            <li><strong>Car:</strong> {car.brand} {car.model} ({car.license_plate})</li>
            <li><strong>Start:</strong> {booking.start_time.strftime('%Y-%m-%d %H:%M')}</li>
            <li><strong>End:</strong> {booking.end_time.strftime('%Y-%m-%d %H:%M')}</li>
            <li><strong>Objective:</strong> {booking.objective}</li>
            <li><strong>Destination:</strong> {booking.destination}</li>
        </ul>
        <p>Please check the admin panel for details.</p>
        """
        EmailService.send_email(recipient, subject, body)

    @staticmethod
    def notify_overdue_bookings(bookings):
        recipient = EmailService.get_setting('admin_email')
        if not recipient or not bookings:
            return

        subject = f"Daily Check: {len(bookings)} Overdue Vehicle Returns"
        
        bookings_html = ""
        for b in bookings:
            from app.models import User, Car
            u = User.query.get(b.user_id)
            c = Car.query.get(b.car_id)
            bookings_html += f"""
            <tr>
                <td style='padding:8px; border:1px solid #ddd;'>{c.license_plate}</td>
                <td style='padding:8px; border:1px solid #ddd;'>{c.brand} {c.model}</td>
                <td style='padding:8px; border:1px solid #ddd;'>{u.full_name}</td>
                <td style='padding:8px; border:1px solid #ddd;'>{b.end_time.strftime('%Y-%m-%d %H:%M')}</td>
            </tr>
            """

        body = f"""
        <h3>Daily Overdue Returns Report</h3>
        <p>The following vehicles have not been marked as returned by their scheduled end time:</p>
        <table style='width:100%; border-collapse:collapse;'>
            <thead>
                <tr style='background-color:#f2f2f2;'>
                    <th style='padding:8px; border:1px solid #ddd; text-align:left;'>License Plate</th>
                    <th style='padding:8px; border:1px solid #ddd; text-align:left;'>Vehicle</th>
                    <th style='padding:8px; border:1px solid #ddd; text-align:left;'>User</th>
                    <th style='padding:8px; border:1px solid #ddd; text-align:left;'>Due Date</th>
                </tr>
            </thead>
            <tbody>
                {bookings_html}
            </tbody>
        </table>
        <p>Please follow up with the users to confirm vehicle status.</p>
        """
        EmailService.send_email(recipient, subject, body)

    @staticmethod
    def send_temp_password(recipient, temp_password):
        subject = "Your Temporary Password - Car Booking System"
        body = f"""
        <h3>Password Reset Request</h3>
        <p>You have requested a new password for your Car Booking System account.</p>
        <p>Your temporary password is: <strong>{temp_password}</strong></p>
        <p>Please log in and change your password immediately in the profile section.</p>
        <br/>
        <p>If you did not request this, please contact the administrator.</p>
        """
        EmailService.send_email(recipient, subject, body)

    @staticmethod
    def notify_booking_status(booking, user, car):
        cc_email = EmailService.get_setting('admin_email')
        
        status_titles = {
            'approved': 'Approved',
            'rejected': 'Rejected',
            'cancelled': 'Cancelled',
            'completed': 'Completed'
        }
        
        status_title = status_titles.get(booking.status, booking.status.capitalize())
        
        subject = f"Booking {status_title}: {car.brand} {car.model}"
        
        status_messages = {
            'approved': "Your vehicle reservation has been <strong>approved</strong>.",
            'rejected': "Your vehicle reservation has been <strong>rejected</strong>.",
            'cancelled': "Your vehicle reservation has been <strong>cancelled</strong>.",
            'completed': "Your vehicle reservation has been marked as <strong>completed</strong>. Thank you!"
        }
        
        status_message = status_messages.get(booking.status, f"Your booking status has been updated to: {booking.status}")

        body = f"""
        <h3>Booking Status Update</h3>
        <p>Hello {user.full_name},</p>
        <p>{status_message}</p>
        <ul>
            <li><strong>Booking ID:</strong> {booking.id}</li>
            <li><strong>Vehicle:</strong> {car.brand} {car.model} ({car.license_plate})</li>
            <li><strong>Period:</strong> {booking.start_time.strftime('%Y-%m-%d %H:%M')} - {booking.end_time.strftime('%Y-%m-%d %H:%M')}</li>
            <li><strong>Status:</strong> {status_title}</li>
        </ul>
        <p>Please log in to the system for more details.</p>
        """
        EmailService.send_email(user.email, subject, body, cc=cc_email)

    @staticmethod
    def send_test_email(recipient, custom_settings=None):
        """
        Special version to test email with specific settings (maybe not saved yet)
        """
        def get_val(key):
            if custom_settings and key in custom_settings:
                return custom_settings[key]
            setting = Setting.query.filter_by(key=key).first()
            return setting.value if setting else None

        smtp_host = get_val('smtp_host')
        smtp_port = get_val('smtp_port')
        smtp_user = get_val('smtp_user')
        smtp_pass = get_val('smtp_pass')

        if not all([smtp_host, smtp_port, smtp_user, smtp_pass]):
            return False, "SMTP settings are incomplete"

        try:
            msg = MIMEMultipart()
            # If smtp_user looks like an email, use it. Otherwise use it as just name.
            msg['From'] = smtp_user
            msg['To'] = recipient
            msg['Subject'] = "SMTP Connection Test - Car Booking System"
            
            body = f"""
            <h3>SMTP Test Successful!</h3>
            <p>Your Car Booking System is now correctly configured to send emails.</p>
            <p><strong>Config Details:</strong></p>
            <ul>
                <li>Host: {smtp_host}</li>
                <li>User: {smtp_user}</li>
            </ul>
            """
            msg.attach(MIMEText(body, 'html'))

            server = smtplib.SMTP(smtp_host, int(smtp_port))
            server.starttls()
            server.login(smtp_user, smtp_pass)
            server.send_message(msg)
            server.quit()
            return True, None
        except Exception as e:
            return False, str(e)
