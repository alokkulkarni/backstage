// filepath: src/services/api.ts
import { APP_CONFIG, HTTP_STATUS, TIMEOUTS } from '../utils/constants';

interface ApiResponse<T = any> {
  data: T;
  message?: string;
  status: number;
  success: boolean;
}

interface ApiError {
  message: string;
  status: number;
  errors?: Record<string, string[]>;
}

class ApiClient {
  private baseURL: string;
  private timeout: number;

  constructor(baseURL: string = APP_CONFIG.API_BASE_URL, timeout: number = TIMEOUTS.API_REQUEST) {
    this.baseURL = baseURL;
    this.timeout = timeout;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const url = `${this.baseURL}${endpoint}`;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      const token = localStorage.getItem('token');
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
        ...options.headers,
      };

      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }

      const response = await fetch(url, {
        ...options,
        headers,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      const data = await response.json();

      if (!response.ok) {
        throw new ApiError(
          data.message || 'An error occurred',
          response.status,
          data.errors
        );
      }

      return {
        data: data.data || data,
        message: data.message,
        status: response.status,
        success: true,
      };
    } catch (error) {
      clearTimeout(timeoutId);
      
      if (error instanceof Error && error.name === 'AbortError') {
        throw new ApiError('Request timeout', HTTP_STATUS.INTERNAL_SERVER_ERROR);
      }
      
      if (error instanceof ApiError) {
        throw error;
      }
      
      throw new ApiError(
        'Network error occurred',
        HTTP_STATUS.INTERNAL_SERVER_ERROR
      );
    }
  }

  async get<T>(endpoint: string, options: RequestInit = {}): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'GET',
    });
  }

  async post<T>(endpoint: string, data?: any, options: RequestInit = {}): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async put<T>(endpoint: string, data?: any, options: RequestInit = {}): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async patch<T>(endpoint: string, data?: any, options: RequestInit = {}): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'PATCH',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async delete<T>(endpoint: string, options: RequestInit = {}): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'DELETE',
    });
  }

  // File upload method
  async upload<T>(
    endpoint: string,
    file: File,
    additionalData?: Record<string, any>,
    onProgress?: (progress: number) => void
  ): Promise<ApiResponse<T>> {
    const formData = new FormData();
    formData.append('file', file);

    if (additionalData) {
      Object.entries(additionalData).forEach(([key, value]) => {
        formData.append(key, value);
      });
    }

    const token = localStorage.getItem('token');
    const headers: HeadersInit = {};

    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();

      // Upload progress
      if (onProgress) {
        xhr.upload.addEventListener('progress', (event) => {
          if (event.lengthComputable) {
            const progress = (event.loaded / event.total) * 100;
            onProgress(progress);
          }
        });
      }

      xhr.addEventListener('load', () => {
        try {
          const response = JSON.parse(xhr.responseText);
          
          if (xhr.status >= 200 && xhr.status < 300) {
            resolve({
              data: response.data || response,
              message: response.message,
              status: xhr.status,
              success: true,
            });
          } else {
            reject(new ApiError(
              response.message || 'Upload failed',
              xhr.status,
              response.errors
            ));
          }
        } catch (error) {
          reject(new ApiError(
            'Invalid response format',
            HTTP_STATUS.INTERNAL_SERVER_ERROR
          ));
        }
      });

      xhr.addEventListener('error', () => {
        reject(new ApiError(
          'Upload failed',
          HTTP_STATUS.INTERNAL_SERVER_ERROR
        ));
      });

      xhr.addEventListener('timeout', () => {
        reject(new ApiError(
          'Upload timeout',
          HTTP_STATUS.INTERNAL_SERVER_ERROR
        ));
      });

      xhr.open('POST', `${this.baseURL}${endpoint}`);
      
      // Set headers
      Object.entries(headers).forEach(([key, value]) => {
        xhr.setRequestHeader(key, value);
      });

      xhr.timeout = this.timeout;
      xhr.send(formData);
    });
  }

  // Download method
  async download(endpoint: string, filename?: string): Promise<void> {
    try {
      const token = localStorage.getItem('token');
      const headers: HeadersInit = {};

      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }

      const response = await fetch(`${this.baseURL}${endpoint}`, {
        headers,
      });

      if (!response.ok) {
        throw new ApiError('Download failed', response.status);
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename || 'download';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }
      throw new ApiError('Download failed', HTTP_STATUS.INTERNAL_SERVER_ERROR);
    }
  }

  // Health check method
  async healthCheck(): Promise<ApiResponse<any>> {
    return this.get('/health');
  }

  // Set authentication token
  setAuthToken(token: string): void {
    localStorage.setItem('token', token);
  }

  // Clear authentication token
  clearAuthToken(): void {
    localStorage.removeItem('token');
  }

  // Get current authentication token
  getAuthToken(): string | null {
    return localStorage.getItem('token');
  }
}

// Create and export API client instance
export const apiClient = new ApiClient();

// Export types
export type { ApiResponse, ApiError };
export { ApiClient };
