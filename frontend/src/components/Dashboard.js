import React from 'react';

function Dashboard({ setActivePage }) {
    const handleNavigation = (page) => {
        console.log(`Navigating to ${page}`);
        setActivePage(page);
    };

    return (
        <div>
            <h2>Dashboard</h2>
            <button onClick={() => handleNavigation('reminder')}>Set Reminder</button>
            <button onClick={() => handleNavigation('checkin')}>Check-In</button>
            <button onClick={() => handleNavigation('sos')}>SOS Alert</button>
        </div>
    );
}

export default Dashboard;
