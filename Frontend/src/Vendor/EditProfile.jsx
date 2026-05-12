import React, { useEffect, useMemo, useState } from 'react';
import { api, authHeader } from '../components/api';

function EditProfile() {
  const [form, setForm] = useState({
    companyName: '',
    contactPerson: '',
    mobileNumber: '',
    whatsappNumber: '',
    email: '',
    officeAddress: '',
    cityState: '',
    city: '',
    category: '',
    primaryServiceArea: '',
    serviceTypes: '',
    yearsExperience: '',
    workerCount: '',
    specialization: '',
    businessType: '',
    gstRegistered: '',
    gstNumber: '',
    pfRegistered: '',
    esicRegistered: '',
    labourLicense: '',
    majorClients: '',
    declaration: false,
    companyDescription: '',
    industryType: '',
    servicesOffered: ''
  });
  const [serviceItems, setServiceItems] = useState([{ name: '', description: '' }]);
  const [serviceLimit, setServiceLimit] = useState(2);
  const [paidServiceAccess, setPaidServiceAccess] = useState(false);
  const [status, setStatus] = useState('');
  const [planName, setPlanName] = useState('Free Vendor Listing');
  const [imageLimit, setImageLimit] = useState(2);
  const [fileLimit, setFileLimit] = useState(2);
  const [existingImages, setExistingImages] = useState([]);
  const [selectedImages, setSelectedImages] = useState([]);
  const [existingLogo, setExistingLogo] = useState('');
  const [existingDocuments, setExistingDocuments] = useState([]);
  const [existingCertificates, setExistingCertificates] = useState([]);
  const [selectedLogo, setSelectedLogo] = useState(null);
  const [selectedDocuments, setSelectedDocuments] = useState([]);
  const [selectedCertificates, setSelectedCertificates] = useState([]);
  const [dbCategories, setDbCategories] = useState([]);

  const uploadsBase = String(api.defaults.baseURL || '').replace(/\/api\/?$/, '');

  const toFileUrl = (filePath) => {
    const clean = String(filePath || '').trim();
    if (!clean) return '';
    if (/^https?:\/\//i.test(clean)) return clean;
    if (clean.startsWith('/')) return `${uploadsBase}${clean}`;
    return `${uploadsBase}/${clean}`;
  };

  const selectedImagePreviews = useMemo(
    () => selectedImages.map((file) => ({ file, url: URL.createObjectURL(file) })),
    [selectedImages]
  );

  useEffect(() => {
    return () => {
      selectedImagePreviews.forEach((item) => URL.revokeObjectURL(item.url));
    };
  }, [selectedImagePreviews]);

  const totalImagesCount = existingImages.length + selectedImages.length;

  useEffect(() => {
    const loadVendorMeta = async () => {
      try {
        const [vendorResponse, categoryResponse] = await Promise.all([
          api.get('/vendor/me', { headers: authHeader('vendor') }),
          api.get('/vendor/categories')
        ]);
        const response = vendorResponse;
        const data = response.data || {};
        const categories = Array.isArray(categoryResponse?.data) ? categoryResponse.data.map((item) => String(item || '').trim()).filter(Boolean) : [];
        const nextPlan = data.subscriptionPlan || 'Free Vendor Listing';
        const hasPaidAccess = data.paid === 'Silver' || data.paid === 'Gold' || ['Verified Vendor', 'Premium Vendor'].includes(nextPlan);
        const nextLimit = hasPaidAccess ? 5 : 2;
        setPaidServiceAccess(hasPaidAccess);
        setServiceLimit(hasPaidAccess ? 20 : 2);
        setForm({
          companyName: data.companyName || '',
          contactPerson: data.contactPerson || '',
          mobileNumber: data.mobileNumber || '',
          whatsappNumber: data.whatsappNumber || '',
          email: data.email || '',
          officeAddress: data.officeAddress || '',
          cityState: data.cityState || '',
          city: data.city || '',
          category: data.category || '',
          primaryServiceArea: Array.isArray(data.primaryServiceArea) ? data.primaryServiceArea.join(', ') : '',
          serviceTypes: Array.isArray(data.serviceTypes) ? data.serviceTypes.join(', ') : '',
          yearsExperience: String(data.yearsExperience ?? ''),
          workerCount: data.workerCount || '',
          specialization: data.specialization || '',
          businessType: data.businessType || '',
          gstRegistered: data.gstRegistered || '',
          gstNumber: data.gstNumber || '',
          pfRegistered: data.pfRegistered || '',
          esicRegistered: data.esicRegistered || '',
          labourLicense: data.labourLicense || '',
          majorClients: data.majorClients || '',
          declaration: Boolean(data.declaration),
          companyDescription: data.companyDescription || '',
          industryType: data.industryType || '',
          servicesOffered: Array.isArray(data.servicesOffered) ? data.servicesOffered.join(', ') : ''
        });
        const normalizedServiceItems = Array.isArray(data.serviceItems)
          ? data.serviceItems
              .map((item) => ({
                name: String(item?.name || '').trim(),
                description: String(item?.description || '').trim()
              }))
              .filter((item) => item.name)
          : [];
        if (normalizedServiceItems.length) {
          const normalized = hasPaidAccess ? normalizedServiceItems : normalizedServiceItems.slice(0, 2);
          setServiceItems(normalized);
          if (!hasPaidAccess && normalizedServiceItems.length > 2) {
            setStatus('Free plan allows maximum 2 services. Extra services were hidden.');
          }
        } else if (Array.isArray(data.servicesOffered) && data.servicesOffered.length) {
          const fallbackItems = data.servicesOffered.map((name) => ({ name: String(name || '').trim(), description: '' })).filter((item) => item.name);
          const normalizedFallback = hasPaidAccess ? fallbackItems : fallbackItems.slice(0, 2);
          setServiceItems(normalizedFallback);
          if (!hasPaidAccess && fallbackItems.length > 2) {
            setStatus('Free plan allows maximum 2 services. Extra services were hidden.');
          }
        } else {
          setServiceItems([{ name: '', description: '' }]);
        }
        setDbCategories(categories);
        setPlanName(nextPlan);
        setImageLimit(nextLimit);
        setFileLimit(nextLimit);
        setExistingImages(Array.isArray(data.galleryImages) ? data.galleryImages : []);
        setExistingLogo(data.companyLogo || '');
        setExistingDocuments(Array.isArray(data.documents) ? data.documents : []);
        setExistingCertificates(Array.isArray(data.certificates) ? data.certificates : []);
      } catch (error) {
        setPlanName('Free Vendor Listing');
        setImageLimit(2);
        setFileLimit(2);
        setServiceLimit(2);
        setPaidServiceAccess(false);
        setExistingImages([]);
        setExistingLogo('');
        setExistingDocuments([]);
        setExistingCertificates([]);
        setDbCategories([]);
      }
    };

    loadVendorMeta();
  }, []);

  const onGallerySelect = (event) => {
    const files = Array.from(event.target.files || []);
    const onlyImages = files.filter((file) => String(file.type || '').startsWith('image/'));
    const allowedSlots = Math.max(0, imageLimit - existingImages.length);

    if (!allowedSlots) {
      setStatus(`Image limit reached. Current plan (${planName}) allows ${imageLimit} images.`);
      setSelectedImages([]);
      return;
    }

    const limited = onlyImages.slice(0, allowedSlots);
    if (onlyImages.length > allowedSlots) {
      setStatus(`Only ${allowedSlots} more image(s) can be added on ${planName}.`);
    } else {
      setStatus('');
    }
    setSelectedImages(limited);
  };

  const onDocumentsSelect = (event) => {
    const files = Array.from(event.target.files || []);
    const availableSlots = Math.max(0, fileLimit - existingDocuments.length);
    if (!availableSlots) {
      setStatus(`Documents limit reached. Maximum ${fileLimit} documents allowed on ${planName}.`);
      setSelectedDocuments([]);
      return;
    }
    const limited = files.slice(0, availableSlots);
    if (files.length > availableSlots) {
      setStatus(`Only ${availableSlots} more document(s) can be added on ${planName}.`);
    }
    setSelectedDocuments(limited);
  };

  const onCertificatesSelect = (event) => {
    const files = Array.from(event.target.files || []);
    const availableSlots = Math.max(0, fileLimit - existingCertificates.length);
    if (!availableSlots) {
      setStatus(`Certificates limit reached. Maximum ${fileLimit} certificates allowed on ${planName}.`);
      setSelectedCertificates([]);
      return;
    }
    const limited = files.slice(0, availableSlots);
    if (files.length > availableSlots) {
      setStatus(`Only ${availableSlots} more certificate(s) can be added on ${planName}.`);
    }
    setSelectedCertificates(limited);
  };

  const removeExisting = async (type, path) => {
    try {
      const payload = type === 'document'
        ? { removeDocuments: [path] }
        : { removeCertificates: [path] };
      await api.put('/vendor/update-profile', payload, { headers: authHeader('vendor') });
      setStatus(type === 'document' ? 'Document removed.' : 'Certificate removed.');
      const response = await api.get('/vendor/me', { headers: authHeader('vendor') });
      const data = response.data || {};
      setExistingDocuments(Array.isArray(data.documents) ? data.documents : []);
      setExistingCertificates(Array.isArray(data.certificates) ? data.certificates : []);
    } catch (error) {
      setStatus(error?.response?.data?.message || 'Unable to remove file.');
    }
  };

  const submit = async (event) => {
    event.preventDefault();
    try {
      if (totalImagesCount > imageLimit) {
        setStatus(`Image limit exceeded. You can upload ${imageLimit} images on ${planName}.`);
        return;
      }
      if (existingDocuments.length + selectedDocuments.length > fileLimit) {
        setStatus(`Documents limit reached. Maximum ${fileLimit} documents allowed on ${planName}.`);
        return;
      }
      if (existingCertificates.length + selectedCertificates.length > fileLimit) {
        setStatus(`Certificates limit reached. Maximum ${fileLimit} certificates allowed on ${planName}.`);
        return;
      }

      const formData = new FormData();
      formData.append('companyName', form.companyName);
      formData.append('contactPerson', form.contactPerson);
      formData.append('mobileNumber', form.mobileNumber);
      formData.append('whatsappNumber', form.whatsappNumber);
      formData.append('email', form.email);
      formData.append('officeAddress', form.officeAddress);
      formData.append('cityState', form.cityState);
      formData.append('city', form.city);
      formData.append('category', form.category);
      formData.append('primaryServiceArea', form.primaryServiceArea);
      formData.append('serviceTypes', form.serviceTypes);
      formData.append('yearsExperience', String(Number(form.yearsExperience || 0)));
      formData.append('workerCount', form.workerCount);
      formData.append('specialization', form.specialization);
      formData.append('businessType', form.businessType);
      formData.append('gstRegistered', form.gstRegistered);
      formData.append('gstNumber', form.gstRegistered === 'Yes' ? form.gstNumber : '');
      formData.append('pfRegistered', form.pfRegistered);
      formData.append('esicRegistered', form.esicRegistered);
      formData.append('labourLicense', form.labourLicense);
      formData.append('majorClients', form.majorClients);
      formData.append('declaration', form.declaration ? 'I agree and declare the information is accurate.' : '');
      formData.append('companyDescription', form.companyDescription);
      formData.append('industryType', form.industryType);
      const normalizedServiceItems = serviceItems
        .map((item) => ({
          name: String(item.name || '').trim(),
          description: String(item.description || '').trim()
        }))
        .filter((item) => item.name);
      formData.append('serviceItems', JSON.stringify(normalizedServiceItems));
      formData.append('servicesOffered', normalizedServiceItems.map((item) => item.name).join(', '));
      if (!paidServiceAccess && normalizedServiceItems.length > 2) {
        setStatus('Free plan allows maximum 2 services.');
        return;
      }
      if (selectedLogo) formData.append('companyLogo', selectedLogo);
      selectedImages.forEach((file) => formData.append('galleryImages', file));
      selectedDocuments.forEach((file) => formData.append('documents', file));
      selectedCertificates.forEach((file) => formData.append('certificates', file));

      await api.put('/vendor/update-profile', formData, { headers: authHeader('vendor') });
      setStatus('Profile updated successfully.');
      setSelectedImages([]);
      setSelectedLogo(null);
      setSelectedDocuments([]);
      setSelectedCertificates([]);

      const response = await api.get('/vendor/me', { headers: authHeader('vendor') });
      const data = response.data || {};
      setExistingImages(Array.isArray(data.galleryImages) ? data.galleryImages : []);
      setExistingLogo(data.companyLogo || '');
      setExistingDocuments(Array.isArray(data.documents) ? data.documents : []);
      setExistingCertificates(Array.isArray(data.certificates) ? data.certificates : []);
    } catch (error) {
      setStatus(error?.response?.data?.message || 'Failed to update profile.');
    }
  };

  return (
    <div>
      <div className="section-head"><h1>Edit Profile</h1></div>
      <form className="white-card form-grid" onSubmit={submit}>
        <label>Company Name<input placeholder="Company Name" value={form.companyName} onChange={(event) => setForm((prev) => ({ ...prev, companyName: event.target.value }))} /></label>
        <label>Contact Person<input placeholder="Contact Person" value={form.contactPerson} onChange={(event) => setForm((prev) => ({ ...prev, contactPerson: event.target.value }))} /></label>
        <label>Mobile Number<input placeholder="Mobile Number" value={form.mobileNumber} onChange={(event) => setForm((prev) => ({ ...prev, mobileNumber: event.target.value }))} /></label>
        <label>WhatsApp Number<input placeholder="WhatsApp Number" value={form.whatsappNumber} onChange={(event) => setForm((prev) => ({ ...prev, whatsappNumber: event.target.value }))} /></label>
        <label>Email Address<input type="email" placeholder="Email Address" value={form.email} onChange={(event) => setForm((prev) => ({ ...prev, email: event.target.value }))} /></label>
        <label>Office Address<input placeholder="Office Address" value={form.officeAddress} onChange={(event) => setForm((prev) => ({ ...prev, officeAddress: event.target.value }))} /></label>
        <label>City/State<input placeholder="City/State" value={form.cityState} onChange={(event) => setForm((prev) => ({ ...prev, cityState: event.target.value }))} /></label>
        <label>City<input placeholder="City" value={form.city} onChange={(event) => setForm((prev) => ({ ...prev, city: event.target.value }))} /></label>
        <label>Service Category<select value={form.category} onChange={(event) => setForm((prev) => ({ ...prev, category: event.target.value }))}>
          <option value="">Select Service Category</option>
          {dbCategories.map((item) => <option key={item} value={item}>{item}</option>)}
        </select></label>
        <div className="vendor-auth-full service-items-block">
          <label>Services</label>
          <div className="service-items-stack">
            {serviceItems.map((item, index) => (
              <div className="service-item-card" key={`edit-service-item-${index}`}>
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
              className="btn btn-secondary"
              onClick={() => setServiceItems((prev) => [...prev, { name: '', description: '' }])}
            >
              <i className="fa fa-plus" /> Add Service
            </button>
          ) : null}
        </div>
        <label>Primary Service Area (comma separated)<input placeholder="Primary Service Area (comma separated)" value={form.primaryServiceArea} onChange={(event) => setForm((prev) => ({ ...prev, primaryServiceArea: event.target.value }))} /></label>
        <label>Type of Service Provided (comma separated)<input placeholder="Type of Service Provided (comma separated)" value={form.serviceTypes} onChange={(event) => setForm((prev) => ({ ...prev, serviceTypes: event.target.value }))} /></label>
        <label>Years of Experience<input type="number" placeholder="Years of Experience" value={form.yearsExperience} onChange={(event) => setForm((prev) => ({ ...prev, yearsExperience: event.target.value }))} /></label>
        <label>Estimated Workers<input placeholder="Estimated Workers" value={form.workerCount} onChange={(event) => setForm((prev) => ({ ...prev, workerCount: event.target.value }))} /></label>
        <label>Business Type<input placeholder="Business Type" value={form.businessType} onChange={(event) => setForm((prev) => ({ ...prev, businessType: event.target.value }))} /></label>
        <label>GST Registered?<select value={form.gstRegistered} onChange={(event) => setForm((prev) => ({ ...prev, gstRegistered: event.target.value, gstNumber: event.target.value === 'Yes' ? prev.gstNumber : '' }))}>
          <option value="">Select</option>
          <option value="Yes">Yes</option>
          <option value="No">No</option>
        </select></label>
        {form.gstRegistered === 'Yes' && (
          <label>GST Number<input placeholder="GST Number" value={form.gstNumber} onChange={(event) => setForm((prev) => ({ ...prev, gstNumber: event.target.value }))} /></label>
        )}
        <label>PF Registered?<select value={form.pfRegistered} onChange={(event) => setForm((prev) => ({ ...prev, pfRegistered: event.target.value }))}>
          <option value="">PF Registered?</option>
          <option value="Yes">Yes</option>
          <option value="No">No</option>
        </select></label>
        <label>ESIC Registered?<select value={form.esicRegistered} onChange={(event) => setForm((prev) => ({ ...prev, esicRegistered: event.target.value }))}>
          <option value="">ESIC Registered?</option>
          <option value="Yes">Yes</option>
          <option value="No">No</option>
        </select></label>
        <label>Labour License?<select value={form.labourLicense} onChange={(event) => setForm((prev) => ({ ...prev, labourLicense: event.target.value }))}>
          <option value="">Labour License?</option>
          <option value="Yes">Yes</option>
          <option value="No">No</option>
        </select></label>
        <label>Industry Type<input placeholder="Industry Type" value={form.industryType} onChange={(event) => setForm((prev) => ({ ...prev, industryType: event.target.value }))} /></label>
        <label>Specialization / Scope of Work<input placeholder="Specialization / Scope of Work" value={form.specialization} onChange={(event) => setForm((prev) => ({ ...prev, specialization: event.target.value }))} /></label>
        <label>Major Clients<textarea rows={4} placeholder="Major Clients" value={form.majorClients} onChange={(event) => setForm((prev) => ({ ...prev, majorClients: event.target.value }))} /></label>
        <label style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'flex-start', gap: '8px', textAlign: 'left', cursor: 'pointer', paddingTop: '28px' }}>
          <input
            type="checkbox"
            checked={Boolean(form.declaration)}
            onChange={(event) => setForm((prev) => ({ ...prev, declaration: event.target.checked }))}
            style={{ marginTop: '2px', width: '16px', height: '16px', flex: '0 0 16px' }}
          />
          I agree and declare the information is accurate.
        </label>
        <label>Company Description<textarea rows={5} placeholder="Company Description" value={form.companyDescription} onChange={(event) => setForm((prev) => ({ ...prev, companyDescription: event.target.value }))} /></label>
        <div className="vendor-gallery-uploader">
          <label htmlFor="vendor-logo-input">Upload Company Logo</label>
          <input id="vendor-logo-input" type="file" accept="image/*" onChange={(event) => setSelectedLogo(event.target.files?.[0] || null)} />
          <div className="vendor-gallery-preview-grid">
            {existingLogo && <img src={toFileUrl(existingLogo)} alt="Company logo" className="vendor-gallery-thumb" />}
          </div>
        </div>
        <div className="vendor-gallery-uploader">
          <label htmlFor="vendor-gallery-input">Upload Images</label>
          <small>{existingImages.length + selectedImages.length}/{imageLimit} uploaded ({planName})</small>
          <input id="vendor-gallery-input" type="file" accept="image/*" multiple onChange={onGallerySelect} />
          <div className="vendor-gallery-preview-grid">
            {existingImages.map((imgPath, index) => (
              <img
                key={`${imgPath}-${index}`}
                src={toFileUrl(imgPath)}
                alt={`Uploaded ${index + 1}`}
                className="vendor-gallery-thumb"
              />
            ))}
            {selectedImagePreviews.map((item, index) => (
              <img key={`${item.file.name}-${index}`} src={item.url} alt={item.file.name} className="vendor-gallery-thumb" />
            ))}
          </div>
        </div>
        <div className="vendor-gallery-uploader">
          <label htmlFor="vendor-documents-input">Upload Documents</label>
          <small>{existingDocuments.length + selectedDocuments.length}/{fileLimit} documents ({planName})</small>
          <input id="vendor-documents-input" type="file" multiple onChange={onDocumentsSelect} />
          <div className="vendor-existing-files">
            {existingDocuments.map((filePath, index) => (
              <div key={`${filePath}-${index}`} className="button-row">
                <a href={toFileUrl(filePath)} target="_blank" rel="noreferrer">{`Document ${index + 1}`}</a>
                <button type="button" className="btn btn-danger" onClick={() => removeExisting('document', filePath)}>Remove</button>
              </div>
            ))}
          </div>
        </div>
        <div className="vendor-gallery-uploader">
          <label htmlFor="vendor-certificates-input">Upload Certificates</label>
          <small>{existingCertificates.length + selectedCertificates.length}/{fileLimit} certificates ({planName})</small>
          <input id="vendor-certificates-input" type="file" multiple onChange={onCertificatesSelect} />
          <div className="vendor-existing-files">
            {existingCertificates.map((filePath, index) => (
              <div key={`${filePath}-${index}`} className="button-row">
                <a href={toFileUrl(filePath)} target="_blank" rel="noreferrer">{`Certificate ${index + 1}`}</a>
                <button type="button" className="btn btn-danger" onClick={() => removeExisting('certificate', filePath)}>Remove</button>
              </div>
            ))}
          </div>
        </div>
        <button type="submit" className="btn btn-primary">Save Changes</button>
      </form>
      {status && <p className="status-text">{status}</p>}
    </div>
  );
}

export default EditProfile;
