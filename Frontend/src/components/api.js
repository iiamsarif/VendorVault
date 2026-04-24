import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'https://vendorvault-yqbm.onrender.com/api';

export const api = axios.create({
  baseURL: API_BASE
});

export const TOKEN_KEYS = {
  admin: 'adminToken',
  vendor: 'vendorToken',
  user: 'userToken'
};
const USER_PROFILE_KEY = 'userProfile';

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
