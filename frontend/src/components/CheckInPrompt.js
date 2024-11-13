import React, { useState } from 'react';

function CheckInPrompt({ setActivePage }) {
    const [mood, setMood] = useState('');

    const handleMoodChange = (e) => {
        setMood(e.target.value);
    };

    const handleSubmit = () => {
        // Data to send to the backend
        const checkInData = {
            mood,
            timestamp: new Date().toISOString()
        };

        // Send data to the backend
        fetch('http://localhost:5000/checkin', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(checkInData)
        })
        .then(response => response.json())
        .then(data => {
            console.log('Backend Response:', data);
            setMood('');  // Clear the mood input after submission
            setActivePage('dashboard');
        })
        .catch(error => {
            console.error('Error:', error);
        });
    };

    return (
        <div>
            <h2>Check-In</h2>
            <p>How are you feeling today?</p>
            <input
                type="text"
                value={mood}
                onChange={handleMoodChange}
                placeholder="Enter your mood"
            />
            <button onClick={handleSubmit}>Submit</button>
            <button onClick={() => setActivePage('dashboard')}>Back to Dashboard</button>
        </div>
    );
}

export default CheckInPrompt;
