import os
import requests
from flask import Flask, jsonify, request
from flask_cors import CORS
from ibm_watson import SpeechToTextV1, TextToSpeechV1
from ibm_cloud_sdk_core.authenticators import IAMAuthenticator
from cloudant.client import Cloudant
from cloudant.error import CloudantException
from dotenv import load_dotenv

# Load environment variables from the .env file
load_dotenv()

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

# Hugging Face Setup
HF_API_KEY = os.getenv('HF_KEY')
MODEL_URL = "https://api-inference.huggingface.co/models/HuggingFaceTB/SmolLM2-1.7B-Instruct"

# IBM Watson Speech to Text Setup
speech_to_text_apikey = os.getenv('SPEECH_TO_TEXT_API_KEY')
speech_to_text_url = os.getenv('SPEECH_TO_TEXT_URL')

speech_authenticator = IAMAuthenticator(speech_to_text_apikey)
speech_to_text = SpeechToTextV1(authenticator=speech_authenticator)
speech_to_text.set_service_url(speech_to_text_url)

# IBM Watson Text to Speech Setup
text_to_speech_apikey = os.getenv('TEXT_TO_SPEECH_APIKEY')
text_to_speech_url = os.getenv('TEXT_TO_SPEECH_URL')

tts_authenticator = IAMAuthenticator(text_to_speech_apikey)
text_to_speech = TextToSpeechV1(authenticator=tts_authenticator)
text_to_speech.set_service_url(text_to_speech_url)

# IBM Cloudant Setup
cloudant_api_key = os.getenv('CLOUDANT_API_KEY')
cloudant_url = os.getenv('CLOUDANT_URL')

# Initialize Cloudant client
cloudant_client = Cloudant.iam(
    account_name=None,  # Account name is not required with IAM
    api_key=cloudant_api_key,
    url=cloudant_url,
    connect=True
)

# Ensure the database exists
database_name = 'reminders'
if database_name in cloudant_client.all_dbs():
    db = cloudant_client[database_name]
else:
    db = cloudant_client.create_database(database_name)
    if db.exists():
        print(f"Database '{database_name}' created successfully.")

@app.route('/setreminder', methods=['POST'])
def set_reminder():
    """Endpoint to store a reminder in Cloudant."""
    data = request.get_json()
    print("Received Reminder Data:", data)

    try:
        # Create a new document in the 'reminders' database
        new_document = db.create_document(data)
        if new_document.exists():
            print("Reminder stored successfully in Cloudant.")
            return jsonify({"message": "Reminder stored successfully"}), 200
        else:
            print("Failed to store reminder in Cloudant.")
            return jsonify({"message": "Failed to store reminder"}), 500
    except CloudantException as ce:
        print("CloudantException:", ce)
        return jsonify({"message": "Error storing reminder in Cloudant", "error": str(ce)}), 500
    except Exception as e:
        print("Exception:", e)
        return jsonify({"message": "An unexpected error occurred", "error": str(e)}), 500

@app.route('/api/receive-transcript', methods=['POST'])
def receive_transcript():
    """Process a user transcript and respond using Hugging Face API."""
    data = request.get_json()
    transcript = data.get('transcript', '')
    print('Received transcript from frontend:', transcript)

    try:
        # Hugging Face Inference API
        headers = {"Authorization": f"Bearer {HF_API_KEY}"}

        # Prompt engineering
        PROMPT_TEMPLATE = """
        You are a helpful assistant. Respond to the following user query:

        User: {user_input}

        Assistant:
        """
        prompt = PROMPT_TEMPLATE.format(user_input=transcript)

        # Call Hugging Face API
        payload = {
            "inputs": prompt,
            "parameters": {"max_length": 200, "temperature": 0.7},
            "options": {"use_cache": False}
        }
        response = requests.post(MODEL_URL, headers=headers, json=payload)

        # Extract response
        if response.status_code == 200:
            response_text = response.json()[0]["generated_text"]
            print("Full response from Hugging Face:", response_text)
            
            # Extract only the assistant's reply
            if "Assistant:" in response_text:
                assistant_reply = response_text.split("Assistant:")[-1].strip()
            else:
                assistant_reply = response_text.strip()
            print("Assistant's reply:", assistant_reply)
            
            return jsonify({'status': 'success', 'response': assistant_reply}), 200
        else:
            print("Error from Hugging Face API:", response.json())
            return jsonify({'status': 'error', 'message': 'Hugging Face API failed', 'error': response.text}), 500
    except Exception as e:
        print("Error processing transcript with Hugging Face:", e)
        return jsonify({'status': 'error', 'message': 'Failed to process transcript', 'error': str(e)}), 500

@app.route('/getreminders', methods=['GET'])
def get_reminders():
    """Retrieve all reminders from the database."""
    try:
        all_docs = [doc for doc in db]
        print("Retrieved Reminders:", all_docs)
        return jsonify({'reminders': all_docs}), 200
    except Exception as e:
        print("Error retrieving reminders:", e)
        return jsonify({'error': str(e), 'message': 'Failed to retrieve reminders'}), 500

@app.route('/deletereminder/<reminder_id>', methods=['DELETE'])
def delete_reminder(reminder_id):
    """Delete a specific reminder by ID."""
    try:
        if reminder_id in db:
            doc = db[reminder_id]
            doc.delete()
            print(f"Deleted Reminder with ID: {reminder_id}")
            return jsonify({'message': f'Reminder {reminder_id} deleted successfully'}), 200
        else:
            return jsonify({'message': f'Reminder {reminder_id} not found'}), 404
    except Exception as e:
        print("Error deleting reminder:", e)
        return jsonify({'error': str(e), 'message': 'Failed to delete reminder'}), 500

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

# Endpoint to provide IAM token for Watson Text to Speech
@app.route('/api/text-to-speech-token', methods=['GET'])
def get_text_to_speech_token():
    try:
        print("Providing IAM token for Watson Text to Speech...")
        tts_token = tts_authenticator.token_manager.get_token()
        return jsonify({'accessToken': tts_token, 'serviceUrl': text_to_speech_url}), 200
    except Exception as e:
        print("Error providing IAM token:", e)
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True)












# import os
# import requests
# from flask import Flask, jsonify, request
# from flask_cors import CORS
# from ibm_watson import SpeechToTextV1
# from ibm_cloud_sdk_core.authenticators import IAMAuthenticator
# from cloudant.client import Cloudant
# from cloudant.error import CloudantException
# from dotenv import load_dotenv

# # Load environment variables from the .env file
# load_dotenv()

# app = Flask(__name__)
# CORS(app)  # Enable CORS for all routes

# # Hugging Face Setup
# HF_API_KEY = os.getenv('HF_KEY')
# MODEL_URL = "https://api-inference.huggingface.co/models/HuggingFaceTB/SmolLM2-1.7B-Instruct"

# # IBM Watson Speech to Text Setup
# speech_to_text_apikey = os.getenv('SPEECH_TO_TEXT_API_KEY')
# speech_to_text_url = os.getenv('SPEECH_TO_TEXT_URL')

# speech_authenticator = IAMAuthenticator(speech_to_text_apikey)
# speech_to_text = SpeechToTextV1(authenticator=speech_authenticator)
# speech_to_text.set_service_url(speech_to_text_url)

# # IBM Cloudant Setup
# cloudant_api_key = os.getenv('CLOUDANT_API_KEY')
# cloudant_url = os.getenv('CLOUDANT_URL')

# # Initialize Cloudant client
# cloudant_client = Cloudant.iam(
#     account_name=None,  # Account name is not required with IAM
#     api_key=cloudant_api_key,
#     url=cloudant_url,
#     connect=True
# )

# # Ensure the database exists
# database_name = 'reminders'
# if database_name in cloudant_client.all_dbs():
#     db = cloudant_client[database_name]
# else:
#     db = cloudant_client.create_database(database_name)
#     if db.exists():
#         print(f"Database '{database_name}' created successfully.")

# @app.route('/setreminder', methods=['POST'])
# def set_reminder():
#     """Endpoint to store a reminder in Cloudant."""
#     data = request.get_json()
#     print("Received Reminder Data:", data)

#     try:
#         # Create a new document in the 'reminders' database
#         new_document = db.create_document(data)
#         if new_document.exists():
#             print("Reminder stored successfully in Cloudant.")
#             return jsonify({"message": "Reminder stored successfully"}), 200
#         else:
#             print("Failed to store reminder in Cloudant.")
#             return jsonify({"message": "Failed to store reminder"}), 500
#     except CloudantException as ce:
#         print("CloudantException:", ce)
#         return jsonify({"message": "Error storing reminder in Cloudant", "error": str(ce)}), 500
#     except Exception as e:
#         print("Exception:", e)
#         return jsonify({"message": "An unexpected error occurred", "error": str(e)}), 500

# @app.route('/api/receive-transcript', methods=['POST'])
# def receive_transcript():
#     """Process a user transcript and respond using Hugging Face API."""
#     data = request.get_json()
#     transcript = data.get('transcript', '')
#     print('Received transcript from frontend:', transcript)

#     try:
#         # Hugging Face Inference API
#         headers = {"Authorization": f"Bearer {HF_API_KEY}"}

#         # Prompt engineering
#         PROMPT_TEMPLATE = """
#         You are a helpful assistant. Respond to the following user query:

#         User: {user_input}

#         Assistant:
#         """
#         prompt = PROMPT_TEMPLATE.format(user_input=transcript)

#         # Call Hugging Face API
#         payload = {
#             "inputs": prompt,
#             "parameters": {"max_length": 200, "temperature": 0.7},
#             "options": {"use_cache": False}
#         }
#         response = requests.post(MODEL_URL, headers=headers, json=payload)

#         # Extract response
#         if response.status_code == 200:
#             response_text = response.json()[0]["generated_text"]
#             print("Full response from Hugging Face:", response_text)
            
#             # Extract only the assistant's reply
#             if "Assistant:" in response_text:
#                 assistant_reply = response_text.split("Assistant:")[-1].strip()
#             else:
#                 assistant_reply = response_text.strip()
#             print("Assistant's reply:", assistant_reply)
            
#             return jsonify({'status': 'success', 'response': assistant_reply}), 200
#         else:
#             print("Error from Hugging Face API:", response.json())
#             return jsonify({'status': 'error', 'message': 'Hugging Face API failed', 'error': response.text}), 500
#     except Exception as e:
#         print("Error processing transcript with Hugging Face:", e)
#         return jsonify({'status': 'error', 'message': 'Failed to process transcript', 'error': str(e)}), 500

# @app.route('/getreminders', methods=['GET'])
# def get_reminders():
#     """Retrieve all reminders from the database."""
#     try:
#         all_docs = [doc for doc in db]
#         print("Retrieved Reminders:", all_docs)
#         return jsonify({'reminders': all_docs}), 200
#     except Exception as e:
#         print("Error retrieving reminders:", e)
#         return jsonify({'error': str(e), 'message': 'Failed to retrieve reminders'}), 500

# @app.route('/deletereminder/<reminder_id>', methods=['DELETE'])
# def delete_reminder(reminder_id):
#     """Delete a specific reminder by ID."""
#     try:
#         if reminder_id in db:
#             doc = db[reminder_id]
#             doc.delete()
#             print(f"Deleted Reminder with ID: {reminder_id}")
#             return jsonify({'message': f'Reminder {reminder_id} deleted successfully'}), 200
#         else:
#             return jsonify({'message': f'Reminder {reminder_id} not found'}), 404
#     except Exception as e:
#         print("Error deleting reminder:", e)
#         return jsonify({'error': str(e), 'message': 'Failed to delete reminder'}), 500

# # Endpoint to provide IAM token for Watson Speech to Text
# @app.route('/api/speech-to-text-token', methods=['GET'])
# def get_speech_to_text_token():
#     try:
#         print("Providing IAM token for Watson Speech to Text...")
#         iam_token = speech_authenticator.token_manager.get_token()
#         return jsonify({'accessToken': iam_token, 'serviceUrl': speech_to_text_url}), 200
#     except Exception as e:
#         print("Error providing IAM token:", e)
#         return jsonify({'error': str(e)}), 500

# if __name__ == '__main__':
#     app.run(debug=True)























# import os
# import requests
# from flask import Flask, jsonify, request
# from flask_cors import CORS
# from ibm_watson import SpeechToTextV1
# from ibm_cloud_sdk_core.authenticators import IAMAuthenticator
# from cloudant.client import Cloudant
# from cloudant.error import CloudantException
# from dotenv import load_dotenv

# # Load environment variables from the .env file
# load_dotenv()

# app = Flask(__name__)
# CORS(app)  # Enable CORS for all routes

# # Hugging Face Setup
# HF_API_KEY = os.getenv('HF_KEY')
# MODEL_URL = "https://api-inference.huggingface.co/models/HuggingFaceTB/SmolLM2-1.7B-Instruct"

# # IBM Watson Speech to Text Setup
# speech_to_text_apikey = os.getenv('SPEECH_TO_TEXT_API_KEY')
# speech_to_text_url = os.getenv('SPEECH_TO_TEXT_URL')

# speech_authenticator = IAMAuthenticator(speech_to_text_apikey)
# speech_to_text = SpeechToTextV1(authenticator=speech_authenticator)
# speech_to_text.set_service_url(speech_to_text_url)

# # IBM Cloudant Setup
# cloudant_api_key = os.getenv('CLOUDANT_API_KEY')
# cloudant_url = os.getenv('CLOUDANT_URL')

# # Initialize Cloudant client
# cloudant_client = Cloudant.iam(
#     account_name=None,  # Account name is not required with IAM
#     api_key=cloudant_api_key,
#     url=cloudant_url,
#     connect=True
# )

# # Ensure the database exists
# database_name = 'reminders'
# if database_name in cloudant_client.all_dbs():
#     db = cloudant_client[database_name]
# else:
#     db = cloudant_client.create_database(database_name)
#     if db.exists():
#         print(f"Database '{database_name}' created successfully.")

# @app.route('/setreminder', methods=['POST'])
# def set_reminder():
#     """Endpoint to store a reminder in Cloudant."""
#     data = request.get_json()
#     print("Received Reminder Data:", data)

#     try:
#         # Create a new document in the 'reminders' database
#         new_document = db.create_document(data)
#         if new_document.exists():
#             print("Reminder stored successfully in Cloudant.")
#             return jsonify({"message": "Reminder stored successfully"}), 200
#         else:
#             print("Failed to store reminder in Cloudant.")
#             return jsonify({"message": "Failed to store reminder"}), 500
#     except CloudantException as ce:
#         print("CloudantException:", ce)
#         return jsonify({"message": "Error storing reminder in Cloudant", "error": str(ce)}), 500
#     except Exception as e:
#         print("Exception:", e)
#         return jsonify({"message": "An unexpected error occurred", "error": str(e)}), 500

# @app.route('/api/receive-transcript', methods=['POST'])
# def receive_transcript():
#     """Process a user transcript and respond using Hugging Face API."""
#     data = request.get_json()
#     transcript = data.get('transcript', '')
#     print('Received transcript from frontend:', transcript)

#     try:
#         # Hugging Face Inference API
#         headers = {"Authorization": f"Bearer {HF_API_KEY}"}

#         # Prompt engineering
#         PROMPT_TEMPLATE = """
#         You are a helpful assistant. Respond to the following user query:

#         User: {user_input}

#         Assistant:
#         """
#         prompt = PROMPT_TEMPLATE.format(user_input=transcript)

#         # Call Hugging Face API
#         payload = {"inputs": prompt, "parameters": {"max_length": 200, "temperature": 0.7}}
#         response = requests.post(MODEL_URL, headers=headers, json=payload)

#         # Extract response
#         if response.status_code == 200:
#             response_text = response.json()[0]["generated_text"]
#             print("Response from Hugging Face:", response_text)
#             return jsonify({'status': 'success', 'response': response_text}), 200
#         else:
#             print("Error from Hugging Face API:", response.json())
#             return jsonify({'status': 'error', 'message': 'Hugging Face API failed', 'error': response.text}), 500
#     except Exception as e:
#         print("Error processing transcript with Hugging Face:", e)
#         return jsonify({'status': 'error', 'message': 'Failed to process transcript', 'error': str(e)}), 500

# @app.route('/getreminders', methods=['GET'])
# def get_reminders():
#     """Retrieve all reminders from the database."""
#     try:
#         all_docs = [doc for doc in db]
#         print("Retrieved Reminders:", all_docs)
#         return jsonify({'reminders': all_docs}), 200
#     except Exception as e:
#         print("Error retrieving reminders:", e)
#         return jsonify({'error': str(e), 'message': 'Failed to retrieve reminders'}), 500

# @app.route('/deletereminder/<reminder_id>', methods=['DELETE'])
# def delete_reminder(reminder_id):
#     """Delete a specific reminder by ID."""
#     try:
#         if reminder_id in db:
#             doc = db[reminder_id]
#             doc.delete()
#             print(f"Deleted Reminder with ID: {reminder_id}")
#             return jsonify({'message': f'Reminder {reminder_id} deleted successfully'}), 200
#         else:
#             return jsonify({'message': f'Reminder {reminder_id} not found'}), 404
#     except Exception as e:
#         print("Error deleting reminder:", e)
#         return jsonify({'error': str(e), 'message': 'Failed to delete reminder'}), 500

# # Endpoint to provide IAM token for Watson Speech to Text
# @app.route('/api/speech-to-text-token', methods=['GET'])
# def get_speech_to_text_token():
#     try:
#         print("Providing IAM token for Watson Speech to Text...")
#         iam_token = speech_authenticator.token_manager.get_token()
#         return jsonify({'accessToken': iam_token, 'serviceUrl': speech_to_text_url}), 200
#     except Exception as e:
#         print("Error providing IAM token:", e)
#         return jsonify({'error': str(e)}), 500

# if __name__ == '__main__':
#     app.run(debug=True)

