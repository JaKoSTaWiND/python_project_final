const getApiUrl = () => process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";

interface FetchOptions extends RequestInit {
  headers?: Record<string, string>;
}

async function refreshAccessToken(): Promise<string | null> {
  const refreshToken = localStorage.getItem("refresh_token");
  if (!refreshToken) return null;

  try {
    const response = await fetch(`${getApiUrl()}/token/refresh/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refresh: refreshToken }),
    });

    if (!response.ok) {
      throw new Error("Refresh token expired");
    }

    const data = await response.json();
    localStorage.setItem("access_token", data.access);
    return data.access;
  } catch (error) {
    console.error("Critical token refresh error:", error);
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    if (typeof window !== "undefined") {
      window.location.href = "/";
    }
    return null;
  }
}

export async function apiFetch(url: string, options: RequestInit = {}): Promise<Response> {
  let token = localStorage.getItem("access_token");

  const headers = new Headers(options.headers);

  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  if (!(options.body instanceof FormData)) {
    if (!headers.has("Content-Type")) {
      headers.set("Content-Type", "application/json");
    }
  }

  const baseUrl = getApiUrl();
  const cleanUrl = url.startsWith("/") ? url : `/${url}`;
  
  let response = await fetch(`${baseUrl}${cleanUrl}`, {
    ...options,
    headers,
  });

  if (response.status === 401) {
    const newToken = await refreshAccessToken();
    
    if (newToken) {
      headers.set("Authorization", `Bearer ${newToken}`);
      
      response = await fetch(`${baseUrl}${cleanUrl}`, {
        ...options,
        headers,
      });
    }
  }

  return response;
}