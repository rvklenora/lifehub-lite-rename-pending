import React, { useState } from 'react';

function CheckInPrompt({ setActivePage }) {
    const [mood, setMood] = useState('');

    const handleMoodChange = (e) => {
        setMood(e.target.value);
    };

    const handleSubmit = () => {
        // Handle the mood submission (e.g., send to backend or store locally)
        console.log(`User mood: ${mood}`);
        setActivePage('dashboard');
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
