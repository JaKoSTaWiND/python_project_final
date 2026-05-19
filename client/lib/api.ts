const getApiUrl = () => process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";

async function refreshAccessToken(): Promise<string | null> {
  const refreshToken = localStorage.getItem("refreshToken"); 
  if (!refreshToken) return null;

  try {
    const baseUrl = getApiUrl();
    
    const response = await fetch(`${baseUrl}/client/auth/token/refresh/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refresh: refreshToken }),
    });

    if (!response.ok) {
      throw new Error("Refresh token expired or invalid");
    }

    const data = await response.json();
    
    localStorage.setItem("accessToken", data.access);
    return data.access;
  } catch (error) {
    console.error("Критическая ошибка обновления токена:", error);
    
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    
    if (typeof window !== "undefined") {
      window.location.href = "/auth";
    }
    return null;
  }
}

export async function apiFetch(url: string, options: RequestInit = {}): Promise<Response> {
  let token = localStorage.getItem("accessToken"); 

  const headers = new Headers(options.headers);

  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  if (!(options.body instanceof FormData)) {
    if (!headers.has("Content-Type")) {
      headers.set("Content-Type", "application/json");
    }
  }

  let finalBody = options.body;
  if (options.body && !(options.body instanceof FormData) && typeof options.body === "object") {
    finalBody = JSON.stringify(options.body);
  }

  const baseUrl = getApiUrl();
  
  let response = await fetch(`${baseUrl}${url}`, {
    ...options,
    headers,
    body: finalBody,
  });

  if (response.status === 401) {
    console.warn(`Access-токен протух при запросе к ${url}. Пытаемся обновиться...`);
    
    const newAccessToken = await refreshAccessToken();
    
    if (newAccessToken) {
      const retryHeaders = new Headers(options.headers);
      retryHeaders.set("Authorization", `Bearer ${newAccessToken}`);
      
      if (!(options.body instanceof FormData)) {
        if (!retryHeaders.has("Content-Type")) {
          retryHeaders.set("Content-Type", "application/json");
        }
      }

      response = await fetch(`${baseUrl}${url}`, {
        ...options,
        headers: retryHeaders,
        body: finalBody,
      });
    }
  }

  return response;
}