import React, { useContext, useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import useAuth from '../hooks/useAuth';
import { AuthContext } from '../hooks/AuthContext';
import { useTranslation } from 'react-i18next';

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
    }
  };

  const getAvatarColor = (name = 'A') => {
    const colors = ['#F6851B', '#3C3C3B', '#E8E8E8'];
    return colors[name.charCodeAt(0) % colors.length];
  };

  if (!auth) return null;

  const navItems = [
    { to: '/feed', label: t('nav.feed') },
    { to: '/live', label: t('nav.live') },
    { to: '/chat', label: t('nav.chat') },
  ];

  return (
    <header className="site-header">
      <div className="site-inner">
        <div className="site-left">
          <Link to="/" className="logo">
            <div className="freenet-logo-placeholder" aria-hidden>F</div>
            <span className="auth-title logo-text">FREENET</span>
          </Link>
        </div>

        <nav className="nav-links">
          {navItems.map((n) => (
            <Link key={n.to} to={n.to} className="nav-link">
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
                {n.label}
              </Link>
            ))}
            <button onClick={() => handleMenuAction('settings')} className="mobile-item">{t('nav.settings')}</button>
            <button onClick={() => handleMenuAction('logout')} className="mobile-item danger">{t('nav.logout')}</button>
          </div>
        </div>
      )}
    </header>
  );
}

export default Navbar;