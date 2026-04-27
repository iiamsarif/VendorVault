import React, { useEffect, useState } from 'react';
import { api, authHeader } from '../components/api';

function AddServices() {
  const [services, setServices] = useState('');
  const [status, setStatus] = useState('');

  useEffect(() => {
    const loadExistingServices = async () => {
      try {
        const response = await api.get('/vendor/me', { headers: authHeader('vendor') });
        const existing = Array.isArray(response.data?.servicesOffered) ? response.data.servicesOffered : [];
        setServices(existing.join(', '));
      } catch (error) {
        setServices('');
      }
    };

    loadExistingServices();
  }, []);

  const save = async () => {
    try {
      await api.put('/vendor/update-profile', {
        servicesOffered: services.split(',').map((service) => service.trim()).filter(Boolean)
      }, { headers: authHeader('vendor') });
      setStatus('Services updated successfully.');
    } catch (error) {
      setStatus('Could not update services.');
    }
  };

  return (
    <div>
      <div className="section-head"><h1>Add Services</h1></div>
      <div className="white-card form-grid">
        <textarea rows={6} placeholder="Enter services separated by commas" value={services} onChange={(event) => setServices(event.target.value)} />
        <button type="button" className="btn btn-primary" onClick={save}>Save Services</button>
      </div>
      {status && <p className="status-text">{status}</p>}
    </div>
  );
}

export default AddServices;
