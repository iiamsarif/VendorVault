import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../components/api';

const heroSlides = [
  {
    image: 'https://images.pexels.com/photos/2379004/pexels-photo-2379004.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1',
    title: 'INDUSTRIAL SOURCING - MADE EASY',
    subtitle: 'The trusted B2B vendor directory for Gujarat industries.',
    description: 'Discover approved vendors, compare service categories, and respond to active requirements from one modern marketplace.'
  },
  {
    image: 'https://images.pexels.com/photos/3183197/pexels-photo-3183197.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1',
    title: 'FIND VERIFIED PARTNERS FAST',
    subtitle: 'Connect procurement teams with reliable business listings.',
    description: 'Use category-first discovery and direct inquiry workflows to shorten vendor evaluation time across operations.'
  },
  {
    image: 'https://images.pexels.com/photos/3184291/pexels-photo-3184291.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1',
    title: 'GROW THROUGH MARKETPLACE LEADS',
    subtitle: 'Track requirements and respond with confidence.',
    description: 'From vendor onboarding to requirement responses, VendorVault keeps industrial buying and selling in one place.'
  }
];

const showcaseImages = [
  'https://images.pexels.com/photos/3184360/pexels-photo-3184360.jpeg?auto=compress&cs=tinysrgb&w=400',
  'https://images.pexels.com/photos/6373305/pexels-photo-6373305.jpeg?auto=compress&cs=tinysrgb&w=400',
  'https://images.pexels.com/photos/3184328/pexels-photo-3184328.jpeg?auto=compress&cs=tinysrgb&w=400'
];

function HomePage() {
  const [vendors, setVendors] = useState([]);
  const [categories, setCategories] = useState([]);
  const [search, setSearch] = useState('');
  const [heroIndex, setHeroIndex] = useState(0);
  const uploadsBase = String(api.defaults.baseURL || '').replace(/\/api\/?$/, '');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [vendorsRes, categoriesRes] = await Promise.all([
          api.get('/vendor/listings?featured=true'),
          api.get('/vendor/categories')
        ]);
        setVendors(vendorsRes.data.slice(0, 6));
        setCategories(Array.isArray(categoriesRes.data) ? categoriesRes.data : []);
      } catch (error) {
        setVendors([]);
        setCategories([]);
      }
    };

    fetchData();
  }, []);

  useEffect(() => {
    const sections = Array.from(document.querySelectorAll('.avantage-observe'));
    if (!sections.length) return undefined;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('avantage-in-view');
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.2 }
    );

    sections.forEach((section) => observer.observe(section));

    return () => observer.disconnect();
  }, []);

  const filteredQuickCategories = useMemo(() => {
    if (!search) return categories;
    return categories.filter((item) => item.toLowerCase().includes(search.toLowerCase()));
  }, [search, categories]);

  const currentHero = heroSlides[heroIndex];

  const goNextSlide = () => {
    setHeroIndex((prev) => (prev + 1) % heroSlides.length);
  };

  const goPrevSlide = () => {
    setHeroIndex((prev) => (prev - 1 + heroSlides.length) % heroSlides.length);
  };

  const toFileUrl = (filePath) => {
    const clean = String(filePath || '').trim();
    if (!clean) return '';
    if (/^https?:\/\//i.test(clean)) return clean;
    if (clean.startsWith('/')) return `${uploadsBase}${clean}`;
    return `${uploadsBase}/${clean}`;
  };

  return (
    <div>
      <section
        className="hero tower-hero"
        style={{
          backgroundImage: `url('${currentHero.image}')`,
          backgroundRepeat: 'no-repeat',
          backgroundPosition: 'center right',
          backgroundSize: 'contain'
        }}
      >
        <div className="container">
          <div className="hero-content">
            <h2>{currentHero.title}</h2>
            <div className="subtitle">{currentHero.subtitle}</div>
            <p>{currentHero.description}</p>
            <div className="hero-buttons">
              <Link to="/vendor/register" className="btn-purchase">Register Vendor</Link>
              <Link to="/vendors" className="btn-purchase btn-alt">Explore Vendors</Link>
            </div>
          </div>
        </div>
        <div className="slider-nav">
          <button type="button" aria-label="Previous slide" onClick={goPrevSlide}>
            <i className="fa-solid fa-chevron-left" />
          </button>
          <button type="button" aria-label="Next slide" onClick={goNextSlide}>
            <i className="fa-solid fa-chevron-right" />
          </button>
        </div>
      </section>

      <section className="showcase">
        <div className="container">
          <div className="grid">
            {showcaseImages.map((img, index) => (
              <div className="grid-item" key={img}>
                <img src={img} alt={`Showcase ${index + 1}`} />
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="clients">
        <div className="container">
          <h3 className="section-title">POPULAR CATEGORIES</h3>
          <div className="client-logos">
            {filteredQuickCategories.slice(0, 10).map((category) => (
              <Link key={category} to={`/vendors?search=${encodeURIComponent(category)}`}>{category}</Link>
            ))}
          </div>
          <div className="tower-search-box">
            <input
              type="text"
              placeholder="Search category"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </div>
        </div>
      </section>

      <section className="container section-space tower-content-block recent-news-section">
        <div className="news-header">
          <h2>Recent news</h2>
          <div className="slider-controls">
            <button type="button" className="control-btn" aria-label="Previous">
              <i className="fa-solid fa-chevron-left" />
            </button>
            <button type="button" className="control-btn" aria-label="Next">
              <i className="fa-solid fa-chevron-right" />
            </button>
          </div>
        </div>

        <div className="news-grid">
          {vendors.map((vendor, index) => {
            const animationClass = index % 3 === 0 ? 'animate-left' : index % 3 === 1 ? 'animate-bottom' : 'animate-right';
            return (
            <article key={vendor._id} className={`news-card ${animationClass}`}>
              <div className="card-image">
                <img
                  src={
                    toFileUrl((Array.isArray(vendor.galleryImages) ? vendor.galleryImages[0] : '') || vendor.companyLogo) ||
                    'https://images.unsplash.com/photo-1516937941344-00b4e0337589?auto=format&fit=crop&w=600&q=80'
                  }
                  alt={vendor.companyName}
                />
              </div>
              <div className="card-content">
                <h3>
                  {vendor.companyName}
                  {vendor.verified ? <i className="fa-solid fa-circle-check featured-verified-tick" /> : null}
                </h3>
                <div className="meta-info">
                  <span><i className="fa-regular fa-calendar" /> {new Date(vendor.createdAt || Date.now()).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }).toUpperCase()}</span>
                </div>
                <p className="card-description">
                  {vendor.companyDescription || 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nam efficitur rutrum diam, ut commodo ipsum elementum. Duis quis iaculis.'}
                </p>
                <Link to={`/vendors/${vendor._id}`} className="read-more-btn">View Profile</Link>
              </div>
            </article>
          );
          })}
          {!vendors.length && <p className="empty-text">No featured vendors yet.</p>}
        </div>
      </section>

      <section className="avantage-hero-timeline avantage-observe">
        <div className="avantage-hero-left avantage-animate-left">
          <div className="avantage-bold-logo">
            <h1 className="avantage-infinity">VV</h1>
            <h1><span>VENDORVAULT</span> Industrial Network</h1>
            <p>Trusted vendor discovery for Gujarat industries</p>
          </div>
        </div>

        <div className="avantage-hero-right avantage-animate-right">
          <div className="avantage-timeline-container">
            <div className="avantage-timeline-line" />

            <div className="avantage-timeline-card left" style={{ marginTop: '60px' }}>
              <h4>Vendor Discovery Simplified</h4>
              <p>Find verified contractors, suppliers, and service providers by category, location, and expertise from one reliable industrial platform.</p>
              <img src="https://images.pexels.com/photos/6950121/pexels-photo-6950121.jpeg?_gl=1*tus3gg*_ga*MTM2NDg4Njc4Ny4xNzcyODY2ODE5*_ga_8JE65Q40S6*czE3NzY5NDM1OTIkbzY5JGcxJHQxNzc2OTQzOTIyJGo1OSRsMCRoMA.." alt="team" />
            </div>

            <div className="avantage-timeline-card right">
              <h4>Requirement Marketplace</h4>
              <p>Industries can post requirements and vendors can respond quickly with quotes, helping procurement teams move faster with better clarity.</p>
              <img src="https://images.pexels.com/photos/11299548/pexels-photo-11299548.jpeg?_gl=1*7ilgve*_ga*MTM2NDg4Njc4Ny4xNzcyODY2ODE5*_ga_8JE65Q40S6*czE3NzY5NDM1OTIkbzY5JGcxJHQxNzc2OTQzODQ1JGo1OSRsMCRoMA.." alt="london" />
            </div>

            <div className="avantage-timeline-card left">
              <h4>Growth for Vendors</h4>
              <p>Build profile visibility, gain quality leads, and grow business through featured listings, verification, and subscription upgrades.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="avantage-color-section avantage-observe">
        <div className="avantage-color-content avantage-animate-left">
          <h2>Smart <br /><b>Industrial Search</b></h2>
          <p>Search by service category, city, and vendor type to shortlist the right industrial partner quickly. VendorVault is built for practical B2B sourcing workflows.</p>
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
                <p style={{ fontSize: '10px', marginTop: '10px' }}>Connect industries with verified service partners across Gujarat.</p>
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
            <div className="avantage-icon-box"><i className="fa-solid fa-book-open" /></div>
            <div className="avantage-text-box">
              <h4>Vendor Onboarding Help</h4>
              <p>Get guided support for creating complete vendor profiles, uploading documents, and improving visibility in category listings.</p>
            </div>
          </div>

          <div className="avantage-support-row">
            <div className="avantage-icon-box"><i className="fa-solid fa-circle-question" /></div>
            <div className="avantage-text-box">
              <h4>Procurement FAQs</h4>
              <p>Find answers on vendor verification, requirement posting, lead responses, and best practices for industry-vendor engagement.</p>
            </div>
          </div>

          <div className="avantage-support-row">
            <div className="avantage-icon-box"><i className="fa-solid fa-ticket" /></div>
            <div className="avantage-text-box">
              <h4>Dedicated Support Ticket</h4>
              <p>Need help with account, listing, or requirement flow? Raise a support ticket and our team will assist you promptly.</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

export default HomePage;


