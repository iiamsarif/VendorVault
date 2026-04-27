import React, { useEffect, useState } from 'react';
import { api, authHeader } from '../components/api';

function AnalyticsOverview() {
  const [stats, setStats] = useState(null);

  useEffect(() => {
    const load = async () => {
      try {
        const response = await api.get('/admin/stats', { headers: authHeader('admin') });
        setStats(response.data);
      } catch (error) {
        setStats(null);
      }
    };

    load();
  }, []);

  return (
    <div>
      <div className="section-head"><h1>Analytics Overview</h1></div>
      <div className="card-grid three">
        <article className="white-card"><h3>Premium Vendors</h3><h2>{stats?.vendors?.premiumVendors || 0}</h2></article>
        <article className="white-card"><h3>Total Requirements</h3><h2>{stats?.requirements || 0}</h2></article>
      </div>
    </div>
  );
}

export default AnalyticsOverview;
