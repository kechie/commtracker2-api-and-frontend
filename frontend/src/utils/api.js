import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

const api = axios.create({
  baseURL: API_BASE_URL,
});

// Request interceptor to add the auth token to headers
api.interceptors.request.use(
  (config) => {
    try {
      const userInfo = localStorage.getItem('userInfo');
      if (userInfo) {
        const { token } = JSON.parse(userInfo);
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
      }
    } catch (error) {
      console.error('Failed to parse userInfo from localStorage', error);
      // Optionally, handle error, e.g., clear localStorage or redirect to login
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export const login = async (username, password) => {
  try {
    const response = await api.post('/auth/login', { username, password });
    return response.data;
  } catch (error) {
    console.error('API Login Error:', error.response?.data || error.message);
    throw error.response?.data || error;
  }
};

export const register = async (name, username, password) => {
  try {
    const response = await api.post('/auth/register', { name, username, password });
    return response.data;
  } catch (error) {
    console.error('API Register Error:', error.response?.data || error.message);
    throw error.response?.data || error;
  }
};

// Tracker API calls
export const getTrackers = async () => {
  try {
    const response = await api.get('/trackers');
    return response.data;
  } catch (error) {
    console.error('API Get Trackers Error:', error.response?.data || error.message);
    throw error.response?.data || error;
  }
};

export const createTracker = async (trackerData) => {
  try {
    const response = await api.post('/trackers', trackerData);
    return response.data;
  } catch (error) {
    console.error('API Create Tracker Error:', error.response?.data || error.message);
    throw error.response?.data || error;
  }
};

export const updateTracker = async (id, trackerData) => {
  try {
    const response = await api.put(`/trackers/${id}`, trackerData);
    return response.data;
  } catch (error) {
    console.error('API Update Tracker Error:', error.response?.data || error.message);
    throw error.response?.data || error;
  }
};

export const deleteTracker = async (id) => {
  try {
    const response = await api.delete(`/trackers/${id}`);
    return response.data;
  } catch (error) {
    console.error('API Delete Tracker Error:', error.response?.data || error.message);
    throw error.response?.data || error;
  }
};


export default api;
