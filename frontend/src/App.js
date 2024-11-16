// App.js
import React, { useState, useEffect, useRef } from 'react';
import Dashboard from './components/Dashboard';
import ReminderSettings from './components/ReminderSettings';
import CheckInPrompt from './components/CheckInPrompt';
import SOSAlert from './components/SOSAlert';
import VoiceListener from './components/VoiceListener';
import Footer from './components/Footer';
import './App.css';

function App() {
    const [activePage, setActivePage] = useState('dashboard');
    const [isListening, setIsListening] = useState(false);
    const [isCameraOpen, setIsCameraOpen] = useState(false);
    const [cameraStream, setCameraStream] = useState(null);
    const videoRef = useRef(null);

    useEffect(() => {
        // Initialize camera after the video element is rendered
        if (isCameraOpen && videoRef.current) {
            initializeCamera();
        }
    }, [isCameraOpen]);

    const handleSettingsClick = () => {
        setActivePage('settings');
        console.log("Navigating to settings page...");
    };

    const openCamera = () => {
        console.log("Requesting camera access...");
        setIsCameraOpen(true);
    };

    const initializeCamera = async () => {
        try {
            if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
                alert("Your browser does not support camera access.");
                return;
            }

            const stream = await navigator.mediaDevices.getUserMedia({ video: true });
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
                videoRef.current.play();
                setCameraStream(stream);
                console.log("Camera feed started");
            } else {
                console.error("videoRef is null. Unable to access the video element.");
            }
        } catch (error) {
            console.error("Error accessing the camera:", error);

            if (error.name === 'NotAllowedError') {
                alert("Camera access was denied. Please allow access to the camera.");
            } else if (error.name === 'NotFoundError') {
                alert("No camera device found. Please check your camera connection.");
            } else {
                alert(`Failed to access the camera: ${error.message}`);
            }

            setIsCameraOpen(false);
        }
    };

    const closeCamera = () => {
        if (videoRef.current) {
            videoRef.current.pause();
            videoRef.current.srcObject = null;
        }

        if (cameraStream) {
            cameraStream.getTracks().forEach((track) => track.stop());
            setCameraStream(null);
        }

        setIsCameraOpen(false);
        console.log("Camera feed stopped");
    };

    const renderListeningBanner = () => (
        isListening && (
            <div className="listening-banner">
                <p>LifeHub is listening...</p>
            </div>
        )
    );

    const renderGridLayout = () => (
        <div className="grid-container">
            <div className="grid-tile biographic-info">
                <h3>Biographic Info</h3>
                <p>(Placeholder)</p>
            </div>
            <div className="grid-tile health-status">
                <h3>Health Status</h3>
            </div>
            <div className="grid-tile calendar-scheduling">
                <h3>Calendar & Scheduling</h3>
            </div>
            <div className="grid-tile biographic-info-extension">
                <h3>Biographic Info (Continued)</h3>
            </div>
            <div className="grid-tile sos-alert">
                <SOSAlert />
            </div>
            <div className="grid-tile daily-reminders">
                <ReminderSettings />
            </div>
            <div className="grid-tile placeholder-tile">
                <h3>Placeholder Tile</h3>
            </div>
            <div className="grid-tile check-in-prompt">
                <CheckInPrompt />
            </div>
            <div className="grid-tile dashboard-tile">
                <Dashboard />
            </div>
        </div>
    );

    return (
        <div className="App">
            {renderListeningBanner()}
            <VoiceListener setActivePage={setActivePage} setIsListening={setIsListening} />
            {renderGridLayout()}

            {/* Camera Feed */}
            {isCameraOpen && (
                <div className="camera-container">
                    <video ref={videoRef} className="camera-feed" autoPlay muted playsInline></video>
                    <button className="close-camera-button" onClick={closeCamera}>Close Camera</button>
                </div>
            )}

            <Footer onSettingsClick={handleSettingsClick} onCameraClick={openCamera} />
        </div>
    );
}

export default App;
