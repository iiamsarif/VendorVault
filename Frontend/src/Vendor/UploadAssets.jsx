import React, { useEffect, useMemo, useState } from 'react';
import { api, authHeader } from '../components/api';

function UploadAssets() {
  const [docs, setDocs] = useState([]);
  const [certs, setCerts] = useState([]);
  const [existingDocs, setExistingDocs] = useState([]);
  const [existingCerts, setExistingCerts] = useState([]);
  const [status, setStatus] = useState('');

  const uploadsBase = String(api.defaults.baseURL || '').replace(/\/api\/?$/, '');

  const toFileUrl = (filePath) => {
    const clean = String(filePath || '').trim();
    if (!clean) return '';
    if (/^https?:\/\//i.test(clean)) return clean;
    if (clean.startsWith('/')) return `${uploadsBase}${clean}`;
    return `${uploadsBase}/${clean}`;
  };

  const normalizeFiles = (files) =>
    (Array.isArray(files) ? files : [])
      .map((file) => {
        const name = String(file || '').split('/').pop();
        const lower = String(file || '').toLowerCase();
        const isImage = lower.endsWith('.png') || lower.endsWith('.jpg') || lower.endsWith('.jpeg') || lower.endsWith('.webp');
        return { name, url: toFileUrl(file), isImage };
      })
      .filter((item) => item.url);

  const selectedDocPreviews = useMemo(
    () => docs.map((file) => ({ name: file.name, url: URL.createObjectURL(file), isImage: String(file.type || '').startsWith('image/') })),
    [docs]
  );
  const selectedCertPreviews = useMemo(
    () => certs.map((file) => ({ name: file.name, url: URL.createObjectURL(file), isImage: String(file.type || '').startsWith('image/') })),
    [certs]
  );

  useEffect(() => {
    const loadExisting = async () => {
      try {
        const response = await api.get('/vendor/me', { headers: authHeader('vendor') });
        const data = response.data || {};
        setExistingDocs(normalizeFiles(data.documents));
        setExistingCerts(normalizeFiles(data.certificates));
      } catch (error) {
        setExistingDocs([]);
        setExistingCerts([]);
      }
    };

    loadExisting();
  }, []);

  useEffect(
    () => () => {
      selectedDocPreviews.forEach((item) => URL.revokeObjectURL(item.url));
      selectedCertPreviews.forEach((item) => URL.revokeObjectURL(item.url));
    },
    [selectedDocPreviews, selectedCertPreviews]
  );

  const save = async () => {
    try {
      const formData = new FormData();
      docs.forEach((file) => formData.append('documents', file));
      certs.forEach((file) => formData.append('certificates', file));

      await api.put('/vendor/update-profile', formData, { headers: authHeader('vendor') });
      setStatus('Documents and certificates updated.');
      setDocs([]);
      setCerts([]);
      const response = await api.get('/vendor/me', { headers: authHeader('vendor') });
      const data = response.data || {};
      setExistingDocs(normalizeFiles(data.documents));
      setExistingCerts(normalizeFiles(data.certificates));
    } catch (error) {
      setStatus('Upload mapping failed.');
    }
  };

  return (
    <div>
      <div className="section-head"><h1>Upload Images/Documents</h1></div>
      <div className="white-card form-grid">
        <label>Gallery / Documents</label>
        <input type="file" multiple onChange={(event) => setDocs(Array.from(event.target.files || []))} />
        <div className="upload-preview-grid">
          {existingDocs.map((item, index) => (
            <a key={`${item.url}-${index}`} href={item.url} target="_blank" rel="noreferrer" className="upload-preview-item">
              {item.isImage ? <img src={item.url} alt={item.name} className="upload-preview-thumb" /> : <div className="upload-preview-file">PDF</div>}
              <span>{item.name}</span>
            </a>
          ))}
          {selectedDocPreviews.map((item, index) => (
            <div key={`${item.name}-${index}`} className="upload-preview-item">
              {item.isImage ? <img src={item.url} alt={item.name} className="upload-preview-thumb" /> : <div className="upload-preview-file">FILE</div>}
              <span>{item.name}</span>
            </div>
          ))}
        </div>
        <label>Certificates</label>
        <input type="file" multiple onChange={(event) => setCerts(Array.from(event.target.files || []))} />
        <div className="upload-preview-grid">
          {existingCerts.map((item, index) => (
            <a key={`${item.url}-${index}`} href={item.url} target="_blank" rel="noreferrer" className="upload-preview-item">
              {item.isImage ? <img src={item.url} alt={item.name} className="upload-preview-thumb" /> : <div className="upload-preview-file">PDF</div>}
              <span>{item.name}</span>
            </a>
          ))}
          {selectedCertPreviews.map((item, index) => (
            <div key={`${item.name}-${index}`} className="upload-preview-item">
              {item.isImage ? <img src={item.url} alt={item.name} className="upload-preview-thumb" /> : <div className="upload-preview-file">FILE</div>}
              <span>{item.name}</span>
            </div>
          ))}
        </div>
        <button type="button" className="btn btn-primary" onClick={save}>Save Assets</button>
      </div>
      {status && <p className="status-text">{status}</p>}
    </div>
  );
}

export default UploadAssets;
