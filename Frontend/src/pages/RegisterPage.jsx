import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api, setToken, setUserProfile } from '../components/api';

function RegisterPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    accountType: 'user',
    name: '',
    industryName: '',
    location: '',
    contactName: '',
    contactPhone: '',
    email: '',
    password: ''
  });
  const [status, setStatus] = useState('');

  const submit = async (event) => {
    event.preventDefault();

    try {
      if (form.accountType === 'industry') {
        const response = await api.post('/industry/register', {
          industryName: form.industryName,
          location: form.location,
          contactName: form.contactName,
          contactPhone: form.contactPhone,
          email: form.email,
          password: form.password
        });

        setToken('user', response.data.token);
        setUserProfile({
          name: response.data?.profile?.industryName || form.industryName,
          email: response.data?.profile?.email || form.email,
          role: 'user'
        });
        navigate('/');
        return;
      }

      const response = await api.post('/auth/register', {
        name: form.name,
        email: form.email,
        password: form.password
      });

      setToken('user', response.data.token);
      setUserProfile({
        name: response.data?.user?.name || form.name,
        email: response.data?.user?.email || form.email,
        role: 'user'
      });
      navigate('/');
    } catch (error) {
      setStatus(error?.response?.data?.message || 'Registration failed.');
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
              <h1>Create your account</h1>
              <p>Please enter your details</p>
            </div>

            <form onSubmit={submit} className="auth-theme-form">
              <div className="auth-theme-input-group">
                <label htmlFor="register-account-type">Account type</label>
                <select
                  id="register-account-type"
                  value={form.accountType}
                  onChange={(event) => setForm((prev) => ({ ...prev, accountType: event.target.value }))}
                >
                  <option value="user">User</option>
                  <option value="industry">Industry / Procurement Team</option>
                  <option value="vendor">Vendor</option>
                </select>
              </div>

              {form.accountType === 'industry' ? (
                <>
                  <div className="auth-theme-input-group">
                    <label htmlFor="register-industry-name">Industry Name</label>
                    <input
                      id="register-industry-name"
                      placeholder="Enter your industry name"
                      value={form.industryName}
                      onChange={(event) => setForm((prev) => ({ ...prev, industryName: event.target.value }))}
                      required
                    />
                  </div>
                  <div className="auth-theme-input-group">
                    <label htmlFor="register-location">Location</label>
                    <input
                      id="register-location"
                      placeholder="Enter your location"
                      value={form.location}
                      onChange={(event) => setForm((prev) => ({ ...prev, location: event.target.value }))}
                      required
                    />
                  </div>
                  <div className="auth-theme-input-group">
                    <label htmlFor="register-contact-name">Contact Person</label>
                    <input
                      id="register-contact-name"
                      placeholder="Enter contact person name"
                      value={form.contactName}
                      onChange={(event) => setForm((prev) => ({ ...prev, contactName: event.target.value }))}
                      required
                    />
                  </div>
                  <div className="auth-theme-input-group">
                    <label htmlFor="register-contact-phone">Contact Phone</label>
                    <input
                      id="register-contact-phone"
                      placeholder="Enter contact phone"
                      value={form.contactPhone}
                      onChange={(event) => setForm((prev) => ({ ...prev, contactPhone: event.target.value }))}
                      required
                    />
                  </div>
                </>
              ) : null}

              {form.accountType === 'user' ? (
                <div className="auth-theme-input-group">
                  <label htmlFor="register-name">Full Name</label>
                  <input
                    id="register-name"
                    placeholder="Enter your full name"
                    value={form.name}
                    onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
                    required
                  />
                </div>
              ) : null}

              <div className="auth-theme-input-group">
                <label htmlFor="register-email">Email address</label>
                <input
                  id="register-email"
                  type="email"
                  placeholder="Enter your email"
                  value={form.email}
                  onChange={(event) => setForm((prev) => ({ ...prev, email: event.target.value }))}
                  required
                />
              </div>

              <div className="auth-theme-input-group">
                <label htmlFor="register-password">Password</label>
                <input
                  id="register-password"
                  type="password"
                  placeholder="********"
                  value={form.password}
                  onChange={(event) => setForm((prev) => ({ ...prev, password: event.target.value }))}
                  required
                />
              </div>

              {form.accountType === 'vendor' ? (
                <Link to="/vendor/register" className="auth-theme-btn-secondary">
                  Continue to Vendor Registration
                </Link>
              ) : (
                <button className="auth-theme-btn-primary" type="submit">Create account</button>
              )}
            </form>

            {status && <p className="auth-theme-status">{status}</p>}
            <p className="auth-theme-switch">
              Already registered? <Link to="/login">Sign in</Link>
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

export default RegisterPage;
