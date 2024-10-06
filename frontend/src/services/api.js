import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

const api = axios.create({
  baseURL: API_URL,
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // Clear token and trigger a re-render
      localStorage.removeItem('token');
      window.dispatchEvent(new Event('storage'));
    }
    return Promise.reject(error);
  }
);

export const getModels = async () => {
  const response = await api.get('/models');
  return response.data;
};

export const createModel = async (modelData) => {
  const response = await api.post('/models', modelData);
  return response.data;
};

export const getModel = async (name) => {
  const response = await api.get(`/models/${name}`);
  return response.data;
};

export const updateModel = async (name, modelData) => {
  const response = await api.put(`/models/${name}`, modelData);
  return response.data;
};

export const deleteModel = async (name) => {
  const response = await api.delete(`/models/${name}`);
  return response.data;
};

export const getUniqueUsers = async (modelName) => {
  const response = await api.get(`/models/${modelName}/unique_users`);
  return response.data;
};

export const getMethodHistory = async (modelName, startDate, endDate) => {
  const params = new URLSearchParams();
  if (startDate) params.append('start_date', startDate.toISOString());
  if (endDate) params.append('end_date', endDate.toISOString());

  const response = await api.get(`/models/${modelName}/history`, { params });
  return response.data;
};

export const getReports = async (name, page = 1, limit = 10) => {
  const skip = (page-1) * limit;

  const params = new URLSearchParams({
    skip: skip.toString(),
    limit: limit.toString(),
  });

  const response = await api.get(`/reports/${name}`, { params });
  if (response.status !== 200) {
    throw new Error('Failed to fetch reports');
  }
  return response.data;
};

export const deleteReport = async (reportId) => {
  const response = await api.delete(`/reports/${reportId}`);
  return response.data;
};