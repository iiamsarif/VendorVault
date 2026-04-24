import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api, authHeader, decodeJwt, getToken, getUserProfile } from '../components/api';

function UserRequirementsPage() {
  const navigate = useNavigate();
  const [requirements, setRequirements] = useState([]);
  const [categories, setCategories] = useState([]);
  const [openModal, setOpenModal] = useState(false);
  const [status, setStatus] = useState('');
  const [form, setForm] = useState({
    industryName: '',
    requirementCategory: '',
    projectDescription: '',
    contactDetails: '',
    location: ''
  });

  const profile = useMemo(() => {
    const local = getUserProfile();
    const token = getToken('user');
    const payload = decodeJwt(token || '') || {};
    return {
      name: local?.name || local?.industryName || payload?.name || 'Industry',
      email: local?.email || payload?.email || '',
      location: local?.location || ''
    };
  }, []);

  const loadRequirements = async () => {
    try {
      const response = await api.get('/industry/my-requirements', { headers: authHeader('user') });
      setRequirements(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      setRequirements([]);
    }
  };

  const loadCategories = async () => {
    try {
      const response = await api.get('/requirements/categories');
      setCategories(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      setCategories([]);
    }
  };

  useEffect(() => {
    loadRequirements();
    loadCategories();
  }, []);

  const openPostModal = () => {
    setForm({
      industryName: profile.name || '',
      requirementCategory: '',
      projectDescription: '',
      contactDetails: profile.email || '',
      location: profile.location || ''
    });
    setStatus('');
    setOpenModal(true);
  };

  const submitRequirement = async () => {
    if (!form.industryName || !form.requirementCategory || !form.projectDescription || !form.contactDetails || !form.location) {
      setStatus('Please fill all required fields.');
      return;
    }

    try {
      await api.post('/industry/post-requirement', form, { headers: authHeader('user') });
      setStatus('Requirement posted successfully.');
      setOpenModal(false);
      await loadRequirements();
    } catch (error) {
      setStatus(error?.response?.data?.message || 'Unable to post requirement.');
    }
  };

  return (
    <section className="container section-space user-req-page">
      <div className="section-head user-req-head">
        <div>
          <h1>My Requirements</h1>
          <p>Track your posted requirements and vendor engagement in one place.</p>
        </div>
        <button type="button" className="btn btn-primary" onClick={openPostModal}>
          <i className="fa-solid fa-plus" /> Post Requirement
        </button>
      </div>

      {status && <p className="status-text">{status}</p>}

      <div className="list-stack user-req-list">
        {requirements.map((item) => (
          <article key={item._id} className="tweet-card user-req-tweet-card">
            <div className="tweet-header">
              <div className="profile-info">
                <div className="avatar">
                  <i className="fa-solid fa-industry" />
                </div>
                <div className="user-details">
                  <div className="name-row">
                    <span className="full-name">{item.requirementCategory}</span>
                  </div>
                  <span className="handle">{item.industryName} - {item.location}</span>
                </div>
              </div>
              <div className="more-options">
                <i className="fa-solid fa-ellipsis" />
              </div>
            </div>

            <div className="tweet-body">
              <p>{item.projectDescription}</p>
            </div>

            <div className="tweet-timestamp">
              {new Date(item.createdAt).toLocaleString()}
            </div>

            <div className="tweet-stats">
              <div className="stat-item"><strong>{Array.isArray(item.likedByVendors) ? item.likedByVendors.length : 0}</strong> Likes</div>
              <button
                type="button"
                className="stat-item user-req-responses-link"
                onClick={() => navigate('/inquiries')}
              >
                <strong>{Array.isArray(item.responses) ? item.responses.length : 0}</strong> Responses
              </button>
            </div>
          </article>
        ))}
        {!requirements.length && <p className="empty-text">No requirements posted yet.</p>}
      </div>

      {openModal ? (
        <div className="admin-modal-overlay" onClick={() => setOpenModal(false)} role="button" tabIndex={0}>
          <div className="admin-modal user-req-modal" onClick={(event) => event.stopPropagation()}>
            <div className="admin-modal-head user-req-modal-head">
              <h2><i className="fa-solid fa-file-circle-plus" /> Post Requirement</h2>
              <button type="button" className="btn btn-secondary" onClick={() => setOpenModal(false)}>Close</button>
            </div>
            <div className="form-grid two-cols user-req-form">
              <div className="user-req-field">
                <label>Industry Name</label>
                <input
                  placeholder="Enter industry name"
                  value={form.industryName}
                  onChange={(event) => setForm((prev) => ({ ...prev, industryName: event.target.value }))}
                />
              </div>

              <div className="user-req-field">
                <label>Category</label>
                <select
                  value={form.requirementCategory}
                  onChange={(event) => setForm((prev) => ({ ...prev, requirementCategory: event.target.value }))}
                >
                  <option value="">Select Category</option>
                  {categories.map((item) => (
                    <option key={item} value={item}>{item}</option>
                  ))}
                </select>
              </div>

              <div className="user-req-field">
                <label>Location</label>
                <input
                  placeholder="City / State"
                  value={form.location}
                  onChange={(event) => setForm((prev) => ({ ...prev, location: event.target.value }))}
                />
              </div>

              <div className="user-req-field">
                <label>Contact Details</label>
                <input
                  placeholder="Email / phone"
                  value={form.contactDetails}
                  onChange={(event) => setForm((prev) => ({ ...prev, contactDetails: event.target.value }))}
                />
              </div>

              <div className="user-req-field full-span">
                <label>Project Description</label>
                <textarea
                  rows={5}
                  placeholder="Write complete requirement details..."
                  value={form.projectDescription}
                  onChange={(event) => setForm((prev) => ({ ...prev, projectDescription: event.target.value }))}
                />
              </div>

              <button type="button" className="btn btn-primary user-req-publish" onClick={submitRequirement}>
                Publish Requirement
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}

export default UserRequirementsPage;
