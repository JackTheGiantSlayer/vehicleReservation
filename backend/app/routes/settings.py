from flask import Blueprint, request, jsonify
from app import db
from app.models import Setting
from app.utils.decorators import token_required, admin_required

bp = Blueprint('settings', __name__)

@bp.route('/', methods=['GET'])
@token_required
@admin_required
def get_settings(current_user):
    settings = Setting.query.all()
    return jsonify({s.key: s.value for s in settings}), 200

@bp.route('/', methods=['POST'])
@token_required
@admin_required
def update_settings(current_user):
    data = request.get_json()
    if not data:
        return jsonify({'message': 'No data provided'}), 400
    
    for key, value in data.items():
        setting = Setting.query.filter_by(key=key).first()
        if setting:
            setting.value = str(value)
        else:
            setting = Setting(key=key, value=str(value))
            db.session.add(setting)
    
    db.session.commit()
    return jsonify({'message': 'Settings updated successfully'}), 200
@bp.route('/test-email', methods=['POST'])
@token_required
@admin_required
def test_email(current_user):
    data = request.get_json()
    if not data:
        return jsonify({'message': 'No data provided'}), 400
    
    recipient = data.get('admin_email')
    if not recipient:
        return jsonify({'message': 'Recipient email is required for testing'}), 400

    # For testing, we might want to use the data passed in rather than what's in DB
    # because the user might be testing before saving.
    # We can pass a temporary settings dict to EmailService or just use a specialized method.
    
    from app.services.email_service import EmailService
    
    # Simple check: if smtp_pass is '********' or empty, use existing from DB
    current_settings = {s.key: s.value for s in Setting.query.all()}
    
    test_settings = {
        'smtp_host': data.get('smtp_host') or current_settings.get('smtp_host'),
        'smtp_port': data.get('smtp_port') or current_settings.get('smtp_port'),
        'smtp_user': data.get('smtp_user') or current_settings.get('smtp_user'),
        'smtp_pass': data.get('smtp_pass') if data.get('smtp_pass') and data.get('smtp_pass') != '********' else current_settings.get('smtp_pass'),
        'email_notifications_enabled': 'true' # Force enable for test
    }

    success, error = EmailService.send_test_email(recipient, test_settings)
    
    if success:
        return jsonify({'message': 'Test email sent successfully!'}), 200
    else:
        return jsonify({'message': f'Failed to send test email: {error}'}), 500
