// Footer.js
import React from 'react';
import { FaCamera, FaCog, FaHeart } from 'react-icons/fa';
import '../App.css';

function Footer({ onSettingsClick, onCameraClick }) {
    return (
        <div className="footer">
            <div className="footer-left">
                <FaHeart className="footer-icon heart-icon" />
                <span className="footer-text">LIFEHUB</span>
            </div>

            <FaCamera className="footer-icon camera-icon" onClick={onCameraClick} />

            <FaCog className="footer-icon settings-icon" onClick={onSettingsClick} />
        </div>
    );
}

export default Footer;
