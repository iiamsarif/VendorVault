import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { clearToken, decodeJwt, getToken, getUserProfile } from './api';

function Navbar() {
  const location = useLocation();
  const [profileOpen, setProfileOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
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
    const handleOutsideClick = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setProfileOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  const logoutUser = () => {
    clearToken('user');
    window.location.href = '/';
  };

  if (hideOnDashboard) return null;

  return (
    <>
      <div className="header-wrapper">
        <header className="top-nav">
          <div className="container nav-content">
            <Link to="/" className="logo"><h1>VENDORVAULT</h1></Link>

            <nav>
              <ul>
                <li><NavLink to="/" end>Home</NavLink></li>
                <li><NavLink to="/categories">Categories</NavLink></li>
                <li><NavLink to="/vendors">Vendors</NavLink></li>
                {isUserLoggedIn ? <li><NavLink to="/requirements">Requirements</NavLink></li> : null}
                {isUserLoggedIn ? <li><NavLink to="/inquiries">Inquiries</NavLink></li> : null}
                <li><NavLink to="/contact">Contact Us</NavLink></li>
              </ul>
            </nav>

            <div className="header-actions">
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
              ) : (
                <div className="desktop-auth-links">
                  {showAuthLinks ? <Link to="/login" className="tower-auth-link">Login</Link> : null}
                  {showAuthLinks ? <Link to="/register" className="tower-auth-link">Register</Link> : null}
                </div>
              )}

              <button
                type="button"
                className="mobile-menu-btn"
                aria-label="Open navigation menu"
                onClick={() => setMobileMenuOpen((prev) => !prev)}
              >
                <i className={`fa-solid ${mobileMenuOpen ? 'fa-xmark' : 'fa-bars'}`} />
              </button>
            </div>
          </div>

          {mobileMenuOpen ? (
            <div className="mobile-nav-panel">
              <NavLink to="/" end>Home</NavLink>
              <NavLink to="/categories">Categories</NavLink>
              <NavLink to="/vendors">Vendors</NavLink>
              {isUserLoggedIn ? <NavLink to="/requirements">Requirements</NavLink> : null}
              {isUserLoggedIn ? <NavLink to="/inquiries">Inquiries</NavLink> : null}
              <NavLink to="/contact">Contact Us</NavLink>
              {showAuthLinks ? <NavLink to="/login">Login</NavLink> : null}
              {showAuthLinks ? <NavLink to="/register">Register</NavLink> : null}
            </div>
          ) : null}
        </header>
      </div>
    </>
  );
}

export default Navbar;
