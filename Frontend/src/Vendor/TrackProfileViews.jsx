import React, { useEffect, useMemo, useState } from 'react';
import { api, authHeader } from '../components/api';

function TrackProfileViews() {
  const [summary, setSummary] = useState({ uniqueProfileViews: 0, profileViews: 0 });
  const [growthPoints, setGrowthPoints] = useState([]);
  const [status, setStatus] = useState('');
  const [items, setItems] = useState([]);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);

  const loadSummary = async () => {
    try {
      const response = await api.get('/vendor/analytics', { headers: authHeader('vendor') });
      setSummary({
        uniqueProfileViews: Number(response.data?.uniqueProfileViews || 0),
        profileViews: Number(response.data?.profileViews || 0)
      });
      setStatus('');
    } catch (error) {
      setSummary({ uniqueProfileViews: 0, profileViews: 0 });
      setStatus(error?.response?.data?.message || 'Unable to load profile view analytics.');
    }
  };

  const loadGrowth = async () => {
    try {
      const response = await api.get('/vendor/profile-views-growth', {
        headers: authHeader('vendor'),
        params: { days: 7 }
      });
      setGrowthPoints(Array.isArray(response.data?.points) ? response.data.points : []);
    } catch (error) {
      setGrowthPoints([]);
      setStatus(error?.response?.data?.message || 'Unable to load growth chart.');
    }
  };

  const loadViews = async (nextPage = 1, nextSearch = '') => {
    setLoading(true);
    try {
      const response = await api.get('/vendor/profile-views', {
        headers: authHeader('vendor'),
        params: { page: nextPage, limit: 10, search: nextSearch }
      });
      setItems(Array.isArray(response.data?.items) ? response.data.items : []);
      setTotal(Number(response.data?.total || 0));
      setTotalPages(Math.max(1, Number(response.data?.totalPages || 1)));
    } catch (error) {
      setItems([]);
      setTotal(0);
      setTotalPages(1);
      setStatus(error?.response?.data?.message || 'Unable to load viewer profiles.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSummary();
    loadGrowth();
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      loadViews(page, search);
    }, 250);
    return () => clearTimeout(timer);
  }, [page, search]);

  const statsText = useMemo(() => {
    if (!total) return 'No profile viewers found yet.';
    return `${total.toLocaleString()} unique viewer${total === 1 ? '' : 's'} found.`;
  }, [total]);

  const uploadsBase = String(api.defaults.baseURL || '').replace(/\/api\/?$/, '');

  const getInitials = (name = '') => {
    const parts = String(name).trim().split(/\s+/).filter(Boolean);
    if (!parts.length) return 'U';
    return `${parts[0][0] || ''}${parts[1]?.[0] || ''}`.toUpperCase();
  };

  const getRoleLabel = (item) => (item?.viewerType || item?.viewerRole || 'user').replace(/^./, (m) => m.toUpperCase());

  const chartData = useMemo(() => {
    const points = Array.isArray(growthPoints) ? growthPoints : [];
    if (!points.length) {
      return { path: '', areaPath: '', labels: [] };
    }

    const width = 560;
    const height = 170;
    const padding = 16;
    const maxVal = Math.max(...points.map((item) => Number(item.value || 0)), 1);
    const stepX = points.length > 1 ? (width - padding * 2) / (points.length - 1) : 0;

    const normalized = points.map((item, index) => {
      const x = padding + (index * stepX);
      const y = height - padding - ((Number(item.value || 0) / maxVal) * (height - padding * 2));
      return { x, y, label: item.label, value: Number(item.value || 0) };
    });

    const path = normalized.map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`).join(' ');
    const areaPath = `${path} L ${normalized[normalized.length - 1].x} ${height - padding} L ${normalized[0].x} ${height - padding} Z`;

    return {
      path,
      areaPath,
      labels: normalized
    };
  }, [growthPoints]);

  return (
    <div>
      <div className="section-head"><h1>Track Profile Views</h1></div>

      <article className="white-card profile-views-summary-card">
        <div className="profile-views-summary-head">
          <div>
            <h2>{summary.uniqueProfileViews}</h2>
            <p>Total unique profiles who viewed your listing.</p>
            <small>Total visits (including repeat): {summary.profileViews}</small>
          </div>
        </div>

        <div className="profile-views-chart-wrap">
          {chartData.path ? (
            <svg viewBox="0 0 560 170" className="profile-views-chart" role="img" aria-label="Profile views growth line chart">
              <defs>
                <linearGradient id="profileViewsArea" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="rgba(255,255,255,0.45)" />
                  <stop offset="100%" stopColor="rgba(255,255,255,0.02)" />
                </linearGradient>
              </defs>
              <path d={chartData.areaPath} fill="url(#profileViewsArea)" />
              <path d={chartData.path} fill="none" stroke="#ffffff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
              {chartData.labels.map((point, idx) => (
                <g key={`${point.label}-${idx}`}>
                  <circle cx={point.x} cy={point.y} r="3.5" fill="#fff" />
                  <text x={point.x} y="165" textAnchor="middle" fontSize="10" fill="rgba(255,255,255,0.85)">{point.label}</text>
                </g>
              ))}
            </svg>
          ) : (
            <p className="profile-views-chart-empty">Not enough data yet for growth chart.</p>
          )}
        </div>
      </article>

      <article className="white-card profile-views-list-card">
        {status ? <p className="status-text">{status}</p> : null}
        <div className="profile-views-toolbar">
          <h3>Viewer Profiles</h3>
          <input
            type="text"
            placeholder="Search by name, email, type or location"
            value={search}
            onChange={(event) => {
              setSearch(event.target.value);
              setPage(1);
            }}
          />
        </div>

        <p className="profile-views-note">{statsText}</p>

        <div className="profile-views-scroll">
          {loading ? <p className="empty-text">Loading viewers...</p> : null}

          {!loading && items.map((item) => (
            <div className="profile-view-row" key={`${item.viewerRole}-${item.viewerId}`}>
              <div className="profile-view-avatar">
                {item.viewerAvatar ? (
                  <img src={String(item.viewerAvatar).startsWith('http') ? item.viewerAvatar : `${uploadsBase}/${String(item.viewerAvatar).replace(/^\//, '')}`} alt={item.viewerName || 'Viewer'} />
                ) : (
                  <span>{getInitials(item.viewerName)}</span>
                )}
              </div>
              <div className="profile-view-meta">
                <h4>{item.viewerName || 'Unknown Viewer'}</h4>
                <p>{item.viewerEmail || 'No email'}</p>
                <div className="profile-view-tags">
                  <span className="tag">{getRoleLabel(item)}</span>
                  {item.viewerLocation ? <span className="tag tag-muted">{item.viewerLocation}</span> : null}
                </div>
              </div>
              <div className="profile-view-right">
                <strong>{item.viewCount || 1}</strong>
                <small>{item.lastViewedAt ? new Date(item.lastViewedAt).toLocaleString() : '-'}</small>
              </div>
            </div>
          ))}

          {!loading && !items.length ? <p className="empty-text">No viewer profiles found.</p> : null}
        </div>

        <div className="profile-views-pagination">
          <button type="button" className="btn btn-secondary" disabled={page <= 1} onClick={() => setPage((prev) => Math.max(1, prev - 1))}>Previous</button>
          <span>Page {page} of {totalPages}</span>
          <button type="button" className="btn btn-secondary" disabled={page >= totalPages} onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}>Next</button>
        </div>
      </article>
    </div>
  );
}

export default TrackProfileViews;
