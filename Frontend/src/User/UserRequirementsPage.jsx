import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { api, authHeader, decodeJwt, getToken, getUserProfile } from '../components/api';

function UserRequirementsPage() {
  const navigate = useNavigate();
  const [requirements, setRequirements] = useState([]);
  const [categories, setCategories] = useState([]);
  const [openModal, setOpenModal] = useState(false);
  const [editingId, setEditingId] = useState('');
  const [status, setStatus] = useState('');
  const [showMyPosts, setShowMyPosts] = useState(false);
  const [search, setSearch] = useState('');
  const [searchParams, setSearchParams] = useSearchParams();
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
      id: String(payload?.id || ''),
      name: local?.name || local?.industryName || payload?.name || 'Industry',
      email: local?.email || payload?.email || '',
      location: local?.location || ''
    };
  }, []);

  const loadRequirements = async (query = '') => {
    try {
      const response = await api.get(`/requirements/list?search=${encodeURIComponent(query)}`);
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

  useEffect(() => {
    if (searchParams.get('post') === '1') {
      setEditingId('');
      setForm({
        industryName: profile.name || '',
        requirementCategory: '',
        projectDescription: '',
        contactDetails: profile.email || '',
        location: profile.location || ''
      });
      setOpenModal(true);
      setSearchParams((prev) => {
        const next = new URLSearchParams(prev);
        next.delete('post');
        return next;
      }, { replace: true });
    }
  }, [profile.email, profile.location, profile.name, searchParams, setSearchParams]);

  const openPostModal = () => {
    setEditingId('');
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

  const openEditModal = (item) => {
    setEditingId(String(item._id));
    setForm({
      industryName: item.industryName || '',
      requirementCategory: item.requirementCategory || '',
      projectDescription: item.projectDescription || '',
      contactDetails: item.contactDetails || '',
      location: item.location || ''
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
      if (editingId) {
        await api.put(`/industry/requirement/${editingId}`, form, { headers: authHeader('user') });
        setStatus('Requirement updated successfully.');
      } else {
        await api.post('/industry/post-requirement', form, { headers: authHeader('user') });
        setStatus('Requirement posted successfully.');
      }
      setOpenModal(false);
      await loadRequirements(search);
    } catch (error) {
      setStatus(error?.response?.data?.message || 'Unable to save requirement.');
    }
  };

  const deleteRequirement = async (item) => {
    const ok = window.confirm(`Delete "${item.requirementCategory}" requirement?`);
    if (!ok) return;
    try {
      await api.delete(`/industry/requirement/${item._id}`, { headers: authHeader('user') });
      setStatus('Requirement deleted successfully.');
      await loadRequirements(search);
    } catch (error) {
      setStatus(error?.response?.data?.message || 'Unable to delete requirement.');
    }
  };

  const filteredRequirements = useMemo(() => {
    return requirements.filter((item) => {
      if (!showMyPosts) return true;
      return String(item.industryId || '') === profile.id;
    });
  }, [requirements, showMyPosts, profile.id]);

  return (
    <section className="container section-space user-req-page">
      <div className="section-head user-req-head">
        <div>
          <h1>Industry Requirements</h1>
          <p>Track your posted requirements and vendor engagement in one place.</p>
        </div>
        <button type="button" className="btn btn-primary" onClick={openPostModal}>
          <i className="fa-solid fa-plus" /> Post Requirement
        </button>
      </div>

      <div className="user-req-toolbar white-card">
        <input
          placeholder="Search requirements by category, industry, location"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />
        <button type="button" className="btn btn-secondary" onClick={() => loadRequirements(search)}>Search</button>
        <button
          type="button"
          className={`btn ${showMyPosts ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setShowMyPosts((prev) => !prev)}
        >
          {showMyPosts ? 'Showing My Posts' : 'My Posts'}
        </button>
      </div>

      {status && <p className="status-text">{status}</p>}

      <div className="list-stack user-req-list">
        {filteredRequirements.map((item) => {
          const isMine = String(item.industryId || '') === profile.id;
          return (
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
                {isMine ? (
                  <button
                    type="button"
                    className="stat-item user-req-responses-link"
                    onClick={() => navigate('/inquiries')}
                  >
                    <strong>{Array.isArray(item.responses) ? item.responses.length : 0}</strong> Responses
                  </button>
                ) : null}
              </div>

              {isMine ? (
                <div className="user-req-owner-actions">
                  <button type="button" className="btn btn-secondary" onClick={() => openEditModal(item)}>Edit</button>
                  <button type="button" className="btn btn-danger" onClick={() => deleteRequirement(item)}>Delete</button>
                </div>
              ) : null}
            </article>
          );
        })}
        {!filteredRequirements.length && <p className="empty-text">No requirements found.</p>}
      </div>

      {openModal ? (
        <div className="admin-modal-overlay" onClick={() => setOpenModal(false)} role="button" tabIndex={0}>
          <div className="admin-modal user-req-modal" onClick={(event) => event.stopPropagation()}>
            <div className="admin-modal-head user-req-modal-head">
              <h2><i className="fa-solid fa-file-circle-plus" /> {editingId ? 'Edit Requirement' : 'Post Requirement'}</h2>
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
                {editingId ? 'Save Changes' : 'Publish Requirement'}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}

export default UserRequirementsPage;
