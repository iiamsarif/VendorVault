import React from 'react';

const faqs = [
  {
    q: 'How does vendor approval work?',
    a: 'Admin reviews submitted details and documents, then approves and verifies vendors based on plan and compliance checks.'
  },
  {
    q: 'Can industries post requirements for free?',
    a: 'Yes, industries can post requirements and receive responses from registered vendors.'
  },
  {
    q: 'How are leads managed?',
    a: 'Vendors can view inquiries, track profile views, and respond to requirement posts from their dashboard.'
  },
  {
    q: 'Are role logins isolated?',
    a: 'Yes. Admin, vendor, and user sessions are stored in separate tokens: adminToken, vendorToken, and userToken.'
  }
];

function FAQPage() {
  return (
    <section className="container section-space">
      <div className="section-head">
        <h1>Frequently Asked Questions</h1>
      </div>
      <div className="list-stack">
        {faqs.map((item) => (
          <article key={item.q} className="white-card">
            <h3>{item.q}</h3>
            <p>{item.a}</p>
          </article>
        ))}
      </div>
    </section>
  );
}

export default FAQPage;
