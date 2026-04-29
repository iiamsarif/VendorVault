import React, { useEffect, useState } from 'react';
import { api, authHeader } from '../components/api';

function UserManagement() {
  const [users, setUsers] = useState([]);
  const [status, setStatus] = useState('');
  const [editingUser, setEditingUser] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    email: '',
    name: '',
    role: 'user',
    accountType: 'user'
  });

  const load = async (page = 1) => {
    setLoading(true);
    try {
      const response = await api.get(`/admin/users?page=${page}&limit=10`, { headers: authHeader('admin') });
      setUsers(response.data?.users || []);
      setTotalPages(response.data?.totalPages || 1);
      setCurrentPage(response.data?.currentPage || 1);
    } catch (error) {
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  const openEdit = (user) => {
    setEditingUser(user);
    setForm({
      email: user.email || '',
      name: user.name || '',
      role: user.role || 'user',
      accountType: user.accountType || 'user'
    });
  };

  const closeEdit = () => {
    setEditingUser(null);
    setForm({
      email: '',
      name: '',
      role: 'user',
      accountType: 'user'
    });
  };

  const saveUser = async () => {
    if (!editingUser?._id) return;
    
    try {
      await api.put('/admin/users/update', {
        userId: editingUser._id,
        ...form
      }, { headers: authHeader('admin') });
      setStatus('User updated successfully.');
      closeEdit();
      load(currentPage);
    } catch (error) {
      setStatus('Failed to update user.');
    }
  };

  const deleteUser = async (userId) => {
    if (!confirm('Are you sure you want to delete this user?')) {
      return;
    }
    
    try {
      await api.delete(`/admin/users/${userId}`, { headers: authHeader('admin') });
      setUsers((prev) => prev.filter((user) => user._id !== userId));
      setStatus('User deleted successfully.');
    } catch (error) {
      setStatus('Failed to delete user.');
    }
  };

  useEffect(() => {
    load(currentPage);
  }, [currentPage]);

  return (
    <div>
      <div className="section-head">
        <h1>User Management</h1>
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
        
        <div className="admin-table-wrap user-management-table">
          <table className="admin-table user-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Role</th>
                <th>Account Type</th>
                <th>Created At</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.length === 0 ? (
                <tr>
                  <td colSpan="6" className="empty-text">No users found.</td>
                </tr>
              ) : (
                users.map((user) => (
                  <tr key={user._id}>
                    <td data-label="Name">{user.name || '-'}</td>
                    <td data-label="Email">{user.email || '-'}</td>
                    <td data-label="Role">
                      <span className={`badge ${user.role === 'admin' ? 'badge-primary' : 'badge-secondary'}`}>
                        {user.role || 'user'}
                      </span>
                    </td>
                    <td data-label="Account Type">{user.accountType || '-'}</td>
                    <td data-label="Created At">{user.createdAt ? new Date(user.createdAt).toLocaleDateString() : '-'}</td>
                    <td data-label="Actions">
                      <div className="button-row">
                        <button type="button" className="btn btn-secondary" onClick={() => openEdit(user)}>Edit</button>
                        <button type="button" className="btn btn-danger" onClick={() => deleteUser(user._id)}>Delete</button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {editingUser && (
        <div className="modal-overlay" onClick={closeEdit}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Edit User</h2>
              <button type="button" className="modal-close" onClick={closeEdit}>
                <i className="fa-solid fa-xmark" />
              </button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label>Name</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label>Email</label>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label>Role</label>
                <select
                  value={form.role}
                  onChange={(e) => setForm({ ...form, role: e.target.value })}
                >
                  <option value="user">User</option>
                  <option value="vendor">Vendor</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              <div className="form-group">
                <label>Account Type</label>
                <select
                  value={form.accountType}
                  onChange={(e) => setForm({ ...form, accountType: e.target.value })}
                >
                  <option value="user">User</option>
                  <option value="vendor">Vendor</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-secondary" onClick={closeEdit}>Cancel</button>
              <button type="button" className="btn btn-primary" onClick={saveUser}>Save</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default UserManagement;
