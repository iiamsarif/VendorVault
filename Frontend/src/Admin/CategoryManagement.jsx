import React, { useEffect, useState } from 'react';
import { api, authHeader } from '../components/api';

function CategoryManagement() {
  const [categories, setCategories] = useState([]);
  const [value, setValue] = useState('');
  const [status, setStatus] = useState('');
  const [editingIndex, setEditingIndex] = useState(null);
  const [editingValue, setEditingValue] = useState('');

  const loadCategories = async () => {
    try {
      const response = await api.get('/admin/categories', { headers: authHeader('admin') });
      setCategories(response.data || []);
    } catch (error) {
      setCategories([]);
    }
  };

  useEffect(() => {
    loadCategories();
  }, []);

  const addCategory = () => {
    const trimmed = value.trim();
    if (!trimmed) {
      setStatus('Category name cannot be empty.');
      return;
    }

    const exists = categories.some((item) => item.toLowerCase() === trimmed.toLowerCase());
    if (exists) {
      setStatus('Category already exists.');
      return;
    }

    setCategories((prev) => [...prev, trimmed]);
    setValue('');
    setStatus('');
  };

  const openEdit = (index) => {
    setEditingIndex(index);
    setEditingValue(categories[index] || '');
  };

  const applyEdit = () => {
    if (editingIndex === null) return;
    const trimmed = editingValue.trim();
    if (!trimmed) {
      setStatus('Category name cannot be empty.');
      return;
    }

    const duplicateIndex = categories.findIndex((item) => item.toLowerCase() === trimmed.toLowerCase());
    if (duplicateIndex !== -1 && duplicateIndex !== editingIndex) {
      setStatus('Category already exists.');
      return;
    }

    setCategories((prev) => prev.map((item, idx) => (idx === editingIndex ? trimmed : item)));
    setEditingIndex(null);
    setEditingValue('');
    setStatus('');
  };

  const save = async () => {
    try {
      await api.post('/admin/categories', { categories }, { headers: authHeader('admin') });
      setStatus('Categories updated successfully.');
    } catch (error) {
      setStatus('Failed to update categories.');
    }
  };

  return (
    <div>
      <div className="section-head"><h1>Category Management</h1></div>
      <div className="white-card form-grid">
        <input value={value} onChange={(event) => setValue(event.target.value)} placeholder="Add category" />
        <button type="button" className="btn btn-secondary" onClick={addCategory}>Add</button>
        <button type="button" className="btn btn-primary" onClick={save}>Save Categories</button>
        <div className="tag-list">
          {categories.map((item, index) => (
            <span key={`${item}-${index}`} className="tag category-edit-tag">
              <span>{item}</span>
              <button type="button" className="category-edit-btn" onClick={() => openEdit(index)} aria-label={`Edit ${item}`}>
                <i className="fa-solid fa-pen" />
              </button>
            </span>
          ))}
        </div>
      </div>
      {status && <p className="status-text">{status}</p>}

      {editingIndex !== null ? (
        <div className="admin-modal-overlay" onClick={() => setEditingIndex(null)} role="button" tabIndex={0}>
          <div className="admin-modal category-edit-modal" onClick={(event) => event.stopPropagation()}>
            <div className="admin-modal-head category-edit-head">
              <h2><i className="fa-solid fa-pen-to-square" /> Edit Category</h2>
              <button type="button" className="btn btn-secondary" onClick={() => setEditingIndex(null)}>Close</button>
            </div>
            <div className="form-grid category-edit-body">
              <input
                className="category-edit-input"
                value={editingValue}
                onChange={(event) => setEditingValue(event.target.value)}
                placeholder="Category name"
              />
              <button type="button" className="btn btn-primary category-edit-save" onClick={applyEdit}>
                <i className="fa-solid fa-check" /> Update Category
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

export default CategoryManagement;
