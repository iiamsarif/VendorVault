import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api, truncateWords } from '../components/api';

const iconList = [
  'fas fa-bolt',
  'fas fa-gear',
  'fas fa-building',
  'fas fa-truck',
  'fas fa-helmet-safety',
  'fas fa-industry',
  'fas fa-screwdriver-wrench',
  'fas fa-hard-hat'
];

function HomePage() {
  const navigate = useNavigate();
  const [vendors, setVendors] = useState([]);
  const [categories, setCategories] = useState([]);
  const [requirements, setRequirements] = useState([]);
  const [search, setSearch] = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        const [vendorRes, categoryRes, reqRes] = await Promise.all([
          api.get('/vendor/listings?featured=true'),
          api.get('/vendor/categories'),
          api.get('/requirements/list')
        ]);
        setVendors((vendorRes.data || []).slice(0, 6));
        setCategories((categoryRes.data || []).slice(0, 8));
        setRequirements((reqRes.data || []).slice(0, 2));
      } catch (error) {
        setVendors([]);
        setCategories([]);
        setRequirements([]);
      }
    };
    load();
  }, []);

  useEffect(() => {
    const nodes = Array.from(document.querySelectorAll('.reveal'));
    if (!nodes.length) return undefined;
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('active');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.1 });
    nodes.forEach((node) => observer.observe(node));
    return () => observer.disconnect();
  }, [categories.length, vendors.length, requirements.length]);

  useEffect(() => {
    const blocks = Array.from(document.querySelectorAll('.avantage-observe'));
    if (!blocks.length) return undefined;
    blocks.forEach((block) => block.classList.remove('avantage-in-view'));

    const smallScreen = window.matchMedia('(max-width: 768px)').matches;
    const activateVisibleBlocks = () => {
      blocks.forEach((block) => {
        if (block.classList.contains('avantage-in-view')) return;
        const rect = block.getBoundingClientRect();
        if (rect.top <= window.innerHeight * 0.92) {
          block.classList.add('avantage-in-view');
        }
      });
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('avantage-in-view');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: smallScreen ? 0.03 : 0.35, rootMargin: smallScreen ? '0px 0px -4% 0px' : '0px 0px -12% 0px' });

    blocks.forEach((block) => observer.observe(block));
    activateVisibleBlocks();
    window.addEventListener('scroll', activateVisibleBlocks, { passive: true });
    window.addEventListener('resize', activateVisibleBlocks);

    return () => {
      observer.disconnect();
      window.removeEventListener('scroll', activateVisibleBlocks);
      window.removeEventListener('resize', activateVisibleBlocks);
    };
  }, []);

  const totalConnections = useMemo(
    () => vendors.reduce((sum, item) => sum + Number(item.totalReviews || 0), 0),
    [vendors]
  );

  const doSearch = () => {
    navigate(`/vendors?search=${encodeURIComponent(search.trim())}`);
  };

  return (
    <div className="vv-public-page">
      <section className="vv-hero">
        <div className="container">
          <span className="vv-status-badge">SYSTEM ONLINE // NETWORK ACTIVE</span>
          <h1 className="reveal slide-left">
            VENDORVAULT <span className="orange">GUJARAT</span>
          </h1>
          <p className="reveal">
            The definitive digital directory for industrial procurement. Connect with verified contractors, suppliers,
            and service providers across Gujarat&apos;s industrial landscape.
          </p>

          <div className="vv-search-box reveal">
            <input
              type="text"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search by category, service, or location..."
            />
            <button type="button" className="vv-btn-primary" onClick={doSearch}>Initialize Search</button>
          </div>

          <div className="vv-stats-grid">
            <div className="vv-stat-item reveal">
              <h3>{vendors.length || 0}+</h3>
              <span>Featured Vendors</span>
            </div>
            <div className="vv-stat-item reveal">
              <h3>{categories.length || 0}+</h3>
              <span>Active Categories</span>
            </div>
            <div className="vv-stat-item reveal">
              <h3>{totalConnections || 0}+</h3>
              <span>Network Connections</span>
            </div>
          </div>
        </div>
      </section>

      <section className="section-padding container vv-directory-section">
        <div className="vv-section-head-row">
          <div>
            <span className="vv-kicker">DIRECTORY INDEX</span>
            <h2>Systematic <span>Categorization</span></h2>
            <p>Navigate our structured database of industrial service providers. Each category is meticulously maintained.</p>
          </div>
          <Link to="/categories" className="vv-inline-link">ACCESS FULL INDEX -&gt;</Link>
        </div>

        <div className="vv-cat-grid">
          {categories.map((category, index) => (
            <Link key={category} to={`/vendors?search=${encodeURIComponent(category)}`} className="vv-cat-card reveal" data-index={String(index + 1).padStart(2, '0')}>
              <i className={iconList[index % iconList.length]} />
              <h5>{category}</h5>
            </Link>
          ))}
          {!categories.length ? <p className="empty-text">No categories found.</p> : null}
        </div>
      </section>

      <section className="vv-quote-section">
        <i className="fas fa-bolt" />
        <blockquote>&quot;Empowering Gujarat&apos;s industrial backbone through seamless, verified digital connections.&quot;</blockquote>
      </section>

      <section className="section-padding container">
        <div className="vv-section-head-row">
          <h2>Featured <span>Vendors</span></h2>
          <Link to="/vendors" className="vv-outline-btn">VIEW COMPLETE ROSTER</Link>
        </div>

        <div className="vv-vendor-grid">
          {vendors.map((vendor, index) => (
            <Link key={vendor._id} to={`/vendors/${vendor._id}`} className={`vv-vendor-card reveal ${index === 0 ? 'slide-left' : index === vendors.length - 1 ? 'slide-right' : ''}`}>
              {vendor.verified ? <span className="vv-verified-tag"><i className="fa-solid fa-circle-check" /> VERIFIED</span> : null}
              <i className="fas fa-industry vv-vendor-icon" />
              <h4>{vendor.companyName}</h4>
              <p>{truncateWords(vendor.companyDescription || 'Trusted industrial vendor in VendorVault Gujarat.', 10)}</p>
              <div className="vv-vendor-meta">
                <i className="fas fa-map-marker-alt" /> {vendor.cityState || vendor.location || 'Gujarat'}
              </div>
            </Link>
          ))}
          {!vendors.length ? <p className="empty-text">No featured vendors yet.</p> : null}
        </div>
      </section>

      <section className="section-padding container">
        <div style={{ marginBottom: '40px' }}>
          <span className="vv-kicker">LIVE FEED</span>
          <h2 className="vv-main-title">Industry <span>Requirements</span></h2>
        </div>

        <div className="vv-req-list">
          {requirements.map((item) => (
            <article key={item._id} className="vv-req-card reveal">
              <div>
                <span className="vv-req-badge">{item.requirementCategory || 'REQUIREMENT'}</span>
                <h5>{item.industryName || 'Industry Requirement'}</h5>
                <p>{item.projectDescription}</p>
              </div>
              <Link to="/requirements" className="vv-req-submit">SUBMIT PROPOSAL -&gt;</Link>
            </article>
          ))}
          {!requirements.length ? <p className="empty-text">No requirements available.</p> : null}
        </div>
      </section>

      <div className="container">
        <div className="vv-reg-cta reveal">
          <h2>Integrate Your <span>Business</span></h2>
          <p>Join the most advanced industrial vendor network in Gujarat. Increase visibility, receive direct inquiries, and scale your operations.</p>
          <div className="vv-cta-btns">
            <Link to="/vendor/register" className="vv-btn-primary">Initialize Registration</Link>
            <Link to="/requirements?post=1" className="vv-outline-btn">Post Requirement</Link>
          </div>
        </div>
      </div>

      <section className="avantage-hero-timeline avantage-observe">
        <div className="avantage-hero-left avantage-animate-left">
          <div className="avantage-bold-logo">
            <h1 className="avantage-infinity">&infin;</h1>
            <h1><span>VENDORVAULT</span> GUJARAT</h1>
            <p>Industrial vendor discovery platform for Gujarat</p>
          </div>
        </div>

        <div className="avantage-hero-right avantage-animate-right">
          <div className="avantage-timeline-container">
            <div className="avantage-timeline-line" />
            <div className="avantage-year-marker">1999</div>

            <div className="avantage-timeline-card left" style={{ marginTop: '60px' }}>
              <h4>Verified Vendor Ecosystem</h4>
              <p>Build trust with approved business profiles, service documentation, and searchable vendor categories for industrial procurement teams.</p>
              <img src="https://images.pexels.com/photos/14749234/pexels-photo-14749234.jpeg?auto=compress&cs=tinysrgb&w=800" alt="team" />
            </div>

            <div className="avantage-timeline-card right">
              <h4>Requirement Marketplace Live</h4>
              <p>Industries can post requirements in minutes, and relevant vendors can respond quickly with offers, quotes, and contact details.</p>
              <img src="https://images.pexels.com/photos/7109241/pexels-photo-7109241.jpeg?auto=compress&cs=tinysrgb&w=800" alt="london" />
            </div>

            <div className="avantage-timeline-card left">
              <h4>Faster Procurement Decisions</h4>
              <p>Compare services, locations, ratings, and vendor responses in one workflow to reduce sourcing time and improve decision quality.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="avantage-color-section avantage-observe">
        <div className="avantage-color-content avantage-animate-left">
          <h2>Smart <br /><b>Industrial Search</b></h2>
          <p>Search by category, service, and city to find the right industrial partner. VendorVault is designed for practical B2B sourcing across Gujarat.</p>
        </div>

        <div className="avantage-laptop-container avantage-animate-right">
          <div className="avantage-laptop-body">
            <div className="avantage-laptop-screen">
              <div className="avantage-mock-nav">
                <span>VENDORVAULT</span>
                <span>Home | Categories | Vendors | Inquiries</span>
              </div>
              <div className="avantage-mock-hero">
                <h3>Find the right <br /><span className="pink-text">Industrial Vendor</span></h3>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="avantage-support-section avantage-observe">
        <div className="avantage-support-visual avantage-animate-left">
          <div className="avantage-triangle-image" />
        </div>

        <div className="avantage-support-info avantage-animate-right">
          <h5>Built for industrial teams</h5>
          <h2>Reliable Support, <br />Fast &amp; Practical</h2>

          <div className="avantage-support-row">
            <div className="avantage-icon-box">&#128214;</div>
            <div className="avantage-text-box">
              <h4>Vendor Onboarding Help</h4>
              <p>Get support for completing business profiles, uploading documents, and improving listing visibility across categories.</p>
            </div>
          </div>

          <div className="avantage-support-row">
            <div className="avantage-icon-box">&#10067;</div>
            <div className="avantage-text-box">
              <h4>Procurement FAQs</h4>
              <p>Find answers about requirement posting, vendor verification, lead responses, and best practices for industrial sourcing.</p>
            </div>
          </div>

          <div className="avantage-support-row">
            <div className="avantage-icon-box">&#127903;</div>
            <div className="avantage-text-box">
              <h4>Dedicated Support Ticket</h4>
              <p>Need help with listing, account setup, or marketplace responses? Raise a ticket and our team will assist you quickly.</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

export default HomePage;
