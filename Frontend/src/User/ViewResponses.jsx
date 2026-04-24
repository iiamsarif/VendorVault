import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api, authHeader } from '../components/api';

function ViewResponses() {
  const navigate = useNavigate();
  const [inquiryReplies, setInquiryReplies] = useState([]);
  const [requirementReplies, setRequirementReplies] = useState([]);

  useEffect(() => {
    const load = async () => {
      try {
        const [inquiryResponse, requirementResponse] = await Promise.all([
          api.get('/inquiries/list', { headers: authHeader('user') }),
          api.get('/industry/response-feed', { headers: authHeader('user') })
        ]);

        const inquiryRows = Array.isArray(inquiryResponse.data) ? inquiryResponse.data : [];
        const requirementRows = Array.isArray(requirementResponse.data) ? requirementResponse.data : [];

        setInquiryReplies(inquiryRows.filter((item) => item?.vendorReply?.message));
        setRequirementReplies(requirementRows.filter((item) => item?.message));
      } catch (error) {
        setInquiryReplies([]);
        setRequirementReplies([]);
      }
    };

    load();
  }, []);

  const uploadsBase = String(api.defaults.baseURL || '').replace(/\/api\/?$/, '');
  const toFileUrl = (filePath) => {
    const clean = String(filePath || '').trim();
    if (!clean) return '';
    if (/^https?:\/\//i.test(clean)) return clean;
    if (clean.startsWith('/')) return `${uploadsBase}${clean}`;
    return `${uploadsBase}/${clean}`;
  };

  const getVendorId = (item, vendor) => vendor?._id || item?.vendorId || item?.vendor?._id || '';
  const getVendorWhatsapp = (vendor) => {
    const raw = String(vendor?.whatsappNumber || vendor?.mobileNumber || '').trim();
    if (!raw) return '';
    return raw.replace(/[^\d]/g, '');
  };

  const openVendorProfile = (vendorId) => {
    if (!vendorId) return;
    navigate(`/vendors/${vendorId}`);
  };

  return (
    <section className="container section-space inquiries-page">
      <div className="section-head inquiries-page-head">
        <h1>Inquiries</h1>
        <p>Track vendor responses to your inquiries and posted requirements.</p>
      </div>
      <div className="list-stack">
        {inquiryReplies.map((item) => {
          const vendor = item.vendorProfile || {};
          const logo = toFileUrl(vendor.companyLogo) || 'https://i.pravatar.cc/80?img=12';
          const vendorId = getVendorId(item, vendor);
          const whatsapp = getVendorWhatsapp(vendor);
          return (
            <article
              className="white-card inquiry-response-card inquiry-response-clickable"
              key={`inquiry-${item._id}`}
              onClick={() => openVendorProfile(vendorId)}
            >
              <div className="inquiry-response-head">
                <img src={logo} alt={vendor.companyName || 'Vendor'} className="inquiry-response-logo" />
                <div className="inquiry-response-meta">
                  <h3 className="inquiry-response-name">
                    {vendor.companyName || 'Vendor'}
                    {vendor.verified ? <i className="fa-solid fa-circle-check verified-tick" /> : null}
                  </h3>
                  <span className="inquiry-status-badge">Responded</span>
                </div>
              </div>
              <div className="inquiry-response-body">
                <div className="inquiry-bubble inquiry-bubble-user">
                  <span>Your Inquiry</span>
                  <p>{item.message}</p>
                </div>
                <div className="inquiry-bubble inquiry-bubble-vendor">
                  <span>Vendor Reply</span>
                  <p>{item.vendorReply?.message}</p>
                </div>
              </div>
              <div className="inquiry-response-actions">
                {whatsapp ? (
                  <a
                    className="btn btn-secondary inquiry-wa-btn"
                    href={`https://wa.me/${whatsapp}`}
                    target="_blank"
                    rel="noreferrer"
                    onClick={(event) => event.stopPropagation()}
                  >
                    <i className="fa-brands fa-whatsapp" /> WhatsApp
                  </a>
                ) : null}
              </div>
            </article>
          );
        })}

        {requirementReplies.map((item, index) => {
          const vendor = item.vendorProfile || {};
          const logo = toFileUrl(vendor.companyLogo) || 'https://i.pravatar.cc/80?img=12';
          const vendorId = getVendorId(item, vendor);
          const whatsapp = getVendorWhatsapp(vendor);
          return (
            <article
              className="white-card inquiry-response-card inquiry-response-clickable"
              key={`req-${item.requirementId}-${index}`}
              onClick={() => openVendorProfile(vendorId)}
            >
              <div className="inquiry-response-head">
                <img src={logo} alt={vendor.companyName || 'Vendor'} className="inquiry-response-logo" />
                <div className="inquiry-response-meta">
                  <h3 className="inquiry-response-name">
                    {vendor.companyName || 'Vendor'}
                    {vendor.verified ? <i className="fa-solid fa-circle-check verified-tick" /> : null}
                  </h3>
                  <span className="inquiry-status-badge">Quote Submitted</span>
                </div>
              </div>
              <div className="inquiry-response-body">
                <div className="inquiry-bubble inquiry-bubble-user">
                  <span>Your Requirement</span>
                  <p>{item.requirementCategory} - {item.projectDescription}</p>
                </div>
                <div className="inquiry-bubble inquiry-bubble-vendor">
                  <span>Vendor Response</span>
                  <p>{item.message}</p>
                </div>
              </div>
              <div className="inquiry-response-actions">
                {whatsapp ? (
                  <a
                    className="btn btn-secondary inquiry-wa-btn"
                    href={`https://wa.me/${whatsapp}`}
                    target="_blank"
                    rel="noreferrer"
                    onClick={(event) => event.stopPropagation()}
                  >
                    <i className="fa-brands fa-whatsapp" /> WhatsApp
                  </a>
                ) : null}
              </div>
            </article>
          );
        })}

        {!inquiryReplies.length && !requirementReplies.length ? <p className="empty-text">No vendor responses yet.</p> : null}
      </div>
    </section>
  );
}

export default ViewResponses;
