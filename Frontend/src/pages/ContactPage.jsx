import React, { useState } from 'react';

function ContactPage() {
  const [form, setForm] = useState({ name: '', email: '', message: '' });
  const [status, setStatus] = useState('');

  const submitForm = (event) => {
    event.preventDefault();
    if (!form.name || !form.email || !form.message) {
      setStatus('Please fill all fields.');
      return;
    }
    setStatus('Thanks for contacting VendorVault Gujarat. Our team will respond shortly.');
    setForm({ name: '', email: '', message: '' });
  };

  return (
    <section className="container section-space">
      <div className="profile-grid">
        <article className="white-card">
          <h1>Contact Us</h1>
          <p>Reach our partnership and support team for onboarding and platform assistance.</p>
          <p>Email: support@vendorvaultgujarat.in</p>
          <p>Phone: +91 99999 99999</p>
          <p>Location: Ahmedabad, Gujarat</p>
        </article>
        <article className="white-card">
          <form onSubmit={submitForm} className="form-grid">
            <input placeholder="Full Name" value={form.name} onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))} />
            <input placeholder="Email" value={form.email} onChange={(event) => setForm((prev) => ({ ...prev, email: event.target.value }))} />
            <textarea rows={5} placeholder="Message" value={form.message} onChange={(event) => setForm((prev) => ({ ...prev, message: event.target.value }))} />
            <button className="btn btn-primary" type="submit">Send Message</button>
          </form>
          {status && <p className="status-text">{status}</p>}
        </article>
      </div>
    </section>
  );
}

export default ContactPage;
