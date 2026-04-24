import React from 'react';

function AboutPage() {
  return (
    <section className="container section-space">
      <div className="page-hero white-card">
        <h1>About VendorVault Gujarat</h1>
        <p>
          VendorVault Gujarat is a digital vendor directory and requirement marketplace built for industrial procurement teams.
          We help businesses discover reliable vendors, manage inquiries, and accelerate sourcing decisions.
        </p>
      </div>
      <div className="card-grid three">
        <article className="white-card">
          <h3>Enterprise Grade Discovery</h3>
          <p>Search by category, location, service, and verification status with instant filtering.</p>
        </article>
        <article className="white-card">
          <h3>Verified Vendor Trust Layer</h3>
          <p>Profile approvals, verification badges, and plan-based visibility help buyers shortlist quickly.</p>
        </article>
        <article className="white-card">
          <h3>Lead & Inquiry Management</h3>
          <p>Vendors and industries track leads, responses, and marketplace opportunities from their dashboards.</p>
        </article>
      </div>
    </section>
  );
}

export default AboutPage;
