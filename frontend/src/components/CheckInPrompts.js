import React, { useState } from 'react';

function CheckInPrompt({ setActivePage }) {
    const [response, setResponse] = useState('');

    const handleCheckInResponse = () => {
        // Placeholder for submitting response (API call will go here)
        alert(`Check-in response submitted: ${response}`);
        setResponse('');
    };

    return (
        <div>
            <h2>How are you feeling today?</h2>
            <textarea
                value={response}
                onChange={(e) => setResponse(e.target.value)}
                placeholder="Your response..."
            />
            <br />
            <button onClick={handleCheckInResponse} className="large-button">Submit</button>
            <button onClick={() => setActivePage('dashboard')} className="large-button">Back to Dashboard</button>
        </div>
    );
}

export default CheckInPrompt;
