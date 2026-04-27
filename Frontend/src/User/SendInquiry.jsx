import React, { useEffect, useState } from 'react';
import { api, authHeader } from '../components/api';

function SendInquiry() {
  const [vendors, setVendors] = useState([]);
  const [form, setForm] = useState({ vendorId: '', contactName: '', contactEmail: '', contactPhone: '', message: '' });
  const [status, setStatus] = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        const response = await api.get('/vendor/listings');
        setVendors(response.data || []);
      } catch (error) {
        setVendors([]);
      }
    };

    load();
  }, []);

  const submit = async (event) => {
    event.preventDefault();
    try {
      await api.post('/inquiries/create', form, { headers: authHeader('user') });
      setStatus('Inquiry sent successfully.');
      setForm({ vendorId: '', contactName: '', contactEmail: '', contactPhone: '', message: '' });
    } catch (error) {
      setStatus(error?.response?.data?.message || 'Failed to send inquiry.');
    }
  };

  return (
    <div>
      <div className="section-head"><h1>Send Inquiry</h1></div>
      <form className="white-card form-grid" onSubmit={submit}>
        <select value={form.vendorId} onChange={(event) => setForm((prev) => ({ ...prev, vendorId: event.target.value }))}>
          <option value="">Select Vendor</option>
          {vendors.map((vendor) => <option key={vendor._id} value={vendor._id}>{vendor.companyName}</option>)}
        </select>
        <input placeholder="Contact Name" value={form.contactName} onChange={(event) => setForm((prev) => ({ ...prev, contactName: event.target.value }))} />
        <input placeholder="Contact Email" value={form.contactEmail} onChange={(event) => setForm((prev) => ({ ...prev, contactEmail: event.target.value }))} />
        <input placeholder="Contact Phone" value={form.contactPhone} onChange={(event) => setForm((prev) => ({ ...prev, contactPhone: event.target.value }))} />
        <textarea rows={4} placeholder="Inquiry Message" value={form.message} onChange={(event) => setForm((prev) => ({ ...prev, message: event.target.value }))} />
        <button type="submit" className="btn btn-primary">Send</button>
      </form>
      {status && <p className="status-text">{status}</p>}
    </div>
  );
}

export default SendInquiry;
