import React, { useEffect, useState } from 'react';
import { api } from '../components/api';

function ShortlistVendors() {
  const [vendors, setVendors] = useState([]);

  useEffect(() => {
    const load = async () => {
      try {
        const response = await api.get('/vendor/listings');
        const shortlistIds = JSON.parse(localStorage.getItem('userShortlist') || '[]');
        const shortlisted = (response.data || []).filter((vendor) => shortlistIds.includes(vendor._id));
        setVendors(shortlisted);
      } catch (error) {
        setVendors([]);
      }
    };

    load();
  }, []);

  return (
    <div>
      <div className="section-head"><h1>Shortlist Vendors</h1></div>
      <div className="list-stack">
        {vendors.map((vendor) => (
          <article key={vendor._id} className="white-card">
            <h3>{vendor.companyName}</h3>
            <p>{vendor.category} • {vendor.location}</p>
          </article>
        ))}
        {!vendors.length && <p className="empty-text">No shortlisted vendors yet.</p>}
      </div>
    </div>
  );
}

export default ShortlistVendors;
