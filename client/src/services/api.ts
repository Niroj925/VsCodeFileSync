import axios from 'axios';
import type { AxiosResponse } from 'axios';
import { BACKEND_URL } from '../utils/constants';

const instance = axios.create({
  baseURL: BACKEND_URL,
  timeout: 10000,
});

// response interceptor (runtime only)
instance.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('API Error:', error);
    return Promise.reject(error);
  }
);

/**
 * Typed helpers (THIS is the key)
 */
export const api = {
  get: async <T>(url: string, config?: any): Promise<T> => {
    const res: AxiosResponse<T> = await instance.get(url, config);
    return res.data;
  },

  post: async <T>(url: string, data?: any, config?: any): Promise<T> => {
    const res: AxiosResponse<T> = await instance.post(url, data, config);
    return res.data;
  },

  patch: async <T>(url: string, data?: any, config?: any): Promise<T> => {
    const res: AxiosResponse<T> = await instance.put(url, data, config);
    return res.data;
  },

  delete: async <T>(url: string, config?: any): Promise<T> => {
    const res: AxiosResponse<T> = await instance.delete(url, config);
    return res.data;
  },
};

export default api;
