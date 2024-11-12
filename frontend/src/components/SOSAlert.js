import React from 'react';

function SOSAlert({ setActivePage }) {
    const handleSOS = () => {
        // Handle the SOS alert (e.g., send message to emergency contact)
        console.log("SOS Alert Triggered!");
        alert("SOS Alert Sent!");
        setActivePage('dashboard');
    };

    return (
        <div>
            <h2>SOS Alert</h2>
            <p>Press the button below to send an SOS alert to your emergency contacts.</p>
            <button onClick={handleSOS}>Send SOS Alert</button>
            <button onClick={() => setActivePage('dashboard')}>Back to Dashboard</button>
        </div>
    );
}

export default SOSAlert;
