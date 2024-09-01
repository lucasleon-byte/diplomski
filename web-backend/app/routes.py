from flask import Blueprint, request, jsonify
from .nmap_scanner import nmap_scan, nmap_scan_again
from .zap_scanner import zap_scan_handler, zap_scan_again_handler
from flask import Blueprint, request, jsonify, current_app
from bson import json_util
import json
import time
from zapv2 import ZAPv2



main = Blueprint('main', __name__)

@main.route('/scan', methods=['POST'])
def scan():
    target_url = request.get_json().get('url')
    if not target_url:
        return jsonify({'error': 'No URL provided'}), 400
    return zap_scan_handler(target_url)

@main.route('/scan_again', methods=['POST'])
def scan_again():
    target_url = request.args.get('url')
    if not target_url:
        return jsonify({'error': 'No URL provided'}), 400
    return zap_scan_again_handler(target_url)

@main.route('/results', methods=['GET'])
def get_results():
    collection = current_app.db['results']
    page = int(request.args.get('page', 1))
    per_page = int(request.args.get('per_page', 10))
    documents = collection.find().skip((page - 1) * per_page).limit(per_page)
    result = [json.loads(json_util.dumps(doc)) for doc in documents]
    return jsonify(result)

@main.route('/alerts', methods=['GET'])
def list_alert_types():
    url = request.args.get('url')
    if not url:
        return jsonify({'error': 'No URL provided'}), 400

    collection = current_app.db['results']
    result = collection.find_one({'url': url}, {'alerts': 1})

    if not result:
        return jsonify({'error': 'No scan results found for this URL'}), 404

    grouped_alerts = result['alerts']
    alert_types = list(grouped_alerts.keys())

    return jsonify({'alert_types': alert_types}), 200

@main.route('/alerts/<alert_type>', methods=['GET'])
def get_alert_details(alert_type):
    url = request.args.get('url')
    if not url:
        return jsonify({'error': 'No URL provided'}), 400

    collection = current_app.db['results']
    result = collection.find_one({'url': url}, {'alerts': 1})

    if not result:
        return jsonify({'error': 'No scan results found for this URL'}), 404

    grouped_alerts = result['alerts']

    if alert_type not in grouped_alerts:
        return jsonify({'error': f'No alerts of type {alert_type} found'}), 404

    alert_details = grouped_alerts[alert_type]

    return jsonify({'alert_type': alert_type, 'details': alert_details}), 200

@main.route('/nmap_scan', methods=['POST'])
def nmap_scan_route():
    if not request.is_json:
        return jsonify({'error': 'Content-Type must be application/json'}), 415

    data = request.get_json()
    target_url = data.get('url')

    if not target_url:
        return jsonify({'error': 'No URL provided'}), 400

    return nmap_scan(target_url)

@main.route('/nmap_results', methods=['GET'])
def get_nmap_results():
    collection = current_app.db['nmap_results']
    page = int(request.args.get('page', 1))
    per_page = int(request.args.get('per_page', 10))
    documents = collection.find().skip((page - 1) * per_page).limit(per_page)
    result = [json.loads(json_util.dumps(doc)) for doc in documents]
    return jsonify(result)

@main.route('/nmap_scan_again', methods=['POST'])
def nmap_scan_again_route():
    if not request.is_json:
        return jsonify({'error': 'Content-Type must be application/json'}), 415

    data = request.get_json()
    target_url = data.get('url')

    if not target_url:
        return jsonify({'error': 'No URL provided'}), 400

    return nmap_scan_again(target_url)
