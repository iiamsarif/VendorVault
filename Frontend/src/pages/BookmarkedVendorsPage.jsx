import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { api, getBookmarkedVendors, toggleVendorBookmark, truncateWords } from '../components/api';

function BookmarkedVendorsPage() {
  const [vendors, setVendors] = useState([]);

  const uploadsBase = useMemo(() => String(api.defaults.baseURL || '').replace(/\/api\/?$/, ''), []);

  useEffect(() => {
    const sync = () => {
      setVendors(getBookmarkedVendors());
    };
    sync();
    window.addEventListener('vv_bookmarks_changed', sync);
    return () => window.removeEventListener('vv_bookmarks_changed', sync);
  }, []);

  const toFileUrl = (filePath) => {
    const clean = String(filePath || '').trim();
    if (!clean) return '';
    if (/^https?:\/\//i.test(clean)) return clean;
    if (clean.startsWith('/')) return `${uploadsBase}${clean}`;
    return `${uploadsBase}/${clean}`;
  };

  const removeBookmark = (vendor) => {
    toggleVendorBookmark(vendor);
    setVendors(getBookmarkedVendors());
  };

  return (
    <section className="container section-space bookmarked-theme">
      <div className="section-head">
        <h1>Bookmarked Vendors</h1>
      </div>
      <p className="bookmarked-subtitle">Your saved vendors from local bookmarks.</p>

      <div className="bookmarked-grid">
        {vendors.map((vendor) => (
          <article key={vendor._id} className="bookmarked-card">
            <div className="bookmarked-top">
              <div className="bookmarked-avatar">
                <img src={toFileUrl(vendor.companyLogo) || 'https://i.pravatar.cc/100?img=12'} alt={vendor.companyName} />
              </div>
              <div className="bookmarked-meta">
                <h3>
                  {vendor.companyName}
                  {vendor.verified ? <i className="fa-solid fa-circle-check verified-tick" /> : null}
                </h3>
                <p>{vendor.category || 'Service Vendor'}</p>
                <small><i className="fa fa-location-dot" /> {vendor.cityState || vendor.location || 'Gujarat'}</small>
              </div>
            </div>
            <p className="bookmarked-desc">{truncateWords(vendor.companyDescription || 'Trusted industrial vendor profile.', 10)}</p>
            <div className="bookmarked-actions">
              <Link to={`/vendors/${vendor._id}`} className="btn btn-primary">View Profile</Link>
              <button type="button" className="btn btn-secondary" onClick={() => removeBookmark(vendor)}>Remove</button>
            </div>
          </article>
        ))}
        {!vendors.length ? <p className="empty-text">No bookmarked vendors yet.</p> : null}
      </div>
    </section>
  );
}

export default BookmarkedVendorsPage;
