import React, { useEffect, useState } from 'react';
import { api, authHeader, decodeJwt, getToken } from '../components/api';

function RespondRequirements() {
  const [requirements, setRequirements] = useState([]);
  const [responses, setResponses] = useState({});
  const [status, setStatus] = useState('');
  const vendorId = decodeJwt(getToken('vendor') || '')?.id;

  const loadRequirements = async () => {
    try {
      const response = await api.get('/requirements/list');
      const rows = Array.isArray(response.data) ? response.data : [];
      setRequirements(rows);
      setResponses((prev) => {
        const next = { ...prev };
        rows.forEach((req) => {
          const vendorResponse = Array.isArray(req.responses)
            ? req.responses.find((item) => String(item?.vendorId || '') === String(vendorId || ''))
            : null;
          if (vendorResponse && typeof next[req._id] !== 'string') {
            next[req._id] = vendorResponse.message || '';
          }
        });
        return next;
      });
    } catch (error) {
      setRequirements([]);
    }
  };

  useEffect(() => {
    loadRequirements();
  }, []);

  const respond = async (requirementId) => {
    try {
      await api.post('/vendor/respond-requirement', {
        requirementId,
        message: responses[requirementId] || '',
        quotation: 'Vendor quotation shared.'
      }, { headers: authHeader('vendor') });
      setStatus('Response submitted successfully.');
      await loadRequirements();
    } catch (error) {
      setStatus('Response submission failed.');
    }
  };

  const toggleLike = async (requirementId, liked) => {
    try {
      await api.post('/requirements/like', { requirementId, liked: !liked }, { headers: authHeader('vendor') });
      await loadRequirements();
    } catch (error) {
      setStatus(error?.response?.data?.message || 'Unable to update like.');
    }
  };

  return (
    <div>
      <div className="section-head"><h1>Respond to Requirements</h1></div>
      {status && <p className="status-text">{status}</p>}
      <div className="list-stack">
        {requirements.map((req) => {
          const vendorResponse = Array.isArray(req.responses)
            ? req.responses.find((item) => String(item?.vendorId || '') === String(vendorId || ''))
            : null;
          const hasResponded = Boolean(vendorResponse?.message);
          const textValue = typeof responses[req._id] === 'string'
            ? responses[req._id]
            : (vendorResponse?.message || '');
          return (
          <article className="tweet-card req-tweet-card" key={req._id}>
            <div className="tweet-header">
              <div className="profile-info">
                <div className="avatar">
                  <i className="fa-solid fa-building" />
                </div>
                <div className="user-details">
                  <div className="name-row">
                    <span className="full-name">{req.requirementCategory}</span>
                    {hasResponded ? <span className="req-responded-badge">Responded</span> : null}
                  </div>
                  <span className="handle">{req.industryName} - {req.location}</span>
                </div>
              </div>
              <div className="more-options">
                <i className="fa-solid fa-ellipsis" />
              </div>
            </div>

            <div className="tweet-body">
              <p>{req.projectDescription}</p>
            </div>

            <div className="req-vendor-meta">
              <span><i className="fa-solid fa-address-book" /> {req.contactDetails || '-'}</span>
            </div>

            <div className="tweet-stats">
              <div className="stat-item"><strong>{Array.isArray(req.likedByVendors) ? req.likedByVendors.length : 0}</strong> Likes</div>
              <div className="stat-item"><strong>{Array.isArray(req.responses) ? req.responses.length : 0}</strong> Responses</div>
            </div>

            <div className="tweet-actions req-tweet-actions">
              <button
                type="button"
                className={`action-btn ${Array.isArray(req.likedByVendors) && req.likedByVendors.includes(vendorId) ? 'is-liked' : ''}`}
                onClick={() => toggleLike(req._id, Array.isArray(req.likedByVendors) && req.likedByVendors.includes(vendorId))}
                title="Like requirement"
              >
                <i className={`${Array.isArray(req.likedByVendors) && req.likedByVendors.includes(vendorId) ? 'fa-solid' : 'fa-regular'} fa-heart`} />
              </button>
            </div>

            <div className="req-response-box">
              <textarea
                rows={3}
                placeholder="Write your response"
                value={textValue}
                onChange={(event) => setResponses((prev) => ({ ...prev, [req._id]: event.target.value }))}
              />
              <button type="button" className="btn btn-primary" onClick={() => respond(req._id)}>
                {hasResponded ? 'Update Quote' : 'Submit Quote'}
              </button>
            </div>
          </article>
        );
        })}
      </div>
    </div>
  );
}

export default RespondRequirements;
