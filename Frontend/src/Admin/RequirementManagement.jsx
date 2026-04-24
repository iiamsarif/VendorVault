import React, { useEffect, useState } from 'react';
import { api, authHeader } from '../components/api';

function RequirementManagement() {
  const [requirements, setRequirements] = useState([]);

  useEffect(() => {
    const load = async () => {
      try {
        const response = await api.get('/admin/requirements', { headers: authHeader('admin') });
        setRequirements(response.data || []);
      } catch (error) {
        setRequirements([]);
      }
    };

    load();
  }, []);

  return (
    <div>
      <div className="section-head"><h1>Requirement Management</h1></div>
      <div className="list-stack">
        {requirements.map((item) => (
          <article key={item._id} className="white-card">
            <h3>{item.requirementCategory}</h3>
            <p>{item.projectDescription}</p>
            <small>{item.industryName} • {item.location}</small>
          </article>
        ))}
        {!requirements.length && <p className="empty-text">No requirements posted yet.</p>}
      </div>
    </div>
  );
}

export default RequirementManagement;
