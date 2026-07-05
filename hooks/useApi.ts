"use client";

import { useState, useCallback, useRef } from "react";
import httpClient, { ApiResponseType } from "@/lib/axios-instance";

// ── Types ────────────────────────────────────────────────────────────────────
type HttpMethod = "get" | "post" | "put" | "patch" | "delete";

interface UseApiOptions {
  /** Prevent duplicate submissions. Default: true */
  preventDoubleSubmit?: boolean;
}

interface UseApiReturn<T> {
  data: T | null;
  isLoading: boolean;
  error: string | null;
  execute: (...args: any[]) => Promise<T | null>;
  reset: () => void;
}

/**
 * Generic reusable hook for any API call.
 * Wraps the httpClient methods with loading/error/data state management.
 *
 * @example
 * // GET request
 * const { data, isLoading, execute } = useApi('get', '/content/list');
 * useEffect(() => { execute(); }, []);
 *
 * @example
 * // POST request
 * const { data, isLoading, execute } = useApi('post', '/content/create');
 * const handleCreate = () => execute({ title: 'Hello' });
 *
 * @example
 * // Dynamic URL
 * const { execute } = useApi('put');
 * const handleUpdate = (id) => execute({ title: 'Updated' }, `/content/update/${id}`);
 */
export function useApi<T = any>(
  method: HttpMethod,
  defaultUrl?: string,
  options: UseApiOptions = {}
): UseApiReturn<T> {
  const { preventDoubleSubmit = true } = options;

  const [data, setData] = useState<T | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const loadingRef = useRef(false);

  const execute = useCallback(
    async (...args: any[]): Promise<T | null> => {
      // Double-submit prevention
      if (preventDoubleSubmit && loadingRef.current) return null;

      let body: any = undefined;
      let url = defaultUrl || "";

      // Parse arguments based on HTTP method
      if (method === "get" || method === "delete") {
        // For GET/DELETE: first arg can be a custom URL
        if (typeof args[0] === "string") {
          url = args[0];
        }
      } else {
        // For POST/PUT/PATCH: first arg is body, optional second arg is URL
        body = args[0];
        if (typeof args[1] === "string") {
          url = args[1];
        }
      }

      if (!url) {
        setError("No URL provided for API call");
        return null;
      }

      try {
        loadingRef.current = true;
        setIsLoading(true);
        setError(null);

        let response: ApiResponseType<T>;

        switch (method) {
          case "get":
            response = await httpClient.get<T>(url);
            break;
          case "post":
            response = await httpClient.post<T>(url, body);
            break;
          case "put":
            response = await httpClient.put<T>(url, body);
            break;
          case "patch":
            response = await httpClient.patch<T>(url, body);
            break;
          case "delete":
            response = await httpClient.delete<T>(url);
            break;
          default:
            throw new Error(`Unsupported HTTP method: ${method}`);
        }

        if (response.success) {
          setData(response.data);
          return response.data;
        } else {
          setError(response.message || "Request failed");
          return null;
        }
      } catch (err: any) {
        const message = err?.message || "Request failed";
        setError(message);
        return null;
      } finally {
        setIsLoading(false);
        loadingRef.current = false;
      }
    },
    [method, defaultUrl, preventDoubleSubmit]
  );

  const reset = useCallback(() => {
    setData(null);
    setError(null);
  }, []);

  return { data, isLoading, error, execute, reset };
}
