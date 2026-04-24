import React, { useEffect, useState } from 'react';
import { api, authHeader } from '../components/api';

function PlatformStatistics() {
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
      <div className="section-head"><h1>Platform Statistics</h1></div>
      <div className="white-card">
        <p>Total Vendors: {stats?.vendors?.totalVendors || 0}</p>
        <p>Approved Vendors: {stats?.vendors?.approvedVendors || 0}</p>
        <p>Verified Vendors: {stats?.vendors?.verifiedVendors || 0}</p>
        <p>Premium Vendors: {stats?.vendors?.premiumVendors || 0}</p>
        <p>Requirements: {stats?.requirements || 0}</p>
        <p>Industries: {stats?.industries || 0}</p>
      </div>
    </div>
  );
}

export default PlatformStatistics;
