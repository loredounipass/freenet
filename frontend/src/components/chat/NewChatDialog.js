import React, { useState, useCallback } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  TextField,
  List,
  ListItemButton,
  ListItemAvatar,
  Avatar,
  ListItemText,
  Typography,
  Box,
  IconButton,
  CircularProgress,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import SearchIcon from '@mui/icons-material/Search';
import { useTranslation } from 'react-i18next';
import User from '../../services/user';

/**
 * Generates a deterministic avatar color based on a name string.
 */
const getAvatarColor = (name) => {
  const colors = ['#2186EB', '#F6851B', '#3C3C3B', '#4CAF50', '#E91E63', '#9C27B0', '#FF5722'];
  const charCode = name ? name.charCodeAt(0) : 0;
  return colors[charCode % colors.length];
};

/**
 * NewChatDialog - Modal dialog to search for users and start a new chat.
 *
 * Props:
 *  - open: boolean
 *  - onClose: () => void
 *  - onSelectUser: (user) => void
 *  - currentUserId: string
 */
export default function NewChatDialog({ open, onClose, onSelectUser, currentUserId }) {
  const { t } = useTranslation();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const handleSearch = useCallback(async (searchQuery) => {
    const trimmed = searchQuery.trim();
    if (!trimmed) {
      setResults([]);
      setSearched(false);
      return;
    }

    setLoading(true);
    setSearched(true);
    try {
      const resp = await User.searchUsers(trimmed);
      const data = resp?.data;
      let users = [];
      if (Array.isArray(data)) {
        users = data;
      } else if (data?.data && Array.isArray(data.data)) {
        users = data.data;
      }
      // Filter out current user
      users = users.filter((u) => u._id !== currentUserId);
      setResults(users);
    } catch (err) {
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, [currentUserId]);

  const handleQueryChange = (e) => {
    const val = e.target.value;
    setQuery(val);
    // Debounce search
    clearTimeout(window._searchTimeout);
    window._searchTimeout = setTimeout(() => handleSearch(val), 400);
  };

  const handleSelect = (user) => {
    onSelectUser(user);
    setQuery('');
    setResults([]);
    setSearched(false);
    onClose();
  };

  const handleClose = () => {
    setQuery('');
    setResults([]);
    setSearched(false);
    onClose();
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      fullWidth
      maxWidth="sm"
      PaperProps={{
        sx: { borderRadius: 3, minHeight: 300 },
      }}
    >
      <DialogTitle
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          pb: 1,
        }}
      >
        <Typography variant="h6" sx={{ fontWeight: 600 }}>
          {t('chat.new_chat')}
        </Typography>
        <IconButton onClick={handleClose} size="small">
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ pt: 1 }}>
        <TextField
          fullWidth
          placeholder={t('chat.search_users')}
          value={query}
          onChange={handleQueryChange}
          autoFocus
          variant="outlined"
          size="small"
          InputProps={{
            startAdornment: <SearchIcon sx={{ color: '#9E9E9E', mr: 1 }} />,
            sx: {
              borderRadius: 3,
              bgcolor: '#F5F5F5',
            },
          }}
          sx={{ mb: 2 }}
        />

        {loading && (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}>
            <CircularProgress size={30} sx={{ color: '#2186EB' }} />
          </Box>
        )}

        {!loading && searched && results.length === 0 && (
          <Box sx={{ textAlign: 'center', py: 3 }}>
            <Typography variant="body2" sx={{ color: '#9E9E9E' }}>
              {t('chat.no_users_found')}
            </Typography>
          </Box>
        )}

        {!loading && results.length > 0 && (
          <List sx={{ pt: 0 }}>
            {results.map((user) => {
              const name = `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email;
              const initial = user.firstName ? user.firstName.charAt(0).toUpperCase() : '?';

              return (
                <ListItemButton
                  key={user._id}
                  onClick={() => handleSelect(user)}
                  sx={{ borderRadius: 2, mb: 0.5 }}
                >
                  <ListItemAvatar>
                    <Avatar
                      sx={{
                        bgcolor: getAvatarColor(user.firstName || ''),
                        width: 40,
                        height: 40,
                        fontSize: 18,
                        fontWeight: 'bold',
                        color: '#fff',
                      }}
                    >
                      {initial}
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary={
                      <Typography variant="body1" sx={{ fontWeight: 500, color: '#333' }}>
                        {name}
                      </Typography>
                    }
                    secondary={
                      <Typography variant="caption" sx={{ color: '#9E9E9E' }}>
                        {user.email}
                      </Typography>
                    }
                  />
                </ListItemButton>
              );
            })}
          </List>
        )}
      </DialogContent>
    </Dialog>
  );
}