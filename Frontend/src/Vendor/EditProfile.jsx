import React, { useEffect, useMemo, useState } from 'react';
import { api, authHeader } from '../components/api';

function EditProfile() {
  const [form, setForm] = useState({
    companyDescription: '',
    location: '',
    industryType: '',
    servicesOffered: ''
  });
  const [status, setStatus] = useState('');
  const [planName, setPlanName] = useState('Free Vendor Listing');
  const [imageLimit, setImageLimit] = useState(2);
  const [existingImages, setExistingImages] = useState([]);
  const [selectedImages, setSelectedImages] = useState([]);

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
        const response = await api.get('/vendor/me', { headers: authHeader('vendor') });
        const data = response.data || {};
        const nextPlan = data.subscriptionPlan || 'Free Vendor Listing';
        const nextLimit = ['Verified Vendor', 'Premium Vendor'].includes(nextPlan) ? 5 : 2;
        setForm({
          companyDescription: data.companyDescription || '',
          location: data.location || '',
          industryType: data.industryType || '',
          servicesOffered: Array.isArray(data.servicesOffered) ? data.servicesOffered.join(', ') : ''
        });
        setPlanName(nextPlan);
        setImageLimit(nextLimit);
        setExistingImages(Array.isArray(data.galleryImages) ? data.galleryImages : []);
      } catch (error) {
        setPlanName('Free Vendor Listing');
        setImageLimit(2);
        setExistingImages([]);
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

  const submit = async (event) => {
    event.preventDefault();
    try {
      if (totalImagesCount > imageLimit) {
        setStatus(`Image limit exceeded. You can upload ${imageLimit} images on ${planName}.`);
        return;
      }

      const formData = new FormData();
      formData.append('companyDescription', form.companyDescription);
      formData.append('location', form.location);
      formData.append('industryType', form.industryType);
      formData.append('servicesOffered', form.servicesOffered);
      selectedImages.forEach((file) => formData.append('galleryImages', file));

      await api.put('/vendor/update-profile', formData, { headers: authHeader('vendor') });
      setStatus('Profile updated successfully.');
      setSelectedImages([]);

      const response = await api.get('/vendor/me', { headers: authHeader('vendor') });
      const data = response.data || {};
      setExistingImages(Array.isArray(data.galleryImages) ? data.galleryImages : []);
    } catch (error) {
      setStatus(error?.response?.data?.message || 'Failed to update profile.');
    }
  };

  return (
    <div>
      <div className="section-head"><h1>Edit Profile</h1></div>
      <form className="white-card form-grid" onSubmit={submit}>
        <textarea rows={5} placeholder="Company Description" value={form.companyDescription} onChange={(event) => setForm((prev) => ({ ...prev, companyDescription: event.target.value }))} />
        <input placeholder="Location" value={form.location} onChange={(event) => setForm((prev) => ({ ...prev, location: event.target.value }))} />
        <input placeholder="Industry Type" value={form.industryType} onChange={(event) => setForm((prev) => ({ ...prev, industryType: event.target.value }))} />
        <input placeholder="Services Offered (comma separated)" value={form.servicesOffered} onChange={(event) => setForm((prev) => ({ ...prev, servicesOffered: event.target.value }))} />
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
        <button type="submit" className="btn btn-primary">Save Changes</button>
      </form>
      {status && <p className="status-text">{status}</p>}
    </div>
  );
}

export default EditProfile;
