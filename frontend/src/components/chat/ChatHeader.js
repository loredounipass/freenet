import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

/**
 * Generates a deterministic avatar color based on a name string.
 */
const getAvatarColor = (name) => {
  const colors = ['#2186EB', '#F6851B', '#3C3C3B', '#4CAF50', '#E91E63', '#9C27B0', '#FF5722'];
  const charCode = name ? name.charCodeAt(0) : 0;
  return colors[charCode % colors.length];
};

/**
 * ChatHeader - Header bar for the individual chat view.
 *
 * Props:
 *  - user: { firstName, lastName, email } - the other user in the chat
 *  - connected: boolean - socket connection status
 */
export default function ChatHeader({ user, connected }) {
  const navigate = useNavigate();
  const { t } = useTranslation();

  const firstName = user?.firstName || '';
  const lastName = user?.lastName || '';
  const fullName = `${firstName} ${lastName}`.trim() || user?.email || 'Usuario';
  const initial = firstName ? firstName.charAt(0).toUpperCase() : '?';

  return (
    <header className="chat-header">
      <button className="chat-back" aria-label={t('chat.back')} onClick={() => navigate('/chat')}>
        {/* arrow */}
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M15 18l-6-6 6-6" stroke="#333" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
      </button>

      <div className="chat-avatar" style={{ backgroundColor: getAvatarColor(firstName) }}>{initial}</div>

      <div className="chat-meta">
        <div className="chat-name">{fullName}</div>
        <div className="chat-status">{connected ? t('chat.connected') : t('chat.disconnected')}</div>
      </div>
    </header>
  );
}