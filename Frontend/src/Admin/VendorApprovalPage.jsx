import React, { useEffect, useState } from 'react';
import { api, authHeader } from '../components/api';

function VendorApprovalPage() {
  const [vendors, setVendors] = useState([]);
  const [status, setStatus] = useState('');
  const [selectedVendor, setSelectedVendor] = useState(null);

  const loadPending = async () => {
    try {
      const response = await api.get('/admin/vendors/pending', { headers: authHeader('admin') });
      setVendors(response.data || []);
    } catch (error) {
      setVendors([]);
    }
  };

  useEffect(() => {
    loadPending();
  }, []);

  const approve = async (vendorId) => {
    try {
      await api.post('/admin/vendors/approve', { vendorId }, { headers: authHeader('admin') });
      setStatus('Vendor approved.');
      loadPending();
    } catch (error) {
      setStatus('Approval failed.');
    }
  };

  const reject = async (vendorId) => {
    try {
      await api.post('/admin/vendors/reject', { vendorId }, { headers: authHeader('admin') });
      setStatus('Vendor rejected and deleted.');
      if (selectedVendor?._id === vendorId) {
        setSelectedVendor(null);
      }
      loadPending();
    } catch (error) {
      setStatus('Reject failed.');
    }
  };

  const toListText = (value) => {
    if (Array.isArray(value)) {
      return value.length ? value.join(', ') : '-';
    }
    return value || '-';
  };

  const uploadsBase = String(api.defaults.baseURL || '').replace(/\/api\/?$/, '');

  const getFileUrl = (filePath) => {
    const cleanPath = String(filePath || '').trim();
    if (!cleanPath) return '';
    if (/^https?:\/\//i.test(cleanPath)) return cleanPath;
    if (cleanPath.startsWith('/')) return `${uploadsBase}${cleanPath}`;
    return `${uploadsBase}/${cleanPath}`;
  };

  const renderFileLinks = (files) => {
    const list = Array.isArray(files) ? files : files ? [files] : [];
    if (!list.length) {
      return <p>-</p>;
    }

    return (
      <div className="list-stack">
        {list.map((file, index) => (
          <div key={`${file}-${index}`} className="button-row">
            <span>{String(file).split('/').pop()}</span>
            <a className="btn btn-secondary" href={getFileUrl(file)} target="_blank" rel="noreferrer">
              View
            </a>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div>
      <div className="section-head"><h1>Vendor Approval</h1></div>
      {status && <p className="status-text">{status}</p>}
      <div className="list-stack">
        {vendors.map((vendor) => (
          <article key={vendor._id} className="white-card">
            <h3>{vendor.companyName}</h3>
            <p>{vendor.category} - {vendor.location}</p>
            <p>{vendor.email}</p>
            <div className="button-row">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setSelectedVendor(vendor)}
              >
                View
              </button>
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => approve(vendor._id)}
              >
                Approve
              </button>
              <button
                type="button"
                className="btn btn-danger"
                onClick={() => reject(vendor._id)}
              >
                Reject
              </button>
            </div>
          </article>
        ))}
        {!vendors.length && <p className="empty-text">No pending vendors.</p>}
      </div>

      {selectedVendor && (
        <div
          className="admin-modal-overlay"
          onClick={() => setSelectedVendor(null)}
          role="button"
          tabIndex={0}
          onKeyDown={(event) => {
            if (event.key === 'Escape') {
              setSelectedVendor(null);
            }
          }}
        >
          <div className="admin-modal" onClick={(event) => event.stopPropagation()}>
            <div className="admin-modal-head">
              <h2>{selectedVendor.companyName}</h2>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setSelectedVendor(null)}
              >
                Close
              </button>
              <button
                type="button"
                className="btn btn-danger"
                onClick={() => reject(selectedVendor._id)}
              >
                Reject
              </button>
            </div>

            <div className="admin-detail-grid">
              <div className="admin-detail-block">
                <h4>Contact</h4>
                <p><strong>Person:</strong> {selectedVendor.contactPerson || '-'}</p>
                <p><strong>Email:</strong> {selectedVendor.email || '-'}</p>
                <p><strong>Mobile:</strong> {selectedVendor.mobileNumber || '-'}</p>
                <p><strong>WhatsApp:</strong> {selectedVendor.whatsappNumber || '-'}</p>
              </div>

              <div className="admin-detail-block">
                <h4>Business</h4>
                <p><strong>Category:</strong> {selectedVendor.category || '-'}</p>
                <p><strong>Office Address:</strong> {selectedVendor.officeAddress || '-'}</p>
                <p><strong>City/State:</strong> {selectedVendor.cityState || '-'}</p>
                <p><strong>Years:</strong> {selectedVendor.yearsExperience ?? '-'}</p>
              </div>

              <div className="admin-detail-block">
                <h4>Profile</h4>
                <p><strong>Industry:</strong> {selectedVendor.industryType || '-'}</p>
                <p><strong>Approved:</strong> {selectedVendor.approved ? 'Yes' : 'No'}</p>
                <p><strong>Verified:</strong> {selectedVendor.verified ? 'Yes' : 'No'}</p>
                <p><strong>Plan:</strong> {selectedVendor.subscriptionPlan || 'Free Vendor Listing'}</p>
                <p><strong>Plan Badge:</strong> {selectedVendor.planBadge || '-'}</p>
              </div>

              <div className="admin-detail-block">
                <h4>Timeline</h4>
                <p><strong>Created:</strong> {selectedVendor.createdAt ? new Date(selectedVendor.createdAt).toLocaleString() : '-'}</p>
                <p><strong>Updated:</strong> {selectedVendor.updatedAt ? new Date(selectedVendor.updatedAt).toLocaleString() : '-'}</p>
                <p><strong>Approved At:</strong> {selectedVendor.approvedAt ? new Date(selectedVendor.approvedAt).toLocaleString() : '-'}</p>
                <p><strong>Vendor ID:</strong> {selectedVendor._id}</p>
              </div>

              <div className="admin-detail-block full-span">
                <h4>Description</h4>
                <p>{selectedVendor.companyDescription || '-'}</p>
              </div>

              <div className="admin-detail-block full-span">
                <h4>Services Offered</h4>
                <p>{toListText(selectedVendor.servicesOffered)}</p>
              </div>

              <div className="admin-detail-block full-span">
                <h4>Industries Served</h4>
                <p>{toListText(selectedVendor.industriesServed)}</p>
              </div>

              <div className="admin-detail-block full-span">
                <h4>Uploads</h4>
                <p><strong>Company Logo</strong></p>
                {renderFileLinks(selectedVendor.companyLogo)}
                <p><strong>Documents</strong></p>
                {renderFileLinks(selectedVendor.documents)}
                <p><strong>Certificates</strong></p>
                {renderFileLinks(selectedVendor.certificates)}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default VendorApprovalPage;
