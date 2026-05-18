import axios from 'axios';

const API = axios.create({
  baseURL: 'https://siva-atomquest-hackathon-2026.onrender.com/api',
});

API.interceptors.request.use(
  (req) => {
    const token = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');

    if (token) {
      req.headers.Authorization = `Bearer ${token}`;
    } else if (storedUser) {
      const user = JSON.parse(storedUser);
      if (user?.token) {
        req.headers.Authorization = `Bearer ${user.token}`;
      }
    }

    return req;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default API;
