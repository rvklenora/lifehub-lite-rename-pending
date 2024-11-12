import React from 'react';

function Dashboard({ setActivePage }) {
    return (
        <div>
            <h2>Main Dashboard</h2>
            <button className="large-button" onClick={() => setActivePage('reminder')}>Set a Reminder</button>
            <button className="large-button" onClick={() => setActivePage('checkin')}>Wellness Check-In</button>
            <button className="large-button" onClick={() => setActivePage('sos')}>SOS Alert</button>
        </div>
    );
}

export default Dashboard;
