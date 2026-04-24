import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../components/api';

function VendorRegistration() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    companyName: '',
    contactPerson: '',
    mobileNumber: '',
    whatsappNumber: '',
    email: '',
    officeAddress: '',
    cityState: '',
    category: '',
    servicesOffered: '',
    yearsExperience: '',
    companyLogo: null,
    documents: [],
    certificates: [],
    password: ''
  });
  const [errors, setErrors] = useState({});
  const [status, setStatus] = useState('');
  const [dbCategories, setDbCategories] = useState([]);

  const logoPreview = useMemo(() => (form.companyLogo ? URL.createObjectURL(form.companyLogo) : ''), [form.companyLogo]);
  const categoryOptions = dbCategories;

  useEffect(() => {
    const loadCategories = async () => {
      try {
        const response = await api.get('/vendor/categories');
        const list = Array.isArray(response.data) ? response.data.map((item) => String(item || '').trim()).filter(Boolean) : [];
        setDbCategories(list);
      } catch (error) {
        setDbCategories([]);
      }
    };

    loadCategories();
  }, []);

  const validate = () => {
    const nextErrors = {};
    const requiredFields = [
      'companyName',
      'contactPerson',
      'mobileNumber',
      'email',
      'officeAddress',
      'cityState',
      'category',
      'servicesOffered',
      'password'
    ];

    requiredFields.forEach((field) => {
      if (!String(form[field] || '').trim()) {
        nextErrors[field] = 'Required field';
      }
    });

    if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      nextErrors.email = 'Invalid email format';
    }
    if (form.mobileNumber && !/^\+?[0-9]{10,15}$/.test(form.mobileNumber)) {
      nextErrors.mobileNumber = 'Invalid phone number';
    }
    if (form.whatsappNumber && !/^\+?[0-9]{10,15}$/.test(form.whatsappNumber)) {
      nextErrors.whatsappNumber = 'Invalid WhatsApp number';
    }
    if (form.companyLogo && !form.companyLogo.type.startsWith('image/')) {
      nextErrors.companyLogo = 'Logo must be an image file';
    }

    const invalidDoc = form.documents.find((file) => !['application/pdf', 'image/png', 'image/jpeg'].includes(file.type));
    if (invalidDoc) nextErrors.documents = 'Documents must be PDF, PNG, or JPEG';

    const invalidCert = form.certificates.find((file) => !['application/pdf', 'image/png', 'image/jpeg'].includes(file.type));
    if (invalidCert) nextErrors.certificates = 'Certificates must be PDF, PNG, or JPEG';

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const submit = async (event) => {
    event.preventDefault();
    setStatus('');
    if (!validate()) return;

    try {
      const formData = new FormData();
      formData.append('companyName', form.companyName);
      formData.append('contactPerson', form.contactPerson);
      formData.append('mobileNumber', form.mobileNumber);
      formData.append('whatsappNumber', form.whatsappNumber);
      formData.append('email', form.email);
      formData.append('officeAddress', form.officeAddress);
      formData.append('cityState', form.cityState);
      formData.append('category', form.category);
      formData.append('servicesOffered', form.servicesOffered);
      formData.append('yearsExperience', String(Number(form.yearsExperience || 0)));
      formData.append('password', form.password);

      if (form.companyLogo) {
        formData.append('companyLogo', form.companyLogo);
      }
      form.documents.forEach((file) => formData.append('documents', file));
      form.certificates.forEach((file) => formData.append('certificates', file));

      await api.post('/vendor/register', formData);
      setStatus('Vendor registration submitted. Waiting for admin approval.');
      setTimeout(() => navigate('/login'), 1200);
    } catch (error) {
      setStatus(error?.response?.data?.message || 'Registration failed.');
    }
  };

  const fieldError = (field) => (errors[field] ? <small className="error-text">{errors[field]}</small> : null);

  return (
    <div className="auth-theme-page">
      <div className="auth-theme-container">
        <section className="auth-theme-form-section vendor-auth-section">
          <div className="auth-theme-brand">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path d="M2 2H11V11H2V2ZM13 2H22V11H13V2ZM2 13H11V22H2V13ZM13 13H22V22H13V13Z" fill="#6941C6" />
            </svg>
            <span>VendorVault Gujarat</span>
          </div>

          <div className="auth-theme-form-wrapper vendor-auth-form-wrapper">
            <div className="auth-theme-header">
              <h1>Vendor registration</h1>
              <p>Please enter your business details</p>
            </div>

            <form onSubmit={submit} className="vendor-auth-grid">
              <div className="auth-theme-input-group">
                <label htmlFor="company-name">Company Name</label>
                <input id="company-name" value={form.companyName} onChange={(event) => setForm((prev) => ({ ...prev, companyName: event.target.value }))} />
                {fieldError('companyName')}
              </div>

              <div className="auth-theme-input-group">
                <label htmlFor="contact-person">Contact Person</label>
                <input id="contact-person" value={form.contactPerson} onChange={(event) => setForm((prev) => ({ ...prev, contactPerson: event.target.value }))} />
                {fieldError('contactPerson')}
              </div>

              <div className="auth-theme-input-group">
                <label htmlFor="mobile-number">Mobile Number</label>
                <input id="mobile-number" value={form.mobileNumber} onChange={(event) => setForm((prev) => ({ ...prev, mobileNumber: event.target.value }))} />
                {fieldError('mobileNumber')}
              </div>

              <div className="auth-theme-input-group">
                <label htmlFor="whatsapp-number">WhatsApp Number</label>
                <input id="whatsapp-number" value={form.whatsappNumber} onChange={(event) => setForm((prev) => ({ ...prev, whatsappNumber: event.target.value }))} />
                {fieldError('whatsappNumber')}
              </div>

              <div className="auth-theme-input-group">
                <label htmlFor="vendor-email">Email Address</label>
                <input id="vendor-email" type="email" value={form.email} onChange={(event) => setForm((prev) => ({ ...prev, email: event.target.value }))} />
                {fieldError('email')}
              </div>

              <div className="auth-theme-input-group">
                <label htmlFor="vendor-password">Password</label>
                <input id="vendor-password" type="password" placeholder="********" value={form.password} onChange={(event) => setForm((prev) => ({ ...prev, password: event.target.value }))} />
                {fieldError('password')}
              </div>

              <div className="auth-theme-input-group vendor-auth-full">
                <label htmlFor="office-address">Office Address</label>
                <input id="office-address" value={form.officeAddress} onChange={(event) => setForm((prev) => ({ ...prev, officeAddress: event.target.value }))} />
                {fieldError('officeAddress')}
              </div>

              <div className="auth-theme-input-group">
                <label htmlFor="city-state">City / State</label>
                <input id="city-state" value={form.cityState} onChange={(event) => setForm((prev) => ({ ...prev, cityState: event.target.value }))} />
                {fieldError('cityState')}
              </div>

              <div className="auth-theme-input-group">
                <label htmlFor="service-category">Service Category</label>
                <select id="service-category" value={form.category} onChange={(event) => setForm((prev) => ({ ...prev, category: event.target.value }))}>
                  <option value="">Select Service Category</option>
                  {categoryOptions.map((item) => <option key={item} value={item}>{item}</option>)}
                </select>
                {fieldError('category')}
              </div>

              <div className="auth-theme-input-group vendor-auth-full">
                <label htmlFor="services-offered">Services Offered (comma separated)</label>
                <input id="services-offered" value={form.servicesOffered} onChange={(event) => setForm((prev) => ({ ...prev, servicesOffered: event.target.value }))} />
                {fieldError('servicesOffered')}
              </div>

              <div className="auth-theme-input-group">
                <label htmlFor="experience-years">Years of Experience</label>
                <input id="experience-years" type="number" value={form.yearsExperience} onChange={(event) => setForm((prev) => ({ ...prev, yearsExperience: event.target.value }))} />
              </div>

              <div className="auth-theme-input-group">
                <label htmlFor="company-logo">Upload Company Logo</label>
                <input id="company-logo" type="file" accept="image/*" onChange={(event) => setForm((prev) => ({ ...prev, companyLogo: event.target.files?.[0] || null }))} />
                {fieldError('companyLogo')}
                {logoPreview && <img src={logoPreview} alt="Logo preview" className="logo-preview" />}
              </div>

              <div className="auth-theme-input-group">
                <label htmlFor="documents">Upload Documents</label>
                <input id="documents" type="file" multiple onChange={(event) => setForm((prev) => ({ ...prev, documents: Array.from(event.target.files || []) }))} />
                {fieldError('documents')}
              </div>

              <div className="auth-theme-input-group">
                <label htmlFor="certificates">Upload Certificates</label>
                <input id="certificates" type="file" multiple onChange={(event) => setForm((prev) => ({ ...prev, certificates: Array.from(event.target.files || []) }))} />
                {fieldError('certificates')}
              </div>

              <div className="vendor-auth-full">
                <button type="submit" className="auth-theme-btn-primary">Submit Registration</button>
              </div>
            </form>

            {status && <p className="auth-theme-status">{status}</p>}
            <p className="auth-theme-switch">
              Already registered? <Link to="/login">Sign in</Link>
            </p>
          </div>
        </section>

        <section className="auth-theme-image-section">
          <div className="auth-theme-illustration">
            <img src="https://illustrations.popsy.co/purple/remote-work.svg" alt="Support Illustration" />
          </div>
        </section>
      </div>
    </div>
  );
}

export default VendorRegistration;
