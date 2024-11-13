# server.py

from flask import Flask, request, jsonify
from flask_cors import CORS  # Import CORS

app = Flask(__name__)
CORS(app)  # Allow CORS from any origin (for testing purposes)

@app.route('/setreminder', methods=['POST'])
def set_reminder():
    data = request.get_json()
    print('Set Reminder Data:', data)
    return jsonify({'status': 'success', 'message': 'Reminder received'})

@app.route('/sos', methods=['POST'])
def sos():
    data = request.get_json()
    print('SOS Data:', data)
    return jsonify({'status': 'success', 'message': 'SOS received'})

@app.route('/checkin', methods=['POST'])
def check_in():
    data = request.get_json()
    print('Check-In Data:', data)
    return jsonify({'status': 'success', 'message': 'Check-In received'})

if __name__ == '__main__':
    app.run(debug=True)
