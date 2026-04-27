import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { api, authHeader, getToken, isVendorBookmarked, toggleVendorBookmark } from '../components/api';

function VendorProfilePage() {
  const { vendorId } = useParams();
  const [vendor, setVendor] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('description');
  const [inquiry, setInquiry] = useState({ contactName: '', contactEmail: '', contactPhone: '', message: '' });
  const [status, setStatus] = useState('');
  const [userRating, setUserRating] = useState(0);
  const [ratingStatus, setRatingStatus] = useState('');
  const [ratingSaving, setRatingSaving] = useState(false);
  const [bookmarked, setBookmarked] = useState(false);

  useEffect(() => {
    const loadVendor = async () => {
      setLoading(true);
      try {
        const viewerHeaders = getToken('user')
          ? authHeader('user')
          : getToken('vendor')
            ? authHeader('vendor')
            : getToken('admin')
              ? authHeader('admin')
              : {};
        const response = await api.get(`/vendor/profile?vendorId=${vendorId}`, { headers: viewerHeaders });
        setVendor(response.data);
        setUserRating(Number(response.data?.myRating || 0));
        setBookmarked(isVendorBookmarked(vendorId));
      } catch (error) {
        setVendor(null);
      } finally {
        setLoading(false);
      }
    };

    loadVendor();
  }, [vendorId]);

  const sendInquiry = async (event) => {
    event.preventDefault();
    if (!inquiry.contactName || !inquiry.message) {
      setStatus('Please fill contact name and message.');
      return;
    }

    try {
      await api.post(
        '/inquiries/create',
        { vendorId, ...inquiry },
        { headers: authHeader('user') }
      );
      setStatus('Inquiry sent successfully.');
      setInquiry({ contactName: '', contactEmail: '', contactPhone: '', message: '' });
    } catch (error) {
      setStatus(error?.response?.data?.message || 'Unable to send inquiry. Login as user/industry first.');
    }
  };

  const shortlistVendor = async () => {
    if (!vendor) return;
    const result = toggleVendorBookmark({ ...vendor, _id: vendorId });
    setBookmarked(result.bookmarked);
    setStatus(result.bookmarked ? 'Vendor bookmarked successfully.' : 'Vendor removed from bookmarks.');
  };

  const submitRating = async () => {
    if (!getToken('user')) {
      setRatingStatus('Login as user/industry to rate this vendor.');
      return;
    }
    if (!userRating) {
      setRatingStatus('Please select a star rating first.');
      return;
    }

    try {
      setRatingSaving(true);
      const response = await api.post(
        '/vendor/rate',
        { vendorId, rating: userRating },
        { headers: authHeader('user') }
      );
      setVendor((prev) => ({
        ...prev,
        rating: response.data?.averageRating ?? prev?.rating ?? 0,
        totalReviews: response.data?.totalReviews ?? prev?.totalReviews ?? 0,
        myRating: userRating
      }));
      setRatingStatus(userRating ? 'Your rating has been saved.' : '');
    } catch (error) {
      setRatingStatus(error?.response?.data?.message || 'Unable to save rating.');
    } finally {
      setRatingSaving(false);
    }
  };

  if (loading) {
    return <section className="container section-space"><p className="empty-text">Loading profile...</p></section>;
  }

  if (!vendor) {
    return <section className="container section-space"><p className="empty-text">Vendor not found.</p></section>;
  }

  const uploadsBase = String(api.defaults.baseURL || '').replace(/\/api\/?$/, '');
  const logoPath = String(vendor.companyLogo || '').trim();
  const logoUrl = logoPath
    ? /^https?:\/\//i.test(logoPath)
      ? logoPath
      : logoPath.startsWith('/')
        ? `${uploadsBase}${logoPath}`
        : `${uploadsBase}/${logoPath}`
    : '';
  const galleryImages = (Array.isArray(vendor.galleryImages) ? vendor.galleryImages : [])
    .map((item) => {
      const clean = String(item || '').trim();
      if (!clean) return '';
      if (/^https?:\/\//i.test(clean)) return clean;
      if (clean.startsWith('/')) return `${uploadsBase}${clean}`;
      return `${uploadsBase}/${clean}`;
    })
    .filter(Boolean);

  const certificateItems = (Array.isArray(vendor.certificates) ? vendor.certificates : [])
    .map((item) => {
      const clean = String(item || '').trim();
      if (!clean) return null;
      const url = /^https?:\/\//i.test(clean)
        ? clean
        : clean.startsWith('/')
          ? `${uploadsBase}${clean}`
          : `${uploadsBase}/${clean}`;
      const lower = clean.toLowerCase();
      const isImage = lower.endsWith('.png') || lower.endsWith('.jpg') || lower.endsWith('.jpeg') || lower.endsWith('.webp');
      return {
        url,
        name: clean.split('/').pop(),
        isImage
      };
    })
    .filter(Boolean);
  const stars = Math.max(0, Math.min(5, Math.round(Number(vendor.rating) || 0)));
  const ratingLabel = Number(vendor.rating || 0).toFixed(1);

  return (
    <section className="vendor-detail-theme">
      <div className="page-header-bg">
        <div className="container">
          <div className="profile-card">
            {vendor.subscriptionPlan === 'Premium Vendor' ? <div className="popular-tag">POPULAR</div> : null}
            <div className="profile-title-row">
              <div className="profile-main-info">
                <div className="vendor-detail-dp">
                  <img src={logoUrl || 'https://i.pravatar.cc/100?img=12'} alt={vendor.companyName} />
                </div>
                <div className="profile-title">
                  <h1>
                    {vendor.companyName}
                    {vendor.verified ? <span className="claimed"><i className="fa fa-check-circle" /> Verified</span> : null}
                  </h1>
                  <div className="profile-meta">
                    <span className="stars">
                      {Array.from({ length: 5 }).map((_, index) => (
                        <i key={index} className={index < stars ? 'fa fa-star' : 'fa-regular fa-star'} />
                      ))}
                    </span>
                    <span>({ratingLabel}/5 Reviews)</span>
                    <span><i className="fa fa-tags" /> {(vendor.servicesOffered || []).join(', ') || vendor.category || 'Services'}</span>
                    <span><i className="fa-regular fa-credit-card" /> Plan: <strong>{vendor.subscriptionPlan || 'Free Vendor Listing'}</strong></span>
                  </div>
                </div>
              </div>
              <div className="action-buttons">
                <button type="button" className="btn-outline" onClick={shortlistVendor}>
                  <i className={`fa-${bookmarked ? 'solid' : 'regular'} fa-bookmark`} />
                  {' '}
                  {bookmarked ? 'Bookmarked' : 'Bookmark'}
                </button>
                <a className="btn-outline" href={`tel:${vendor.mobileNumber || ''}`}><i className="fa fa-phone" /> Call</a>
                <a className="btn-outline" href={`https://wa.me/${(vendor.whatsappNumber || '').replace(/[^0-9]/g, '')}`} target="_blank" rel="noreferrer"><i className="fa-brands fa-whatsapp" /> WhatsApp</a>
              </div>
            </div>
          </div>

          <div className="tabs-nav">
            <button type="button" className={`tab-item ${activeTab === 'description' ? 'active' : ''}`} onClick={() => setActiveTab('description')}>
              <i className="fa-regular fa-file-lines" /> Description
            </button>
            <button type="button" className={`tab-item ${activeTab === 'photos' ? 'active' : ''}`} onClick={() => setActiveTab('photos')}>
              <i className="fa-regular fa-image" /> Photos
            </button>
            <button type="button" className={`tab-item ${activeTab === 'certificates' ? 'active' : ''}`} onClick={() => setActiveTab('certificates')}>
              <i className="fa-solid fa-certificate" /> Certificates
            </button>
            <button type="button" className={`tab-item ${activeTab === 'reviews' ? 'active' : ''}`} onClick={() => setActiveTab('reviews')}>
              <i className="fa-regular fa-star" /> Reviews ({vendor.totalReviews || 0})
            </button>
          </div>

          <div className="content-grid">
            <div className="main-content">
              {activeTab === 'description' ? (
                <article className="content-card">
                  <h3>Description</h3>
                  <p>{vendor.companyDescription || 'No description available.'}</p>

                  <div className="header-with-icon">
                    <div className="icon-box"><i className="fa fa-bars" /></div>
                    <h3>Services Offered</h3>
                  </div>
                  <p>{(vendor.servicesOffered || []).join(', ') || 'No services added.'}</p>

                  <div className="header-with-icon">
                    <div className="icon-box"><i className="fa fa-industry" /></div>
                    <h3>Industries Served</h3>
                  </div>
                  <p>{(vendor.industriesServed || []).join(', ') || 'Industrial Manufacturing'}</p>
                </article>
              ) : null}

              {activeTab === 'photos' ? (
                <article className="content-card">
                  <h3>Photos</h3>
                  {galleryImages.length ? (
                    <div className="vendor-photo-grid">
                      {galleryImages.map((photo, index) => (
                        <img key={`${photo}-${index}`} src={photo} alt={`Vendor photo ${index + 1}`} className="vendor-photo-thumb" />
                      ))}
                    </div>
                  ) : (
                    <p>No uploaded photos found.</p>
                  )}
                </article>
              ) : null}

              {activeTab === 'certificates' ? (
                <article className="content-card">
                  <h3>Certificates</h3>
                  {certificateItems.length ? (
                    <div className="vendor-certificate-grid">
                      {certificateItems.map((item, index) => (
                        <a
                          key={`${item.url}-${index}`}
                          href={item.url}
                          target="_blank"
                          rel="noreferrer"
                          className="vendor-certificate-item"
                        >
                          {item.isImage ? (
                            <img src={item.url} alt={item.name} className="vendor-certificate-thumb" />
                          ) : (
                            <div className="vendor-certificate-file"><i className="fa-regular fa-file-pdf" /> PDF</div>
                          )}
                          <span>{item.name}</span>
                        </a>
                      ))}
                    </div>
                  ) : (
                    <p>No certificates uploaded.</p>
                  )}
                </article>
              ) : null}

              {activeTab === 'reviews' ? (
                <article className="content-card">
                  <h3>Reviews</h3>
                  <p>{vendor.rating || 0}/5 rating with {vendor.totalReviews || 0} reviews.</p>
                </article>
              ) : null}
            </div>

            <aside className="sidebar">
              <div className="widget">
                <div className="widget-title">Rate This Vendor</div>
                <p className="rating-help-text">
                  {vendor?.myRating ? 'You already rated this vendor. You can update your rating anytime.' : 'Click stars to submit your rating.'}
                </p>
                <div className="vendor-rating-picker">
                  {Array.from({ length: 5 }).map((_, index) => {
                    const score = index + 1;
                    return (
                      <button
                        key={score}
                        type="button"
                        className={`vendor-rating-star ${score <= userRating ? 'active' : ''}`}
                        onClick={() => setUserRating(score)}
                        aria-label={`Rate ${score} star`}
                      >
                        <i className={score <= userRating ? 'fa-solid fa-star' : 'fa-regular fa-star'} />
                      </button>
                    );
                  })}
                </div>
                <button type="button" className="btn btn-primary" onClick={submitRating} disabled={ratingSaving}>
                  {ratingSaving ? 'Saving...' : vendor?.myRating ? 'Update Rating' : 'Submit Rating'}
                </button>
                {ratingStatus ? <p className="status-text">{ratingStatus}</p> : null}
              </div>

              <div className="widget">
                <div className="widget-title">Send Inquiry / Request Quote</div>
                <form onSubmit={sendInquiry}>
                  <div className="form-group">
                    <label>Contact Name</label>
                    <input
                      className="form-control"
                      value={inquiry.contactName}
                      onChange={(event) => setInquiry((prev) => ({ ...prev, contactName: event.target.value }))}
                    />
                  </div>
                  <div className="form-group">
                    <label>Email</label>
                    <input
                      className="form-control"
                      value={inquiry.contactEmail}
                      onChange={(event) => setInquiry((prev) => ({ ...prev, contactEmail: event.target.value }))}
                    />
                  </div>
                  <div className="form-group">
                    <label>Phone</label>
                    <input
                      className="form-control"
                      value={inquiry.contactPhone}
                      onChange={(event) => setInquiry((prev) => ({ ...prev, contactPhone: event.target.value }))}
                    />
                  </div>
                  <div className="form-group">
                    <label>Message</label>
                    <textarea
                      className="form-control"
                      rows={5}
                      value={inquiry.message}
                      onChange={(event) => setInquiry((prev) => ({ ...prev, message: event.target.value }))}
                    />
                  </div>
                  <button type="submit" className="btn btn-primary">Send Inquiry</button>
                </form>
                {status && <p className="status-text">{status}</p>}
              </div>

              <div className="widget">
                <div className="widget-title">Author Info</div>
                <div className="author-box">
                  <div className="author-img">
                    <img src={logoUrl || 'https://i.pravatar.cc/100?img=12'} alt={vendor.companyName} />
                  </div>
                  <div>
                    <div className="author-name">{vendor.contactPerson || vendor.companyName}</div>
                    <div className="author-meta">Member since {new Date(vendor.createdAt || Date.now()).getFullYear()}</div>
                  </div>
                </div>
              </div>
            </aside>
          </div>
        </div>
      </div>
    </section>
  );
}

export default VendorProfilePage;
