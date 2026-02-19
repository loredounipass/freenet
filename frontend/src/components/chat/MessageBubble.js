import React from 'react';
import { Box, Typography } from '@mui/material';
import DoneAllIcon from '@mui/icons-material/DoneAll';
import DoneIcon from '@mui/icons-material/Done';

/**
 * Formats a message timestamp to HH:MM.
 */
const formatTime = (dateStr) => {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

/**
 * Returns a status icon based on message delivery status.
 */
const StatusIcon = ({ status }) => {
  if (status === 'read') {
    return <DoneAllIcon sx={{ fontSize: 14, color: '#2186EB', ml: 0.5 }} />;
  }
  if (status === 'delivered') {
    return <DoneAllIcon sx={{ fontSize: 14, color: '#9E9E9E', ml: 0.5 }} />;
  }
  return <DoneIcon sx={{ fontSize: 14, color: '#9E9E9E', ml: 0.5 }} />;
};

/**
 * MessageBubble - Renders a single chat message bubble.
 *
 * Props:
 *  - message: { _id, content, type, sender, receiver, status, createdAt, multimediaUrl }
 *  - isOwn: boolean - whether the current user sent this message
 *  - showTail: boolean - whether to show the bubble tail (first message in a group)
 */
export default function MessageBubble({ message, isOwn, showTail = true }) {
  const { content, type, status, createdAt, multimediaUrl } = message;

  const renderContent = () => {
    switch (type) {
      case 'image':
        return (
          <Box>
            {multimediaUrl && (
              <Box
                component="img"
                src={multimediaUrl}
                alt="shared"
                sx={{
                  maxWidth: 250,
                  maxHeight: 300,
                  borderRadius: 2,
                  objectFit: 'cover',
                  display: 'block',
                  mb: content ? 0.5 : 0,
                }}
              />
            )}
            {content && (
              <Typography
                variant="body2"
                sx={{
                  color: isOwn ? '#fff' : '#333',
                  fontSize: '0.9rem',
                  lineHeight: 1.4,
                  wordBreak: 'break-word',
                }}
              >
                {content}
              </Typography>
            )}
          </Box>
        );

      case 'video':
        return (
          <Box>
            {multimediaUrl && (
              <Box
                component="video"
                src={multimediaUrl}
                controls
                sx={{
                  maxWidth: 280,
                  borderRadius: 2,
                  display: 'block',
                  mb: content ? 0.5 : 0,
                }}
              />
            )}
            {content && (
              <Typography
                variant="body2"
                sx={{ color: isOwn ? '#fff' : '#333', fontSize: '0.9rem', wordBreak: 'break-word' }}
              >
                {content}
              </Typography>
            )}
          </Box>
        );

      case 'audio':
        return (
          <Box>
            {multimediaUrl && (
              <Box component="audio" src={multimediaUrl} controls sx={{ maxWidth: 250, display: 'block', mb: content ? 0.5 : 0 }} />
            )}
            {content && (
              <Typography
                variant="body2"
                sx={{ color: isOwn ? '#fff' : '#333', fontSize: '0.9rem', wordBreak: 'break-word' }}
              >
                {content}
              </Typography>
            )}
          </Box>
        );

      default:
        return (
          <Typography
            variant="body2"
            sx={{
              color: isOwn ? '#fff' : '#333',
              fontSize: '0.9rem',
              lineHeight: 1.4,
              wordBreak: 'break-word',
            }}
          >
            {content}
          </Typography>
        );
    }
  };

  return (
    <Box
      sx={{
        display: 'flex',
        justifyContent: isOwn ? 'flex-end' : 'flex-start',
        mb: showTail ? 0.8 : 0.3,
        px: 1,
      }}
    >
      <Box
        sx={{
          maxWidth: '75%',
          bgcolor: isOwn ? '#2186EB' : '#F0F0F0',
          color: isOwn ? '#fff' : '#333',
          borderRadius: isOwn
            ? showTail
              ? '16px 16px 4px 16px'
              : '16px 4px 4px 16px'
            : showTail
              ? '16px 16px 16px 4px'
              : '4px 16px 16px 4px',
          px: 1.5,
          py: 1,
          position: 'relative',
        }}
      >
        {renderContent()}

        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-end',
            mt: 0.3,
            gap: 0.3,
          }}
        >
          <Typography
            variant="caption"
            sx={{
              color: isOwn ? 'rgba(255,255,255,0.7)' : '#9E9E9E',
              fontSize: '0.68rem',
              lineHeight: 1,
            }}
          >
            {formatTime(createdAt)}
          </Typography>
          {isOwn && <StatusIcon status={status} />}
        </Box>
      </Box>
    </Box>
  );
}