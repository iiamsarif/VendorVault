import React, { useEffect, useState } from 'react';
import { api, authHeader } from '../components/api';

function ViewInquiries() {
  const [inquiries, setInquiries] = useState([]);
  const [status, setStatus] = useState('');
  const [replyingInquiry, setReplyingInquiry] = useState(null);
  const [replyMessage, setReplyMessage] = useState('');

  const load = async () => {
    try {
      const response = await api.get('/inquiries/list', { headers: authHeader('vendor') });
      setInquiries(response.data || []);
    } catch (error) {
      setInquiries([]);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const openReplyModal = (item) => {
    setReplyingInquiry(item);
    setReplyMessage(item?.vendorReply?.message || '');
    setStatus('');
  };

  const submitReply = async () => {
    if (!replyingInquiry?._id || !replyMessage.trim()) {
      setStatus('Reply message is required.');
      return;
    }

    try {
      await api.post(
        '/inquiries/reply',
        { inquiryId: replyingInquiry._id, message: replyMessage.trim() },
        { headers: authHeader('vendor') }
      );
      setStatus('Reply sent successfully.');
      setReplyingInquiry(null);
      setReplyMessage('');
      await load();
    } catch (error) {
      setStatus(error?.response?.data?.message || 'Failed to send reply.');
    }
  };

  const getInitials = (value = '') => {
    const parts = String(value).trim().split(/\s+/).filter(Boolean);
    if (!parts.length) return 'U';
    return `${parts[0][0] || ''}${parts[1]?.[0] || ''}`.toUpperCase();
  };

  return (
    <div>
      <div className="section-head"><h1>View Inquiries</h1></div>
      {status && <p className="status-text">{status}</p>}
      <div className="list-stack vendor-inquiry-list">
        {inquiries.map((item) => (
          <article key={item._id} className="white-card vendor-inquiry-card">
            <div className="vendor-inquiry-head">
              <div className="vendor-inquiry-avatar">{getInitials(item.contactName)}</div>
              <div className="vendor-inquiry-meta">
                <h3>{item.contactName || 'Unknown Contact'}</h3>
                <span>{item.createdAt ? new Date(item.createdAt).toLocaleString() : ''}</span>
              </div>
              {item.vendorReply?.message ? <span className="vendor-inquiry-badge">Replied</span> : null}
            </div>

            <div className="vendor-inquiry-message">
              <p>{item.message}</p>
            </div>

            <div className="vendor-inquiry-contact-row">
              <span><i className="fa-regular fa-envelope" /> {item.contactEmail || '-'}</span>
              <span><i className="fa-solid fa-phone" /> {item.contactPhone || '-'}</span>
            </div>

            {item.vendorReply?.message ? (
              <div className="vendor-inquiry-reply-preview">
                <strong>Your Reply</strong>
                <p>{item.vendorReply.message}</p>
              </div>
            ) : null}

            <div className="button-row vendor-inquiry-actions">
              <button type="button" className="btn btn-primary" onClick={() => openReplyModal(item)}>
                {item.vendorReply?.message ? 'Edit Reply' : 'Reply'}
              </button>
            </div>
          </article>
        ))}
        {!inquiries.length && <p className="empty-text">No inquiries yet.</p>}
      </div>

      {replyingInquiry ? (
        <div className="admin-modal-overlay" onClick={() => setReplyingInquiry(null)} role="button" tabIndex={0}>
          <div className="admin-modal vendor-reply-modal" onClick={(event) => event.stopPropagation()}>
            <div className="admin-modal-head">
              <h2>Reply To Inquiry</h2>
              <button type="button" className="btn btn-secondary" onClick={() => setReplyingInquiry(null)}>Close</button>
            </div>
            <div className="form-grid vendor-reply-grid">
              <div className="vendor-reply-original">
                <strong>Inquiry</strong>
                <p>{replyingInquiry.message}</p>
              </div>
              <textarea
                rows={5}
                placeholder="Type your response..."
                value={replyMessage}
                onChange={(event) => setReplyMessage(event.target.value)}
              />
              <button type="button" className="btn btn-primary" onClick={submitReply}>Respond</button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

export default ViewInquiries;
