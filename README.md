﻿# LifeHub Lite Prototype

LifeHub Lite is a wellness-focused web app that assists users with routine reminders, wellness check-ins, and an SOS alert feature. Users can interact with the app through voice commands and receive AI-driven responses. The Python backend API interprets user commands, manages SOS alerts, and handles wellness check-ins.

---

## Features

1. **Routine Reminders**:
   - Users can set reminders manually through the UI or by voice command.
   - Voice commands are transcribed to text and sent to the backend:
     - If the command closely matches a predefined command (similarity above 95%), it’s executed.
     - Otherwise, the command is sent to an AI model, initiating a conversation for additional clarification or interaction.

2. **SOS Alert Simulation**:
   - A button or voice command can trigger an SOS alert.
   - The system automatically sends an email or SMS to an emergency contact with a predefined message and the user’s location.

3. **Wellness Check-In Prompts**:
   - Timed prompts ask the user how they’re feeling. The user can respond directly through the UI or by voice.
   - Responses are analyzed to detect mood trends and trigger supportive suggestions or reminders if negative sentiment is detected.

4. **Voice Activation**:
   - Users can issue voice commands, which are processed and interpreted using off-the-shelf voice recognition APIs.

---

## Tech Stack

- **Frontend**: REACT for a responsive user interface.
- **Backend**: Python Flask Server with custom API endpoints.
- **Voice Recognition**: IBM Voice to text and text to voice.
- **Database**: Cloudante.
- **AI Processing**: Hugging Face’s open-source NLP models for interpreting commands and sentiment analysis.
- **Email/SMS**: Twilio or SendGrid for sending emergency alerts to contacts.

---

## Getting Started

1. **Clone the Repository**:
   ```bash
   git clone <repository-url>
   cd lifehub-lite

2. **Installs**
   cd ./frontend
   npm install

   cd ./backend
   pip install -r requirements.txt

3. **Launch**
   ./backend - python server.py
   ./frontend - npm start
   
