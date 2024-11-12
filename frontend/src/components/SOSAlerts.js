import React from 'react';

function SOSAlert({ setActivePage }) {
    const handleSOSAlert = () => {
        // Placeholder for SOS alert functionality (API call will go here)
        alert('SOS Alert triggered!');
    };

    return (
        <div>
            <h2>SOS Alert</h2>
            <p>If you need assistance, click the button below to send an alert to your emergency contact.</p>
            <button onClick={handleSOSAlert} className="large-button">Send SOS Alert</button>
            <button onClick={() => setActivePage('dashboard')} className="large-button">Back to Dashboard</button>
        </div>
    );
}

export default SOSAlert;
