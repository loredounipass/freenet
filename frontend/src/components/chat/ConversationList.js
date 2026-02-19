import React, { useState, useEffect, useContext, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  TextField,
  List,
  Fab,
  CircularProgress,
} from '@mui/material';
import AddCommentIcon from '@mui/icons-material/AddComment';
import SearchIcon from '@mui/icons-material/Search';
import ChatBubbleOutlineIcon from '@mui/icons-material/ChatBubbleOutline';
import { AuthContext } from '../../hooks/AuthContext';
import useMessagesAndMultimedia from '../../hooks/useMessagesAndMultimedia';
import { useTranslation } from 'react-i18next';
import ConversationItem from './ConversationItem';
import NewChatDialog from './NewChatDialog';
import User from '../../services/user';

/**
 * Builds a list of conversations from raw messages.
 * Groups messages by the other user and extracts the latest message per conversation.
 */
const buildConversations = (messages, currentUserId) => {
  const convMap = new Map();

  for (const msg of messages) {
    const otherUserId = msg.sender === currentUserId ? msg.receiver : msg.sender;
    if (!otherUserId) continue;

    const existing = convMap.get(otherUserId);
    if (!existing) {
      convMap.set(otherUserId, {
        userId: otherUserId,
        lastMessage: msg,
        unreadCount: 0,
        messages: [msg],
      });
    } else {
      existing.messages.push(msg);
      // Keep the most recent message as lastMessage
      const existingTime = new Date(existing.lastMessage?.createdAt || 0).getTime();
      const newTime = new Date(msg.createdAt || 0).getTime();
      if (newTime > existingTime) {
        existing.lastMessage = msg;
      }
    }
  }

  // Sort conversations by last message time (newest first)
  return Array.from(convMap.values()).sort((a, b) => {
    const ta = new Date(a.lastMessage?.createdAt || 0).getTime();
    const tb = new Date(b.lastMessage?.createdAt || 0).getTime();
    return tb - ta;
  });
};

/**
 * ConversationList - Main chat page showing all conversations.
 */
export default function ConversationList() {
  const navigate = useNavigate();
  const { auth } = useContext(AuthContext);
  const { t } = useTranslation();
  const { messages, fetchMyMessages } = useMessagesAndMultimedia();

  const [searchQuery, setSearchQuery] = useState('');
  const [newChatOpen, setNewChatOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [userCache, setUserCache] = useState({});

  const currentUserId = auth?._id;

  // Build conversations from messages
  const conversations = useMemo(
    () => buildConversations(messages, currentUserId),
    [messages, currentUserId]
  );

  // Fetch messages on mount
  useEffect(() => {
    let mounted = true;
    const init = async () => {
      setLoading(true);
      try {
        await fetchMyMessages();
      } catch (err) {
        // Error handled silently
      } finally {
        if (mounted) setLoading(false);
      }
    };
    init();
    return () => {
      mounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Fetch user info for each conversation partner
  useEffect(() => {
    const fetchUsers = async () => {
      const unknownIds = conversations
        .map((c) => c.userId)
        .filter((id) => id && !userCache[id]);

      if (unknownIds.length === 0) return;

      for (const uid of unknownIds) {
        try {
          const resp = await User.searchUsers(uid);
          const data = resp?.data;
          let users = [];
          if (Array.isArray(data)) {
            users = data;
          } else if (data?.data && Array.isArray(data.data)) {
            users = data.data;
          }
          const found = users.find((u) => u._id === uid);
          if (found) {
            setUserCache((prev) => ({ ...prev, [uid]: found }));
          }
        } catch (err) {
          // Skip
        }
      }
    };

    if (conversations.length > 0) {
      fetchUsers();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conversations.length]);

  // Filter conversations by search query
  const filteredConversations = useMemo(() => {
    if (!searchQuery.trim()) return conversations;

    const q = searchQuery.toLowerCase();
    return conversations.filter((conv) => {
      const user = userCache[conv.userId];
      if (!user) return false;
      const fullName = `${user.firstName || ''} ${user.lastName || ''}`.toLowerCase();
      const email = (user.email || '').toLowerCase();
      return fullName.includes(q) || email.includes(q);
    });
  }, [conversations, searchQuery, userCache]);

  const handleSelectConversation = (userId) => {
    navigate(`/chat/${userId}`);
  };

  const handleNewChatUser = (user) => {
    // Cache the user and navigate to chat
    setUserCache((prev) => ({ ...prev, [user._id]: user }));
    navigate(`/chat/${user._id}`);
  };

  if (loading) {
    return (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: 'calc(100vh - 120px)',
        }}
      >
        <CircularProgress sx={{ color: '#2186EB' }} />
      </Box>
    );
  }

  return (
    <Box
      sx={{
        height: 'calc(100vh - 120px)',
        display: 'flex',
        flexDirection: 'column',
        bgcolor: '#fff',
        borderRadius: 3,
        overflow: 'hidden',
        boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
      }}
    >
      {/* Header */}
      <Box sx={{ px: 2.5, pt: 2.5, pb: 1 }}>
        <Typography
          variant="h5"
          sx={{ fontWeight: 700, color: '#333', mb: 2 }}
        >
          {t('chat.title')}
        </Typography>

        {/* Search bar */}
        <TextField
          fullWidth
          placeholder={t('chat.search_placeholder')}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          variant="outlined"
          size="small"
          InputProps={{
            startAdornment: <SearchIcon sx={{ color: '#9E9E9E', mr: 1 }} />,
            sx: {
              borderRadius: 3,
              bgcolor: '#F5F5F5',
              '& fieldset': { border: 'none' },
              '&:hover fieldset': { border: 'none' },
              '&.Mui-focused fieldset': { border: '1px solid #2186EB' },
            },
          }}
        />
      </Box>

      {/* Conversation list */}
      <Box
        sx={{
          flexGrow: 1,
          overflowY: 'auto',
          px: 1,
          '&::-webkit-scrollbar': { width: 6 },
          '&::-webkit-scrollbar-thumb': {
            bgcolor: '#CCC',
            borderRadius: 3,
          },
        }}
      >
        {filteredConversations.length === 0 ? (
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              alignItems: 'center',
              height: '100%',
              py: 6,
            }}
          >
            <ChatBubbleOutlineIcon
              sx={{ fontSize: 64, color: '#E0E0E0', mb: 2 }}
            />
            <Typography
              variant="body1"
              sx={{ color: '#9E9E9E', textAlign: 'center', mb: 1 }}
            >
              {t('chat.no_conversations')}
            </Typography>
            <Typography
              variant="body2"
              sx={{ color: '#BDBDBD', textAlign: 'center' }}
            >
              {t('chat.start_new')}
            </Typography>
          </Box>
        ) : (
          <List sx={{ pt: 0.5 }}>
            {filteredConversations.map((conv) => {
              const user = userCache[conv.userId] || {};
              return (
                <ConversationItem
                  key={conv.userId}
                  conversation={{
                    ...conv,
                    firstName: user.firstName,
                    lastName: user.lastName,
                    email: user.email,
                  }}
                  selected={false}
                  currentUserId={currentUserId}
                  onClick={() => handleSelectConversation(conv.userId)}
                />
              );
            })}
          </List>
        )}
      </Box>

      {/* New chat FAB */}
      <Fab
        color="primary"
        aria-label={t('chat.new_chat')}
        onClick={() => setNewChatOpen(true)}
        sx={{
          position: 'absolute',
          bottom: 24,
          right: 24,
          bgcolor: '#2186EB',
          '&:hover': { bgcolor: '#1a6fc2' },
        }}
      >
        <AddCommentIcon />
      </Fab>

      {/* New chat dialog */}
      <NewChatDialog
        open={newChatOpen}
        onClose={() => setNewChatOpen(false)}
        onSelectUser={handleNewChatUser}
        currentUserId={currentUserId}
      />
    </Box>
  );
}