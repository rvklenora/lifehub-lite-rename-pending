import React from 'react';

function ReminderSettings({ setActivePage }) {
    return (
        <div>
            <h2>Set Reminder</h2>
            <p>Reminder settings and options go here.</p>
            <button onClick={() => setActivePage('dashboard')}>Back to Dashboard</button>
        </div>
    );
}

export default ReminderSettings;
