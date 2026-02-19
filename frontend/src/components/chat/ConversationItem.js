import React from 'react';
import {
  ListItemButton,
  ListItemAvatar,
  Avatar,
  ListItemText,
  Typography,
  Box,
  Badge,
} from '@mui/material';
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
 * Formats a date for conversation list display.
 * Shows time for today, "Yesterday" for yesterday, otherwise short date.
 */
const formatConversationTime = (dateStr, t) => {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  if (date >= today) {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }
  if (date >= yesterday) {
    return t('chat.yesterday');
  }
  return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
};

/**
 * Returns a preview string for the last message in a conversation.
 */
const getMessagePreview = (message, isOwnMessage, t) => {
  if (!message) return '';
  const prefix = isOwnMessage ? `${t('chat.you')}: ` : '';

  switch (message.type) {
    case 'image':
      return `${prefix}📷 ${t('chat.photo')}`;
    case 'video':
      return `${prefix}🎥 ${t('chat.video')}`;
    case 'audio':
      return `${prefix}🎵 ${t('chat.audio')}`;
    default:
      return `${prefix}${message.content || ''}`;
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
export default function ConversationItem({ conversation, selected, currentUserId, onClick }) {
  const { t } = useTranslation();

  const { firstName = '', lastName = '', lastMessage, unreadCount = 0 } = conversation;
  const fullName = `${firstName} ${lastName}`.trim() || conversation.email || 'Usuario';
  const initial = firstName ? firstName.charAt(0).toUpperCase() : '?';
  const isOwnMessage = lastMessage?.sender === currentUserId;

  return (
    <ListItemButton
      selected={selected}
      onClick={onClick}
      sx={{
        py: 1.5,
        px: 2,
        borderRadius: 2,
        mb: 0.5,
        '&.Mui-selected': {
          backgroundColor: 'rgba(33, 134, 235, 0.08)',
          '&:hover': {
            backgroundColor: 'rgba(33, 134, 235, 0.12)',
          },
        },
        '&:hover': {
          backgroundColor: 'rgba(0, 0, 0, 0.04)',
        },
      }}
    >
      <ListItemAvatar>
        <Avatar
          sx={{
            bgcolor: getAvatarColor(firstName),
            width: 48,
            height: 48,
            fontSize: 20,
            fontWeight: 'bold',
            color: '#fff',
          }}
        >
          {initial}
        </Avatar>
      </ListItemAvatar>

      <ListItemText
        disableTypography
        sx={{ ml: 0.5 }}
        primary={
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography
              variant="body1"
              sx={{
                fontWeight: unreadCount > 0 ? 700 : 500,
                color: '#333',
                fontSize: '0.95rem',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                maxWidth: '70%',
              }}
            >
              {fullName}
            </Typography>
            <Typography
              variant="caption"
              sx={{
                color: unreadCount > 0 ? '#2186EB' : '#9E9E9E',
                fontWeight: unreadCount > 0 ? 600 : 400,
                fontSize: '0.75rem',
                flexShrink: 0,
              }}
            >
              {formatConversationTime(lastMessage?.createdAt, t)}
            </Typography>
          </Box>
        }
        secondary={
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 0.3 }}>
            <Typography
              variant="body2"
              sx={{
                color: unreadCount > 0 ? '#333' : '#9E9E9E',
                fontWeight: unreadCount > 0 ? 500 : 400,
                fontSize: '0.85rem',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                maxWidth: '85%',
              }}
            >
              {getMessagePreview(lastMessage, isOwnMessage, t)}
            </Typography>
            {unreadCount > 0 && (
              <Badge
                badgeContent={unreadCount}
                color="primary"
                sx={{
                  '& .MuiBadge-badge': {
                    bgcolor: '#2186EB',
                    color: '#fff',
                    fontSize: '0.7rem',
                    minWidth: 20,
                    height: 20,
                  },
                }}
              />
            )}
          </Box>
        }
      />
    </ListItemButton>
  );
}