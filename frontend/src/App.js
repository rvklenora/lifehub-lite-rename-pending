import React, { useState } from 'react';
import Dashboard from './components/Dashboard';
import ReminderSettings from './components/ReminderSettings';
import CheckInPrompt from './components/CheckInPrompts';
import SOSAlert from './components/SOSAlerts';
import './App.css';

function App() {
    const [activePage, setActivePage] = useState('dashboard');

    return (
        <div className="App">
            <h1>LifeHub Lite</h1>
            {activePage === 'dashboard' && <Dashboard setActivePage={setActivePage} />}
            {activePage === 'reminder' && <ReminderSettings setActivePage={setActivePage} />}
            {activePage === 'checkin' && <CheckInPrompt setActivePage={setActivePage} />}
            {activePage === 'sos' && <SOSAlert setActivePage={setActivePage} />}
        </div>
    );
}

export default App;
