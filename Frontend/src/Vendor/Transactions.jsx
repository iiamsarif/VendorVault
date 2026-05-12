import React, { useEffect, useState } from 'react';
import { api, authHeader } from '../components/api';

function Transactions() {
  const [rows, setRows] = useState([]);
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const response = await api.get('/vendor/transactions', { headers: authHeader('vendor') });
        setRows(Array.isArray(response.data) ? response.data : []);
      } catch (error) {
        setRows([]);
        setStatus('Unable to load transactions.');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  return (
    <div>
      <div className="section-head">
        <h1>Transaction</h1>
        <p className="section-subtext">Your subscription and payment history.</p>
      </div>

      <div className="white-card">
        {status ? <p className="status-text">{status}</p> : null}
        {loading ? <p className="empty-text">Loading transactions...</p> : null}
        {!loading && !rows.length ? <p className="empty-text">No transactions found.</p> : null}

        {!!rows.length && (
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Plan</th>
                  <th>Amount</th>
                  <th>Status</th>
                  <th>Start</th>
                  <th>End</th>
                  <th>Type</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((item) => (
                  <tr key={item._id}>
                    <td data-label="Plan">{item.plan || '-'}</td>
                    <td data-label="Amount">INR {Number(item.amount || 0).toLocaleString('en-IN')}</td>
                    <td data-label="Status">
                      <span className={`badge ${
                        item.status === 'Active' ? 'badge-primary' :
                        item.status === 'Override' ? 'badge-secondary' :
                        item.status === 'Expired' ? 'text-danger' : 'text-success'
                      }`}
                      >
                        {item.status}
                      </span>
                    </td>
                    <td data-label="Start">{item.startDate ? new Date(item.startDate).toLocaleDateString() : '-'}</td>
                    <td data-label="End">{item.endDate ? new Date(item.endDate).toLocaleDateString() : '-'}</td>
                    <td data-label="Type">{item.source || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export default Transactions;
