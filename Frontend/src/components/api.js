import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

export const api = axios.create({
  baseURL: API_BASE
});

export const TOKEN_KEYS = {
  admin: 'adminToken',
  vendor: 'vendorToken',
  user: 'userToken'
};
const USER_PROFILE_KEY = 'userProfile';
const BOOKMARKS_KEY = 'userBookmarkedVendors';

export function getToken(role) {
  return localStorage.getItem(TOKEN_KEYS[role]);
}

export function setToken(role, token) {
  localStorage.setItem(TOKEN_KEYS[role], token);
}

export function clearToken(role) {
  localStorage.removeItem(TOKEN_KEYS[role]);
  if (role === 'user') {
    localStorage.removeItem(USER_PROFILE_KEY);
  }
}

export function authHeader(role) {
  const token = getToken(role);
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export function decodeJwt(token) {
  try {
    const payload = token.split('.')[1];
    return JSON.parse(atob(payload));
  } catch (error) {
    return null;
  }
}

export function setUserProfile(profile) {
  localStorage.setItem(USER_PROFILE_KEY, JSON.stringify(profile || {}));
}

export function getUserProfile() {
  try {
    return JSON.parse(localStorage.getItem(USER_PROFILE_KEY) || '{}');
  } catch (error) {
    return {};
  }
}

export function getBookmarkedVendors() {
  try {
    const data = JSON.parse(localStorage.getItem(BOOKMARKS_KEY) || '[]');
    return Array.isArray(data) ? data : [];
  } catch (error) {
    return [];
  }
}

export function isVendorBookmarked(vendorId) {
  const id = String(vendorId || '');
  if (!id) return false;
  return getBookmarkedVendors().some((item) => String(item?._id || '') === id);
}

export function toggleVendorBookmark(vendor) {
  const id = String(vendor?._id || '');
  if (!id) return { bookmarked: false, items: getBookmarkedVendors() };

  const current = getBookmarkedVendors();
  const exists = current.some((item) => String(item?._id || '') === id);
  const next = exists
    ? current.filter((item) => String(item?._id || '') !== id)
    : [
        ...current,
        {
          _id: id,
          companyName: vendor?.companyName || '',
          category: vendor?.category || '',
          cityState: vendor?.cityState || vendor?.location || '',
          location: vendor?.location || vendor?.cityState || '',
          companyLogo: vendor?.companyLogo || '',
          rating: Number(vendor?.rating || 0),
          totalReviews: Number(vendor?.totalReviews || 0),
          verified: Boolean(vendor?.verified),
          subscriptionPlan: vendor?.subscriptionPlan || 'Free Vendor Listing',
          companyDescription: vendor?.companyDescription || ''
        }
      ];

  localStorage.setItem(BOOKMARKS_KEY, JSON.stringify(next));
  window.dispatchEvent(new CustomEvent('vv_bookmarks_changed', { detail: { count: next.length } }));
  return { bookmarked: !exists, items: next };
}

export function truncateWords(text, maxWords = 10) {
  const words = String(text || '').trim().split(/\s+/).filter(Boolean);
  if (words.length <= maxWords) return words.join(' ');
  return `${words.slice(0, maxWords).join(' ')}...`;
}
