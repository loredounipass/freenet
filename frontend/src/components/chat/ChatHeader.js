import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { apiOrigin } from '../../api/http'

/** Generates a deterministic gradient based on a name. */
const getAvatarGradient = (name) => {
  const gradients = [
    'linear-gradient(135deg, #22c1c3, #1e90ff)',
    'linear-gradient(135deg, #f6851b, #e91e63)',
    'linear-gradient(135deg, #4caf50, #22c1c3)',
    'linear-gradient(135deg, #9c27b0, #1e90ff)',
    'linear-gradient(135deg, #ff5722, #f6851b)',
    'linear-gradient(135deg, #e91e63, #9c27b0)',
    'linear-gradient(135deg, #1e90ff, #4caf50)',
  ];
  const charCode = name ? name.charCodeAt(0) : 0;
  return gradients[charCode % gradients.length];
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
  function resolveProfilePhotoUrl(url) {
    if (!url) return null
    return url.startsWith('/') ? `${apiOrigin}${url}` : url
  }
  const profilePhoto = resolveProfilePhotoUrl(user?.profilePhotoUrl || user?.profilePhoto || user?.photoUrl || user?.photo || user?.avatarUrl)

  return (
    <header className="chat-header">
      <button className="chat-back" aria-label={t('chat.back')} onClick={() => navigate('/chat')}>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M15 18l-6-6 6-6"/>
        </svg>
      </button>

      <div
        className="chat-avatar"
        style={{ background: getAvatarGradient(firstName) }}
      >
        {profilePhoto ? <img src={profilePhoto} alt={fullName} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} /> : initial}
      </div>

      <div className="chat-meta">
        <div className="chat-name">{fullName}</div>
        <div className={`chat-status${connected ? ' online' : ''}`}>
          {connected ? t('chat.connected') : t('chat.disconnected')}
        </div>
      </div>
    </header>
  );
}