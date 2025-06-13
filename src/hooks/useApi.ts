import { useState, useCallback, useEffect, useRef } from 'react';

interface ApiResponse<T = any> {
  data: T | null;
  status: number | string;
}

export const useApi = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const apiCall = useCallback(async <T = any>(url: string, options: RequestInit = {}): Promise<ApiResponse<T>> => {
    setIsLoading(true);
    setError(null);

    // Cancel previous request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    abortControllerRef.current = new AbortController();

    try {
      const response = await fetch(url, {
        ...options,
        signal: abortControllerRef.current.signal,
        mode: 'cors',
      });

      if (!response.ok) {
        if (response.status === 404) {
          return { data: null, status: 404 };
        }
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `API Error: ${response.statusText} (${response.status})`);
      }

      const data = await response.json();
      return { data, status: response.status };
    } catch (error: any) {
      if (error.name === 'AbortError') {
        return { data: null, status: 'aborted' };
      }
      
      let errorMessage = error.message;
      if (error instanceof TypeError && error.message === 'Failed to fetch') {
        errorMessage = 'Network error. Please check your connection and try again.';
      }
      
      setError(errorMessage);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  return { apiCall, isLoading, error };
}; 