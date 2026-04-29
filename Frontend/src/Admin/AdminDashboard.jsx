import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api, authHeader } from '../components/api';

function AdminDashboard() {
  const [stats, setStats] = useState(null);

  useEffect(() => {
    const loadStats = async () => {
      try {
        const response = await api.get('/admin/stats', { headers: authHeader('admin') });
        setStats(response.data);
      } catch (error) {
        setStats(null);
      }
    };

    loadStats();
  }, []);

  return (
    <div>
      <div className="section-head">
        <h1>Admin Dashboard</h1>
      </div>
      <div className="card-grid three">
        <article className="white-card"><h3>Total Vendors</h3><h2>{stats?.vendors?.totalVendors || 0}</h2></article>
        <article className="white-card"><h3>Approved Vendors</h3><h2>{stats?.vendors?.approvedVendors || 0}</h2></article>
        <article className="white-card"><h3>Verified Vendors</h3><h2>{stats?.vendors?.verifiedVendors || 0}</h2></article>
        <article className="white-card"><h3>Requirements</h3><h2>{stats?.requirements || 0}</h2></article>
        <article className="white-card"><h3>Users</h3><h2>{stats?.industries || 0}</h2></article>
      </div>
      <div className="card-grid three section-space-sm">
        <Link className="white-card linked-card" to="/admin/vendors/approval">Vendor Approval</Link>
        <Link className="white-card linked-card" to="/admin/categories">Category Management</Link>
        <Link className="white-card linked-card" to="/admin/analytics">Analytics Overview</Link>
      </div>
    </div>
  );
}

export default AdminDashboard;
