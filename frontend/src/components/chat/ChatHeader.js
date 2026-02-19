import React from 'react';
import { Box, Typography, IconButton, Avatar } from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
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
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        px: 2,
        py: 1.2,
        bgcolor: '#fff',
        borderBottom: '1px solid #E0E0E0',
        position: 'sticky',
        top: 0,
        zIndex: 10,
      }}
    >
      <IconButton
        onClick={() => navigate('/chat')}
        sx={{ mr: 1, color: '#333' }}
        aria-label={t('chat.back')}
      >
        <ArrowBackIcon />
      </IconButton>

      <Avatar
        sx={{
          bgcolor: getAvatarColor(firstName),
          width: 40,
          height: 40,
          fontSize: 18,
          fontWeight: 'bold',
          color: '#fff',
          mr: 1.5,
        }}
      >
        {initial}
      </Avatar>

      <Box sx={{ flexGrow: 1 }}>
        <Typography
          variant="body1"
          sx={{ fontWeight: 600, color: '#333', fontSize: '1rem', lineHeight: 1.2 }}
        >
          {fullName}
        </Typography>
        <Typography
          variant="caption"
          sx={{
            color: connected ? '#4CAF50' : '#9E9E9E',
            fontSize: '0.75rem',
            fontWeight: 500,
          }}
        >
          {connected ? t('chat.connected') : t('chat.disconnected')}
        </Typography>
      </Box>
    </Box>
  );
}