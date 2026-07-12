import axios, { AxiosRequestConfig, isAxiosError } from 'axios';
import { router } from 'expo-router';

import { secureStorage } from '@/storage/secureStorage';

const API_URL = process.env.EXPO_PUBLIC_API_URL;

export const axiosInstance = axios.create({
  baseURL: API_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

// Access token interceptor
axiosInstance.interceptors.request.use(
  async config => {
    const accessToken = await secureStorage.get('accessToken');
    if (accessToken) {
      config.headers.Authorization = `Bearer ${accessToken}`;
    }
    return config;
  },
  error => {
    return Promise.reject(error);
  },
);

// Response interceptor - auto refresh token
axiosInstance.interceptors.response.use(
  response => response,
  async error => {
    if (error.response?.status === 401) {
      const refreshToken = await secureStorage.get('refreshToken');
      if (refreshToken) {
        try {
          const response = await axiosInstance.post('/auth/refresh', {
            refreshToken,
          });

          const newTokens = response.data;
          await secureStorage.save('accessToken', newTokens.accessToken);
          await secureStorage.save('refreshToken', newTokens.refreshToken);

          const originalRequest = error.config;
          originalRequest.headers.Authorization = `Bearer ${newTokens.accessToken}`;
          return axiosInstance(originalRequest);
        } catch (refreshError) {
          await secureStorage.remove('accessToken');
          await secureStorage.remove('refreshToken');
          router.replace('/login');
        }
      } else {
        router.replace('/login');
      }
    }
    return Promise.reject(error);
  },
);

export async function client<ResponseDataType, RequestBodyType = unknown>(
  url: string,
  config?: AxiosRequestConfig<RequestBodyType>,
): Promise<ResponseDataType> {
  try {
    return (
      await axiosInstance.request<ResponseDataType>({
        url,
        ...config,
      })
    ).data;
  } catch (error) {
    if (isAxiosError(error)) {
      console.log('API call failed:', {
        url: error.config?.url,
        method: error.config?.method,
        status: error.response?.status,
        errorMessage: error.message,
        responseData: error.response?.data,
      });
    } else {
      console.log('Non Axios error:', {
        error,
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
      });
    }
    throw error;
  }
}

client.get = <ResType>(url: string, config?: AxiosRequestConfig) =>
  client<ResType>(url, { method: 'GET', ...config });

client.post = <ResType, ReqBody = unknown>(
  url: string,
  data?: ReqBody,
  config?: AxiosRequestConfig,
) => client<ResType, ReqBody>(url, { method: 'POST', ...config, data });

client.put = <ResType, ReqBody = unknown>(
  url: string,
  data?: ReqBody,
  config?: AxiosRequestConfig,
) => client<ResType, ReqBody>(url, { method: 'PUT', ...config, data });

client.patch = <ResType, ReqBody = unknown>(
  url: string,
  data?: ReqBody,
  config?: AxiosRequestConfig,
) => client<ResType, ReqBody>(url, { method: 'PATCH', ...config, data });

client.delete = <ResType>(url: string, config?: AxiosRequestConfig) =>
  client<ResType>(url, { method: 'DELETE', ...config });

export default axiosInstance;
