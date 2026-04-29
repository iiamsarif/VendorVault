import React, { useEffect, useState } from 'react';
import { api, authHeader } from '../components/api';

function ListingModeration() {
  const [vendors, setVendors] = useState([]);
  const [status, setStatus] = useState('');
  const [editingVendor, setEditingVendor] = useState(null);
  const [verifyingVendor, setVerifyingVendor] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);

  // Helper function to construct proper file URLs
  const getFileUrl = (filePath) => {
    const cleanPath = String(filePath || '').trim();
    if (!cleanPath) return '';
    if (/^https?:\/\//i.test(cleanPath)) return cleanPath;
    // Default to backend server at localhost:5000
    if (cleanPath.startsWith('/')) return `http://localhost:5000${cleanPath}`;
    return `http://localhost:5000/${cleanPath}`;
  };
  const [form, setForm] = useState({
    companyName: '',
    contactPerson: '',
    mobileNumber: '',
    whatsappNumber: '',
    email: '',
    officeAddress: '',
    cityState: '',
    category: '',
    city: '',
    primaryServiceArea: '',
    serviceTypes: '',
    workerCount: '',
    specialization: '',
    businessType: '',
    gstRegistered: '',
    gstNumber: '',
    pfRegistered: '',
    esicRegistered: '',
    labourLicense: '',
    majorClients: '',
    industriesServed: '',
    declaration: '',
    declarationChecked: false,
    industryType: '',
    yearsExperience: '',
    servicesOffered: '',
    companyDescription: '',
    verified: false,
    featured: false,
    suspended: false
  });

  const load = async (page = 1) => {
    setLoading(true);
    try {
      const response = await api.get(`/admin/vendors?page=${page}&limit=10`, { headers: authHeader('admin') });
      setVendors(response.data?.vendors || []);
      setTotalPages(response.data?.totalPages || 1);
      setCurrentPage(response.data?.currentPage || 1);
    } catch (error) {
      setVendors([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load(currentPage);
  }, [currentPage]);

  const openVerificationModal = (vendor) => {
    setVerifyingVendor(vendor);
  };

  const closeVerificationModal = () => {
    setVerifyingVendor(null);
  };

  const getVerificationStage = (vendor) => {
    if (!vendor) return 0;
    
    // Stage 1: Basic Profile Complete
    const hasBasicInfo = vendor.companyName && vendor.email && vendor.mobileNumber;
    if (!hasBasicInfo) return 0;
    
    // Stage 2: Business Information Complete
    const hasBusinessInfo = vendor.category && vendor.officeAddress && vendor.cityState;
    if (!hasBusinessInfo) return 1;
    
    // Stage 3: Documents Uploaded
    const hasDocuments = (vendor.documents && vendor.documents.length > 0) || 
                       (vendor.certificates && vendor.certificates.length > 0);
    if (!hasDocuments) return 2;
    
    // Stage 4: Subscription Active (Silver or Paid)
    const hasValidSubscription = vendor.subscriptionPlan && 
                               vendor.subscriptionPlan !== 'Free Vendor Listing';
    if (!hasValidSubscription) return 3;
    
    // Stage 5: Ready for Verification
    return 4;
  };

  const getSubscriptionStatus = (vendor) => {
    const plan = vendor.subscriptionPlan || 'Free Vendor Listing';
    if (plan === 'Premium Vendor') return { text: 'Paid', color: '#28a745', level: 'Paid' };
    if (plan === 'Verified Vendor') return { text: 'Silver', color: '#17a2b8', level: 'Silver' };
    return { text: 'Free', color: '#6c757d', level: 'Free' };
  };

  const confirmVerification = async () => {
    if (!verifyingVendor?._id) return;
    try {
      await api.post('/admin/vendors/verify', { 
        vendorId: verifyingVendor._id, 
        verified: true 
      }, { headers: authHeader('admin') });
      setStatus('Vendor verified successfully.');
      closeVerificationModal();
      loadVendors();
    } catch (error) {
      setStatus('Unable to verify vendor.');
    }
  };

  const openEdit = (vendor) => {
    setEditingVendor(vendor);
    
    // 3-stage verification check for declaration
    const getDeclarationStage = (vendor) => {
      if (!vendor) return 0;
      
      // Stage 1: Basic declaration exists
      if (!vendor.declaration) return 0;
      
      // Stage 2: Declaration matches expected text
      const expectedDeclaration = "I agree and declare the information is accurate.";
      const declarationText = String(vendor.declaration || '').trim().toLowerCase();
      const expectedText = expectedDeclaration.toLowerCase();
      
      if (declarationText !== expectedText) return 1;
      
      // Stage 3: Declaration is verified (has been checked and confirmed)
      return vendor.declarationVerified ? 3 : 2;
    };

    const declarationStage = getDeclarationStage(vendor);
    
    setForm({
      companyName: vendor.companyName || '',
      contactPerson: vendor.contactPerson || '',
      mobileNumber: vendor.mobileNumber || '',
      whatsappNumber: vendor.whatsappNumber || '',
      email: vendor.email || '',
      officeAddress: vendor.officeAddress || '',
      cityState: vendor.cityState || '',
      category: vendor.category || '',
      city: vendor.city || '',
      primaryServiceArea: Array.isArray(vendor.primaryServiceArea) ? vendor.primaryServiceArea.join(', ') : '',
      serviceTypes: Array.isArray(vendor.serviceTypes) ? vendor.serviceTypes.join(', ') : '',
      workerCount: vendor.workerCount || '',
      specialization: vendor.specialization || '',
      businessType: vendor.businessType || '',
      gstRegistered: vendor.gstRegistered || '',
      gstNumber: vendor.gstNumber || '',
      pfRegistered: vendor.pfRegistered || '',
      esicRegistered: vendor.esicRegistered || '',
      labourLicense: vendor.labourLicense || '',
      majorClients: vendor.majorClients || '',
      industriesServed: Array.isArray(vendor.industriesServed) ? vendor.industriesServed.join(', ') : '',
      declaration: vendor.declaration || '',
      declarationChecked: declarationStage >= 2, // Show as checked if declaration text matches
      declarationStage: declarationStage,
      industryType: vendor.industryType || '',
      yearsExperience: String(vendor.yearsExperience || ''),
      servicesOffered: Array.isArray(vendor.servicesOffered) ? vendor.servicesOffered.join(', ') : '',
      companyDescription: vendor.companyDescription || '',
      verified: Boolean(vendor.verified),
      featured: Boolean(vendor.featured),
      suspended: Boolean(vendor.suspended)
    });
  };

  const deleteVendor = async () => {
    if (!editingVendor?._id) return;
    try {
      await api.post('/admin/vendors/reject', { vendorId: editingVendor._id }, { headers: authHeader('admin') });
      setStatus('Vendor deleted successfully.');
      setEditingVendor(null);
      loadVendors();
    } catch (error) {
      setStatus(error?.response?.data?.message || 'Unable to delete vendor.');
    }
  };

  const saveEdit = async () => {
    if (!editingVendor?._id) return;
    try {
      await api.put(
        '/admin/vendors/update',
        {
          vendorId: editingVendor._id,
          ...form,
          yearsExperience: Number(form.yearsExperience || 0),
          servicesOffered: form.servicesOffered.split(',').map((item) => item.trim()).filter(Boolean),
          primaryServiceArea: form.primaryServiceArea.split(',').map((item) => item.trim()).filter(Boolean),
          serviceTypes: form.serviceTypes.split(',').map((item) => item.trim()).filter(Boolean),
          industriesServed: form.industriesServed.split(',').map((item) => item.trim()).filter(Boolean)
        },
        { headers: authHeader('admin') }
      );
      setStatus('Vendor updated successfully.');
      setEditingVendor(null);
      loadVendors();
    } catch (error) {
      setStatus(error?.response?.data?.message || 'Unable to update vendor.');
    }
  };

  return (
    <div>
      <div className="section-head"><h1>Listing Moderation</h1></div>
      {status && <p className="status-text">{status}</p>}
      
      <div className="pagination-controls">
        <button 
          className="btn btn-secondary" 
          onClick={() => load(Math.max(1, currentPage - 1))}
          disabled={currentPage === 1 || loading}
        >
          <i className="fa-solid fa-chevron-left" /> Previous
        </button>
        
        <span className="pagination-info">
          Page {currentPage} of {totalPages}
        </span>
        
        <button 
          className="btn btn-secondary" 
          onClick={() => load(Math.min(totalPages, currentPage + 1))}
          disabled={currentPage === totalPages || loading}
        >
          Next <i className="fa-solid fa-chevron-right" />
        </button>
      </div>
      
      <div className="white-card admin-table-wrap">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Company</th>
              <th>Category</th>
              <th>Verified</th>
              <th>Featured</th>
              <th>Suspended</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {vendors.slice(0, 50).map((vendor) => (
              <tr key={vendor._id}>
                <td data-label="Company">{vendor.companyName}</td>
                <td data-label="Category">{vendor.category || '-'}</td>
                <td data-label="Verified">{vendor.verified ? 'Yes' : 'No'}</td>
                <td data-label="Featured">{vendor.featured ? 'Yes' : 'No'}</td>
                <td data-label="Suspended">{vendor.suspended ? 'Yes' : 'No'}</td>
                <td data-label="Actions">
                  <div className="button-row">
                    <button type="button" className="btn btn-secondary" onClick={() => openEdit(vendor)}>Edit</button>
                    <button type="button" className="btn btn-primary" onClick={() => openVerificationModal(vendor)}>
                      {vendor.verified ? 'Unverify' : 'Verify'}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {editingVendor ? (
        <div className="admin-modal-overlay" onClick={() => setEditingVendor(null)} role="button" tabIndex={0}>
          <div className="admin-modal admin-edit-modal" onClick={(event) => event.stopPropagation()}>
            <div className="admin-modal-head">
              <h2>Edit Vendor</h2>
              <button type="button" className="btn btn-secondary" onClick={() => setEditingVendor(null)}>Close</button>
            </div>

            <div className="form-grid two-cols admin-edit-grid">
              <div className="form-group">
                <label>Company Name</label>
                <input type="text" value={form.companyName} onChange={(event) => setForm((prev) => ({ ...prev, companyName: event.target.value }))} />
              </div>
              <div className="form-group">
                <label>Contact Person</label>
                <input type="text" value={form.contactPerson} onChange={(event) => setForm((prev) => ({ ...prev, contactPerson: event.target.value }))} />
              </div>
              <div className="form-group">
                <label>Mobile Number</label>
                <input type="tel" value={form.mobileNumber} onChange={(event) => setForm((prev) => ({ ...prev, mobileNumber: event.target.value }))} />
              </div>
              <div className="form-group">
                <label>WhatsApp Number</label>
                <input type="tel" value={form.whatsappNumber} onChange={(event) => setForm((prev) => ({ ...prev, whatsappNumber: event.target.value }))} />
              </div>
              <div className="form-group">
                <label>Email</label>
                <input type="email" value={form.email} onChange={(event) => setForm((prev) => ({ ...prev, email: event.target.value }))} />
              </div>
              <div className="form-group">
                <label>Category</label>
                <input type="text" value={form.category} onChange={(event) => setForm((prev) => ({ ...prev, category: event.target.value }))} />
              </div>
              <div className="form-group">
                <label>Office Address</label>
                <input type="text" value={form.officeAddress} onChange={(event) => setForm((prev) => ({ ...prev, officeAddress: event.target.value }))} />
              </div>
              <div className="form-group">
                <label>City/State</label>
                <input type="text" value={form.cityState} onChange={(event) => setForm((prev) => ({ ...prev, cityState: event.target.value }))} />
              </div>
              <div className="form-group">
                <label>City</label>
                <input type="text" value={form.city} onChange={(event) => setForm((prev) => ({ ...prev, city: event.target.value }))} />
              </div>
              <div className="form-group">
                <label>Industry Type</label>
                <input type="text" value={form.industryType} onChange={(event) => setForm((prev) => ({ ...prev, industryType: event.target.value }))} />
              </div>
              <div className="form-group">
                <label>Years Experience</label>
                <input type="number" value={form.yearsExperience} onChange={(event) => setForm((prev) => ({ ...prev, yearsExperience: event.target.value }))} />
              </div>
              <div className="form-group">
                <label>Services Offered (comma separated)</label>
                <input type="text" value={form.servicesOffered} onChange={(event) => setForm((prev) => ({ ...prev, servicesOffered: event.target.value }))} />
              </div>
              <div className="form-group">
                <label>Primary Service Area (comma separated)</label>
                <input type="text" value={form.primaryServiceArea} onChange={(event) => setForm((prev) => ({ ...prev, primaryServiceArea: event.target.value }))} />
              </div>
              <div className="form-group">
                <label>Type of Service Provided (comma separated)</label>
                <input type="text" value={form.serviceTypes} onChange={(event) => setForm((prev) => ({ ...prev, serviceTypes: event.target.value }))} />
              </div>
              <div className="form-group">
                <label>Estimated Workers</label>
                <input type="text" value={form.workerCount} onChange={(event) => setForm((prev) => ({ ...prev, workerCount: event.target.value }))} />
              </div>
              <div className="form-group">
                <label>Business Type</label>
                <input type="text" value={form.businessType} onChange={(event) => setForm((prev) => ({ ...prev, businessType: event.target.value }))} />
              </div>
              <div className="form-group">
                <label>GST Registered</label>
                <select value={form.gstRegistered} onChange={(event) => setForm((prev) => ({ ...prev, gstRegistered: event.target.value }))}>
                  <option value="">Select</option>
                  <option value="Yes">Yes</option>
                  <option value="No">No</option>
                </select>
              </div>
              <div className="form-group">
                <label>GST Number</label>
                <input type="text" value={form.gstNumber} onChange={(event) => setForm((prev) => ({ ...prev, gstNumber: event.target.value }))} />
              </div>
              <div className="form-group">
                <label>PF Registered</label>
                <select value={form.pfRegistered} onChange={(event) => setForm((prev) => ({ ...prev, pfRegistered: event.target.value }))}>
                  <option value="">Select</option>
                  <option value="Yes">Yes</option>
                  <option value="No">No</option>
                </select>
              </div>
              <div className="form-group">
                <label>ESIC Registered</label>
                <select value={form.esicRegistered} onChange={(event) => setForm((prev) => ({ ...prev, esicRegistered: event.target.value }))}>
                  <option value="">Select</option>
                  <option value="Yes">Yes</option>
                  <option value="No">No</option>
                </select>
              </div>
              <div className="form-group">
                <label>Labour License</label>
                <input type="text" value={form.labourLicense} onChange={(event) => setForm((prev) => ({ ...prev, labourLicense: event.target.value }))} />
              </div>
              <div className="form-group">
                <label>Industries Served (comma separated)</label>
                <input type="text" value={form.industriesServed} onChange={(event) => setForm((prev) => ({ ...prev, industriesServed: event.target.value }))} />
              </div>
              <div className="form-group full-span">
                <label>Specialization / Scope of Work</label>
                <textarea rows={3} value={form.specialization} onChange={(event) => setForm((prev) => ({ ...prev, specialization: event.target.value }))} />
              </div>
              <div className="form-group full-span">
                <label>Major Clients</label>
                <textarea rows={3} value={form.majorClients} onChange={(event) => setForm((prev) => ({ ...prev, majorClients: event.target.value }))} />
              </div>
              <div className="form-group full-span">
                <label>Declaration Status</label>
                <div className="declaration-status-container">
                  <div className="declaration-info">
                    <small>
                      {form.declarationStage === 0 && <span style={{ color: '#dc3545' }}>No declaration found</span>}
                      {form.declarationStage === 1 && <span style={{ color: '#ffc107' }}>Declaration text does not match expected format</span>}
                      {form.declarationStage === 2 && <span style={{ color: '#17a2b8' }}>Declaration matches, awaiting admin verification</span>}
                      {form.declarationStage === 3 && <span style={{ color: '#28a745' }}>Declaration fully verified</span>}
                    </small>
                  </div>
                </div>
              </div>
              <div className="form-group full-span">
                <label>Company Description</label>
                <textarea rows={4} value={form.companyDescription} onChange={(event) => setForm((prev) => ({ ...prev, companyDescription: event.target.value }))} />
              </div>
              <div className="check-row full-span">
                <label><input type="checkbox" checked={form.verified} onChange={(event) => setForm((prev) => ({ ...prev, verified: event.target.checked }))} /> Verified</label>
                <label><input type="checkbox" checked={form.featured} onChange={(event) => setForm((prev) => ({ ...prev, featured: event.target.checked }))} /> Featured</label>
              </div>
            </div>

            <div className="button-row admin-edit-actions" style={{ marginTop: '14px' }}>
              <button
                type="button"
                className={`btn ${form.suspended ? 'btn-secondary' : 'btn-danger'}`}
                onClick={() => setForm((prev) => ({ ...prev, suspended: !prev.suspended }))}
              >
                {form.suspended ? 'Unsuspend' : 'Suspend'}
              </button>
              <button type="button" className="btn btn-danger" onClick={deleteVendor}>Delete Vendor</button>
              <button type="button" className="btn btn-primary" onClick={saveEdit}>Save Changes</button>
            </div>
          </div>
        </div>
      ) : null}

      {verifyingVendor ? (
        <div className="admin-modal-overlay" onClick={closeVerificationModal} role="button" tabIndex={0}>
          <div className="admin-modal verification-modal" onClick={(event) => event.stopPropagation()}>
            <div className="admin-modal-head">
              <h2>Vendor Verification - {verifyingVendor.companyName}</h2>
              <button type="button" className="btn btn-secondary" onClick={closeVerificationModal}>Close</button>
            </div>

            <div className="verification-content">
              {/* Subscription Status */}
              <div className="verification-section">
                <h3>Subscription Status</h3>
                <div className="subscription-status">
                  <span className="status-badge" style={{ backgroundColor: getSubscriptionStatus(verifyingVendor).color }}>
                    {getSubscriptionStatus(verifyingVendor).text}
                  </span>
                  <span className="plan-details">{verifyingVendor.subscriptionPlan || 'Free Vendor Listing'}</span>
                </div>
              </div>

              {/* 5-Stage Verification */}
              <div className="verification-section">
                <h3>Verification Progress</h3>
                <div className="verification-stages">
                  {[
                    { stage: 1, name: 'Basic Profile Complete', completed: getVerificationStage(verifyingVendor) >= 1 },
                    { stage: 2, name: 'Business Information Complete', completed: getVerificationStage(verifyingVendor) >= 2 },
                    { stage: 3, name: 'Documents Uploaded', completed: getVerificationStage(verifyingVendor) >= 3 },
                    { stage: 4, name: 'Subscription Active', completed: getVerificationStage(verifyingVendor) >= 4 },
                    { stage: 5, name: 'Ready for Verification', completed: getVerificationStage(verifyingVendor) >= 5 }
                  ].map((item) => (
                    <div key={item.stage} className={`verification-stage ${item.completed ? 'completed' : 'pending'}`}>
                      <div className="stage-number">{item.stage}</div>
                      <div className="stage-content">
                        <div className="stage-name">{item.name}</div>
                        <div className="stage-status">{item.completed ? '✓ Completed' : '⏳ Pending'}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Documents */}
              <div className="verification-section">
                <h3>Documents & Certificates</h3>
                <div className="documents-grid">
                  <div className="document-group">
                    <h4>Documents</h4>
                    {verifyingVendor.documents && verifyingVendor.documents.length > 0 ? (
                      <div className="file-links">
                        {verifyingVendor.documents.map((doc, index) => (
                          <a key={index} href={getFileUrl(doc)} target="_blank" rel="noreferrer" className="file-link">
                            <i className="fa fa-file-alt" />
                            {doc.split('/').pop()}
                          </a>
                        ))}
                      </div>
                    ) : (
                      <p className="no-documents">No documents uploaded</p>
                    )}
                  </div>

                  <div className="document-group">
                    <h4>Certificates</h4>
                    {verifyingVendor.certificates && verifyingVendor.certificates.length > 0 ? (
                      <div className="file-links">
                        {verifyingVendor.certificates.map((cert, index) => (
                          <a key={index} href={getFileUrl(cert)} target="_blank" rel="noreferrer" className="file-link">
                            <i className="fa fa-certificate" />
                            {cert.split('/').pop()}
                          </a>
                        ))}
                      </div>
                    ) : (
                      <p className="no-documents">No certificates uploaded</p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="verification-actions">
              <button 
                type="button" 
                className="btn btn-success" 
                onClick={confirmVerification}
                disabled={getVerificationStage(verifyingVendor) < 4}
              >
                Verify Vendor
              </button>
              <button type="button" className="btn btn-secondary" onClick={closeVerificationModal}>
                Close
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

export default ListingModeration;
