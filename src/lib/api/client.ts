const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/survay/api';
const DEFAULT_TIMEOUT = 30000;

export interface ApiResponse<T = any> {
  ok: boolean;
  err?: string;
  [key: string]: any;
}

export const postForm = async <T = any>(
  endpoint: string,
  data: FormData | Record<string, any>,
  options: {
    timeoutMs?: number;
    headers?: Record<string, string>;
  } = {}
): Promise<ApiResponse<T> & T> => {
  let formData: FormData;

  if (data instanceof FormData) {
    formData = data;
  } else {
    formData = new FormData();
    Object.entries(data).forEach(([key, value]) => {
      if (value instanceof File) {
        formData.append(key, value);
      } else if (typeof value === 'boolean') {
        formData.append(key, value ? '1' : '0');
      } else if (value !== null && value !== undefined) {
        formData.append(key, String(value));
      }
    });
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(
    () => controller.abort(),
    options.timeoutMs || DEFAULT_TIMEOUT
  );

  try {
    const response = await fetch(`${API_BASE_URL}/${endpoint}`, {
      method: 'POST',
      body: formData,
      signal: controller.signal,
      headers: options.headers || {}
    });

    clearTimeout(timeoutId);

    const text = await response.text();
    let result: any;

    try {
      result = JSON.parse(text);
    } catch {
      result = {
        ok: response.ok,
        err: response.ok ? undefined : text || 'Request failed'
      };
    }

    if (!response.ok && !result.err) {
      result.err = `HTTP ${response.status}: ${response.statusText}`;
    }

    if (!result.ok) {
      result.ok = response.ok;
    }

    return result;
  } catch (error: any) {
    clearTimeout(timeoutId);

    if (error.name === 'AbortError') {
      return {
        ok: false,
        err: 'Request timeout'
      } as any;
    }

    return {
      ok: false,
      err: error.message || 'Network error'
    } as any;
  }
};
