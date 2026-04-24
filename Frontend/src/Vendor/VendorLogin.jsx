import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api, setToken } from '../components/api';

function VendorLogin() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [status, setStatus] = useState('');

  const submit = async (event) => {
    event.preventDefault();
    try {
      const response = await api.post('/vendor/login', form);
      setToken('vendor', response.data.token);
      navigate('/vendor/dashboard');
    } catch (error) {
      setStatus(error?.response?.data?.message || 'Vendor login failed.');
    }
  };

  return (
    <div className="auth-theme-page">
      <div className="auth-theme-container">
        <section className="auth-theme-form-section">
          <div className="auth-theme-brand">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path d="M2 2H11V11H2V2ZM13 2H22V11H13V2ZM2 13H11V22H2V13ZM13 13H22V22H13V13Z" fill="#6941C6" />
            </svg>
            <span>VendorVault Gujarat</span>
          </div>

          <div className="auth-theme-form-wrapper">
            <div className="auth-theme-header">
              <h1>Vendor login</h1>
              <p>Please enter your vendor account details</p>
            </div>

            <form onSubmit={submit} className="auth-theme-form">
              <div className="auth-theme-input-group">
                <label htmlFor="vendor-email">Email address</label>
                <input
                  id="vendor-email"
                  type="email"
                  placeholder="Enter your email"
                  value={form.email}
                  onChange={(event) => setForm((prev) => ({ ...prev, email: event.target.value }))}
                  required
                />
              </div>

              <div className="auth-theme-input-group">
                <label htmlFor="vendor-password">Password</label>
                <input
                  id="vendor-password"
                  type="password"
                  placeholder="********"
                  value={form.password}
                  onChange={(event) => setForm((prev) => ({ ...prev, password: event.target.value }))}
                  required
                />
              </div>

              <button className="auth-theme-btn-primary" type="submit">Sign in</button>
            </form>

            {status && <p className="auth-theme-status">{status}</p>}
            <p className="auth-theme-switch">
              Need vendor account? <Link to="/vendor/register">Register vendor</Link>
            </p>
          </div>
        </section>

        <section className="auth-theme-image-section">
          <div className="auth-theme-illustration">
            <img src="https://illustrations.popsy.co/purple/remote-work.svg" alt="Support Illustration" />
          </div>
        </section>
      </div>
    </div>
  );
}

export default VendorLogin;
