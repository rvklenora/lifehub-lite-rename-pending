// VoiceListener.js
import React, { useState, useRef } from 'react';
import * as WatsonSpeech from 'watson-speech';

function VoiceListener({ setActivePage }) {
  const [isRecording, setIsRecording] = useState(false);
  const [transcription, setTranscription] = useState('');
  const [isError, setIsError] = useState(false);
  const streamRef = useRef(null);

  const handleVoiceCommand = async () => {
    if (isRecording) {
      setIsRecording(false);
      console.log("Recording stopped");
      if (streamRef.current) {
        streamRef.current.stop();
        streamRef.current = null;
      }
      return;
    }

    setIsRecording(true);
    console.log("Recording started");

    try {
      // Fetch the IAM token and service URL from the backend
      const response = await fetch('http://localhost:5000/api/speech-to-text-token');

      if (!response.ok) {
        throw new Error(`Failed to fetch token: ${response.statusText}`);
      }

      const data = await response.json();
      const accessToken = data.accessToken;
      const serviceUrl = data.serviceUrl;

      if (!accessToken || !serviceUrl) {
        throw new Error("Access token or service URL is missing in the response");
      }

      console.log("Received access token and service URL from backend:", accessToken, serviceUrl);

      // Set up Speech to Text service
      const stream = WatsonSpeech.SpeechToText.recognizeMicrophone({
        accessToken: accessToken,
        url: serviceUrl,
        objectMode: true, // Ensure data comes in as objects
        interimResults: true,
        format: true,     // Set format to true to get JSON transcripts
      });

      // Save the stream reference
      streamRef.current = stream;

      // Handle transcription data
      stream.on('data', (data) => {
        console.log("Received data from Watson Speech to Text:", data);

        // Check for errors and warnings
        if (data.error) {
          console.error("Error from Watson Speech to Text:", data.error);
          setIsError(true);
          setIsRecording(false);
          return;
        }

        if (data.warnings && data.warnings.length > 0) {
          console.warn("Warnings from Watson Speech to Text:", data.warnings);
        }

        // Process the transcript if available
        if (
          data.results &&
          data.results[0] &&
          data.results[0].alternatives &&
          data.results[0].alternatives[0]
        ) {
          const transcript = data.results[0].alternatives[0].transcript.trim();
          console.log("Transcript received:", transcript);
          setTranscription((prev) => prev + ' ' + transcript);

          // If the result is final, process the transcript
          if (data.results[0].final) {
            console.log("Final transcript:", transcript);

            // Process transcription text with Watson Assistant
            processTranscript(transcript);
          }
        } else {
          console.warn("No transcript available in the data received.");
        }
      });

      // Handle errors
      stream.on('error', (err) => {
        console.error("Error with Watson Speech to Text:", err);
        setIsError(true);
        setIsRecording(false);
      });

    } catch (error) {
      console.error("Error starting Speech to Text:", error);
      setIsError(true);
      setIsRecording(false);
    }
  };

  const processTranscript = async (transcript) => {
    console.log("Processing transcript:", transcript);
    try {
      console.log("Sending transcription to backend for NLP:", transcript);
      const commandResponse = await fetch('http://localhost:5000/api/process-command', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: transcript }),
      });

      const { intent } = await commandResponse.json();
      console.log("Received intent from Watson Assistant:", intent);

      if (intent === 'set_reminder') {
        setActivePage('reminder');
      } else if (intent === 'sos') {
        setActivePage('sos');
      } else {
        console.log("Unknown intent received:", intent);
      }
    } catch (error) {
      console.error("Error processing transcript:", error);
      setIsError(true);
    }
  };

  return (
    <div>
      <button onClick={handleVoiceCommand}>
        {isRecording ? 'Stop' : 'Start'} Voice Command
      </button>
      {isError && (
        <p>Error occurred during speech-to-text or NLP processing. Please try again.</p>
      )}
      <p>Transcription: {transcription}</p>
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
