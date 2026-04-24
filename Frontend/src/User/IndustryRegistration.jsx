import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api, setToken } from '../components/api';

function IndustryRegistration() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
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
      const response = await api.post('/industry/register', form);
      setToken('user', response.data.token);
      navigate('/user/dashboard');
    } catch (error) {
      setStatus(error?.response?.data?.message || 'Industry registration failed.');
    }
  };

  return (
    <section className="container section-space">
      <div className="white-card auth-wrap">
        <h1>Industry Registration</h1>
        <form className="form-grid" onSubmit={submit}>
          <input placeholder="Industry Name" value={form.industryName} onChange={(event) => setForm((prev) => ({ ...prev, industryName: event.target.value }))} />
          <input placeholder="Location" value={form.location} onChange={(event) => setForm((prev) => ({ ...prev, location: event.target.value }))} />
          <input placeholder="Contact Name" value={form.contactName} onChange={(event) => setForm((prev) => ({ ...prev, contactName: event.target.value }))} />
          <input placeholder="Contact Phone" value={form.contactPhone} onChange={(event) => setForm((prev) => ({ ...prev, contactPhone: event.target.value }))} />
          <input type="email" placeholder="Email" value={form.email} onChange={(event) => setForm((prev) => ({ ...prev, email: event.target.value }))} />
          <input type="password" placeholder="Password" value={form.password} onChange={(event) => setForm((prev) => ({ ...prev, password: event.target.value }))} />
          <button className="btn btn-primary" type="submit">Create Industry Account</button>
        </form>
        {status && <p className="status-text">{status}</p>}
      </div>
    </section>
  );
}

export default IndustryRegistration;
