import React, { useState } from 'react';

function ReminderSettings({ setActivePage }) {
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [date, setDate] = useState('');
    const [time, setTime] = useState('');

    const handleSubmit = (e) => {
        e.preventDefault(); // Prevent default form submission
        console.log("Form Submitted");

        // Data to send to the backend
        const reminderData = {
            title,
            description,
            date,
            time
        };

        // Log the data being sent
        console.log('Reminder Data:', reminderData);

        // Send data to the backend
        fetch('http://localhost:5000/setreminder', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(reminderData)
        })
        .then(response => response.json())
        .then(data => {
            console.log('Backend Response:', data);
            // Clear the form fields after successful submission
            setTitle('');
            setDescription('');
            setDate('');
            setTime('');
            // Navigate back to dashboard
            setActivePage('dashboard');
        })
        .catch(error => {
            console.error('Error:', error);
        });
    };

    return (
        <div className="reminder-settings">
            <h2>Set a Reminder</h2>
            <form onSubmit={handleSubmit}>
                <div className="form-group">
                    <label htmlFor="title">Reminder Title</label>
                    <input
                        type="text"
                        id="title"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="Enter the reminder title"
                        required
                    />
                </div>

                <div className="form-group">
                    <label htmlFor="description">Description</label>
                    <textarea
                        id="description"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="Enter a description (optional)"
                    />
                </div>

                <div className="form-group">
                    <label htmlFor="date">Date</label>
                    <input
                        type="date"
                        id="date"
                        value={date}
                        onChange={(e) => setDate(e.target.value)}
                        required
                    />
                </div>

                <div className="form-group">
                    <label htmlFor="time">Time</label>
                    <input
                        type="time"
                        id="time"
                        value={time}
                        onChange={(e) => setTime(e.target.value)}
                        required
                    />
                </div>

                <div className="form-actions">
                    <button type="submit">Set Reminder</button>
                    <button type="button" onClick={() => setActivePage('dashboard')}>
                        Back to Dashboard
                    </button>
                </div>
            </form>
        </div>
    );
}

export default ReminderSettings;
