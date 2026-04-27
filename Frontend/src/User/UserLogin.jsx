import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api, setToken } from '../components/api';

function UserLogin() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [status, setStatus] = useState('');

  const submit = async (event) => {
    event.preventDefault();
    try {
      const response = await api.post('/auth/login', { ...form, role: 'user' });
      setToken('user', response.data.token);
      navigate('/user/dashboard');
    } catch (error) {
      setStatus(error?.response?.data?.message || 'Login failed.');
    }
  };

  return (
    <section className="container section-space">
      <div className="auth-wrap white-card">
        <h1>User / Industry Login</h1>
        <form className="form-grid" onSubmit={submit}>
          <input type="email" placeholder="Email" value={form.email} onChange={(event) => setForm((prev) => ({ ...prev, email: event.target.value }))} />
          <input type="password" placeholder="Password" value={form.password} onChange={(event) => setForm((prev) => ({ ...prev, password: event.target.value }))} />
          <button type="submit" className="btn btn-primary">Login</button>
        </form>
        {status && <p className="status-text">{status}</p>}
      </div>
    </section>
  );
}

export default UserLogin;
