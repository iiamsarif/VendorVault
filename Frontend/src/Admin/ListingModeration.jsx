import React, { useEffect, useState } from 'react';
import { api, authHeader } from '../components/api';

function ListingModeration() {
  const [vendors, setVendors] = useState([]);
  const [status, setStatus] = useState('');
  const [editingVendor, setEditingVendor] = useState(null);
  const [form, setForm] = useState({
    companyName: '',
    contactPerson: '',
    mobileNumber: '',
    whatsappNumber: '',
    email: '',
    officeAddress: '',
    cityState: '',
    category: '',
    location: '',
    industryType: '',
    yearsExperience: '',
    servicesOffered: '',
    companyDescription: '',
    verified: false,
    featured: false,
    suspended: false
  });

  const loadVendors = async () => {
    try {
      const response = await api.get('/vendor/listings');
      setVendors(response.data || []);
    } catch (error) {
      setVendors([]);
    }
  };

  useEffect(() => {
    loadVendors();
  }, []);

  const toggleVerify = async (vendorId, verified) => {
    try {
      await api.post('/admin/vendors/verify', { vendorId, verified: !verified }, { headers: authHeader('admin') });
      setStatus('Vendor verification updated.');
      loadVendors();
    } catch (error) {
      setStatus('Unable to update verification status.');
    }
  };

  const openEdit = (vendor) => {
    setEditingVendor(vendor);
    setForm({
      companyName: vendor.companyName || '',
      contactPerson: vendor.contactPerson || '',
      mobileNumber: vendor.mobileNumber || '',
      whatsappNumber: vendor.whatsappNumber || '',
      email: vendor.email || '',
      officeAddress: vendor.officeAddress || '',
      cityState: vendor.cityState || '',
      category: vendor.category || '',
      location: vendor.location || '',
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
          servicesOffered: form.servicesOffered.split(',').map((item) => item.trim()).filter(Boolean)
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

      <div className="white-card admin-table-wrap">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Company</th>
              <th>Category</th>
              <th>Location</th>
              <th>Verified</th>
              <th>Featured</th>
              <th>Suspended</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {vendors.slice(0, 50).map((vendor) => (
              <tr key={vendor._id}>
                <td>{vendor.companyName}</td>
                <td>{vendor.category || '-'}</td>
                <td>{vendor.location || '-'}</td>
                <td>{vendor.verified ? 'Yes' : 'No'}</td>
                <td>{vendor.featured ? 'Yes' : 'No'}</td>
                <td>{vendor.suspended ? 'Yes' : 'No'}</td>
                <td>
                  <div className="button-row">
                    <button type="button" className="btn btn-secondary" onClick={() => openEdit(vendor)}>Edit</button>
                    <button type="button" className="btn btn-primary" onClick={() => toggleVerify(vendor._id, vendor.verified)}>
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
              <input placeholder="Company Name" value={form.companyName} onChange={(event) => setForm((prev) => ({ ...prev, companyName: event.target.value }))} />
              <input placeholder="Contact Person" value={form.contactPerson} onChange={(event) => setForm((prev) => ({ ...prev, contactPerson: event.target.value }))} />
              <input placeholder="Mobile Number" value={form.mobileNumber} onChange={(event) => setForm((prev) => ({ ...prev, mobileNumber: event.target.value }))} />
              <input placeholder="WhatsApp Number" value={form.whatsappNumber} onChange={(event) => setForm((prev) => ({ ...prev, whatsappNumber: event.target.value }))} />
              <input placeholder="Email" value={form.email} onChange={(event) => setForm((prev) => ({ ...prev, email: event.target.value }))} />
              <input placeholder="Category" value={form.category} onChange={(event) => setForm((prev) => ({ ...prev, category: event.target.value }))} />
              <input placeholder="Office Address" value={form.officeAddress} onChange={(event) => setForm((prev) => ({ ...prev, officeAddress: event.target.value }))} />
              <input placeholder="City/State" value={form.cityState} onChange={(event) => setForm((prev) => ({ ...prev, cityState: event.target.value }))} />
              <input placeholder="Location" value={form.location} onChange={(event) => setForm((prev) => ({ ...prev, location: event.target.value }))} />
              <input placeholder="Industry Type" value={form.industryType} onChange={(event) => setForm((prev) => ({ ...prev, industryType: event.target.value }))} />
              <input placeholder="Years Experience" value={form.yearsExperience} onChange={(event) => setForm((prev) => ({ ...prev, yearsExperience: event.target.value }))} />
              <input placeholder="Services Offered (comma separated)" value={form.servicesOffered} onChange={(event) => setForm((prev) => ({ ...prev, servicesOffered: event.target.value }))} />
              <textarea className="full-span" rows={4} placeholder="Company Description" value={form.companyDescription} onChange={(event) => setForm((prev) => ({ ...prev, companyDescription: event.target.value }))} />
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
    </div>
  );
}

export default ListingModeration;
