import React, { useState, useCallback, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import User from '../../services/user';

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

  // Close on Escape key
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => { if (e.key === 'Escape') handleClose(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  if (!open) return null;

  return (
    <div className="ncd-overlay" onClick={handleClose}>
      <div className="ncd-panel" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="ncd-header">
          <h3 className="ncd-title">{t('chat.new_chat')}</h3>
          <button className="ncd-close" onClick={handleClose} aria-label="Cerrar">✕</button>
        </div>

        {/* Body */}
        <div className="ncd-body">
          {/* Search input */}
          <div className="ncd-search-wrap">
            <span className="ncd-search-icon">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/>
              </svg>
            </span>
            <input
              className="ncd-search-input"
              placeholder={t('chat.search_users')}
              value={query}
              onChange={handleQueryChange}
              autoFocus
            />
          </div>

          {/* Loading */}
          {loading && (
            <div className="ncd-loading">
              <div style={{
                width: 28, height: 28,
                border: '3px solid rgba(34,193,195,0.2)',
                borderTopColor: '#22c1c3',
                borderRadius: '50%',
                animation: 'fn-spin 0.9s linear infinite',
              }} />
            </div>
          )}

          {/* No results */}
          {!loading && searched && results.length === 0 && (
            <div className="ncd-empty">{t('chat.no_users_found')}</div>
          )}

          {/* Results */}
          {!loading && results.length > 0 && (
            <div className="ncd-results">
              {results.map((user) => {
                const name = `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email;
                const initial = user.firstName ? user.firstName.charAt(0).toUpperCase() : '?';

                return (
                  <div
                    key={user._id}
                    className="ncd-user-row"
                    onClick={() => handleSelect(user)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => e.key === 'Enter' && handleSelect(user)}
                  >
                    <div
                      className="ncd-user-avatar"
                      style={{ background: getAvatarGradient(user.firstName || '') }}
                    >
                      {initial}
                    </div>
                    <div>
                      <div className="ncd-user-name">{name}</div>
                      <div className="ncd-user-email">{user.email}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}