import os
from flask import Flask, jsonify, request
from flask_cors import CORS
from ibm_watson import SpeechToTextV1, AssistantV2
from ibm_cloud_sdk_core.authenticators import IAMAuthenticator
from dotenv import load_dotenv

# Load environment variables from the .env file
load_dotenv()

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

# IBM Watson Speech to Text Setup
speech_to_text_apikey = os.getenv('SPEECH_TO_TEXT_API_KEY')
speech_to_text_url = os.getenv('SPEECH_TO_TEXT_URL')

speech_authenticator = IAMAuthenticator(speech_to_text_apikey)
speech_to_text = SpeechToTextV1(authenticator=speech_authenticator)
speech_to_text.set_service_url(speech_to_text_url)

# IBM Watson Assistant Setup
assistant_api_key = os.getenv('ASSISTANT_API_KEY')
assistant_url = os.getenv('ASSISTANT_URL')
assistant_id = os.getenv('ASSISTANT_ID')

assistant_authenticator = IAMAuthenticator(assistant_api_key)
assistant = AssistantV2(
    version='2021-06-14',
    authenticator=assistant_authenticator
)
assistant.set_service_url(assistant_url)

# Endpoint to provide IAM token for Watson Speech to Text
@app.route('/api/speech-to-text-token', methods=['GET'])
def get_speech_to_text_token():
    try:
        print("Providing IAM token for Watson Speech to Text...")
        iam_token = speech_authenticator.token_manager.get_token()
        return jsonify({'accessToken': iam_token, 'serviceUrl': speech_to_text_url}), 200
    except Exception as e:
        print("Error providing IAM token:", e)
        return jsonify({'error': str(e)}), 500


# Endpoint to provide API key for Watson Speech to Text
@app.route('/api/speech-to-text-api-key', methods=['GET'])
def get_speech_to_text_api_key():
    try:
        print("Providing API key for Watson Speech to Text...")
        return jsonify({'apiKey': speech_to_text_apikey}), 200
    except Exception as e:
        print("Error providing API key:", e)
        return jsonify({'error': str(e)}), 500

# Endpoint to process commands using Watson Assistant
@app.route('/api/process-command', methods=['POST'])
def process_command():
    data = request.get_json()
    user_input = data.get('text', '')
    print('Received user input for NLP:', user_input)

    # Create session
    session_response = assistant.create_session(assistant_id=assistant_id).get_result()
    session_id = session_response['session_id']

    # Send message to assistant
    response = assistant.message(
        assistant_id=assistant_id,
        session_id=session_id,
        input={'message_type': 'text', 'text': user_input}
    ).get_result()

    # Get intent
    intents = response.get('output', {}).get('intents', [])
    intent = intents[0]['intent'] if intents else 'unknown'
    print("Detected intent from Watson Assistant:", intent)

    # Close session
    assistant.delete_session(assistant_id=assistant_id, session_id=session_id)

    return jsonify({'intent': intent})

if __name__ == '__main__':
    app.run(debug=True)


# import os
# from flask import Flask, jsonify, request
# from flask_cors import CORS
# from ibm_watson import SpeechToTextV1, AssistantV2
# from ibm_cloud_sdk_core.authenticators import IAMAuthenticator
# from dotenv import load_dotenv
# from cloudant.client import Cloudant

# # Load environment variables from the .env file
# load_dotenv()

# app = Flask(__name__)
# CORS(app)  # Enable CORS for all routes

# # IBM Watson Speech to Text Setup
# speech_to_text_apikey = os.getenv('SPEECH_TO_TEXT_API_KEY')
# speech_to_text_url = os.getenv('SPEECH_TO_TEXT_URL')

# authenticator = IAMAuthenticator(speech_to_text_apikey)
# speech_to_text = SpeechToTextV1(authenticator=authenticator)
# speech_to_text.set_service_url(speech_to_text_url)

# # IBM Watson Assistant Setup
# assistant_api_key = os.getenv('ASSISTANT_API_KEY')
# assistant_url = os.getenv('ASSISTANT_URL')
# assistant_id = os.getenv('ASSISTANT_ID')

# assistant_authenticator = IAMAuthenticator(assistant_api_key)
# assistant = AssistantV2(
#     version='2021-06-14',
#     authenticator=assistant_authenticator
# )
# assistant.set_service_url(assistant_url)

# # IBM Cloudant Setup
# cloudant_api_key = os.getenv('CLOUDANT_API_KEY')
# cloudant_url = os.getenv('CLOUDANT_URL')

# client = Cloudant.iam(None, cloudant_api_key, url=cloudant_url, connect=True)
# database_name = 'lifehub_database'
# db = client.create_database(database_name, throw_on_exists=False)

# # Endpoint to generate access token for Watson Speech to Text
# @app.route('/api/speech-to-text-token', methods=['GET'])
# def get_speech_to_text_token():
#     try:
#         print("Generating access token for Watson Speech to Text...")
#         access_token = speech_to_text.get_token()
#         print("Access token generated:", access_token)
#         return jsonify({'accessToken': access_token}), 200
#     except Exception as e:
#         print("Error generating access token:", e)
#         return jsonify({'error': str(e)}), 500

# # Endpoint to process commands using Watson Assistant
# @app.route('/api/process-command', methods=['POST'])
# def process_command():
#     data = request.get_json()
#     user_input = data.get('text', '')
#     print('Received user input for NLP:', user_input)

#     # Create session
#     session_response = assistant.create_session(
#         assistant_id=assistant_id
#     ).get_result()
#     session_id = session_response['session_id']

#     # Send message to assistant
#     response = assistant.message(
#         assistant_id=assistant_id,
#         session_id=session_id,
#         input={
#             'message_type': 'text',
#             'text': user_input,
#         }
#     ).get_result()

#     # Get intent
#     intents = response.get('output', {}).get('intents', [])
#     intent = intents[0]['intent'] if intents else 'unknown'
#     print("Detected intent from Watson Assistant:", intent)

#     # Close session
#     assistant.delete_session(
#         assistant_id=assistant_id,
#         session_id=session_id
#     )

#     return jsonify({'intent': intent})

# # Endpoint to save reminder to Cloudant
# @app.route('/setreminder', methods=['POST'])
# def set_reminder():
#     data = request.get_json()
#     print('Saving reminder data to Cloudant:', data)
#     db.create_document(data)
#     return jsonify({'status': 'success', 'message': 'Reminder received'}), 200

# # Start the Flask app
# if __name__ == '__main__':
#     app.run(debug=True)



















# # server.py

# from flask import Flask, request, jsonify
# from flask_cors import CORS  # Import CORS

# app = Flask(__name__)
# CORS(app)  # Allow CORS from any origin (for testing purposes)

# @app.route('/setreminder', methods=['POST'])
# def set_reminder():
#     data = request.get_json()
#     print('Set Reminder Data:', data)
#     return jsonify({'status': 'success', 'message': 'Reminder received'})

# @app.route('/sos', methods=['POST'])
# def sos():
#     data = request.get_json()
#     print('SOS Data:', data)
#     return jsonify({'status': 'success', 'message': 'SOS received'})

# @app.route('/checkin', methods=['POST'])
# def check_in():
#     data = request.get_json()
#     print('Check-In Data:', data)
#     return jsonify({'status': 'success', 'message': 'Check-In received'})

# if __name__ == '__main__':
#     app.run(debug=True)
