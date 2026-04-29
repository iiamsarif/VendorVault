import React, { useEffect, useState } from 'react';
import { api, authHeader } from '../components/api';

function SubscriptionManagement() {
  const [stats, setStats] = useState([]);
  const [paidVendors, setPaidVendors] = useState([]);
  const [status, setStatus] = useState('');
  const [busyVendorId, setBusyVendorId] = useState('');
  const [editingVendor, setEditingVendor] = useState(null);
  const [editingTier, setEditingTier] = useState('Free');

  const load = async () => {
    try {
      const [statsResponse, paidResponse] = await Promise.all([
        api.get('/admin/stats', { headers: authHeader('admin'), params: { _t: Date.now() } }),
        api.get('/admin/subscriptions/paid-vendors', { headers: authHeader('admin'), params: { _t: Date.now() } })
      ]);

      setStats(statsResponse.data.subscriptions || []);
      const vendors = Array.isArray(paidResponse.data) ? paidResponse.data : [];
      setPaidVendors(vendors);
    } catch (error) {
      setStats([]);
      setPaidVendors([]);
      setStatus('Unable to load subscription data.');
    }
  };

  useEffect(() => {
    load();
  }, []);

  const openEditModal = (vendor) => {
    const currentTier =
      String(vendor?.paid || '').toLowerCase() === 'gold'
        ? 'Gold'
        : String(vendor?.paid || '').toLowerCase() === 'silver'
          ? 'Silver'
          : 'Free';
    setEditingVendor(vendor);
    setEditingTier(currentTier);
  };

  const closeEditModal = () => {
    setEditingVendor(null);
    setEditingTier('Free');
  };

  const updateTier = async () => {
    if (!editingVendor?._id) return;

    try {
      setBusyVendorId(editingVendor._id);
      await api.post(
        '/admin/subscriptions/set-tier',
        { vendorId: editingVendor._id, tier: editingTier },
        { headers: authHeader('admin') }
      );
      setStatus(`${editingVendor.companyName || 'Vendor'} is now ${editingTier}.`);
      closeEditModal();
      await load();
    } catch (error) {
      setStatus(error?.response?.data?.message || 'Unable to update vendor tier right now.');
    } finally {
      setBusyVendorId('');
    }
  };

  return (
    <div>
      <div className="section-head"><h1>Subscription Management</h1></div>
      {status ? <p className="status-text">{status}</p> : null}

      <div className="card-grid three">
        {stats.map((item) => (
          <article className="white-card" key={item._id}>
            <h3>{item._id}</h3>
            <h2>{item.count}</h2>
          </article>
        ))}
        {!stats.length && <p className="empty-text">No subscription data available.</p>}
      </div>

      <div className="section-head" style={{ marginTop: '22px' }}>
        <h2>Paid Vendors</h2>
      </div>
      <div className="white-card admin-table-wrap">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Company</th>
              <th>Plan</th>
              <th>Paid</th>
              <th>Expires On</th>
              <th>Contact</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {paidVendors.map((vendor) => (
              <tr key={vendor._id}>
                <td>{vendor.companyName || '-'}</td>
                <td>{vendor.activePlan || vendor.subscriptionPlan || '-'}</td>
                <td>{vendor.paid || 'None'}</td>
                <td>{vendor.endDate ? new Date(vendor.endDate).toLocaleDateString() : '-'}</td>
                <td>{vendor.email || vendor.mobileNumber || '-'}</td>
                <td>
                  <button type="button" className="btn btn-secondary" onClick={() => openEditModal(vendor)}>
                    Edit
                  </button>
                </td>
              </tr>
            ))}
            {!paidVendors.length ? (
              <tr>
                <td colSpan={6}>No active paid vendors found.</td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>

      {editingVendor ? (
        <div className="admin-modal-overlay" onClick={closeEditModal} role="button" tabIndex={0}>
          <div className="admin-modal admin-edit-modal" onClick={(event) => event.stopPropagation()}>
            <div className="admin-modal-head">
              <h2>Edit Subscription</h2>
              <button type="button" className="btn btn-secondary" onClick={closeEditModal}>Close</button>
            </div>

            <div className="form-grid">
              <input value={editingVendor.companyName || ''} readOnly />
              <select value={editingTier} onChange={(event) => setEditingTier(event.target.value)}>
                <option value="Free">Free</option>
                <option value="Silver">Silver</option>
                <option value="Gold">Gold</option>
              </select>
            </div>

            <div className="button-row admin-edit-actions" style={{ marginTop: '14px' }}>
              <button
                type="button"
                className="btn btn-primary"
                onClick={updateTier}
                disabled={busyVendorId === editingVendor._id}
              >
                {busyVendorId === editingVendor._id ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

export default SubscriptionManagement;
