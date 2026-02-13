from app import create_app, db
from app.models import User, Setting

def seed_data():
    app = create_app()
    with app.app_context():
        # 1. Create Admin User
        admin_email = "admin@example.com"
        if not User.query.filter_by(email=admin_email).first():
            admin = User(
                email=admin_email,
                full_name="System Administrator",
                role="admin"
            )
            admin.set_password("admin1234")
            db.session.add(admin)
            print(f"Admin user created: {admin_email} / admin1234")
        else:
            print(f"Admin user {admin_email} already exists.")
        
        # 2. Initial Settings
        default_settings = [
            {'key': 'admin_email', 'value': admin_email, 'description': 'Main admin email for notifications'},
            {'key': 'email_notifications_enabled', 'value': 'false', 'description': 'Enable/Disable email alerts'},
            {'key': 'smtp_host', 'value': 'smtp.gmail.com', 'description': 'SMTP Server Host'},
            {'key': 'smtp_port', 'value': '587', 'description': 'SMTP Server Port'},
            {'key': 'smtp_user', 'value': '', 'description': 'SMTP Username'},
            {'key': 'smtp_pass', 'value': '', 'description': 'SMTP Password'},
        ]
        
        for s in default_settings:
            if not Setting.query.filter_by(key=s['key']).first():
                new_setting = Setting(key=s['key'], value=s['value'], description=s['description'])
                db.session.add(new_setting)
                print(f"Setting created: {s['key']} = {s['value']}")
        
        db.session.commit()
        print("Seeding complete.")

if __name__ == '__main__':
    seed_data()
