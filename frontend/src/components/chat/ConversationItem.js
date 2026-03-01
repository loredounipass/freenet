import React from 'react';
import { useTranslation } from 'react-i18next';

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

/** Formats a date for conversation list display. */
const formatConversationTime = (dateStr, t) => {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  if (date >= today) return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  if (date >= yesterday) return t('chat.yesterday');
  return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
};

/** Returns a preview string for the last message. */
const getMessagePreview = (message, isOwnMessage, t) => {
  if (!message) return '';
  const prefix = isOwnMessage ? `${t('chat.you')}: ` : '';
  switch (message.type) {
    case 'image': return `${prefix}📷 ${t('chat.photo')}`;
    case 'video': return `${prefix}🎥 ${t('chat.video')}`;
    case 'audio': return `${prefix}🎵 ${t('chat.audio')}`;
    default:      return `${prefix}${message.content || ''}`;
  }
};

/**
 * ConversationItem - A single row in the conversation list.
 *
 * Props:
 *  - conversation: { userId, firstName, lastName, email, lastMessage, unreadCount }
 *  - selected: boolean
 *  - currentUserId: string
 *  - onClick: () => void
 */
export default function ConversationItem({ conversation, selected, currentUserId, onClick, profilePhotoUrl }) {
  const { t } = useTranslation();

  const { firstName = '', lastName = '', lastMessage, unreadCount = 0 } = conversation;
  const fullName = `${firstName} ${lastName}`.trim() || conversation.email || 'Usuario';
  const initial = firstName ? firstName.charAt(0).toUpperCase() : '?';
  const isOwnMessage = lastMessage?.sender === currentUserId;
  const hasUnread = unreadCount > 0;

  return (
    <div
      className={`conv-item${selected ? ' selected' : ''}`}
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && onClick()}
    >
      {/* Avatar */}
      <div
        className="conv-item-avatar"
        style={{ background: getAvatarGradient(firstName) }}
      >
        {profilePhotoUrl ? <img src={profilePhotoUrl} alt={fullName} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} /> : initial}
      </div>

      {/* Body */}
      <div className="conv-item-body">
        <div className="conv-item-top">
          <span className={`conv-item-name${hasUnread ? ' unread' : ''}`}>
            {fullName}
          </span>
          <span className={`conv-item-time${hasUnread ? ' unread' : ''}`}>
            {formatConversationTime(lastMessage?.createdAt, t)}
          </span>
        </div>
        <div className="conv-item-bottom">
          <span className={`conv-item-preview${hasUnread ? ' unread' : ''}`}>
            {getMessagePreview(lastMessage, isOwnMessage, t)}
          </span>
          {hasUnread && (
            <span className="conv-unread-badge">{unreadCount}</span>
          )}
        </div>
      </div>
    </div>
  );
}