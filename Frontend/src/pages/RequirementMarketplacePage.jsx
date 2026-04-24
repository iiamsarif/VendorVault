import React, { useEffect, useState } from 'react';
import { api, authHeader, getToken } from '../components/api';

function RequirementMarketplacePage() {
  const [requirements, setRequirements] = useState([]);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [messageById, setMessageById] = useState({});

  const loadRequirements = async (query = '') => {
    try {
      const response = await api.get(`/requirements/list?search=${encodeURIComponent(query)}`);
      setRequirements(response.data || []);
    } catch (error) {
      setRequirements([]);
    }
  };

  useEffect(() => {
    loadRequirements();
  }, []);

  const submitVendorResponse = async (requirementId) => {
    const message = messageById[requirementId];
    if (!message) {
      setStatus('Add response message before submitting quotation.');
      return;
    }

    try {
      await api.post(
        '/vendor/respond-requirement',
        { requirementId, message, quotation: 'Quotation shared in response.' },
        { headers: authHeader('vendor') }
      );
      setStatus('Response submitted successfully.');
      setMessageById((prev) => ({ ...prev, [requirementId]: '' }));
    } catch (error) {
      setStatus('Unable to submit response. Please login as vendor.');
    }
  };

  const saveRequirement = async (requirementId) => {
    try {
      await api.post('/vendor/save-requirement', { requirementId }, { headers: authHeader('vendor') });
      setStatus('Requirement saved.');
    } catch (error) {
      setStatus('Save failed. Please login as vendor.');
    }
  };

  const isVendorLoggedIn = Boolean(getToken('vendor'));

  return (
    <section className="container section-space">
      <div className="section-head">
        <h1>Requirement Marketplace</h1>
      </div>
      <div className="filter-bar white-card">
        <input
          placeholder="Search requirements by category, industry, location"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />
        <button type="button" className="btn btn-primary" onClick={() => loadRequirements(search)}>Search</button>
      </div>

      {status && <p className="status-text">{status}</p>}

      <div className="list-stack">
        {requirements.map((item) => (
          <article key={item._id} className="white-card">
            <h3>{item.requirementCategory}</h3>
            <p>{item.projectDescription}</p>
            <small>{item.industryName} • {item.location}</small>
            <p>Budget: {item.budgetRange || 'Not specified'} | Deadline: {item.deadline || 'Flexible'}</p>
            <div className="button-row">
              <a className="btn btn-ghost" href={`mailto:${item.contactDetails}`}>Contact Industry</a>
              <button type="button" className="btn btn-secondary" onClick={() => saveRequirement(item._id)} disabled={!isVendorLoggedIn}>Save Requirement</button>
            </div>
            <textarea
              rows={3}
              placeholder="Submit your response"
              value={messageById[item._id] || ''}
              onChange={(event) => setMessageById((prev) => ({ ...prev, [item._id]: event.target.value }))}
            />
            <button type="button" className="btn btn-primary" onClick={() => submitVendorResponse(item._id)} disabled={!isVendorLoggedIn}>Respond to Requirement</button>
          </article>
        ))}
        {!requirements.length && <p className="empty-text">No requirements available.</p>}
      </div>
    </section>
  );
}

export default RequirementMarketplacePage;
