import React from 'react';
import { Link, useLocation } from 'react-router-dom';

function Footer() {
  const location = useLocation();
  const hideOnDashboard =
    location.pathname.startsWith('/admin') ||
    location.pathname.startsWith('/vendor/dashboard') ||
    location.pathname.startsWith('/user/dashboard') ||
    location.pathname === '/login' ||
    location.pathname === '/register' ||
    location.pathname === '/vendor/register' ||
    location.pathname === '/admin/login';

  if (hideOnDashboard) return null;

  return (
    <footer className="vv-footer">
      <div className="container">
        <div className="vv-footer-grid">
          <div className="vv-footer-col">
            <div className="vv-logo" style={{ marginBottom: '20px' }}>
              <i className="fas fa-shield-alt" />
              <span>VendorVault</span>
            </div>
            <p>
              Gujarat&apos;s leading digital industrial vendor directory connecting industries with verified contractors.
            </p>
            <div className="vv-socials">
              <i className="fab fa-facebook" />
              <i className="fab fa-twitter" />
              <i className="fab fa-linkedin" />
            </div>
          </div>

          <div className="vv-footer-col">
            <h5>Quick Links</h5>
            <ul>
              <li><Link to="/">Home</Link></li>
              <li><Link to="/vendors">Browse Vendors</Link></li>
              <li><Link to="/categories">Categories</Link></li>
              <li><Link to="/requirements">Requirements</Link></li>
            </ul>
          </div>

          <div className="vv-footer-col">
            <h5>For Vendors</h5>
            <ul>
              <li><Link to="/vendor/register">Register Business</Link></li>
              <li><Link to="/vendors">Vendor Directory</Link></li>
              <li><Link to="/requirements">View Requirements</Link></li>
            </ul>
          </div>

          <div className="vv-footer-col">
            <h5>Contact Us</h5>
            <ul className="vv-contact-list">
              <li><i className="fas fa-envelope" /> contact@vendorvault.in</li>
              <li><i className="fas fa-phone" /> +91 8401605796</li>
              <li><i className="fas fa-map-marker-alt" /> Bharuch, Gujarat, India</li>
            </ul>
          </div>
        </div>

        <div className="vv-footer-bottom">
          <p>© 2026 VendorVault Gujarat. All rights reserved.</p>
          <p>Privacy Policy | Terms of Service</p>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
