// VoiceListener.js
import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as WatsonSpeech from 'watson-speech';

function VoiceListener({ setIsListening }) {
  const streamRef = useRef(null);
  const isListeningRef = useRef(false);
  const isProcessingRef = useRef(false);
  const fullTranscriptionRef = useRef('');
  const [transcription, setTranscription] = useState('');
  const accessTokenRef = useRef('');
  const serviceUrlRef = useRef('');
  const ttsAccessTokenRef = useRef('');
  const ttsServiceUrlRef = useRef('');

  // Define playAssistantReply using useCallback
  const playAssistantReply = useCallback((text) => {
    console.log("Playing assistant's reply:", text);

    // Use Watson Speech SDK to synthesize the text
    const audioStream = WatsonSpeech.TextToSpeech.synthesize({
      text: text,
      accessToken: ttsAccessTokenRef.current,
      url: ttsServiceUrlRef.current,
      voice: 'en-US_AllisonV3Voice', // Or any other available voice
    });

    audioStream.on('error', (err) => {
      console.error('Error during text-to-speech synthesis:', err);
    });

    // Create an audio element to play the synthesized speech
    const audioElement = new Audio();
    audioElement.src = window.URL.createObjectURL(audioStream);
    audioElement.play();
  }, []);

  // Define sendTranscriptionToBackend using useCallback
  const sendTranscriptionToBackend = useCallback(
    async (transcript) => {
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

        if (data.status === 'success') {
          const assistantReply = data.response;
          // Trigger Text to Speech
          playAssistantReply(assistantReply);
        }
      } catch (error) {
        console.error("Error sending transcription to backend:", error);
        throw error; // Re-throw the error so the caller can handle it
      }
    },
    [playAssistantReply] // Include playAssistantReply as a dependency
  );

  useEffect(() => {
    const startVoiceListener = async () => {
      console.log("VoiceListener component mounted");

      try {
        console.log("Attempting to fetch IAM token and service URL from backend...");
        const response = await fetch('http://localhost:5000/api/speech-to-text-token');

        if (!response.ok) {
          throw new Error(`Failed to fetch token: ${response.status} (${response.statusText})`);
        }

        const data = await response.json();
        const { accessToken, serviceUrl } = data;

        if (!accessToken || !serviceUrl) {
          throw new Error("Access token or service URL is missing in the response");
        }

        accessTokenRef.current = accessToken;
        serviceUrlRef.current = serviceUrl;

        // Fetch the Text to Speech token and service URL from the backend
        console.log("Attempting to fetch Text to Speech IAM token and service URL from backend...");
        const ttsResponse = await fetch('http://localhost:5000/api/text-to-speech-token');

        console.log("Received response from Text to Speech token endpoint:", ttsResponse);

        if (!ttsResponse.ok) {
          throw new Error(`Failed to fetch Text to Speech token: ${ttsResponse.status} (${ttsResponse.statusText})`);
        }

        const ttsData = await ttsResponse.json();
        console.log("Text to Speech token endpoint response data:", ttsData);

        const ttsAccessToken = ttsData.accessToken;
        const ttsServiceUrl = ttsData.serviceUrl;

        if (!ttsAccessToken || !ttsServiceUrl) {
          throw new Error("Text to Speech access token or service URL is missing in the response");
        }

        console.log("Text to Speech access token and service URL obtained successfully");

        // Save the tokens in refs for later use
        ttsAccessTokenRef.current = ttsAccessToken;
        ttsServiceUrlRef.current = ttsServiceUrl;

        // Test microphone access before initializing the stream

        console.log("Checking microphone access...");
        await navigator.mediaDevices.getUserMedia({ audio: true });
        console.log("Microphone access granted");

        console.log("Initializing the speech-to-text stream...");
        const stream = WatsonSpeech.SpeechToText.recognizeMicrophone({
          accessToken: accessTokenRef.current,
          url: serviceUrlRef.current,
          interimResults: true,
          objectMode: true,
          format: true,
          inactivity_timeout: -1,
        });

        streamRef.current = stream;

        // Set the listening state to true
        setIsListening(true);
        isListeningRef.current = true;

        stream.on('data', (data) => {
          try {
            if (
              data.results &&
              data.results[0] &&
              data.results[0].alternatives &&
              data.results[0].alternatives[0]
            ) {
              const transcript = data.results[0].alternatives[0].transcript.trim();
              const isFinal = data.results[0].final;
              setTranscription(transcript);

              const lowerTranscript = transcript.toLowerCase();

              if (!isProcessingRef.current) {
                if (!isListeningRef.current) {
                  if (lowerTranscript.includes("hi")) {
                    console.log("Wake word detected");
                    isListeningRef.current = true;
                    fullTranscriptionRef.current = '';
                  }
                } else {
                  if (isFinal) {
                    fullTranscriptionRef.current += ' ' + transcript;

                    if (lowerTranscript.includes("please")) {
                      console.log("Stop word detected");
                      isListeningRef.current = false;
                      isProcessingRef.current = true;

                      const command = fullTranscriptionRef.current.replace(/please/gi, '').trim();
                      sendTranscriptionToBackend(command)
                        .then(() => {
                          isProcessingRef.current = false;
                        })
                        .catch((error) => {
                          console.error("Error sending transcription to backend:", error);
                          isProcessingRef.current = false;
                        });

                      fullTranscriptionRef.current = '';
                    }
                  }
                }
              }
            }
          } catch (error) {
            console.error("Error in 'data' event handler:", error);
          }
        });

        stream.on('error', (err) => {
          console.error("Error with Watson Speech to Text stream:", err);
          setIsListening(false);
          isListeningRef.current = false;
        });

        stream.on('close', () => {
          console.log("Speech to Text stream closed");
          setIsListening(false);
          isListeningRef.current = false;
        });

        stream.on('connection-close', () => {
          console.log("Speech to Text connection closed");
          setIsListening(false);
          isListeningRef.current = false;
        });
      } catch (error) {
        console.error("Error starting Speech to Text:", error);
        setIsListening(false);
        isListeningRef.current = false;
      }
    };

    startVoiceListener();

    return () => {
      console.log("Cleaning up VoiceListener component...");
      if (streamRef.current) {
        streamRef.current.stop();
        streamRef.current = null;
        console.log("Speech-to-text stream stopped");
        setIsListening(false);
        isListeningRef.current = false;
      }
    };
  }, [sendTranscriptionToBackend]); // Include sendTranscriptionToBackend in dependencies


  return (
    <div>
      <p>Listening for commands...</p>
      <p>Current transcription: {transcription}</p>
    </div>
  );
}

export default VoiceListener;

// // VoiceListener.js
// import React, { useEffect, useRef, useState } from 'react';
// import * as WatsonSpeech from 'watson-speech';

// function VoiceListener() {
//   const streamRef = useRef(null);
//   const isListeningRef = useRef(false);
//   const isProcessingRef = useRef(false);
//   const fullTranscriptionRef = useRef('');

//   const [transcription, setTranscription] = useState('');
//   const accessTokenRef = useRef('');
//   const serviceUrlRef = useRef('');
//   const ttsAccessTokenRef = useRef('');
//   const ttsServiceUrlRef = useRef('');

//   useEffect(() => {
//     const startVoiceListener = async () => {
//       console.log("VoiceListener component mounted");

//       try {
//         console.log("Attempting to fetch IAM token and service URL from backend...");
//         // Fetch the IAM token and service URL from the backend
//         const response = await fetch('http://localhost:5000/api/speech-to-text-token');

//         console.log("Received response from token endpoint:", response);

//         if (!response.ok) {
//           throw new Error(`Failed to fetch token: ${response.status} (${response.statusText})`);
//         }

//         const data = await response.json();
//         console.log("Token endpoint response data:", data);

//         const accessToken = data.accessToken;
//         const serviceUrl = data.serviceUrl;

//         if (!accessToken || !serviceUrl) {
//           throw new Error("Access token or service URL is missing in the response");
//         }

//         console.log("Access token and service URL obtained successfully");

//         // Save the tokens in refs for later use
//         accessTokenRef.current = accessToken;
//         serviceUrlRef.current = serviceUrl;

//         // Fetch the Text to Speech token and service URL from the backend
//         console.log("Attempting to fetch Text to Speech IAM token and service URL from backend...");
//         const ttsResponse = await fetch('http://localhost:5000/api/text-to-speech-token');

//         console.log("Received response from Text to Speech token endpoint:", ttsResponse);

//         if (!ttsResponse.ok) {
//           throw new Error(`Failed to fetch Text to Speech token: ${ttsResponse.status} (${ttsResponse.statusText})`);
//         }

//         const ttsData = await ttsResponse.json();
//         console.log("Text to Speech token endpoint response data:", ttsData);

//         const ttsAccessToken = ttsData.accessToken;
//         const ttsServiceUrl = ttsData.serviceUrl;

//         if (!ttsAccessToken || !ttsServiceUrl) {
//           throw new Error("Text to Speech access token or service URL is missing in the response");
//         }

//         console.log("Text to Speech access token and service URL obtained successfully");

//         // Save the tokens in refs for later use
//         ttsAccessTokenRef.current = ttsAccessToken;
//         ttsServiceUrlRef.current = ttsServiceUrl;

//         // Test microphone access before initializing the stream
//         console.log("Checking microphone access...");
//         await navigator.mediaDevices.getUserMedia({ audio: true });
//         console.log("Microphone access granted");

//         // Set up Speech to Text service
//         console.log("Initializing the speech-to-text stream...");
//         const stream = WatsonSpeech.SpeechToText.recognizeMicrophone({
//           accessToken: accessTokenRef.current,
//           url: serviceUrlRef.current,
//           interimResults: true,
//           objectMode: true,
//           format: true,
//           inactivity_timeout: -1, // Keep the connection alive
//         });

//         console.log("Speech-to-text stream initialized");

//         // Save the stream reference
//         streamRef.current = stream;

//         // Handle transcription data
//         console.log("Attaching event listeners to the stream...");
//         stream.on('data', (data) => {
//           try {
//             console.log("Received data from Watson Speech to Text:", data);

//             if (
//               data.results &&
//               data.results[0] &&
//               data.results[0].alternatives &&
//               data.results[0].alternatives[0]
//             ) {
//               const transcript = data.results[0].alternatives[0].transcript.trim();
//               const isFinal = data.results[0].final;

//               console.log("Transcript received:", transcript, "Is final:", isFinal);

//               // Update the live transcription
//               setTranscription(transcript);

//               const lowerTranscript = transcript.toLowerCase();

//               if (!isProcessingRef.current) {
//                 if (!isListeningRef.current) {
//                   // Not currently listening for a command
//                   if (lowerTranscript.includes("hi")) {
//                     console.log("Wake word detected");
//                     isListeningRef.current = true;
//                     fullTranscriptionRef.current = '';
//                   }
//                 } else {
//                   // Currently listening for a command
//                   if (isFinal) {
//                     // Accumulate only final transcriptions to avoid duplicates
//                     fullTranscriptionRef.current += ' ' + transcript;
//                     console.log("Accumulated transcription:", fullTranscriptionRef.current.trim());

//                     if (lowerTranscript.includes("please")) {
//                       console.log("Stop word detected");
//                       isListeningRef.current = false;
//                       isProcessingRef.current = true; // Start processing

//                       // Remove the "please" from the transcription
//                       const command = fullTranscriptionRef.current.replace(/please/gi, '').trim();
//                       console.log("Final command to send to backend:", command);

//                       // Send transcription to backend
//                       sendTranscriptionToBackend(command)
//                         .then(() => {
//                           isProcessingRef.current = false; // Finished processing
//                         })
//                         .catch((error) => {
//                           console.error("Error sending transcription to backend:", error);
//                           isProcessingRef.current = false; // Allow new commands even if there's an error
//                         });

//                       // Reset full transcription
//                       fullTranscriptionRef.current = '';
//                     }
//                   }
//                 }
//               }
//             } else {
//               console.warn("No transcript available in the data received.");
//             }
//           } catch (error) {
//             console.error("Error in 'data' event handler:", error);
//           }
//         });

//         stream.on('error', (err) => {
//           console.error("Error with Watson Speech to Text stream:", err);
//         });

//         stream.on('close', (event) => {
//           console.log("Speech to Text stream closed:", event);
//         });

//         stream.on('connection-close', (event) => {
//           console.log("Speech to Text connection closed:", event);
//         });

//         console.log("Event listeners attached");
//       } catch (error) {
//         console.error("Error starting Speech to Text:", error);
//       }
//     };

//     startVoiceListener();

//     // Cleanup function to stop the stream when component unmounts
//     return () => {
//       console.log("Cleaning up VoiceListener component...");
//       if (streamRef.current) {
//         streamRef.current.stop();
//         streamRef.current = null;
//         console.log("Speech-to-text stream stopped");
//       }
//     };
//   }, []);

//   const sendTranscriptionToBackend = async (transcript) => {
//     console.log("Sending transcription to backend:", transcript);
//     try {
//       const response = await fetch('http://localhost:5000/api/receive-transcript', {
//         method: 'POST',
//         headers: { 'Content-Type': 'application/json' },
//         body: JSON.stringify({ transcript }),
//       });

//       if (!response.ok) {
//         const errorText = await response.text();
//         throw new Error(`Server error: ${response.status} - ${errorText}`);
//       }

//       const data = await response.json();
//       console.log("Backend response:", data);

//       if (data.status === 'success') {
//         const assistantReply = data.response;
//         // Trigger Text to Speech
//         playAssistantReply(assistantReply);
//       }
//     } catch (error) {
//       console.error("Error sending transcription to backend:", error);
//       throw error; // Re-throw the error so the caller can handle it
//     }
//   };

//   const playAssistantReply = (text) => {
//     console.log("Playing assistant's reply:", text);

//     // Use Watson Speech SDK to synthesize the text
//     const audioStream = WatsonSpeech.TextToSpeech.synthesize({
//       text: text,
//       accessToken: ttsAccessTokenRef.current,
//       url: ttsServiceUrlRef.current,
//       voice: 'en-US_AllisonV3Voice', // Or any other available voice
//     });

//     audioStream.on('error', (err) => {
//       console.error('Error during text-to-speech synthesis:', err);
//     });

//     // Create an audio element to play the synthesized speech
//     const audioElement = audioStream instanceof Blob ? new Audio(URL.createObjectURL(audioStream)) : new Audio();
//     audioElement.src = window.URL.createObjectURL(audioStream);
//     audioElement.play();
//   };

//   return (
//     <div>
//       <p>Listening for commands...</p>
//       <p>Current transcription: {transcription}</p>
//     </div>
//   );
// }

// export default VoiceListener;
