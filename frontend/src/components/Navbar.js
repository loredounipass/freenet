import React, { useContext, useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import useAuth from '../hooks/useAuth';
import { AuthContext } from '../hooks/AuthContext';
import { useTranslation } from 'react-i18next';
import DynamicFeedIcon from '@mui/icons-material/DynamicFeed';
import LiveTvIcon from '@mui/icons-material/LiveTv';
import ChatBubbleOutlineIcon from '@mui/icons-material/ChatBubbleOutline';
import VideoLibraryIcon from '@mui/icons-material/VideoLibrary';
import ExploreIcon from '@mui/icons-material/Explore';

function Navbar() {
  const { t } = useTranslation();
  const { auth, setAuth } = useContext(AuthContext);
  const { logoutUser } = useAuth();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false);
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleMenuAction = async (key) => {
    setMenuOpen(false);
    setMobileOpen(false);
    if (key === 'logout') {
      try {
        await logoutUser();
      } catch (err) {
        // ignore
      }
      setAuth(null);
      navigate('/login');
    } else if (key === 'settings') {
      navigate('/settings');
    } else if (key === 'profile') {
      navigate('/profile');
    }
  };

  const getAvatarColor = (name = 'A') => {
    const colors = ['#F6851B', '#3C3C3B', '#E8E8E8'];
    return colors[name.charCodeAt(0) % colors.length];
  };

  if (!auth) return null;

  const navItems = [
    { to: '/feed', label: t('nav.feed'), icon: <DynamicFeedIcon />, tone: 'teal' },
    { to: '/live', label: t('nav.live'), icon: <LiveTvIcon />, tone: 'blue' },
    { to: '/chat', label: t('nav.chat'), icon: <ChatBubbleOutlineIcon />, tone: 'blue' },
    { to: '/videos', label: t('nav.videos'), icon: <VideoLibraryIcon />, tone: 'teal' },
    { to: '/discover', label: t('nav.discover'), icon: <ExploreIcon />, tone: 'teal' },
  ];

  return (
    <header className="site-header">
      <div className="site-inner">
        <div className="site-left">
          <Link to="/" className="logo" aria-label="Freenet">
            <div className="freenet-logo-placeholder navbar-logo" aria-hidden>F</div>
          </Link>
          <div className="nav-search-wrap">
            <span className="nav-search-icon">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/>
              </svg>
            </span>
            <input className="nav-search-input" placeholder="Buscar" />
          </div>
        </div>

        <nav className="nav-links">
          {navItems.map((n) => (
            <Link key={n.to} to={n.to} className="nav-link">
              <span className={`nav-icon ${n.tone}`}>{n.icon}</span>
              {n.label}
            </Link>
          ))}
        </nav>

        <div className="site-right">
          <button onClick={() => setMobileOpen(!mobileOpen)} className="mobile-toggle" aria-label="menu">
            <svg xmlns="http://www.w3.org/2000/svg" className="icon-menu" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>

          <div className="avatar-wrap" ref={menuRef}>
            <button onClick={() => setMenuOpen((s) => !s)} className="avatar-btn" style={{ backgroundColor: getAvatarColor(auth.firstName) }} aria-label="user menu">
              {auth.firstName.charAt(0)}
            </button>

            {menuOpen && (
              <div className="avatar-menu">
                <div className="greeting">{t('nav.hi', { firstName: auth.firstName })}</div>
                <button onClick={() => handleMenuAction('profile')}>{t('nav.profile')}</button>
                <button onClick={() => handleMenuAction('settings')}>{t('nav.settings')}</button>
                <button onClick={() => handleMenuAction('logout')} className="danger">{t('nav.logout')}</button>
              </div>
            )}
          </div>
        </div>
      </div>

      {mobileOpen && (
        <div className="mobile-menu">
          <div className="mobile-inner">
            {navItems.map((n) => (
              <Link key={n.to} to={n.to} onClick={() => setMobileOpen(false)} className="mobile-item">
                <span className={`nav-icon ${n.tone}`}>{n.icon}</span>
                {n.label}
              </Link>
            ))}
            <button onClick={() => handleMenuAction('profile')} className="mobile-item">{t('nav.profile')}</button>
            <button onClick={() => handleMenuAction('settings')} className="mobile-item">{t('nav.settings')}</button>
            <button onClick={() => handleMenuAction('logout')} className="mobile-item danger">{t('nav.logout')}</button>
          </div>
        </div>
      )}
    </header>
  );
}

export default Navbar;
