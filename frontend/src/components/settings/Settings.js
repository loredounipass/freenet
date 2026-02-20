import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import ChangePasswordComponent from './ChangePasswordComponent';
import TwoFactorAuthComponent from './TwoFactorAuthComponent';
import LanguageSelectorComponent from './LanguageSelectorComponent';
import UserProfileComponent from './UserProfileComponent'; 
import VerifyEmailComponent from './VerifyEmailComponent'; 
import LockIcon from '@mui/icons-material/Lock';
import SecurityIcon from '@mui/icons-material/Security';
import LanguageIcon from '@mui/icons-material/Language';
import PersonIcon from '@mui/icons-material/Person';
import ArrowBackIcon from '@mui/icons-material/ArrowBack'; 
import SettingsIcon from '@mui/icons-material/Settings'; 
import { Link } from 'react-router-dom';

const sections = [
    { id: 'userProfile', label: 'user_profile', icon: <PersonIcon /> },
    { id: 'changePassword', label: 'change_password', icon: <LockIcon /> },
    { id: 'twoFactorAuth', label: 'two_factor_auth', icon: <SecurityIcon /> },
    { id: 'languageSelector', label: 'language_selector', icon: <LanguageIcon /> },
    { id: 'verifyEmail', label: 'verify_email', icon: <SecurityIcon /> },
];

const renderSection = (selectedSection) => {
    switch (selectedSection) {
        case 'userProfile': return <UserProfileComponent />;
        case 'changePassword': return <ChangePasswordComponent />;
        case 'twoFactorAuth': return <TwoFactorAuthComponent />;
        case 'languageSelector': return <LanguageSelectorComponent />;
        case 'verifyEmail': return <VerifyEmailComponent />;
        default: return null;
    }
};

function Settings() {
    const { t } = useTranslation(); 
    const [selectedSection, setSelectedSection] = useState('userProfile');

    return (
        <div className="settings-container">
            <div className="settings-card">
                {/* Sidebar */}
                <div className="settings-sidebar">
                    <ul className="sidebar-list">
                        {sections.map(({ id, label, icon }) => (
                            <li key={id}>
                                <button
                                    onClick={() => setSelectedSection(id)}
                                    className={`sidebar-btn ${selectedSection === id ? 'active' : ''}`}
                                >
                                    <span className="sidebar-icon">{icon}</span>
                                    <span className="sidebar-text">
                                        {t(label)}
                                    </span>
                                </button>
                            </li>
                        ))}
                        
                        <li className="sidebar-bottom-item">
                            <Link
                                to="/"
                                className="sidebar-btn"
                            >
                                <span className="sidebar-icon"><ArrowBackIcon /></span>
                                <span className="sidebar-text">
                                    {t('go_back')}
                                </span>
                            </Link>
                        </li>
                    </ul>
                </div>

                {/* Main Content */}
                <div className="settings-content">
                    <div className="settings-header">
                        <SettingsIcon className="settings-header-icon" />
                        <h1 className="settings-title">
                            {t('settings_title')}
                        </h1>
                    </div>
                    
                    <div style={{ marginTop: '1rem' }}>
                        {renderSection(selectedSection)}
                    </div>
                </div>
            </div>
        </div>
    );
}

export default Settings;
