import React, { useEffect, useState } from 'react';
import { api, authHeader } from '../components/api';

function FeaturedVendorManagement() {
  const [vendors, setVendors] = useState([]);
  const [status, setStatus] = useState('');

  const loadVendors = async () => {
    try {
      const response = await api.get('/vendor/listings');
      setVendors(response.data || []);
    } catch (error) {
      setVendors([]);
    }
  };

  useEffect(() => {
    loadVendors();
  }, []);

  const toggleFeature = async (vendorId, featured) => {
    try {
      await api.post('/admin/vendors/feature', { vendorId, featured: !featured }, { headers: authHeader('admin') });
      setStatus('Featured listing updated.');
      loadVendors();
    } catch (error) {
      setStatus('Could not update featured listing.');
    }
  };

  return (
    <div>
      <div className="section-head"><h1>Featured Vendor Management</h1></div>
      {status && <p className="status-text">{status}</p>}
      <div className="list-stack">
        {vendors.slice(0, 20).map((vendor) => (
          <article key={vendor._id} className="white-card">
            <h3>{vendor.companyName}</h3>
            <p>{vendor.category}</p>
            <p>Featured: {vendor.featured ? 'Yes' : 'No'}</p>
            <button type="button" className="btn btn-primary" onClick={() => toggleFeature(vendor._id, vendor.featured)}>
              {vendor.featured ? 'Remove Featured' : 'Set Featured'}
            </button>
          </article>
        ))}
      </div>
    </div>
  );
}

export default FeaturedVendorManagement;
