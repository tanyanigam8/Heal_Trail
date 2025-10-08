import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:8000',
});

export const uploadPDF = async (formData) => {
  const res = await api.post('/upload', formData);
  return res.data;
};

export const fetchReports = async () => {
  const res = await api.get('/report-history');
  return res.data;
};
