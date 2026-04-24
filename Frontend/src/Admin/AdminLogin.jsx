import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api, setToken } from '../components/api';

function AdminLogin() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ adminId: '', password: '' });
  const [status, setStatus] = useState('');

  const submit = async (event) => {
    event.preventDefault();
    try {
      const response = await api.post('/admin/login', form);
      setToken('admin', response.data.token);
      navigate('/admin/dashboard');
    } catch (error) {
      setStatus(error?.response?.data?.message || 'Admin login failed.');
    }
  };

  return (
    <section className="admin-login-hero">
      <div className="admin-login-shell">
        <div className="admin-login-brand-pane">
          <span className="admin-login-badge">Restricted Area</span>
          <h1>VendorVault Gujarat</h1>
          <h2>Admin Control Center</h2>
          <p>
            Access platform moderation, category management, listings control, and analytics from a secure administrator portal.
          </p>
        </div>

        <div className="white-card admin-login-card">
          <div className="admin-login-card-head">
            <h3>Sign in as Admin</h3>
            <small>Use your admin credentials only</small>
          </div>
          <form onSubmit={submit} className="form-grid admin-login-form">
            <label>
              Admin ID
              <input
                placeholder="Enter Admin ID"
                value={form.adminId}
                onChange={(event) => setForm((prev) => ({ ...prev, adminId: event.target.value }))}
                autoComplete="username"
              />
            </label>
            <label>
              Password
              <input
                type="password"
                placeholder="Enter password"
                value={form.password}
                onChange={(event) => setForm((prev) => ({ ...prev, password: event.target.value }))}
                autoComplete="current-password"
              />
            </label>
            <button type="submit" className="btn btn-primary admin-login-btn">Login Securely</button>
          </form>
          {status && <p className="status-text">{status}</p>}
        </div>
      </div>
    </section>
  );
}

export default AdminLogin;
