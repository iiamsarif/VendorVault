import React, { useEffect, useState } from 'react';
import { api, authHeader } from '../components/api';

function RequirementManagement() {
  const [requirements, setRequirements] = useState([]);
  const [status, setStatus] = useState('');
  const [deletingId, setDeletingId] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);

  const load = async (page = 1) => {
    setLoading(true);
    try {
      const response = await api.get(`/admin/requirements?page=${page}&limit=10`, { headers: authHeader('admin') });
      setRequirements(response.data?.requirements || []);
      setTotalPages(response.data?.totalPages || 1);
      setCurrentPage(response.data?.currentPage || 1);
    } catch (error) {
      setRequirements([]);
    } finally {
      setLoading(false);
    }
  };

  const deleteRequirement = async (id) => {
    if (!confirm('Are you sure you want to delete this requirement?')) {
      return;
    }
    
    setDeletingId(id);
    try {
      await api.delete(`/admin/requirements/${id}`, { headers: authHeader('admin') });
      setRequirements((prev) => prev.filter((item) => item._id !== id));
      setStatus('Requirement deleted successfully.');
    } catch (error) {
      setStatus('Failed to delete requirement.');
    } finally {
      setDeletingId(null);
    }
  };

  useEffect(() => {
    load(currentPage);
  }, [currentPage]);

  // Debug: Log requirements data changes
  useEffect(() => {
    console.log('Requirements state changed:', requirements.length, requirements);
  }, [requirements]);

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <div>
      <div className="section-head">
        <h1>Requirement Management</h1>
        {status && <div className="status-text">{status}</div>}
      </div>
      
      <div className="white-card">
        <div className="pagination-controls">
          <button 
            className="btn btn-secondary" 
            onClick={() => load(Math.max(1, currentPage - 1))}
            disabled={currentPage === 1 || loading}
          >
            <i className="fa-solid fa-chevron-left" /> Previous
          </button>
          
          <span className="pagination-info">
            Page {currentPage} of {totalPages}
          </span>
          
          <button 
            className="btn btn-secondary" 
            onClick={() => load(Math.min(totalPages, currentPage + 1))}
            disabled={currentPage === totalPages || loading}
          >
            Next <i className="fa-solid fa-chevron-right" />
          </button>
        </div>
        
        <div className="requirement-grid">
          {requirements.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">
                <i className="fa-solid fa-clipboard-list" />
              </div>
              <h3>No Requirements Found</h3>
              <p>No requirements have been posted yet. Check back later for new vendor requirements.</p>
            </div>
          ) : (
            requirements.map((item) => (
              <div key={item._id} className="requirement-card">
                <div className="requirement-header">
                  <div className="requirement-category">
                    <span className="category-badge">{item.requirementCategory}</span>
                  </div>
                  <div className="requirement-meta">
                    <span className="location">
                      <i className="fa-solid fa-map-marker-alt" />
                      {item.location}
                    </span>
                    <span className="industry">
                      <i className="fa-solid fa-industry" />
                      {item.industryName}
                    </span>
                    <span className="date">
                      <i className="fa-solid fa-calendar" />
                      {formatDate(item.createdAt)}
                    </span>
                  </div>
                  <div className="requirement-actions">
                    <button 
                      type="button" 
                      className="btn btn-danger btn-sm"
                      onClick={() => deleteRequirement(item._id)}
                      disabled={deletingId === item._id}
                    >
                      {deletingId === item._id ? (
                        <>
                          <i className="fa-solid fa-spinner fa-spin" />
                          Deleting...
                        </>
                      ) : (
                        <>
                          <i className="fa-solid fa-trash" />
                          Delete
                        </>
                      )}
                    </button>
                  </div>
                </div>
                
                <div className="requirement-content">
                  <h4 className="requirement-title">
                    {item.requirementCategory}
                  </h4>
                  <div className="requirement-description">
                    <p>{item.projectDescription}</p>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

export default RequirementManagement;
