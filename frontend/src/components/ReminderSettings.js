import React, { useState } from 'react';

function ReminderSettings({ setActivePage }) {
    const [reminderText, setReminderText] = useState('');

    const handleSetReminder = () => {
        // Placeholder for setting a reminder (API call will go here)
        alert(`Reminder set: ${reminderText}`);
        setReminderText('');
    };

    return (
        <div>
            <h2>Set a Reminder</h2>
            <input
                type="text"
                value={reminderText}
                onChange={(e) => setReminderText(e.target.value)}
                placeholder="Enter reminder text here"
            />
            <br />
            <button onClick={handleSetReminder} className="large-button">Set Reminder</button>
            <button onClick={() => setActivePage('dashboard')} className="large-button">Back to Dashboard</button>
        </div>
    );
}

export default ReminderSettings;
