import React, { useState, useEffect, useContext, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
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
      const existingTime = new Date(existing.lastMessage?.createdAt || 0).getTime();
      const newTime = new Date(msg.createdAt || 0).getTime();
      if (newTime > existingTime) {
        existing.lastMessage = msg;
      }
    }
  }

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

  const conversations = useMemo(
    () => buildConversations(messages, currentUserId),
    [messages, currentUserId]
  );

  useEffect(() => {
    let mounted = true;
    const init = async () => {
      setLoading(true);
      try {
        await fetchMyMessages();
      } catch (err) {
        // silent
      } finally {
        if (mounted) setLoading(false);
      }
    };
    init();
    return () => { mounted = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
          // skip
        }
      }
    };

    if (conversations.length > 0) fetchUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conversations.length]);

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

  const handleSelectConversation = (userId) => navigate(`/chat/${userId}`);

  const handleNewChatUser = (user) => {
    setUserCache((prev) => ({ ...prev, [user._id]: user }));
    navigate(`/chat/${user._id}`);
  };

  if (loading) {
    return (
      <div className="conv-list-loading">
        <div style={{
          width: 32, height: 32,
          border: '3px solid rgba(34,193,195,0.2)',
          borderTopColor: '#22c1c3',
          borderRadius: '50%',
          animation: 'fn-spin 0.9s linear infinite',
        }} />
      </div>
    );
  }

  return (
    <>
      <div className="conv-list-wrapper">
        {/* Header */}
        <div className="conv-list-header">
          <h2 className="conv-list-title">{t('chat.title')}</h2>

          {/* Search */}
          <div className="conv-search-wrap">
            <span className="conv-search-icon">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/>
              </svg>
            </span>
            <input
              className="conv-search-input"
              placeholder={t('chat.search_placeholder')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        {/* Conversation list */}
        <div className="conv-list-scroll">
          {filteredConversations.length === 0 ? (
            <div className="conv-empty">
              <div className="conv-empty-icon">💬</div>
              <div className="conv-empty-title">{t('chat.no_conversations')}</div>
              <div className="conv-empty-sub">{t('chat.start_new')}</div>
            </div>
          ) : (
            filteredConversations.map((conv) => {
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
            })
          )}
        </div>

        {/* New chat FAB */}
        <button
          className="conv-fab"
          aria-label={t('chat.new_chat')}
          onClick={() => setNewChatOpen(true)}
          title={t('chat.new_chat')}
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
            <line x1="12" y1="10" x2="12" y2="14"/><line x1="10" y1="12" x2="14" y2="12"/>
          </svg>
        </button>
      </div>

      <NewChatDialog
        open={newChatOpen}
        onClose={() => setNewChatOpen(false)}
        onSelectUser={handleNewChatUser}
        currentUserId={currentUserId}
      />
    </>
  );
}