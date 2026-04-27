import React, { useEffect, useMemo, useState } from 'react';
import { api, authHeader } from '../components/api';

function ListingManagement() {
  const [availableCategories, setAvailableCategories] = useState([]);
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [primaryCategory, setPrimaryCategory] = useState('');
  const [maxCategories, setMaxCategories] = useState(4);
  const [status, setStatus] = useState('');
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');

  const load = async () => {
    try {
      const response = await api.get('/vendor/listing-categories', { headers: authHeader('vendor') });
      const data = response.data || {};
      const nextSelected = Array.isArray(data.selectedCategories) ? data.selectedCategories : [];
      setAvailableCategories(Array.isArray(data.availableCategories) ? data.availableCategories : []);
      setSelectedCategories(nextSelected);
      setPrimaryCategory(data.primaryCategory || nextSelected[0] || '');
      setMaxCategories(Number(data.maxCategories) || 4);
      setStatus('');
    } catch (error) {
      setAvailableCategories([]);
      setSelectedCategories([]);
      setPrimaryCategory('');
      setStatus('Unable to load listing categories.');
    }
  };

  useEffect(() => {
    load();
  }, []);

  const filteredCategories = useMemo(() => {
    if (!search) return availableCategories;
    return availableCategories.filter((item) => item.toLowerCase().includes(search.toLowerCase()));
  }, [availableCategories, search]);

  const toggleCategory = (category) => {
    setSelectedCategories((prev) => {
      if (prev.includes(category)) {
        const next = prev.filter((item) => item !== category);
        if (primaryCategory === category) {
          setPrimaryCategory(next[0] || '');
        }
        return next;
      }

      if (prev.length >= maxCategories) {
        setStatus(`You can select up to ${maxCategories} categories only.`);
        return prev;
      }

      setStatus('');
      return [...prev, category];
    });
  };

  const save = async () => {
    if (!selectedCategories.length) {
      setStatus('Select at least one category.');
      return;
    }

    setSaving(true);
    try {
      const response = await api.put(
        '/vendor/listing-categories',
        { categories: selectedCategories, primaryCategory },
        { headers: authHeader('vendor') }
      );
      const data = response.data || {};
      setSelectedCategories(Array.isArray(data.selectedCategories) ? data.selectedCategories : selectedCategories);
      setPrimaryCategory(data.primaryCategory || primaryCategory || selectedCategories[0] || '');
      setStatus(data.message || 'Listing categories updated.');
    } catch (error) {
      setStatus(error?.response?.data?.message || 'Failed to save listing categories.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <div className="section-head"><h1>Listings</h1></div>
      <article className="white-card listing-settings-card">
        <div className="listing-settings-top">
          <div>
            <h3>Category Listing Control</h3>
            <p>Select up to {maxCategories} categories for your business listing. Pick one primary category to show as your default listing category.</p>
          </div>
          <div className="listing-count-pill">{selectedCategories.length}/{maxCategories}</div>
        </div>

        <div className="listing-selected-wrap">
          <strong>Current Categories</strong>
          <div className="listing-selected-chips">
            {selectedCategories.length ? selectedCategories.map((item) => (
              <span key={item} className="listing-chip">
                {item}
                <button type="button" onClick={() => toggleCategory(item)} aria-label={`Remove ${item}`}>
                  <i className="fa-solid fa-xmark" />
                </button>
              </span>
            )) : <span className="listing-chip-empty">No categories selected</span>}
          </div>
        </div>

        <div className="listing-primary-row">
          <label htmlFor="listing-primary">Primary Category</label>
          <select
            id="listing-primary"
            value={primaryCategory}
            onChange={(event) => setPrimaryCategory(event.target.value)}
            disabled={!selectedCategories.length}
          >
            {!selectedCategories.length ? <option value="">Select categories first</option> : null}
            {selectedCategories.map((item) => (
              <option key={item} value={item}>{item}</option>
            ))}
          </select>
        </div>

        <div className="listing-category-browser">
          <div className="listing-browser-head">
            <h4>Available Categories</h4>
            <input
              type="text"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search categories"
            />
          </div>

          <div className="listing-category-grid">
            {filteredCategories.map((category) => {
              const checked = selectedCategories.includes(category);
              const disabled = !checked && selectedCategories.length >= maxCategories;
              return (
                <label key={category} className={`listing-category-option ${checked ? 'is-active' : ''} ${disabled ? 'is-disabled' : ''}`}>
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => toggleCategory(category)}
                    disabled={disabled}
                  />
                  <span>{category}</span>
                </label>
              );
            })}
            {!filteredCategories.length ? <p className="empty-text">No categories found.</p> : null}
          </div>
        </div>

        <div className="listing-settings-actions">
          <button type="button" className="btn btn-primary" onClick={save} disabled={saving}>
            {saving ? 'Saving...' : 'Save Listing Categories'}
          </button>
        </div>

        {status ? <p className="status-text">{status}</p> : null}
      </article>
    </div>
  );
}

export default ListingManagement;
