import React, { useEffect, useState } from 'react';
import { api, authHeader } from '../components/api';

function CategoryManagement() {
  const [categories, setCategories] = useState([]);
  const [value, setValue] = useState('');
  const [status, setStatus] = useState('');
  const [editingIndex, setEditingIndex] = useState(null);
  const [editingValue, setEditingValue] = useState('');

  const loadCategories = async () => {
    console.log('=== LOADING CATEGORIES ===');
    try {
      console.log('Making API call to GET /admin/categories...');
      const response = await api.get('/admin/categories', { headers: authHeader('admin') });
      console.log('Categories loaded from API:', response.data);
      setCategories(response.data || []);
    } catch (error) {
      console.log('Error loading categories:', error);
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
    console.log('=== APPLYING EDIT ===');
    console.log('Editing index:', editingIndex);
    console.log('Editing value:', editingValue);
    console.log('Current categories:', categories);
    
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

    const updatedCategories = categories.map((item, idx) => (idx === editingIndex ? trimmed : item));
    console.log('Updated categories:', updatedCategories);
    setCategories(updatedCategories);
    setEditingIndex(null);
    setEditingValue('');
    setStatus('Category updated. Click "Save Categories" to persist changes.');
  };

  const deleteCategory = () => {
    if (editingIndex === null) return;
    setCategories((prev) => prev.filter((_, idx) => idx !== editingIndex));
    setEditingIndex(null);
    setEditingValue('');
    setStatus('Category removed. Click "Save Categories" to persist changes.');
  };

  const save = async () => {
    console.log('=== SAVING CATEGORIES ===');
    console.log('Categories to save:', categories);
    try {
      console.log('Making API call to /admin/categories...');
      const response = await api.post('/admin/categories', { categories }, { headers: authHeader('admin') });
      console.log('API Response:', response);
      setStatus('Categories updated successfully.');
      console.log('Categories saved successfully');
      
      // Reload categories from database to verify persistence
      console.log('Reloading categories from database...');
      await loadCategories();
    } catch (error) {
      console.log('Error saving categories:', error);
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
              <div className="button-row category-edit-save">
                <button type="button" className="btn btn-danger" onClick={deleteCategory}>
                  <i className="fa-solid fa-trash" /> Delete Category
                </button>
                <button type="button" className="btn btn-primary" onClick={applyEdit}>
                  <i className="fa-solid fa-check" /> Update Category
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

export default CategoryManagement;
