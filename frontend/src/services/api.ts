const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000/api/v1";

interface FetchOptions extends RequestInit {
  params?: Record<string, string>;
}

export async function apiFetch<T>(endpoint: string, options: FetchOptions = {}): Promise<T> {
  const { params, headers, ...restOptions } = options;
  
  // 1. Build URL
  let url = `${BASE_URL}${endpoint}`;
  if (params) {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, val]) => {
      if (val !== undefined && val !== null) {
        searchParams.append(key, val);
      }
    });
    const queryString = searchParams.toString();
    if (queryString) {
      url += `?${queryString}`;
    }
  }

  // 2. Set headers
  const activeHeaders = new Headers(headers);
  if (!activeHeaders.has("Content-Type") && !(restOptions.body instanceof FormData)) {
    activeHeaders.set("Content-Type", "application/json");
  }
  
  // Inject JWT if present
  if (typeof window !== "undefined") {
    const token = localStorage.getItem("medilab_access_token");
    if (token) {
      activeHeaders.set("Authorization", `Bearer ${token}`);
    }
  }

  // 3. Perform Fetch request
  const response = await fetch(url, {
    headers: activeHeaders,
    ...restOptions,
  });

  // 4. Handle 401 token refresh logic
  if (response.status === 401 && typeof window !== "undefined") {
    const refreshToken = localStorage.getItem("medilab_refresh_token");
    if (refreshToken) {
      try {
        const refreshResponse = await fetch(`${BASE_URL}/auth/refresh`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ refresh_token: refreshToken }),
        });
        
        if (refreshResponse.ok) {
          const refreshData = await refreshResponse.json();
          localStorage.setItem("medilab_access_token", refreshData.access_token);
          localStorage.setItem("medilab_refresh_token", refreshData.refresh_token);
          
          // Retry original request with new token
          activeHeaders.set("Authorization", `Bearer ${refreshData.access_token}`);
          const retryResponse = await fetch(url, {
            headers: activeHeaders,
            ...restOptions,
          });
          
          if (!retryResponse.ok) {
            const errorText = await retryResponse.text();
            throw new Error(errorText || "Request failed after token refresh");
          }
          return await retryResponse.json() as T;
        } else {
          // Refresh token expired or invalid, trigger logout
          localStorage.removeItem("medilab_access_token");
          localStorage.removeItem("medilab_refresh_token");
          localStorage.removeItem("medilab_user");
          window.location.href = "/auth/login";
        }
      } catch (err) {
        localStorage.removeItem("medilab_access_token");
        localStorage.removeItem("medilab_refresh_token");
        localStorage.removeItem("medilab_user");
        window.location.href = "/auth/login";
      }
    }
  }

  if (!response.ok) {
    const errorText = await response.text();
    let errorMessage = "Request failed";
    try {
      const parsed = JSON.parse(errorText);
      errorMessage = parsed.detail || errorMessage;
    } catch {
      errorMessage = errorText || errorMessage;
    }
    throw new Error(errorMessage);
  }

  // No content response
  if (response.status === 204) {
    return {} as T;
  }

  return await response.json() as T;
}
