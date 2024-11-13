import React from 'react';

function SOSAlert({ setActivePage }) {
    const handleSOS = () => {
        // Data to send to the backend
        const sosData = {
            message: 'SOS Alert triggered!',
            timestamp: new Date().toISOString()
        };

        // Send data to the backend
        fetch('http://localhost:5000/sos', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(sosData)
        })
        .then(response => response.json())
        .then(data => {
            console.log('Backend Response:', data);
            alert('SOS Alert Sent!');
            setActivePage('dashboard');
        })
        .catch(error => {
            console.error('Error:', error);
        });
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
