from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate
from flask_cors import CORS
from .config import Config

db = SQLAlchemy()
migrate = Migrate()

def create_app(config_class=Config):
    app = Flask(__name__)
    app.config.from_object(config_class)

    db.init_app(app)
    migrate.init_app(app, db)
    CORS(app)

    from app.routes import auth, cars, bookings, reports, users, settings, notifications
    app.register_blueprint(auth.bp, url_prefix='/api/auth')
    app.register_blueprint(cars.bp, url_prefix='/api/cars')
    app.register_blueprint(bookings.bp, url_prefix='/api/bookings')
    app.register_blueprint(users.bp, url_prefix='/api/users')
    app.register_blueprint(reports.bp, url_prefix='/api/reports')
    app.register_blueprint(settings.bp, url_prefix='/api/settings')
    app.register_blueprint(notifications.bp, url_prefix='/api/notifications')

    from app.services.scheduler import init_scheduler
    init_scheduler(app)

    @app.route('/')
    def index():
        return "Car Booking API is running!"

    return app
