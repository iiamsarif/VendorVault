import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../components/api';

const iconClasses = [
  'fa-regular fa-comment-dots',
  'fa-solid fa-dna',
  'fa-solid fa-calculator',
  'fa-solid fa-map-location-dot',
  'fa-solid fa-scroll',
  'fa-solid fa-book-bible',
  'fa-solid fa-feather-pointed',
  'fa-solid fa-magnifying-glass-plus'
];

function CategoriesPage() {
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    const loadCategories = async () => {
      try {
        const response = await api.get('/vendor/categories');
        setCategories(Array.isArray(response.data) ? response.data : []);
      } catch (error) {
        setCategories([]);
      }
    };

    loadCategories();
  }, []);

  return (
    <section className="container category-theme-section">
      <h2 className="category-theme-title">Choose <span>A</span> Category</h2>
      <div className="category-grid">
        {categories.map((category, index) => (
          <Link
            key={category}
            className="category-card"
            to={`/vendors?category=${encodeURIComponent(category)}`}
          >
            <div className="icon-box">
              <i className={iconClasses[index % iconClasses.length]} />
            </div>
            <h3>{category}</h3>
            <p>Explore verified vendor listings, offerings, and contact options in this category.</p>
          </Link>
        ))}
      </div>
    </section>
  );
}

export default CategoriesPage;
