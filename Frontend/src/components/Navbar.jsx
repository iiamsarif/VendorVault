import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { clearToken, decodeJwt, getBookmarkedVendors, getToken, getUserProfile } from './api';

function Navbar() {
  const location = useLocation();
  const [profileOpen, setProfileOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [theme, setTheme] = useState(() => localStorage.getItem('vv_theme') || 'dark');
  const [bookmarkCount, setBookmarkCount] = useState(() => getBookmarkedVendors().length);
  const menuRef = useRef(null);

  const hideOnDashboard =
    location.pathname.startsWith('/admin') ||
    location.pathname.startsWith('/vendor/dashboard') ||
    location.pathname.startsWith('/user/dashboard') ||
    location.pathname === '/login' ||
    location.pathname === '/register' ||
    location.pathname === '/vendor/login' ||
    location.pathname === '/vendor/register';

  const userToken = getToken('user');
  const isUserLoggedIn = Boolean(userToken);
  const showAuthLinks = !isUserLoggedIn;

  const userMeta = useMemo(() => {
    if (!isUserLoggedIn) return null;
    const profile = getUserProfile();
    const payload = decodeJwt(userToken) || {};
    const email = profile?.email || payload?.email || '';
    const name = profile?.name || (email ? email.split('@')[0] : 'User');
    return {
      name,
      email,
      role: 'User'
    };
  }, [isUserLoggedIn, userToken]);

  useEffect(() => {
    setProfileOpen(false);
    setMobileMenuOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    if (hideOnDashboard) {
      document.body.removeAttribute('data-theme');
      return;
    }
    document.body.setAttribute('data-theme', theme);
    localStorage.setItem('vv_theme', theme);
  }, [theme, hideOnDashboard]);

  useEffect(() => {
    const handleOutsideClick = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setProfileOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  useEffect(() => {
    const syncCount = () => setBookmarkCount(getBookmarkedVendors().length);
    window.addEventListener('vv_bookmarks_changed', syncCount);
    window.addEventListener('storage', syncCount);
    return () => {
      window.removeEventListener('vv_bookmarks_changed', syncCount);
      window.removeEventListener('storage', syncCount);
    };
  }, []);

  const logoutUser = () => {
    clearToken('user');
    window.location.href = '/';
  };

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  if (hideOnDashboard) return null;

  return (
    <header className="vv-header">
      <div className="container">
        <nav className="vv-nav">
          <Link to="/" className="vv-logo">
            <i className="fas fa-shield-alt" />
            <span>VendorVault</span>
          </Link>

          <ul className="vv-nav-links">
            <li><NavLink to="/" end>Home</NavLink></li>
            <li><NavLink to="/vendors">Vendors</NavLink></li>
            <li><NavLink to="/categories">Categories</NavLink></li>
            {isUserLoggedIn ? <li><NavLink to="/requirements">Requirements</NavLink></li> : null}
            {isUserLoggedIn ? <li><NavLink to="/inquiries">Inquiries</NavLink></li> : null}
            <li><NavLink to="/contact">Contact</NavLink></li>
          </ul>

          <div className="vv-nav-actions">
            {isUserLoggedIn ? <Link to="/requirements?post=1" className="vv-post-link">Post Requirement</Link> : null}
            <Link to="/vendor/register" className="vv-btn-primary">Register Business</Link>
            {showAuthLinks ? <Link to="/login" className="vv-sign-link">Sign In</Link> : null}
            {isUserLoggedIn ? (
              <Link to="/bookmarked" className="vv-bookmark-link" aria-label="Open bookmarked vendors">
                <i className="fa-regular fa-bookmark" />
                {bookmarkCount > 0 ? <span>{bookmarkCount}</span> : null}
              </Link>
            ) : null}

            {isUserLoggedIn ? (
              <div className="profile-menu-wrap" ref={menuRef}>
                <button type="button" className="profile-icon-btn" onClick={() => setProfileOpen((prev) => !prev)}>
                  {(userMeta?.name || 'U').slice(0, 1).toUpperCase()}
                </button>
                {profileOpen ? (
                  <div className="profile-popover">
                    <h4>{userMeta?.name || 'User'}</h4>
                    <p>{userMeta?.email || 'No email available'}</p>
                    <small>{userMeta?.role || 'User'}</small>
                    <div className="profile-popover-actions">
                      <button type="button" className="btn btn-primary" onClick={logoutUser}>Logout</button>
                    </div>
                  </div>
                ) : null}
              </div>
            ) : null}

            <button type="button" className="vv-theme-toggle" onClick={toggleTheme} aria-label="Toggle theme">
              <i className={`fas ${theme === 'dark' ? 'fa-moon' : 'fa-sun'}`} />
            </button>

            <button
              type="button"
              className="vv-mobile-toggle"
              aria-label="Open navigation menu"
              onClick={() => setMobileMenuOpen((prev) => !prev)}
            >
              <i className={`fas ${mobileMenuOpen ? 'fa-xmark' : 'fa-bars'}`} />
            </button>
          </div>
        </nav>

        {mobileMenuOpen ? (
          <div className="vv-mobile-panel">
            <NavLink to="/" end>Home</NavLink>
            <NavLink to="/vendors">Vendors</NavLink>
            <NavLink to="/categories">Categories</NavLink>
            {isUserLoggedIn ? <NavLink to="/requirements">Requirements</NavLink> : null}
            {isUserLoggedIn ? <NavLink to="/inquiries">Inquiries</NavLink> : null}
            {isUserLoggedIn ? <NavLink to="/bookmarked">Bookmarked</NavLink> : null}
            <NavLink to="/contact">Contact</NavLink>
            {showAuthLinks ? <NavLink to="/login">Sign In</NavLink> : null}
            {showAuthLinks ? <NavLink to="/register">Register</NavLink> : null}
          </div>
        ) : null}
      </div>
    </header>
  );
}

export default Navbar;
