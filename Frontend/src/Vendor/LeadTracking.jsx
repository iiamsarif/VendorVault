import React, { useEffect, useState } from 'react';
import { api, authHeader } from '../components/api';

function LeadTracking() {
  const [analytics, setAnalytics] = useState(null);

  useEffect(() => {
    const load = async () => {
      try {
        const response = await api.get('/vendor/analytics', { headers: authHeader('vendor') });
        setAnalytics(response.data);
      } catch (error) {
        setAnalytics(null);
      }
    };

    load();
  }, []);

  return (
    <div>
      <div className="section-head"><h1>Lead Tracking</h1></div>
      <div className="card-grid">
        <article className="white-card"><h3>Leads</h3><h2>{analytics?.totalInquiries || 0}</h2></article>
        <article className="white-card"><h3>Requirement Responses</h3><h2>{analytics?.responses || 0}</h2></article>
      </div>
    </div>
  );
}

export default LeadTracking;
