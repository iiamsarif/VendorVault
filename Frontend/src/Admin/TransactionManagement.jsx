import React, { useEffect, useState } from 'react';
import { api, authHeader } from '../components/api';

function TransactionManagement() {
  const [rows, setRows] = useState([]);
  const [status, setStatus] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState(null);

  const load = async (page = 1) => {
    setLoading(true);
    try {
      const response = await api.get('/admin/transactions', {
        headers: authHeader('admin'),
        params: { page, limit: 20 }
      });
      const data = response.data || {};
      setRows(Array.isArray(data.transactions) ? data.transactions : []);
      setCurrentPage(Number(data.currentPage || 1));
      setTotalPages(Number(data.totalPages || 1));
      setStatus('');
    } catch (error) {
      setRows([]);
      setStatus('Unable to load transactions.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load(1);
  }, []);

  return (
    <div>
      <div className="section-head">
        <h1>Transactions</h1>
      </div>

      <div className="white-card">
        <div className="pagination-controls">
          <button className="btn btn-secondary" onClick={() => load(Math.max(1, currentPage - 1))} disabled={currentPage <= 1 || loading}>
            <i className="fa-solid fa-chevron-left" /> Previous
          </button>
          <span className="pagination-info">Page {currentPage} of {totalPages}</span>
          <button className="btn btn-secondary" onClick={() => load(Math.min(totalPages, currentPage + 1))} disabled={currentPage >= totalPages || loading}>
            Next <i className="fa-solid fa-chevron-right" />
          </button>
        </div>

        {status ? <p className="status-text">{status}</p> : null}
        {loading ? <p className="empty-text">Loading transactions...</p> : null}
        {!loading && !rows.length ? <p className="empty-text">No transactions found.</p> : null}

        {!!rows.length && (
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Vendor</th>
                  <th>Plan</th>
                  <th>Amount</th>
                  <th>Status</th>
                  <th>End Date</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((item) => (
                  <tr key={item._id}>
                    <td data-label="Vendor">{item.vendorName || '-'}</td>
                    <td data-label="Plan">{item.plan || '-'}</td>
                    <td data-label="Amount">INR {Number(item.amount || 0).toLocaleString('en-IN')}</td>
                    <td data-label="Status">{item.status || '-'}</td>
                    <td data-label="End Date">{item.endDate ? new Date(item.endDate).toLocaleDateString() : '-'}</td>
                    <td data-label="Actions">
                      <button type="button" className="btn btn-secondary" onClick={() => setSelected(item)}>View</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {selected && (
        <div className="modal-overlay" onClick={() => setSelected(null)}>
          <div className="modal-content" onClick={(event) => event.stopPropagation()}>
            <div className="modal-header">
              <h2>Transaction Details</h2>
              <button type="button" className="modal-close" onClick={() => setSelected(null)}>
                <i className="fa-solid fa-xmark" />
              </button>
            </div>
            <div className="modal-body">
              <div className="form-grid">
                <p><strong>Vendor:</strong> {selected.vendorName || '-'}</p>
                <p><strong>Email:</strong> {selected.vendorEmail || '-'}</p>
                <p><strong>Plan:</strong> {selected.plan || '-'}</p>
                <p><strong>Label:</strong> {selected.label || '-'}</p>
                <p><strong>Amount:</strong> INR {Number(selected.amount || 0).toLocaleString('en-IN')}</p>
                <p><strong>Status:</strong> {selected.status || '-'}</p>
                <p><strong>Type:</strong> {selected.source || '-'}</p>
                <p><strong>Payment ID:</strong> {selected.paymentId || '-'}</p>
                <p><strong>Order ID:</strong> {selected.orderId || '-'}</p>
                <p><strong>Start Date:</strong> {selected.startDate ? new Date(selected.startDate).toLocaleString() : '-'}</p>
                <p><strong>End Date:</strong> {selected.endDate ? new Date(selected.endDate).toLocaleString() : '-'}</p>
                <p><strong>Created:</strong> {selected.createdAt ? new Date(selected.createdAt).toLocaleString() : '-'}</p>
                <p><strong>Updated:</strong> {selected.updatedAt ? new Date(selected.updatedAt).toLocaleString() : '-'}</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default TransactionManagement;
