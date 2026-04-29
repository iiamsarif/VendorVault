import React, { useEffect, useState } from 'react';
import { api, authHeader } from '../components/api';

function VendorApprovalPage() {
  const [vendors, setVendors] = useState([]);
  const [status, setStatus] = useState('');
  const [selectedVendor, setSelectedVendor] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [editedVendor, setEditedVendor] = useState({});

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

  const startEdit = (vendor) => {
    setSelectedVendor(vendor);
    setEditedVendor({ ...vendor });
    setEditMode(true);
  };

  const cancelEdit = () => {
    setEditMode(false);
    setEditedVendor({});
  };

  const saveEdit = async () => {
    try {
      await api.put('/admin/vendors/update', editedVendor, { headers: authHeader('admin') });
      setStatus('Vendor updated successfully.');
      setEditMode(false);
      setSelectedVendor(null);
      loadPending();
    } catch (error) {
      setStatus('Update failed.');
    }
  };

  const handleInputChange = (field, value) => {
    setEditedVendor(prev => ({
      ...prev,
      [field]: value
    }));
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
            <p>{vendor.category} - {vendor.cityState || 'Location not specified'}</p>
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
                className="btn btn-info"
                onClick={() => startEdit(vendor)}
              >
                Edit
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
              <h2>{editMode ? 'Edit Vendor' : selectedVendor.companyName}</h2>
              {editMode ? (
                <div>
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={cancelEdit}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    className="btn btn-success"
                    onClick={saveEdit}
                  >
                    Save
                  </button>
                </div>
              ) : (
                <div>
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
              )}
            </div>

            <div className="admin-detail-grid">
              {editMode ? (
                <>
                  <div className="admin-detail-block">
                    <h4>Contact</h4>
                    <div className="form-group">
                      <label>Contact Person</label>
                      <input
                        type="text"
                        className="form-control"
                        value={editedVendor.contactPerson || ''}
                        onChange={(e) => handleInputChange('contactPerson', e.target.value)}
                      />
                    </div>
                    <div className="form-group">
                      <label>Email</label>
                      <input
                        type="email"
                        className="form-control"
                        value={editedVendor.email || ''}
                        onChange={(e) => handleInputChange('email', e.target.value)}
                      />
                    </div>
                    <div className="form-group">
                      <label>Mobile Number</label>
                      <input
                        type="tel"
                        className="form-control"
                        value={editedVendor.mobileNumber || ''}
                        onChange={(e) => handleInputChange('mobileNumber', e.target.value)}
                      />
                    </div>
                    <div className="form-group">
                      <label>WhatsApp Number</label>
                      <input
                        type="tel"
                        className="form-control"
                        value={editedVendor.whatsappNumber || ''}
                        onChange={(e) => handleInputChange('whatsappNumber', e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="admin-detail-block">
                    <h4>Business</h4>
                    <div className="form-group">
                      <label>Company Name</label>
                      <input
                        type="text"
                        className="form-control"
                        value={editedVendor.companyName || ''}
                        onChange={(e) => handleInputChange('companyName', e.target.value)}
                      />
                    </div>
                    <div className="form-group">
                      <label>Category</label>
                      <input
                        type="text"
                        className="form-control"
                        value={editedVendor.category || ''}
                        onChange={(e) => handleInputChange('category', e.target.value)}
                      />
                    </div>
                    <div className="form-group">
                      <label>Office Address</label>
                      <input
                        type="text"
                        className="form-control"
                        value={editedVendor.officeAddress || ''}
                        onChange={(e) => handleInputChange('officeAddress', e.target.value)}
                      />
                    </div>
                    <div className="form-group">
                      <label>City/State</label>
                      <input
                        type="text"
                        className="form-control"
                        value={editedVendor.cityState || ''}
                        onChange={(e) => handleInputChange('cityState', e.target.value)}
                      />
                    </div>
                    <div className="form-group">
                      <label>Years of Experience</label>
                      <input
                        type="number"
                        className="form-control"
                        value={editedVendor.yearsExperience || ''}
                        onChange={(e) => handleInputChange('yearsExperience', e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="admin-detail-block">
                    <h4>Profile Settings</h4>
                    <div className="form-group">
                      <label>Industry Type</label>
                      <input
                        type="text"
                        className="form-control"
                        value={editedVendor.industryType || ''}
                        onChange={(e) => handleInputChange('industryType', e.target.value)}
                      />
                    </div>
                    <div className="form-group">
                      <label>Subscription Plan</label>
                      <select
                        className="form-control"
                        value={editedVendor.subscriptionPlan || 'Free Vendor Listing'}
                        onChange={(e) => handleInputChange('subscriptionPlan', e.target.value)}
                      >
                        <option value="Free Vendor Listing">Free Vendor Listing</option>
                        <option value="Verified Vendor">Verified Vendor</option>
                        <option value="Premium Vendor">Premium Vendor</option>
                      </select>
                    </div>
                    <div className="form-group">
                      <label>Approved</label>
                      <select
                        className="form-control"
                        value={editedVendor.approved ? 'true' : 'false'}
                        onChange={(e) => handleInputChange('approved', e.target.value === 'true')}
                      >
                        <option value="false">No</option>
                        <option value="true">Yes</option>
                      </select>
                    </div>
                    <div className="form-group">
                      <label>Verified</label>
                      <select
                        className="form-control"
                        value={editedVendor.verified ? 'true' : 'false'}
                        onChange={(e) => handleInputChange('verified', e.target.value === 'true')}
                      >
                        <option value="false">No</option>
                        <option value="true">Yes</option>
                      </select>
                    </div>
                    <div className="form-group">
                      <label>Featured</label>
                      <select
                        className="form-control"
                        value={editedVendor.featured ? 'true' : 'false'}
                        onChange={(e) => handleInputChange('featured', e.target.value === 'true')}
                      >
                        <option value="false">No</option>
                        <option value="true">Yes</option>
                      </select>
                    </div>
                    <div className="form-group">
                      <label>Suspended</label>
                      <select
                        className="form-control"
                        value={editedVendor.suspended ? 'true' : 'false'}
                        onChange={(e) => handleInputChange('suspended', e.target.value === 'true')}
                      >
                        <option value="false">No</option>
                        <option value="true">Yes</option>
                      </select>
                    </div>
                  </div>

                  <div className="admin-detail-block">
                    <h4>Service Details</h4>
                    <div className="form-group">
                      <label>Primary Service Area</label>
                      <input
                        type="text"
                        className="form-control"
                        value={Array.isArray(editedVendor.primaryServiceArea) ? editedVendor.primaryServiceArea.join(', ') : editedVendor.primaryServiceArea || ''}
                        onChange={(e) => handleInputChange('primaryServiceArea', e.target.value.split(',').map(s => s.trim()).filter(s => s))}
                      />
                    </div>
                    <div className="form-group">
                      <label>Type of Service Provided</label>
                      <input
                        type="text"
                        className="form-control"
                        value={Array.isArray(editedVendor.serviceTypes) ? editedVendor.serviceTypes.join(', ') : editedVendor.serviceTypes || ''}
                        onChange={(e) => handleInputChange('serviceTypes', e.target.value.split(',').map(s => s.trim()).filter(s => s))}
                      />
                    </div>
                    <div className="form-group">
                      <label>Estimated Workers</label>
                      <input
                        type="text"
                        className="form-control"
                        value={editedVendor.workerCount || ''}
                        onChange={(e) => handleInputChange('workerCount', e.target.value)}
                      />
                    </div>
                    <div className="form-group">
                      <label>Business Type</label>
                      <input
                        type="text"
                        className="form-control"
                        value={editedVendor.businessType || ''}
                        onChange={(e) => handleInputChange('businessType', e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="admin-detail-block">
                    <h4>Legal & Compliance</h4>
                    <div className="form-group">
                      <label>GST Registered</label>
                      <select
                        className="form-control"
                        value={editedVendor.gstRegistered || ''}
                        onChange={(e) => handleInputChange('gstRegistered', e.target.value)}
                      >
                        <option value="">Select</option>
                        <option value="Yes">Yes</option>
                        <option value="No">No</option>
                      </select>
                    </div>
                    <div className="form-group">
                      <label>GST Number</label>
                      <input
                        type="text"
                        className="form-control"
                        value={editedVendor.gstNumber || ''}
                        onChange={(e) => handleInputChange('gstNumber', e.target.value)}
                      />
                    </div>
                    <div className="form-group">
                      <label>PF Registered</label>
                      <select
                        className="form-control"
                        value={editedVendor.pfRegistered || ''}
                        onChange={(e) => handleInputChange('pfRegistered', e.target.value)}
                      >
                        <option value="">Select</option>
                        <option value="Yes">Yes</option>
                        <option value="No">No</option>
                      </select>
                    </div>
                    <div className="form-group">
                      <label>ESIC Registered</label>
                      <select
                        className="form-control"
                        value={editedVendor.esicRegistered || ''}
                        onChange={(e) => handleInputChange('esicRegistered', e.target.value)}
                      >
                        <option value="">Select</option>
                        <option value="Yes">Yes</option>
                        <option value="No">No</option>
                      </select>
                    </div>
                    <div className="form-group">
                      <label>Labour License</label>
                      <input
                        type="text"
                        className="form-control"
                        value={editedVendor.labourLicense || ''}
                        onChange={(e) => handleInputChange('labourLicense', e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="admin-detail-block">
                    <h4>Business Details</h4>
                    <div className="form-group">
                      <label>Specialization / Scope of Work</label>
                      <textarea
                        className="form-control"
                        rows={3}
                        value={editedVendor.specialization || ''}
                        onChange={(e) => handleInputChange('specialization', e.target.value)}
                      />
                    </div>
                    <div className="form-group">
                      <label>Major Clients</label>
                      <input
                        type="text"
                        className="form-control"
                        value={editedVendor.majorClients || ''}
                        onChange={(e) => handleInputChange('majorClients', e.target.value)}
                      />
                    </div>
                    <div className="form-group">
                      <label>Declaration</label>
                      <textarea
                        className="form-control"
                        rows={3}
                        value={editedVendor.declaration || ''}
                        onChange={(e) => handleInputChange('declaration', e.target.value)}
                      />
                    </div>
                  </div>
                </>
              ) : (
                <>
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
                </>
              )}

              <div className="admin-detail-block full-span">
                <h4>Description</h4>
                {editMode ? (
                  <div className="form-group">
                    <label>Company Description</label>
                    <textarea
                      className="form-control"
                      rows={4}
                      value={editedVendor.companyDescription || ''}
                      onChange={(e) => handleInputChange('companyDescription', e.target.value)}
                    />
                  </div>
                ) : (
                  <p>{selectedVendor.companyDescription || '-'}</p>
                )}
              </div>

              <div className="admin-detail-block full-span">
                <h4>Services Offered</h4>
                {editMode ? (
                  <div className="form-group">
                    <label>Services Offered (comma-separated)</label>
                    <input
                      type="text"
                      className="form-control"
                      value={Array.isArray(editedVendor.servicesOffered) ? editedVendor.servicesOffered.join(', ') : editedVendor.servicesOffered || ''}
                      onChange={(e) => handleInputChange('servicesOffered', e.target.value.split(',').map(s => s.trim()).filter(s => s))}
                    />
                  </div>
                ) : (
                  <p>{toListText(selectedVendor.servicesOffered)}</p>
                )}
              </div>

              <div className="admin-detail-block full-span">
                <h4>Industries Served</h4>
                {editMode ? (
                  <div className="form-group">
                    <label>Industries Served (comma-separated)</label>
                    <input
                      type="text"
                      className="form-control"
                      value={Array.isArray(editedVendor.industriesServed) ? editedVendor.industriesServed.join(', ') : editedVendor.industriesServed || ''}
                      onChange={(e) => handleInputChange('industriesServed', e.target.value.split(',').map(s => s.trim()).filter(s => s))}
                    />
                  </div>
                ) : (
                  <p>{toListText(selectedVendor.industriesServed)}</p>
                )}
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
