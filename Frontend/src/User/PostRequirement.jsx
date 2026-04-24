import React, { useState } from 'react';
import { api, authHeader } from '../components/api';

function PostRequirement() {
  const [form, setForm] = useState({
    industryName: '',
    location: '',
    requirementCategory: '',
    projectDescription: '',
    contactDetails: '',
    budgetRange: '',
    deadline: ''
  });
  const [status, setStatus] = useState('');

  const submit = async (event) => {
    event.preventDefault();
    try {
      await api.post('/industry/post-requirement', form, { headers: authHeader('user') });
      setStatus('Requirement posted successfully.');
      setForm({
        industryName: '',
        location: '',
        requirementCategory: '',
        projectDescription: '',
        contactDetails: '',
        budgetRange: '',
        deadline: ''
      });
    } catch (error) {
      setStatus(error?.response?.data?.message || 'Failed to post requirement.');
    }
  };

  return (
    <div>
      <div className="section-head"><h1>Post Requirement</h1></div>
      <form className="white-card form-grid" onSubmit={submit}>
        <input placeholder="Industry Name" value={form.industryName} onChange={(event) => setForm((prev) => ({ ...prev, industryName: event.target.value }))} />
        <input placeholder="Location" value={form.location} onChange={(event) => setForm((prev) => ({ ...prev, location: event.target.value }))} />
        <input placeholder="Requirement Category" value={form.requirementCategory} onChange={(event) => setForm((prev) => ({ ...prev, requirementCategory: event.target.value }))} />
        <textarea rows={5} placeholder="Project Description" value={form.projectDescription} onChange={(event) => setForm((prev) => ({ ...prev, projectDescription: event.target.value }))} />
        <input placeholder="Contact Details" value={form.contactDetails} onChange={(event) => setForm((prev) => ({ ...prev, contactDetails: event.target.value }))} />
        <input placeholder="Budget Range (optional)" value={form.budgetRange} onChange={(event) => setForm((prev) => ({ ...prev, budgetRange: event.target.value }))} />
        <input placeholder="Deadline (optional)" value={form.deadline} onChange={(event) => setForm((prev) => ({ ...prev, deadline: event.target.value }))} />
        <button className="btn btn-primary" type="submit">Publish Requirement</button>
      </form>
      {status && <p className="status-text">{status}</p>}
    </div>
  );
}

export default PostRequirement;
