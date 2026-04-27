import React from 'react';
import { Link } from 'react-router-dom';

function NotFoundPage() {
  return (
    <section className="container section-space">
      <div className="white-card auth-wrap">
        <h1>Page Not Found</h1>
        <p>The page you requested does not exist.</p>
        <Link className="btn btn-primary" to="/">Go Home</Link>
      </div>
    </section>
  );
}

export default NotFoundPage;
