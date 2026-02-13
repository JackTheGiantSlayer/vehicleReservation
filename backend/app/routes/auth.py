from flask import Blueprint, request, jsonify, current_app
from app import db
from app.models import User
import jwt
import datetime
import random
import string

bp = Blueprint('auth', __name__)

@bp.route('/register', methods=['POST'])
def register():
    data = request.get_json()
    
    if not data or not data.get('email') or not data.get('password'):
        return jsonify({'message': 'Missing email or password'}), 400
        
    if User.query.filter_by(email=data['email']).first():
        return jsonify({'message': 'User already exists'}), 400
        
    new_user = User(
        email=data['email'],
        full_name=data.get('full_name', ''),
        phone_number=data.get('phone_number', ''),
        role='user' # Default role
    )
    new_user.set_password(data['password'])
    
    db.session.add(new_user)
    db.session.commit()
    
    return jsonify({'message': 'User registered successfully'}), 201

@bp.route('/login', methods=['POST'])
def login():
    data = request.get_json()
    
    if not data or not data.get('email') or not data.get('password'):
        return jsonify({'message': 'Missing email or password'}), 400
        
    user = User.query.filter_by(email=data['email']).first()
    
    if not user or not user.check_password(data['password']):
        return jsonify({'message': 'Invalid credentials'}), 401
        
    token = jwt.encode({
        'user_id': user.id,
        'role': user.role,
        'exp': datetime.datetime.utcnow() + datetime.timedelta(hours=24)
    }, current_app.config['SECRET_KEY'], algorithm="HS256")
    
    return jsonify({
        'token': token,
        'user': user.to_dict()
    }), 200

@bp.route('/me', methods=['GET'])
def get_current_user():
    # We will need to import token_required here to avoid circular imports if possible, 
    # or reorganize. ideally decorators should be imported at top.
    # Let's do a local import or standard import if decorators.py doesn't import routes.
    from app.utils.decorators import token_required
    
    @token_required
    def _get_me(current_user):
        return jsonify(current_user.to_dict())
        
    return _get_me()

@bp.route('/forgot-password', methods=['POST'])
def forgot_password():
    data = request.get_json()
    email = data.get('email')
    phone_number = data.get('phone_number')

    if not email or not phone_number:
        return jsonify({'message': 'Email and phone number are required'}), 400

    user = User.query.filter_by(email=email, phone_number=phone_number).first()
    if not user:
        return jsonify({'message': 'Invalid email or phone number'}), 404

    # Generate random temporary password
    temp_password = ''.join(random.choices(string.ascii_letters + string.digits, k=8))
    user.set_password(temp_password)
    db.session.commit()

    # Send email
    from app.services.email_service import EmailService
    EmailService.send_temp_password(user.email, temp_password)

    return jsonify({'message': 'Temporary password sent to your email'}), 200
