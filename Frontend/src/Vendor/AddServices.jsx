import React, { useEffect, useState } from 'react';
import { api, authHeader } from '../components/api';

function AddServices() {
  const [serviceItems, setServiceItems] = useState([{ name: '', description: '' }]);
  const [status, setStatus] = useState('');
  const [serviceLimit, setServiceLimit] = useState(2);
  const [paidServiceAccess, setPaidServiceAccess] = useState(false);

  useEffect(() => {
    const loadExistingServices = async () => {
      try {
        const response = await api.get('/vendor/me', { headers: authHeader('vendor') });
        const vendor = response.data || {};
        const plan = String(vendor.subscriptionPlan || 'Free Vendor Listing');
        const hasPaidAccess =
          vendor.paid === 'Silver' ||
          vendor.paid === 'Gold' ||
          ['Verified Vendor', 'Premium Vendor'].includes(plan);
        setPaidServiceAccess(hasPaidAccess);
        setServiceLimit(hasPaidAccess ? 20 : 2);

        const existingServiceItems = Array.isArray(response.data?.serviceItems)
          ? response.data.serviceItems
              .map((item) => ({
                name: String(item?.name || '').trim(),
                description: String(item?.description || '').trim()
              }))
              .filter((item) => item.name)
          : [];

        if (existingServiceItems.length) {
          const normalized = hasPaidAccess ? existingServiceItems : existingServiceItems.slice(0, 2);
          setServiceItems(normalized);
          if (!hasPaidAccess && existingServiceItems.length > 2) {
            setStatus('Free plan allows maximum 2 services. Extra services were hidden.');
          }
          return;
        }

        const existingNames = Array.isArray(response.data?.servicesOffered) ? response.data.servicesOffered : [];
        const fallbackItems = existingNames
          .map((name) => ({ name: String(name || '').trim(), description: '' }))
          .filter((item) => item.name);
        const normalizedFallback = hasPaidAccess ? fallbackItems : fallbackItems.slice(0, 2);
        setServiceItems(normalizedFallback.length ? normalizedFallback : [{ name: '', description: '' }]);
        if (!hasPaidAccess && fallbackItems.length > 2) {
          setStatus('Free plan allows maximum 2 services. Extra services were hidden.');
        }
      } catch (error) {
        setServiceItems([{ name: '', description: '' }]);
        setServiceLimit(2);
        setPaidServiceAccess(false);
      }
    };

    loadExistingServices();
  }, []);

  const save = async () => {
    const normalizedServiceItems = serviceItems
      .map((item) => ({
        name: String(item.name || '').trim(),
        description: String(item.description || '').trim()
      }))
      .filter((item) => item.name);

    if (!normalizedServiceItems.length) {
      setStatus('Please add at least one service name.');
      return;
    }
    if (!paidServiceAccess && normalizedServiceItems.length > 2) {
      setStatus('Free plan allows maximum 2 services.');
      return;
    }

    try {
      await api.put('/vendor/update-profile', {
        serviceItems: normalizedServiceItems,
        servicesOffered: normalizedServiceItems.map((item) => item.name)
      }, { headers: authHeader('vendor') });
      setStatus('Services updated successfully.');
    } catch (error) {
      setStatus('Could not update services.');
    }
  };

  return (
    <div className="vendor-add-services-page">
      <div className="section-head"><h1>Add Services</h1></div>
      <div className="white-card form-grid vendor-add-services-card">
        <div className="vendor-add-services-meta">
          <span className={`vendor-add-services-plan ${paidServiceAccess ? 'paid' : 'free'}`}>
            {paidServiceAccess ? 'Paid Plan' : 'Free Plan'}
          </span>
          <span className="vendor-add-services-limit">
            {serviceItems.length}/{serviceLimit} services
          </span>
        </div>
        <div className="vendor-auth-full service-items-block">
          <label className="vendor-add-services-label">Services</label>
          <div className="service-items-stack">
            {serviceItems.map((item, index) => (
              <div className="service-item-card" key={`add-service-item-${index}`}>
                <div className="service-item-head">
                  <strong>Service {index + 1}</strong>
                  {serviceItems.length > 1 ? (
                    <button
                      type="button"
                      className="btn btn-danger"
                      onClick={() => setServiceItems((prev) => prev.filter((_, i) => i !== index))}
                    >
                      Remove
                    </button>
                  ) : null}
                </div>
                <input
                  placeholder="Service name"
                  value={item.name}
                  onChange={(event) =>
                    setServiceItems((prev) =>
                      prev.map((row, i) => (i === index ? { ...row, name: event.target.value } : row))
                    )
                  }
                />
                <textarea
                  rows={3}
                  placeholder="Service description"
                  value={item.description}
                  onChange={(event) =>
                    setServiceItems((prev) =>
                      prev.map((row, i) => (i === index ? { ...row, description: event.target.value } : row))
                    )
                  }
                />
              </div>
            ))}
          </div>
          {(paidServiceAccess || serviceItems.length < serviceLimit) ? (
            <button
              type="button"
              className="btn btn-secondary vendor-add-services-btn-add"
              onClick={() => setServiceItems((prev) => [...prev, { name: '', description: '' }])}
            >
              <i className="fa fa-plus" /> Add Service
            </button>
          ) : null}
        </div>
        <button type="button" className="btn btn-primary vendor-add-services-btn-save" onClick={save}>Save Services</button>
      </div>
      {status && <p className="status-text">{status}</p>}
    </div>
  );
}

export default AddServices;
