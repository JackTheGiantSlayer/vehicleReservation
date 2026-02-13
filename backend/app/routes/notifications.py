from flask import Blueprint, request, jsonify
from app import db
from app.models import Notification
from app.utils.decorators import token_required, admin_required

bp = Blueprint('notifications', __name__)

@bp.route('/', methods=['GET'])
@token_required
def get_notifications(current_user):
    # Admins see system notifications (user_id is null) + their own
    if current_user.role == 'admin':
        notifications = Notification.query.filter(
            (Notification.user_id == current_user.id) | (Notification.user_id == None)
        ).order_by(Notification.created_at.desc()).limit(50).all()
    else:
        notifications = Notification.query.filter_by(user_id=current_user.id).order_by(Notification.created_at.desc()).limit(50).all()
    
    return jsonify({'notifications': [n.to_dict() for n in notifications]}), 200

@bp.route('/unread-count', methods=['GET'])
@token_required
def get_unread_count(current_user):
    if current_user.role == 'admin':
        count = Notification.query.filter(
            ((Notification.user_id == current_user.id) | (Notification.user_id == None)),
            Notification.is_read == False
        ).count()
    else:
        count = Notification.query.filter_by(user_id=current_user.id, is_read=False).count()
    
    return jsonify({'count': count}), 200

@bp.route('/<int:id>/read', methods=['PUT'])
@token_required
def mark_as_read(current_user, id):
    notification = Notification.query.get_or_404(id)
    
    # Ownership check
    if notification.user_id and notification.user_id != current_user.id:
        return jsonify({'message': 'Unauthorized'}), 403
        
    notification.is_read = True
    db.session.commit()
    return jsonify({'message': 'Notification marked as read'}), 200

@bp.route('/read-all', methods=['PUT'])
@token_required
def mark_all_as_read(current_user):
    if current_user.role == 'admin':
        Notification.query.filter(
            ((Notification.user_id == current_user.id) | (Notification.user_id == None)),
            Notification.is_read == False
        ).update({Notification.is_read: True}, synchronize_session=False)
    else:
        Notification.query.filter_by(user_id=current_user.id, is_read=False).update({Notification.is_read: True}, synchronize_session=False)
    
    db.session.commit()
    return jsonify({'message': 'All notifications marked as read'}), 200
