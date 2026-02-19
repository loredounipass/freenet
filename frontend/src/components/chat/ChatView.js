import React, { useState, useEffect, useRef, useContext, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { Box, Typography, CircularProgress } from '@mui/material';
import { AuthContext } from '../../hooks/AuthContext';
import useMessagesAndMultimedia from '../../hooks/useMessagesAndMultimedia';
import { useTranslation } from 'react-i18next';
import ChatHeader from './ChatHeader';
import ChatInput from './ChatInput';
import MessageBubble from './MessageBubble';
import User from '../../services/user';

/**
 * Groups messages by date for display with date separators.
 */
const groupMessagesByDate = (messages, t) => {
  const groups = [];
  let currentDate = null;

  const sorted = [...messages].sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
  );

  for (const msg of sorted) {
    const msgDate = new Date(msg.createdAt);
    const dateKey = msgDate.toDateString();

    if (dateKey !== currentDate) {
      currentDate = dateKey;
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);

      let label;
      if (msgDate >= today) {
        label = t('chat.today');
      } else if (msgDate >= yesterday) {
        label = t('chat.yesterday');
      } else {
        label = msgDate.toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric' });
      }

      groups.push({ type: 'date', label, key: `date-${dateKey}` });
    }

    groups.push({ type: 'message', data: msg, key: msg._id || `msg-${Math.random()}` });
  }

  return groups;
};

/**
 * ChatView - Individual chat conversation view.
 * Displays messages between the current user and another user.
 */
export default function ChatView() {
  const { userId: otherUserId } = useParams();
  const { auth } = useContext(AuthContext);
  const { t } = useTranslation();
  const {
    messages: allMessages,
    connected,
    fetchMyMessages,
    createMessage,
    uploadMessage,
    joinChat,
  } = useMessagesAndMultimedia();

  const [otherUser, setOtherUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef(null);

  const currentUserId = auth?._id;

  // Filter messages for this specific conversation
  const chatMessages = allMessages.filter(
    (msg) =>
      (msg.sender === currentUserId && msg.receiver === otherUserId) ||
      (msg.sender === otherUserId && msg.receiver === currentUserId)
  );

  const groupedItems = groupMessagesByDate(chatMessages, t);

  // Scroll to bottom when messages change
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [chatMessages.length, scrollToBottom]);

  // Fetch other user info and messages on mount
  useEffect(() => {
    let mounted = true;

    const init = async () => {
      setLoading(true);
      try {
        // Fetch all messages
        await fetchMyMessages();

        // Join the chat room via socket
        if (otherUserId) {
          joinChat(otherUserId);
        }

        // Try to get user info - use search as fallback
        try {
          const resp = await User.searchUsers(otherUserId);
          const data = resp?.data;
          let users = [];
          if (Array.isArray(data)) {
            users = data;
          } else if (data?.data && Array.isArray(data.data)) {
            users = data.data;
          }
          const found = users.find((u) => u._id === otherUserId);
          if (mounted && found) {
            setOtherUser(found);
          }
        } catch (err) {
          // If search fails, we'll show a placeholder
        }
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
  }, [otherUserId]);

  // Send text message
  const handleSendMessage = async (content) => {
    if (!content.trim() || !otherUserId) return;
    await createMessage({
      content,
      type: 'text',
      receiverId: otherUserId,
    });
  };

  // Send file message
  const handleSendFile = async (file, content) => {
    if (!otherUserId) return;
    const type = file.type.startsWith('image/')
      ? 'image'
      : file.type.startsWith('video/')
        ? 'video'
        : file.type.startsWith('audio/')
          ? 'audio'
          : 'image';

    await uploadMessage(file, {
      content: content || '',
      type,
      receiverId: otherUserId,
    });
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
        display: 'flex',
        flexDirection: 'column',
        height: 'calc(100vh - 120px)',
        bgcolor: '#fff',
        borderRadius: 3,
        overflow: 'hidden',
        boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
      }}
    >
      {/* Header */}
      <ChatHeader user={otherUser} connected={connected} />

      {/* Messages area */}
      <Box
        sx={{
          flexGrow: 1,
          overflowY: 'auto',
          py: 2,
          bgcolor: '#FAFAFA',
          '&::-webkit-scrollbar': { width: 6 },
          '&::-webkit-scrollbar-thumb': {
            bgcolor: '#CCC',
            borderRadius: 3,
          },
        }}
      >
        {chatMessages.length === 0 ? (
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              height: '100%',
            }}
          >
            <Typography variant="body2" sx={{ color: '#9E9E9E', textAlign: 'center' }}>
              {t('chat.no_messages')}
            </Typography>
          </Box>
        ) : (
          groupedItems.map((item, index) => {
            if (item.type === 'date') {
              return (
                <Box
                  key={item.key}
                  sx={{
                    display: 'flex',
                    justifyContent: 'center',
                    my: 1.5,
                  }}
                >
                  <Box
                    sx={{
                      bgcolor: 'rgba(0,0,0,0.06)',
                      borderRadius: 3,
                      px: 2,
                      py: 0.5,
                    }}
                  >
                    <Typography
                      variant="caption"
                      sx={{ color: '#666', fontSize: '0.75rem', fontWeight: 500 }}
                    >
                      {item.label}
                    </Typography>
                  </Box>
                </Box>
              );
            }

            const msg = item.data;
            const isOwn = msg.sender === currentUserId;

            // Determine if this is the first message in a group from the same sender
            const prevItem = index > 0 ? groupedItems[index - 1] : null;
            const showTail =
              !prevItem ||
              prevItem.type === 'date' ||
              prevItem.data?.sender !== msg.sender;

            return (
              <MessageBubble
                key={item.key}
                message={msg}
                isOwn={isOwn}
                showTail={showTail}
              />
            );
          })
        )}
        <div ref={messagesEndRef} />
      </Box>

      {/* Input */}
      <ChatInput
        onSendMessage={handleSendMessage}
        onSendFile={handleSendFile}
        disabled={!connected}
      />
    </Box>
  );
}