import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../components/api';

function ViewVendorDirectory() {
  const [vendors, setVendors] = useState([]);

  useEffect(() => {
    const load = async () => {
      try {
        const response = await api.get('/vendor/listings');
        setVendors(response.data || []);
      } catch (error) {
        setVendors([]);
      }
    };

    load();
  }, []);

  return (
    <div>
      <div className="section-head"><h1>View Vendor Directory</h1></div>
      <div className="card-grid">
        {vendors.slice(0, 12).map((vendor) => (
          <article key={vendor._id} className="white-card">
            <h3>{vendor.companyName}</h3>
            <p>{vendor.category}</p>
            <p>{vendor.location}</p>
            <Link className="btn btn-primary" to={`/vendors/${vendor._id}`}>View Profile</Link>
          </article>
        ))}
      </div>
    </div>
  );
}

export default ViewVendorDirectory;
