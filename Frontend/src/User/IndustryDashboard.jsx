import React from 'react';
import { Link } from 'react-router-dom';

function IndustryDashboard() {
  return (
    <div>
      <div className="section-head"><h1>Industry Dashboard</h1></div>
      <div className="card-grid three">
        <Link to="/user/dashboard/post-requirement" className="white-card linked-card">Post Requirement</Link>
        <Link to="/user/dashboard/vendors" className="white-card linked-card">View Vendor Directory</Link>
        <Link to="/user/dashboard/shortlist" className="white-card linked-card">Shortlist Vendors</Link>
        <Link to="/user/dashboard/send-inquiry" className="white-card linked-card">Send Inquiry</Link>
        <Link to="/user/dashboard/responses" className="white-card linked-card">View Responses</Link>
      </div>
    </div>
  );
}

export default IndustryDashboard;
