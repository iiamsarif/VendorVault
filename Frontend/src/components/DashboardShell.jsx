import React, { useEffect, useState } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { api, authHeader, clearToken, decodeJwt, getToken } from './api';
import brandLogo from '../assets/Logo.jpeg';

function DashboardShell({ role, title, links, children }) {
  const [open, setOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [vendorMeta, setVendorMeta] = useState({ logo: '', name: '', suspended: false, paid: 'None', silverAccess: false });

  const logout = () => {
    clearToken(role);
    window.location.href = role === 'admin' ? '/admin/login' : '/login';
  };

  const toggleSidebar = () => {
    if (role !== 'vendor') {
      setOpen((prev) => !prev);
      return;
    }

    if (window.innerWidth > 768) {
      setCollapsed((prev) => !prev);
    } else {
      setOpen((prev) => !prev);
    }
  };

  useEffect(() => {
    const loadVendorMeta = async () => {
      if (role !== 'vendor') return;
      const token = getToken('vendor');
      const payload = decodeJwt(token) || {};
      const fallbackName = (payload.email || 'vendor@vendorvault.in').split('@')[0];

      try {
        const response = await api.get('/vendor/analytics', { headers: authHeader('vendor') });
        const vendor = response.data || {};
        const uploadsBase = String(api.defaults.baseURL || '').replace(/\/api\/?$/, '');
        const rawLogo = String(vendor.companyLogo || '').trim();
        let logo = '';
        if (rawLogo) {
          if (/^https?:\/\//i.test(rawLogo)) {
            logo = rawLogo;
          } else if (rawLogo.startsWith('/')) {
            logo = `${uploadsBase}${rawLogo}`;
          } else {
            logo = `${uploadsBase}/${rawLogo}`;
          }
        }

        setVendorMeta({
          logo,
          name: String(vendor.companyName || '').trim() || fallbackName,
          suspended: Boolean(vendor.suspended),
          paid: String(vendor.paid || 'None'),
          silverAccess: String(vendor.paid || '') === 'Silver' || ['Verified Vendor', 'Premium Vendor'].includes(String(vendor.plan || vendor.subscriptionPlan || ''))
        });
      } catch (error) {
        setVendorMeta({ logo: '', name: fallbackName, suspended: false, paid: 'None', silverAccess: false });
      }
    };

    loadVendorMeta();
  }, [role]);

  if (role === 'admin') {
    const token = getToken('admin');
    const profile = decodeJwt(token) || {};
    const adminName = (profile.email || 'admin').split('@')[0];

    return (
      <div className={`dashboard-root admin-theme ${open ? 'mobile-open' : ''}`}>
        <div className={`admin-sidebar-overlay ${open ? 'active' : ''}`} onClick={() => setOpen(false)} role="button" tabIndex={0} />

        <aside className={`dashboard-sidebar admin-sidebar ${open ? 'active' : ''}`}>
          <div className="admin-logo-section">
            <div className="admin-logo-content">
              <img src={brandLogo} alt="VendorVault Gujarat" className="admin-logo-image" />
              <span className="admin-logo-text">VendorVault Gujarat</span>
            </div>
            <button type="button" className="admin-close-sidebar" onClick={() => setOpen(false)}>
              <i className="fa-solid fa-xmark" />
            </button>
          </div>

          <div className="admin-nav-label">Home</div>
          <nav className="sidebar-nav admin-nav">
            {links.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                end={link.end}
                onClick={() => setOpen(false)}
                className={({ isActive }) => `admin-nav-item ${isActive ? 'active' : ''}`}
              >
                <span className="admin-nav-left">
                  <i className={link.icon || 'fa-solid fa-circle'} />
                  <span>{link.label}</span>
                </span>
                {link.badge ? <span className="badge-ui">{link.badge}</span> : null}
              </NavLink>
            ))}
          </nav>
        </aside>

        <main className="dashboard-main admin-main">
          <header className="dashboard-topbar admin-top-nav">
            <div className="admin-left-group">
              <button type="button" className="admin-menu-toggle" onClick={toggleSidebar}>
                <i className="fa-solid fa-bars" />
              </button>
              <div className="admin-search-bar">
                <i className="fa fa-search" />
                <input type="text" placeholder="Search..." />
              </div>
            </div>

            <div className="admin-top-right">
              <i className="fa-regular fa-bell" />
              <div className="admin-user-profile">
                <img src="https://static.vecteezy.com/system/resources/thumbnails/051/498/303/small/social-media-chatting-online-default-male-blank-profile-picture-head-and-body-icon-people-standing-icon-grey-background-free-vector.jpg" className="admin-avatar" alt="Admin" />
                <div className="admin-user-info">
                  <span className="admin-user-name">{adminName}</span>
                  <span className="admin-user-role">Admin</span>
                </div>
              </div>
              <button type="button" className="btn btn-primary admin-logout-btn" onClick={logout}>Logout</button>
            </div>
          </header>
          <section className="dashboard-content admin-content">{children}</section>
        </main>
      </div>
    );
  }

  if (role === 'vendor') {
    const token = getToken('vendor');
    const profile = decodeJwt(token) || {};
    const email = profile.email || 'vendor@vendorvault.in';

    return (
      <div className={`dashboard-root vendor-theme ${open ? 'mobile-open' : ''}`}>
        <aside className={`dashboard-sidebar vendor-sidebar ${collapsed ? 'collapsed' : ''} ${open ? 'open' : ''}`}>
          <button type="button" className="vendor-sidebar-close" onClick={() => setOpen(false)}>
            <i className="fa fa-xmark" />
          </button>
          <div className="vendor-brand">
            <h2>VendorVault Gujrat</h2>
            <span>Vendor Panel</span>
          </div>

          <nav className="sidebar-nav vendor-nav">
            {links.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                end={link.end}
                onClick={(event) => {
                  const lockByPlan =
                    (link.to === '/vendor/dashboard/listings' || link.to === '/vendor/dashboard/profile-views' || link.to === '/vendor/dashboard/inquiries') &&
                    !vendorMeta.silverAccess;
                  if (lockByPlan) {
                    event.preventDefault();
                    return;
                  }
                  setOpen(false);
                }}
                className={({ isActive }) => {
                  const lockByPlan =
                    (link.to === '/vendor/dashboard/listings' || link.to === '/vendor/dashboard/profile-views' || link.to === '/vendor/dashboard/inquiries') &&
                    !vendorMeta.silverAccess;
                  return `vendor-nav-item ${isActive ? 'active' : ''} ${lockByPlan ? 'is-locked' : ''}`;
                }}
              >
                <i className={link.icon || 'fa fa-circle'} />
                <span>{link.label}</span>
                {link.badge ? <em className={`vendor-badge ${link.badgeClass || ''}`}>{link.badge}</em> : null}
                {(link.to === '/vendor/dashboard/listings' || link.to === '/vendor/dashboard/profile-views' || link.to === '/vendor/dashboard/inquiries') && !vendorMeta.silverAccess ? (
                  <em className="vendor-crown-lock"><i className="fa-solid fa-crown" /></em>
                ) : null}
              </NavLink>
            ))}
          </nav>
        </aside>

        <main className="dashboard-main vendor-main">
          <header className="dashboard-topbar vendor-topbar">
            <div className="vendor-top-left">
              <button type="button" className="vendor-toggle-btn" onClick={toggleSidebar}>
                <i className="fa fa-bars" />
              </button>
              <div className="vendor-search-box">
                <input type="text" placeholder="Search..." />
              </div>
            </div>
            <div className="vendor-top-right">
              {vendorMeta.silverAccess ? (
                <Link to="/vendor/dashboard/inquiries" className="vendor-top-icon" title="View inquiries">
                  <i className="fa fa-envelope" />
                </Link>
              ) : (
                <div className="vendor-top-icon vendor-top-icon-locked" title="Upgrade to view inquiries">
                  <i className="fa fa-envelope" />
                  <i className="fa-solid fa-crown vendor-crown-lock-small" />
                </div>
              )}
              <div className="vendor-user-chip">
                <img src={vendorMeta.logo || 'https://i.pravatar.cc/100?img=32'} alt="Vendor" />
                <div>
                  <strong>{vendorMeta.name || email.split('@')[0]}</strong>
                  <small>Vendor</small>
                </div>
              </div>
              <button type="button" className="btn btn-danger" onClick={logout}>Logout</button>
            </div>
          </header>

          <section className="dashboard-content vendor-content">
            {vendorMeta.suspended ? (
              <div className="vendor-suspended-alert">
                This account has been suspended by admin. Public visibility is disabled.
              </div>
            ) : null}
            {children}
          </section>
        </main>
      </div>
    );
  }

  return (
    <div className="dashboard-root">
      <aside className={`dashboard-sidebar ${open ? 'open' : ''}`}>
        <div className="sidebar-head">
          <h2>{title}</h2>
          <button type="button" className="btn btn-ghost" onClick={toggleSidebar}>Close</button>
        </div>
        <nav className="sidebar-nav">
          {links.map((link) => (
            <NavLink key={link.to} to={link.to} end={link.end} onClick={() => setOpen(false)}>
              {link.label}
            </NavLink>
          ))}
        </nav>
        <button type="button" className="btn btn-primary" onClick={logout}>Logout</button>
      </aside>

      <main className="dashboard-main">
        <header className="dashboard-topbar">
          <button type="button" className="btn btn-ghost" onClick={toggleSidebar}>Menu</button>
          <Link className="brand-mark" to="/">VendorVault Gujarat</Link>
        </header>
        <section className="dashboard-content">{children}</section>
      </main>
    </div>
  );
}

export default DashboardShell;
