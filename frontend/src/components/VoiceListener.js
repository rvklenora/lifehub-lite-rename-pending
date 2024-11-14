// VoiceListener.js
import React, { useEffect, useRef, useState } from 'react';
import * as WatsonSpeech from 'watson-speech';

function VoiceListener() {
  const streamRef = useRef(null);
  const isListeningRef = useRef(false);
  const isProcessingRef = useRef(false);
  const fullTranscriptionRef = useRef('');
  const [transcription, setTranscription] = useState('');
  const accessTokenRef = useRef('');
  const serviceUrlRef = useRef('');

  useEffect(() => {
    const startVoiceListener = async () => {
      console.log("VoiceListener component mounted");

      try {
        console.log("Attempting to fetch IAM token and service URL from backend...");
        // Fetch the IAM token and service URL from the backend
        const response = await fetch('http://localhost:5000/api/speech-to-text-token');

        console.log("Received response from token endpoint:", response);

        if (!response.ok) {
          throw new Error(`Failed to fetch token: ${response.status} (${response.statusText})`);
        }

        const data = await response.json();
        console.log("Token endpoint response data:", data);

        const accessToken = data.accessToken;
        const serviceUrl = data.serviceUrl;

        if (!accessToken || !serviceUrl) {
          throw new Error("Access token or service URL is missing in the response");
        }

        console.log("Access token and service URL obtained successfully");

        // Save the tokens in refs for later use
        accessTokenRef.current = accessToken;
        serviceUrlRef.current = serviceUrl;

        // Test microphone access before initializing the stream
        console.log("Checking microphone access...");
        await navigator.mediaDevices.getUserMedia({ audio: true });
        console.log("Microphone access granted");

        // Set up Speech to Text service
        console.log("Initializing the speech-to-text stream...");
        const stream = WatsonSpeech.SpeechToText.recognizeMicrophone({
          accessToken: accessTokenRef.current,
          url: serviceUrlRef.current,
          interimResults: true,
          objectMode: true,
          format: true,
          inactivity_timeout: -1, // Keep the connection alive
        });

        console.log("Speech-to-text stream initialized");

        // Save the stream reference
        streamRef.current = stream;

        // Handle transcription data
        console.log("Attaching event listeners to the stream...");
        stream.on('data', (data) => {
          try {
            console.log("Received data from Watson Speech to Text:", data);

            if (
              data.results &&
              data.results[0] &&
              data.results[0].alternatives &&
              data.results[0].alternatives[0]
            ) {
              const transcript = data.results[0].alternatives[0].transcript.trim();
              const isFinal = data.results[0].final;

              console.log("Transcript received:", transcript, "Is final:", isFinal);

              // Update the live transcription
              setTranscription(transcript);

              const lowerTranscript = transcript.toLowerCase();

              if (!isProcessingRef.current) {
                if (!isListeningRef.current) {
                  // Not currently listening for a command
                  if (lowerTranscript.includes("hi")) {
                    console.log("Wake word detected");
                    isListeningRef.current = true;
                    fullTranscriptionRef.current = '';
                  }
                } else {
                  // Currently listening for a command
                  if (isFinal) {
                    // Accumulate only final transcriptions to avoid duplicates
                    fullTranscriptionRef.current += ' ' + transcript;
                    console.log("Accumulated transcription:", fullTranscriptionRef.current.trim());

                    if (lowerTranscript.includes("please")) {
                      console.log("Stop word detected");
                      isListeningRef.current = false;
                      isProcessingRef.current = true; // Start processing

                      // Remove the "please" from the transcription
                      const command = fullTranscriptionRef.current.replace(/please/gi, '').trim();
                      console.log("Final command to send to backend:", command);

                      // Send transcription to backend
                      sendTranscriptionToBackend(command)
                        .then(() => {
                          isProcessingRef.current = false; // Finished processing
                        })
                        .catch((error) => {
                          console.error("Error sending transcription to backend:", error);
                          isProcessingRef.current = false; // Allow new commands even if there's an error
                        });

                      // Reset full transcription
                      fullTranscriptionRef.current = '';
                    }
                  }
                }
              }
            } else {
              console.warn("No transcript available in the data received.");
            }
          } catch (error) {
            console.error("Error in 'data' event handler:", error);
          }
        });

        stream.on('error', (err) => {
          console.error("Error with Watson Speech to Text stream:", err);
        });

        stream.on('close', (event) => {
          console.log("Speech to Text stream closed:", event);
        });

        stream.on('connection-close', (event) => {
          console.log("Speech to Text connection closed:", event);
        });

        console.log("Event listeners attached");
      } catch (error) {
        console.error("Error starting Speech to Text:", error);
      }
    };

    startVoiceListener();

    // Cleanup function to stop the stream when component unmounts
    return () => {
      console.log("Cleaning up VoiceListener component...");
      if (streamRef.current) {
        streamRef.current.stop();
        streamRef.current = null;
        console.log("Speech-to-text stream stopped");
      }
    };
  }, []);

  const sendTranscriptionToBackend = async (transcript) => {
    console.log("Sending transcription to backend:", transcript);
    try {
      const response = await fetch('http://localhost:5000/api/receive-transcript', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transcript }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Server error: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      console.log("Backend response:", data);
    } catch (error) {
      console.error("Error sending transcription to backend:", error);
      throw error; // Re-throw the error so the caller can handle it
    }
  };

  return (
    <div>
      <p>Listening for commands...</p>
      <p>Current transcription: {transcription}</p>
    </div>
  );
}

export default VoiceListener;






// import React, { useState } from 'react';
// import * as WatsonSpeech from 'watson-speech'; // Import the Watson Speech library

// function VoiceCommand({ setActivePage }) {
//   const [isRecording, setIsRecording] = useState(false);
//   const [transcription, setTranscription] = useState('');
//   const [isError, setIsError] = useState(false);

//   const handleVoiceCommand = async () => {
//     if (isRecording) {
//       // Stop recording logic
//       setIsRecording(false);
//       console.log("Recording stopped");
//       return;
//     }

//     setIsRecording(true);
//     console.log("Recording started");

//     // Fetch token from backend to connect to Watson Speech to Text
//     const response = await fetch('http://localhost:5000/api/speech-to-text-token');
//     const { accessToken } = await response.json();
//     console.log("Received access token from backend:", accessToken);

//     // Set up Speech to Text service (using WebSocket or similar method)
//     const stream = WatsonSpeech.SpeechToText.recognizeMicrophone({
//       token: accessToken,
//       outputElement: '#output',
//       format: false,  // Optional: disable audio format for simplicity
//     });

//     stream.on('data', (data) => {
//       console.log("Received data from Watson Speech to Text:", data);
//       const transcript = data.alternatives[0].transcript.trim();
//       setTranscription(transcript);
//       console.log("Current transcription:", transcript);

//       // Send transcription to backend for NLP processing with Watson Assistant
//       processTranscript(transcript);
//     });

//     stream.on('error', (err) => {
//       console.error("Error with Watson Speech to Text:", err);
//       setIsError(true);
//     });
//   };

//   const processTranscript = async (transcript) => {
//     try {
//       console.log("Sending transcription to backend for NLP:", transcript);
//       const commandResponse = await fetch('http://localhost:5000/api/process-command', {
//         method: 'POST',
//         headers: { 'Content-Type': 'application/json' },
//         body: JSON.stringify({ text: transcript }),
//       });

//       const { intent } = await commandResponse.json();
//       console.log("Received intent from Watson Assistant:", intent);

//       // Handle the response based on the intent
//       if (intent === 'set_reminder') {
//         setActivePage('reminder');
//       } else if (intent === 'sos') {
//         setActivePage('sos');
//       } else {
//         console.log("Unknown intent received:", intent);
//       }
//     } catch (error) {
//       console.error("Error processing transcript:", error);
//       setIsError(true);
//     }
//   };

//   return (
//     <div>
//       <button onClick={handleVoiceCommand}>
//         {isRecording ? 'Stop' : 'Start'} Voice Command
//       </button>
//       {isError && <p>Error occurred during speech-to-text or NLP processing. Please try again.</p>}
//       <p>Transcription: {transcription}</p>
//     </div>
//   );
// }

// export default VoiceCommand;

















// import React, { useEffect, useRef } from 'react';

// function VoiceListener({ setActivePage }) {
//   const recognitionRef = useRef(null);
//   const recognizing = useRef(false);
//   const intentionallyStopped = useRef(false);

//   useEffect(() => {
//     const SpeechRecognition =
//       window.SpeechRecognition || window.webkitSpeechRecognition;
//     if (!SpeechRecognition) {
//       console.error('Speech Recognition not supported in this browser.');
//       return;
//     }

//     if (!recognitionRef.current) {
//       const recognition = new SpeechRecognition();
//       recognition.continuous = true;
//       recognition.interimResults = true;
//       recognition.lang = 'en-US';

//       recognition.onstart = () => {
//         recognizing.current = true;
//         console.log('Recognition started');
//       };

//       recognition.onend = () => {
//         recognizing.current = false;
//         console.log('Recognition ended');
//         if (!intentionallyStopped.current) {
//           recognition.start();
//         }
//       };

//       recognition.onresult = (event) => {
//         let finalTranscript = '';

//         for (let i = event.resultIndex; i < event.results.length; i++) {
//           const result = event.results[i];
//           if (result.isFinal) {
//             finalTranscript = result[0].transcript.trim();
//             console.log('Finalized Transcript:', finalTranscript);

//             // Normalize the transcript by removing spaces and converting to lowercase
//             const normalizedTranscript = finalTranscript
//               .replace(/\s+/g, '')
//               .toLowerCase();

//             // Check for "set reminder" command
//             if (
//               normalizedTranscript.includes('heylifehub') &&
//               (normalizedTranscript.includes('setreminder') ||
//                 normalizedTranscript.includes('reminderplease') ||
//                 normalizedTranscript.includes('reminder'))
//             ) {
//               console.log("Trigger phrase 'set reminder' detected!");
//               intentionallyStopped.current = true;
//               recognition.stop();
//               setActivePage('reminder'); // Navigate to reminder page
//               setTimeout(() => {
//                 intentionallyStopped.current = false;
//                 recognition.start(); // Restart recognition
//               }, 1000);

//               // Check for "SOS" command
//             } else if (
//               normalizedTranscript.includes('heylifehub') &&
//               (normalizedTranscript.includes('sos') ||
//                 normalizedTranscript.includes('emergency') ||
//                 normalizedTranscript.includes('help'))
//             ) {
//               console.log("Trigger phrase 'SOS' detected!");
//               intentionallyStopped.current = true;
//               recognition.stop();
//               setActivePage('sos'); // Navigate to SOS page
//               setTimeout(() => {
//                 intentionallyStopped.current = false;
//                 recognition.start(); // Restart recognition
//               }, 1000);
//             }
//           }
//         }
//       };

//       recognition.onerror = (event) => {
//         console.error('Speech Recognition Error:', event.error);
//         // Optionally, restart recognition after error
//         if (!intentionallyStopped.current) {
//           recognition.stop();
//         }
//       };

//       recognitionRef.current = recognition;
//       recognition.start();
//     }

//     return () => {
//       if (recognitionRef.current) {
//         recognitionRef.current.stop();
//         recognitionRef.current = null;
//       }
//     };
//   }, [setActivePage]);

//   return null;
// }

// export default VoiceListener;
