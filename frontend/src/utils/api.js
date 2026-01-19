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

/* export const register = async (name, username, password) => {
  try {
    const response = await api.post('/auth/register', { name, username, password });
    return response.data;
  } catch (error) {
    console.error('API Register Error:', error.response?.data || error.message);
    throw error.response?.data || error;
  }
}; */

// Tracker API calls
export const getTrackers = async (page = 1, limit = 10, sortBy = 'dateReceived', sortOrder = 'DESC') => {
  try {
    // Ensure numeric parameters are actually numbers
    const response = await api.get('/trackers', {
      params: {
        page: parseInt(page, 10),
        limit: parseInt(limit, 10),
        sortBy: sortBy || 'dateReceived',
        sortOrder: sortOrder || 'DESC'
      }
    });
    return response.data;
  } catch (error) {
    console.error('API Get Trackers Error:', error.response?.data || error.message);
    throw error.response?.data || error;
  }
};

export const getAllTrackers = async () => {
  try {
    const response = await api.get('/trackers/all');
    return response.data;
  } catch (error) {
    console.error('API Get All Trackers Error:', error.response?.data || error.message);
    throw error.response?.data || error;
  }
};

export const createTracker = async (trackerData) => {
  try {
    const formData = new FormData();
    for (const key in trackerData) {
      if (trackerData.hasOwnProperty(key)) {
        if (key === 'recipientIds' && Array.isArray(trackerData[key])) {
          trackerData[key].forEach(id => formData.append('recipientIds[]', id));
        } else if (key === 'attachment' && trackerData[key]) {
          formData.append('attachment', trackerData[key]);
        } else {
          formData.append(key, trackerData[key]);
        }
      }
    }

    const response = await api.post('/trackers', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
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

export const getRecipients = async () => {
  try {
    const response = await api.get('/recipients');
    return response.data;
  } catch (error) {
    console.error('API Get Recipients Error:', error.response?.data || error.message);
    throw error.response?.data || error;
  }
};
//Use with caution - returns all recipients without pagination
export const getAllRecipients = async () => {
  try {
    const response = await api.get('/recipients/all');
    return response.data;
  } catch (error) {
    console.error('API Get All Recipients Error:', error.response?.data || error.message);
    throw error.response?.data || error;
  }
};

// User Management API calls (v2)
export const getAllUsers = async () => {
  try {
    const response = await api.get('/users');
    return response.data;
  } catch (error) {
    console.error('API Get All Users Error:', error.response?.data || error.message);
    throw error.response?.data || error;
  }
};

export const createUser = async (userData) => {
  try {
    // This uses the existing register endpoint from authController
    // It expects { name, username, password, email, userrole, deptId }
    const response = await api.post('/auth/register', userData);
    return response.data;
  } catch (error) {
    console.error('API Create User Error:', error.response?.data || error.message);
    throw error.response?.data || error;
  }
};

export const updateUser = async (id, userData) => {
  try {
    const response = await api.put(`/users/${id}`, userData);
    return response.data;
  } catch (error) {
    console.error('API Update User Error:', error.response?.data || error.message);
    throw error.response?.data || error;
  }
};

export const deleteUser = async (id) => {
  try {
    const response = await api.delete(`/users/${id}`);
    return response.data;
  } catch (error) {
    console.error('API Delete User Error:', error.response?.data || error.message);
    throw error.response?.data || error;
  }
};


export default api;
