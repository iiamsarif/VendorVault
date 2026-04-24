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
    location.pathname === '/vendor/login' ||
    location.pathname === '/vendor/register';

  if (hideOnDashboard) return null;

  return (
    <>
      <footer>
        <div className="container">
          <div className="footer-grid">
            <div className="footer-col">
              <div className="logo">
                <h1 style={{ color: '#ffffff', marginBottom: '20px' }}>VENDORVAULT</h1>
              </div>
              <p>
                VendorVault Gujarat helps industries discover, compare, and connect with trusted service providers.
                Build stronger sourcing pipelines with verified business listings and requirement-driven leads.
              </p>
            </div>

            <div className="footer-col">
              <h4>Platform</h4>
              <ul className="footer-links">
                <li><Link to="/vendors">Vendor Directory</Link></li>
                <li><Link to="/categories">Browse Categories</Link></li>
                <li><Link to="/categories">Service Categories</Link></li>
                <li><Link to="/faq">Help Center</Link></li>
              </ul>
            </div>

            <div className="footer-col">
              <h4>Recent Updates</h4>
              <div className="comment-item">
                <span>New</span>
                <strong>Vendor verification process improved</strong>
              </div>
              <div className="comment-item">
                <span>New</span>
                <strong>Marketplace response workflows upgraded</strong>
              </div>
            </div>

            <div className="footer-col">
              <h4>Contact</h4>
              <p>Ahmedabad, Gujarat</p>
              <p>support@vendorvaultgujarat.in</p>
              <p>Mon - Sat, 9:00 AM - 6:00 PM</p>
            </div>
          </div>
        </div>
      </footer>

      <div className="sub-footer">
        <div className="container">
          <p>@2026 VendorVault Gujarat - Industrial Vendor Marketplace Platform</p>
          <div className="sub-links">
            <Link to="/contact">Contact</Link>
            <Link to="/faq">FAQ</Link>
          </div>
        </div>
      </div>

      <div className="floating-leaf">
        <i className="fa-solid fa-leaf" />
      </div>
    </>
  );
}

export default Footer;
