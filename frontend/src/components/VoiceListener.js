import React, { useEffect } from 'react';

function VoiceListener({ setActivePage }) {
    useEffect(() => {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SpeechRecognition) {
            console.error("Speech Recognition not supported in this browser.");
            return;
        }

        const recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = 'en-US';

        recognition.start();

        recognition.onresult = (event) => {
            let finalTranscript = '';

            for (let i = event.resultIndex; i < event.results.length; i++) {
                const result = event.results[i];
                if (result.isFinal) {
                    finalTranscript = result[0].transcript.trim();
                    console.log("Finalized Transcript:", finalTranscript);

                    // Normalize the transcript by removing spaces and converting to lowercase
                    const normalizedTranscript = finalTranscript.replace(/\s+/g, '').toLowerCase();

                    // Check if the normalized transcript includes "heylifehub"
                    if (normalizedTranscript.includes("heylifehub")) {
                        console.log("Trigger phrase 'Hey LifeHub' detected!");
                        recognition.stop();

                        console.log("Setting active page to 'reminder'");
                        setActivePage('reminder'); // Update the active page state

                        setTimeout(() => {
                            recognition.start(); // Restart recognition
                        }, 1000);
                    }
                }
            }
        };

        recognition.onerror = (event) => {
            console.error("Speech Recognition Error:", event.error);
            if (event.error === 'no-speech' || event.error === 'network') {
                recognition.start();
            }
        };

        return () => {
            recognition.stop();
        };
    }, [setActivePage]);

    return null;
}

export default VoiceListener;
