import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api, authHeader } from '../components/api';

function VendorDashboard() {
  const [analytics, setAnalytics] = useState(null);
  const respondedInquiries = Math.max(
    0,
    Number(analytics?.totalInquiries || 0) - Number(analytics?.openInquiries || 0)
  );

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
      <div className="section-head"><h1>Vendor Dashboard</h1></div>
      <div className="stats-row">
        <article className="stat-card sales">
          <div>
            <div className="label">Today</div>
            <div className="title">Profile Views</div>
          </div>
          <div className="number">{analytics?.profileViews || 0}</div>
        </article>
        <article className="stat-card visitors">
          <div>
            <div className="label">Today</div>
            <div className="title">Total Inquiries</div>
          </div>
          <div className="number">{analytics?.totalInquiries || 0}</div>
        </article>
        <article className="stat-card orders">
          <div>
            <div className="label">Today</div>
            <div className="title">Responded Inquiries</div>
          </div>
          <div className="number">{respondedInquiries}</div>
        </article>
      </div>

      <div className="charts-row">
        <article className="chart-box">
          <h4>Profile Settings</h4>
          <Link to="/vendor/dashboard/edit-profile" className="white-card linked-card">Edit Profile</Link>
        </article>
        <article className="chart-box">
          <h4>Lead Actions</h4>
          <Link to="/vendor/dashboard/respond-requirements" className="white-card linked-card">Respond to Requirements</Link>
        </article>
        <article className="chart-box">
          <h4>Subscription</h4>
          <p className="status-text">Currently Paid: <strong>{analytics?.paid || 'None'}</strong></p>
          <Link to="/vendor/dashboard/subscription" className="white-card linked-card">Upgrade Subscription</Link>
        </article>
      </div>
    </div>
  );
}

export default VendorDashboard;
