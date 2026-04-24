import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api, setToken, setUserProfile } from '../components/api';

function LoginPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ role: 'user', email: '', password: '' });
  const [status, setStatus] = useState('');

  const submit = async (event) => {
    event.preventDefault();
    if (!form.email || !form.password) {
      setStatus('Email and password are required.');
      return;
    }

    try {
      let response;
      if (form.role === 'vendor') {
        response = await api.post('/vendor/login', { email: form.email, password: form.password });
      } else {
        response = await api.post('/auth/login', { email: form.email, password: form.password, role: 'user' });
      }

      if (response.data.tokenKey === 'vendorToken') setToken('vendor', response.data.token);
      if (response.data.tokenKey === 'userToken') {
        setToken('user', response.data.token);
        setUserProfile({
          name: response.data?.profile?.name || 'User',
          email: response.data?.profile?.email || form.email,
          role: 'user'
        });
      }

      if (form.role === 'vendor') navigate('/vendor/dashboard');
      if (form.role === 'user') navigate('/');
    } catch (error) {
      setStatus(error?.response?.data?.message || 'Login failed.');
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
              <h1>Welcome back</h1>
              <p>Please enter your details</p>
            </div>

            <form onSubmit={submit} className="auth-theme-form">
              <div className="auth-theme-input-group">
                <label htmlFor="login-role">Login as</label>
                <select
                  id="login-role"
                  value={form.role}
                  onChange={(event) => setForm((prev) => ({ ...prev, role: event.target.value }))}
                >
                  <option value="vendor">Vendor</option>
                  <option value="user">User / Industry</option>
                </select>
              </div>

              <div className="auth-theme-input-group">
                <label htmlFor="login-email">Email address</label>
                <input
                  id="login-email"
                  type="email"
                  placeholder="Enter your email"
                  value={form.email}
                  onChange={(event) => setForm((prev) => ({ ...prev, email: event.target.value }))}
                  required
                />
              </div>

              <div className="auth-theme-input-group">
                <label htmlFor="login-password">Password</label>
                <input
                  id="login-password"
                  type="password"
                  placeholder="********"
                  value={form.password}
                  onChange={(event) => setForm((prev) => ({ ...prev, password: event.target.value }))}
                  required
                />
              </div>

              <button className="auth-theme-btn-primary" type="submit">Sign in</button>
              <Link className="auth-theme-btn-secondary" to="/vendor/register">Sign up as Vendor</Link>
            </form>

            {status && <p className="auth-theme-status">{status}</p>}
            <p className="auth-theme-switch">
              Don&apos;t have an account? <Link to="/register">Sign up</Link>
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

export default LoginPage;
