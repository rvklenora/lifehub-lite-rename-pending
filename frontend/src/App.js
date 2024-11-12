import React, { useState, useEffect } from 'react';
import Dashboard from './components/Dashboard';
import ReminderSettings from './components/ReminderSettings';
import CheckInPrompt from './components/CheckInPrompt';
import SOSAlert from './components/SOSAlert';
import VoiceListener from './components/VoiceListener';
import './App.css';

function App() {
    const [activePage, setActivePage] = useState('dashboard');

    useEffect(() => {
        console.log("Current active page:", activePage); // Log active page state changes
    }, [activePage]);

    return (
        <div className="App">
            <h1>LifeHub Lite</h1>
            <VoiceListener setActivePage={setActivePage} />
            {activePage === 'dashboard' && <Dashboard setActivePage={setActivePage} />}
            {activePage === 'reminder' && <ReminderSettings setActivePage={setActivePage} />}
            {activePage === 'checkin' && <CheckInPrompt setActivePage={setActivePage} />}
            {activePage === 'sos' && <SOSAlert setActivePage={setActivePage} />}
        </div>
    );
}

export default App;
