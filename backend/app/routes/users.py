from flask import Blueprint, request, jsonify
from app import db
from app.models import User
from app.utils.decorators import token_required, admin_required

bp = Blueprint('users', __name__)

@bp.route('/', methods=['GET'])
@token_required
@admin_required
def get_users(current_user):
    users = User.query.order_by(User.id).all()
    output = []
    for user in users:
        output.append({
            'id': user.id,
            'email': user.email,
            'full_name': user.full_name,
            'role': user.role,
            'created_at': user.created_at.isoformat() if user.created_at else None
        })
    return jsonify({'users': output}), 200

@bp.route('/profile', methods=['PUT'])
@token_required
def update_profile(current_user):
    data = request.get_json()
    
    if 'full_name' in data:
        current_user.full_name = data['full_name']
        
    if 'phone_number' in data:
        current_user.phone_number = data['phone_number']
        
    if 'password' in data and data['password']:
        current_user.set_password(data['password'])
        
    db.session.commit()
    return jsonify({'message': 'Profile updated successfully', 'user': current_user.to_dict()}), 200

@bp.route('/<int:id>', methods=['PUT'])
@token_required
@admin_required
def update_user(current_user, id):
    user = User.query.get_or_404(id)
    data = request.get_json()

    if 'role' in data:
        if data['role'] not in ['user', 'admin']:
            return jsonify({'message': 'Invalid role'}), 400
        user.role = data['role']
    
    if 'full_name' in data:
        user.full_name = data['full_name']

    if 'phone_number' in data:
        user.phone_number = data['phone_number']
        
    if 'password' in data and data['password']:
        user.set_password(data['password'])
        
    db.session.commit()
    return jsonify({'message': 'User updated successfully'}), 200

@bp.route('/<int:id>', methods=['DELETE'])
@token_required
@admin_required
def delete_user(current_user, id):
    user = User.query.get_or_404(id)
    
    # Prevent deleting yourself
    if user.id == current_user.id:
        return jsonify({'message': 'Cannot delete your own account'}), 400
        
    db.session.delete(user)
    db.session.commit()
    return jsonify({'message': 'User deleted successfully'}), 200
