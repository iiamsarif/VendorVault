import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { api, truncateWords } from '../components/api';

const defaultFilters = {
  category: '',
  location: '',
  industryType: '',
  reviewMin: '',
  highlight: '',
  search: ''
};

function VendorDirectoryPage() {
  const ITEMS_PER_PAGE = 4;
  const PAGE_GROUP_SIZE = 5;
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [vendors, setVendors] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [imageIndexes, setImageIndexes] = useState({});
  const [currentPage, setCurrentPage] = useState(1);
  const [filters, setFilters] = useState({
    ...defaultFilters,
    category: searchParams.get('category') || '',
    search: searchParams.get('search') || ''
  });

  useEffect(() => {
    const loadCategories = async () => {
      try {
        const response = await api.get('/vendor/categories');
        setCategories(Array.isArray(response.data) ? response.data : []);
      } catch (error) {
        setCategories([]);
      }
    };

    loadCategories();
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [filters]);

  useEffect(() => {
    const loadVendors = async () => {
      setLoading(true);
      try {
        const query = new URLSearchParams();
        Object.entries(filters).forEach(([key, value]) => {
          if (key === 'highlight') return;
          if (value === true) query.append(key, 'true');
          if (value && value !== true) query.append(key, value);
        });

        if (filters.highlight === 'verified') query.append('verified', 'true');
        if (filters.highlight === 'topRated') query.append('topRated', 'true');
        if (filters.highlight === 'newVendors') query.append('newVendors', 'true');
        if (filters.highlight === 'premium') query.append('premium', 'true');

        const response = await api.get(`/vendor/listings?${query.toString()}`);
        setVendors(response.data || []);
      } catch (error) {
        setVendors([]);
      } finally {
        setLoading(false);
      }
    };

    loadVendors();
  }, [filters]);

  const resultCount = useMemo(() => vendors.length, [vendors]);
  const sortedVendors = useMemo(() => {
    const list = Array.isArray(vendors) ? [...vendors] : [];
    return list.sort((a, b) => {
      const aTime = new Date(a?.createdAt || 0).getTime();
      const bTime = new Date(b?.createdAt || 0).getTime();
      return bTime - aTime;
    });
  }, [vendors]);
  const totalPages = Math.max(1, Math.ceil(sortedVendors.length / ITEMS_PER_PAGE));
  const safePage = Math.min(currentPage, totalPages);
  const startIndex = (safePage - 1) * ITEMS_PER_PAGE;
  const paginatedVendors = sortedVendors.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  const groupStart = Math.floor((safePage - 1) / PAGE_GROUP_SIZE) * PAGE_GROUP_SIZE + 1;
  const groupEnd = Math.min(groupStart + PAGE_GROUP_SIZE - 1, totalPages);
  const pageItems = Array.from({ length: groupEnd - groupStart + 1 }, (_, index) => groupStart + index);
  const uploadsBase = String(api.defaults.baseURL || '').replace(/\/api\/?$/, '');

  const toFileUrl = (filePath) => {
    const clean = String(filePath || '').trim();
    if (!clean) return '';
    if (/^https?:\/\//i.test(clean)) return clean;
    if (clean.startsWith('/')) return `${uploadsBase}${clean}`;
    return `${uploadsBase}/${clean}`;
  };

  const renderStars = (rating) => {
    const numeric = Math.max(0, Math.min(5, Math.round(Number(rating) || 0)));
    return Array.from({ length: 5 }).map((_, index) => (
      <i key={`${numeric}-${index}`} className={`fa-star ${index < numeric ? 'fa-solid' : 'fa-regular gray'}`} />
    ));
  };

  const slideImage = (vendorId, total, direction) => {
    if (total <= 1) return;
    setImageIndexes((prev) => {
      const current = prev[vendorId] || 0;
      const next = (current + direction + total) % total;
      return { ...prev, [vendorId]: next };
    });
  };

  return (
    <section className="container section-space vendor-directory-theme">
      <div className="search-tabs">
        <button type="button" className="tab active"><i className="fa fa-briefcase" /> Business Providers</button>
      </div>

      <div className="search-box">
        <div className="search-field">
          <input
            value={filters.search}
            onChange={(event) => setFilters((prev) => ({ ...prev, search: event.target.value }))}
            placeholder="What are you looking for?"
          />
        </div>
        <div className="search-field small">
          <select
            value={filters.category}
            onChange={(event) => setFilters((prev) => ({ ...prev, category: event.target.value }))}
          >
            <option value="">All Categories</option>
            {categories.map((category) => (
              <option key={category} value={category}>{category}</option>
            ))}
          </select>
        </div>
        <div className="search-field last">
          <input
            value={filters.location}
            onChange={(event) => setFilters((prev) => ({ ...prev, location: event.target.value }))}
            placeholder="Address, city, zip.."
          />
          <i className="fa-solid fa-crosshairs gps-icon" />
        </div>
      </div>

      <div className="results-header">
        <div className="results-count"><strong>{resultCount}</strong> vendors found</div>
        <div className="results-controls">
          <button type="button" className="control-btn active">Sort By <i className="fa fa-chevron-down" /></button>
          <button type="button" className="control-btn"><i className="fa fa-th-large" /></button>
          <button type="button" className="control-btn active"><i className="fa fa-list" /></button>
          <button type="button" className="control-btn"><i className="fa fa-map" /></button>
        </div>
      </div>

      {loading ? <p className="empty-text">Loading vendors...</p> : null}

      <div className="main-layout">
        <aside className="sidebar">
          <div className="filter-group">
            <h4>Filters</h4>
            <p className="filter-label">Review</p>
            <label>
              <input type="checkbox" checked={filters.reviewMin === '5'} onChange={() => setFilters((prev) => ({ ...prev, reviewMin: prev.reviewMin === '5' ? '' : '5' }))} />
              <span className="stars">{renderStars(5)}</span>
            </label>
            <label>
              <input type="checkbox" checked={filters.reviewMin === '4'} onChange={() => setFilters((prev) => ({ ...prev, reviewMin: prev.reviewMin === '4' ? '' : '4' }))} />
              <span className="stars">{renderStars(4)}</span>
            </label>
            <label>
              <input type="checkbox" checked={filters.reviewMin === '3'} onChange={() => setFilters((prev) => ({ ...prev, reviewMin: prev.reviewMin === '3' ? '' : '3' }))} />
              <span className="stars">{renderStars(3)}</span>
            </label>
          </div>

          <div className="filter-group">
            <p className="filter-label">Industry Type</p>
            <input
              value={filters.industryType}
              onChange={(event) => setFilters((prev) => ({ ...prev, industryType: event.target.value }))}
              placeholder="Type industry"
            />
          </div>
        </aside>

        <main className="results-list">
          {paginatedVendors.map((vendor) => {
            const fallbackCover = 'https://images.pexels.com/photos/3182781/pexels-photo-3182781.jpeg?auto=compress&cs=tinysrgb&w=800';
            const gallery = [
              ...(Array.isArray(vendor.galleryImages) ? vendor.galleryImages : [])
            ]
              .map((path) => toFileUrl(path))
              .filter(Boolean)
              .filter((path, index, arr) => arr.indexOf(path) === index);

            const imageList = gallery.length ? gallery : [fallbackCover];
            const activeIndex = Math.min(imageIndexes[vendor._id] || 0, imageList.length - 1);
            const cover = imageList[activeIndex];
            const avatar = toFileUrl(vendor.companyLogo) || 'https://i.pravatar.cc/100?img=12';
            const ratingValue = Number(vendor.rating || 0).toFixed(1);

            return (
              <article
                key={vendor._id}
                className="result-card"
                role="link"
                tabIndex={0}
                onClick={() => navigate(`/vendors/${vendor._id}`)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault();
                    navigate(`/vendors/${vendor._id}`);
                  }
                }}
              >
                <div className="card-img">
                  <img src={cover} alt={vendor.companyName} />
                  <button
                    type="button"
                    className="image-nav-btn prev"
                    onClick={(event) => {
                      event.stopPropagation();
                      slideImage(vendor._id, imageList.length, -1);
                    }}
                    aria-label="Previous image"
                  >
                    &lt;
                  </button>
                  <button
                    type="button"
                    className="image-nav-btn next"
                    onClick={(event) => {
                      event.stopPropagation();
                      slideImage(vendor._id, imageList.length, 1);
                    }}
                    aria-label="Next image"
                  >
                    &gt;
                  </button>
                  {vendor.subscriptionPlan === 'Premium Vendor' ? (
                    <div className="popular-tag"><i className="fa fa-fire" /> POPULAR</div>
                  ) : null}
                </div>

                <div className="card-info">
                  <div className="user-avatar">
                    <img src={avatar} alt={vendor.companyName} />
                  </div>
                  <h3 className="card-title">
                    {vendor.companyName}
                    {vendor.verified ? <i className="fa-solid fa-circle-check verified-tick" /> : null}
                  </h3>
                  <div className="card-meta">
                    <span className="stars">{renderStars(vendor.rating)}</span>
                    <strong>{ratingValue}</strong> ({vendor.totalReviews || 0}) - <span className="status-open">{vendor.approved ? 'Open' : 'Pending'}</span>
                  </div>
                  <div className="card-meta"><i className="fa fa-location-dot" /> {vendor.cityState || 'Gujarat'}</div>
                  <div className="card-meta"><i className="fa-regular fa-clock" /> {vendor.yearsExperience || 0} years experience</div>
                  <div className="card-meta"><i className="fa fa-phone" /> {vendor.mobileNumber || '-'}</div>
                  <div className="card-meta">{truncateWords(vendor.companyDescription || 'Trusted industrial service provider in Gujarat.', 10)}</div>

                  <div className="card-footer">
                    <div><i className="fa-solid fa-bowl-food" style={{ marginRight: '8px' }} /> {vendor.category}</div>
                    <div className="button-row">
                      <a className="btn btn-ghost" href={`tel:${vendor.mobileNumber || ''}`} onClick={(event) => event.stopPropagation()}>Call</a>
                      <a className="btn btn-secondary" href={`https://wa.me/${(vendor.whatsappNumber || '').replace(/[^0-9]/g, '')}`} target="_blank" rel="noreferrer" onClick={(event) => event.stopPropagation()}>WhatsApp</a>
                      <Link className="btn btn-primary" to={`/vendors/${vendor._id}`} onClick={(event) => event.stopPropagation()}>View Profile</Link>
                    </div>
                  </div>
                </div>
              </article>
            );
          })}

          {!loading && !sortedVendors.length ? <p className="empty-text">No vendors match your filters.</p> : null}
          {!loading && sortedVendors.length > ITEMS_PER_PAGE ? (
            <div className="vendor-pagination">
              {pageItems.map((pageNo) => (
                <button
                  key={pageNo}
                  type="button"
                  className={`vendor-page-btn ${safePage === pageNo ? 'active' : ''}`}
                  onClick={() => setCurrentPage(pageNo)}
                >
                  {pageNo}
                </button>
              ))}
              {groupEnd < totalPages ? (
                <button
                  type="button"
                  className="vendor-page-btn"
                  onClick={() => setCurrentPage(groupEnd + 1)}
                >
                  Next
                </button>
              ) : null}
            </div>
          ) : null}
        </main>
      </div>
    </section>
  );
}

export default VendorDirectoryPage;
